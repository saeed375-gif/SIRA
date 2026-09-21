import { Router, type Request, type Response } from 'express';
import { rateLimit } from './rateLimit.js';
import { readAuth, requireAuth, type AuthenticatedRequest } from './auth.js';
import { restPath, SupabaseHttpError, supabaseFetch } from './supabaseRest.js';

const router = Router();
const REFRESH_COOKIE = 'sira_refresh';
const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown> & { display_name?: string };
};

type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  user: SupabaseUser;
};

function readCookie(req: Request, name: string) {
  const cookie = req.get('cookie') || '';
  const item = cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : '';
}

function isSecureRequest(req: Request) {
  return req.secure || (req.get('x-forwarded-proto') || '').split(',')[0]?.trim() === 'https';
}

function refreshCookie(req: Request, token: string, maxAge = REFRESH_MAX_AGE_SECONDS) {
  const parts = [
    `${REFRESH_COOKIE}=${encodeURIComponent(token)}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/api/auth',
    `Max-Age=${maxAge}`,
  ];
  if (isSecureRequest(req)) parts.push('Secure');
  return parts.join('; ');
}

function clearRefreshCookie(req: Request) {
  return refreshCookie(req, '', 0);
}

function cleanEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type ProgressSnapshot = {
  discoveredPlaceIds: string[];
  completedChallenges: string[];
  totalPoints: number;
  favoritePlaceIds: string[];
  journeys: Record<string, { revealedStopNumbers: number[]; completedAt?: string }>;
  kidsMapGame: { completedStageIds: string[]; stagePoints: number; entryFeePaid?: boolean };
};

const uniqueStrings = (value: unknown, maximum = 250) => Array.from(new Set(
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.length > 0 && item.length <= 160) : [],
)).slice(0, maximum);
const uniqueNumbers = (value: unknown, maximum = 50) => Array.from(new Set(
  Array.isArray(value) ? value.map(Number).filter(Number.isInteger) : [],
)).slice(0, maximum);

function cleanProgress(value: unknown): ProgressSnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const rawJourneys = source.journeys && typeof source.journeys === 'object' ? source.journeys as Record<string, unknown> : {};
  const journeys = Object.fromEntries(Object.entries(rawJourneys).slice(0, 50).map(([id, journey]) => {
    const details = journey && typeof journey === 'object' ? journey as Record<string, unknown> : {};
    const completedAt = typeof details.completedAt === 'string' ? details.completedAt : undefined;
    return [id, { revealedStopNumbers: uniqueNumbers(details.revealedStopNumbers), ...(completedAt ? { completedAt } : {}) }];
  }));
  const kids = source.kidsMapGame && typeof source.kidsMapGame === 'object' ? source.kidsMapGame as Record<string, unknown> : {};
  return {
    totalPoints: Math.max(0, Math.min(1_000_000, Math.floor(Number(source.totalPoints) || 50))),
    discoveredPlaceIds: uniqueStrings(source.discoveredPlaceIds),
    completedChallenges: uniqueStrings(source.completedChallenges, 500),
    favoritePlaceIds: uniqueStrings(source.favoritePlaceIds),
    journeys,
    kidsMapGame: {
      completedStageIds: uniqueStrings(kids.completedStageIds, 20),
      stagePoints: Math.max(0, Math.min(10_000, Math.floor(Number(kids.stagePoints) || 0))),
      ...(kids.entryFeePaid === true ? { entryFeePaid: true } : {}),
    },
  };
}

function mergeProgress(existing: ProgressSnapshot | null, incoming: ProgressSnapshot): ProgressSnapshot {
  if (!existing) return incoming;
  const journeys = { ...existing.journeys };
  for (const [id, journey] of Object.entries(incoming.journeys)) {
    const previous = journeys[id];
    journeys[id] = {
      revealedStopNumbers: uniqueNumbers([...(previous?.revealedStopNumbers || []), ...journey.revealedStopNumbers]),
      ...(previous?.completedAt || journey.completedAt ? { completedAt: previous?.completedAt || journey.completedAt } : {}),
    };
  }
  return {
    totalPoints: Math.max(existing.totalPoints, incoming.totalPoints),
    discoveredPlaceIds: uniqueStrings([...existing.discoveredPlaceIds, ...incoming.discoveredPlaceIds]),
    completedChallenges: uniqueStrings([...existing.completedChallenges, ...incoming.completedChallenges], 500),
    favoritePlaceIds: uniqueStrings([...existing.favoritePlaceIds, ...incoming.favoritePlaceIds]),
    journeys,
    kidsMapGame: {
      completedStageIds: uniqueStrings([...existing.kidsMapGame.completedStageIds, ...incoming.kidsMapGame.completedStageIds], 20),
      stagePoints: Math.max(existing.kidsMapGame.stagePoints, incoming.kidsMapGame.stagePoints),
      ...(existing.kidsMapGame.entryFeePaid || incoming.kidsMapGame.entryFeePaid ? { entryFeePaid: true } : {}),
    },
  };
}

async function getSupabaseUser(accessToken: string) {
  return supabaseFetch<SupabaseUser>('/auth/v1/user', { accessToken });
}

async function persistProgress(accessToken: string, user: SupabaseUser, progress: ProgressSnapshot) {
  // Progress is account data only. It is never read from JWT claims or used
  // for authorization, so users cannot grant themselves extra permissions.
  await supabaseFetch('/auth/v1/user', {
    method: 'PUT',
    accessToken,
    body: JSON.stringify({ data: { ...(user.user_metadata || {}), sira_progress: progress } }),
  });
}

function authError(res: Response, error: unknown, context: 'login' | 'signup' | 'verify' | 'recovery' | 'password') {
  const status = error instanceof SupabaseHttpError ? error.status : 500;
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  const details = error instanceof SupabaseHttpError ? JSON.stringify(error.details || '').toLowerCase() : '';
  const combined = `${message} ${details}`;

  if (status === 429) return res.status(429).json({ error: 'طلبات كثيرة خلال وقت قصير. انتظر قليلًا ثم حاول مجددًا.', code: 'rate_limited' });
  if (context === 'login') {
    if (combined.includes('email not confirmed')) return res.status(403).json({ error: 'يرجى تأكيد بريدك الإلكتروني أولًا.', code: 'email_not_confirmed' });
    return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.', code: 'invalid_credentials' });
  }
  if (context === 'signup' && (combined.includes('already') || combined.includes('registered') || combined.includes('exists'))) {
    return res.status(409).json({ error: 'تعذر إنشاء الحساب بهذا البريد. جرّب تسجيل الدخول أو استعادة كلمة المرور.', code: 'account_exists' });
  }
  if (context === 'verify') {
    if (combined.includes('expired')) return res.status(400).json({ error: 'انتهت صلاحية رمز التحقق. اطلب رمزًا جديدًا.', code: 'otp_expired' });
    return res.status(400).json({ error: 'رمز التحقق غير صحيح. حاول مرة أخرى.', code: 'invalid_otp' });
  }
  if (context === 'password') return res.status(400).json({ error: 'تعذر حفظ كلمة المرور الجديدة. تحقق منها وحاول مجددًا.', code: 'password_update_failed' });
  if (context === 'recovery') return res.status(200).json({ message: 'إذا كان البريد مرتبطًا بحساب في سيرة، فسيصلك رمز التحقق.' });
  return res.status(status >= 400 && status < 500 ? status : 503).json({ error: 'تعذر الاتصال حاليًا. حاول مرة أخرى.', code: 'unavailable' });
}

async function publicUser(user: SupabaseUser, accessToken: string) {
  let displayName = String(user.user_metadata?.display_name || '').trim();
  try {
    const profiles = await supabaseFetch<Array<{ display_name?: string | null }>>(restPath('profiles', {
      select: 'display_name',
      id: `eq.${user.id}`,
      limit: 1,
    }), { accessToken });
    displayName = String(profiles[0]?.display_name || displayName).trim();
  } catch {
    // The auth session is still valid if the optional profile lookup is temporarily unavailable.
  }
  return {
    id: user.id,
    email: user.email || '',
    displayName: displayName || (user.email ? user.email.split('@')[0] : 'مستكشف القدس'),
  };
}

async function sendSession(req: Request, res: Response, session: SupabaseSession) {
  res.setHeader('Set-Cookie', refreshCookie(req, session.refresh_token));
  res.json({
    accessToken: session.access_token,
    expiresAt: Date.now() + Number(session.expires_in || 3600) * 1000,
    user: await publicUser(session.user, session.access_token),
  });
}

router.post('/signup', rateLimit(6, 60_000), async (req, res) => {
  const displayName = String(req.body?.displayName || '').trim();
  const email = cleanEmail(req.body?.email);
  const password = String(req.body?.password || '');
  if (displayName.length < 2 || displayName.length > 60) return res.status(400).json({ error: 'أدخل اسمًا صحيحًا من حرفين على الأقل.' });
  if (!validEmail(email)) return res.status(400).json({ error: 'أدخل بريدًا إلكترونيًا صحيحًا.' });
  if (password.length < 8) return res.status(400).json({ error: 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.' });
  try {
    const data = await supabaseFetch<SupabaseSession | { user?: SupabaseUser }>('/auth/v1/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, data: { display_name: displayName } }),
    });
    if ('access_token' in data && data.access_token) return sendSession(req, res, data);
    return res.status(202).json({ requiresVerification: true, email });
  } catch (error) {
    return authError(res, error, 'signup');
  }
});

router.post('/login', rateLimit(12, 60_000), async (req, res) => {
  const email = cleanEmail(req.body?.email);
  const password = String(req.body?.password || '');
  if (!validEmail(email) || !password) return res.status(400).json({ error: 'أدخل البريد الإلكتروني وكلمة المرور.' });
  try {
    const data = await supabaseFetch<SupabaseSession>('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return sendSession(req, res, data);
  } catch (error) {
    return authError(res, error, 'login');
  }
});

router.post('/verify', rateLimit(20, 60_000), async (req, res) => {
  const email = cleanEmail(req.body?.email);
  const token = String(req.body?.token || '').replace(/\D/g, '').slice(0, 8);
  const type = req.body?.type === 'recovery' ? 'recovery' : 'signup';
  if (!validEmail(email) || token.length < 6) return res.status(400).json({ error: 'أدخل رمز التحقق كاملًا.' });
  try {
    const data = await supabaseFetch<SupabaseSession>('/auth/v1/verify', {
      method: 'POST',
      body: JSON.stringify({ email, token, type }),
    });
    return sendSession(req, res, data);
  } catch (error) {
    return authError(res, error, 'verify');
  }
});

router.post('/resend', rateLimit(3, 60_000), async (req, res) => {
  const email = cleanEmail(req.body?.email);
  if (!validEmail(email)) return res.status(400).json({ error: 'أدخل بريدًا إلكترونيًا صحيحًا.' });
  try {
    await supabaseFetch('/auth/v1/resend', {
      method: 'POST',
      body: JSON.stringify({ email, type: 'signup' }),
    });
    return res.json({ message: 'أرسلنا رسالة تأكيد جديدة إلى بريدك الإلكتروني.' });
  } catch (error) {
    return authError(res, error, 'verify');
  }
});

router.post('/recovery', rateLimit(3, 60_000), async (req, res) => {
  const email = cleanEmail(req.body?.email);
  if (!validEmail(email)) return res.status(400).json({ error: 'أدخل بريدًا إلكترونيًا صحيحًا.' });
  try {
    await supabaseFetch('/auth/v1/recover', { method: 'POST', body: JSON.stringify({ email }) });
  } catch (error) {
    if (error instanceof SupabaseHttpError && error.status === 429) return authError(res, error, 'recovery');
  }
  return res.json({ message: 'إذا كان البريد مرتبطًا بحساب في سيرة، فسيصلك رمز التحقق.' });
});

router.post('/password', rateLimit(8, 60_000), requireAuth, async (req: AuthenticatedRequest, res) => {
  const password = String(req.body?.password || '');
  if (password.length < 8) return res.status(400).json({ error: 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.' });
  try {
    await supabaseFetch('/auth/v1/user', {
      method: 'PUT',
      accessToken: req.auth!.accessToken,
      body: JSON.stringify({ password }),
    });
    return res.json({ message: 'تم تغيير كلمة المرور بنجاح.' });
  } catch (error) {
    return authError(res, error, 'password');
  }
});

router.post('/progress-load', rateLimit(30, 60_000), requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await getSupabaseUser(req.auth!.accessToken);
    return res.json({ progress: cleanProgress(user.user_metadata?.sira_progress) });
  } catch {
    return res.status(503).json({ error: 'تعذر استعادة تقدم الحساب حاليًا.' });
  }
});

router.post('/progress-sync', rateLimit(20, 60_000), requireAuth, async (req: AuthenticatedRequest, res) => {
  const incoming = cleanProgress(req.body?.progress);
  if (!incoming) return res.status(400).json({ error: 'بيانات التقدم غير صالحة.' });
  try {
    const user = await getSupabaseUser(req.auth!.accessToken);
    const progress = mergeProgress(cleanProgress(user.user_metadata?.sira_progress), incoming);
    await persistProgress(req.auth!.accessToken, user, progress);
    return res.json({ progress });
  } catch {
    return res.status(503).json({ error: 'تعذر مزامنة تقدم الحساب حاليًا.' });
  }
});

router.post('/progress-save', rateLimit(30, 60_000), requireAuth, async (req: AuthenticatedRequest, res) => {
  const progress = cleanProgress(req.body?.progress);
  if (!progress) return res.status(400).json({ error: 'بيانات التقدم غير صالحة.' });
  try {
    const user = await getSupabaseUser(req.auth!.accessToken);
    await persistProgress(req.auth!.accessToken, user, progress);
    return res.json({ progress });
  } catch {
    return res.status(503).json({ error: 'تعذر حفظ تقدم الحساب حاليًا.' });
  }
});

router.post('/session', rateLimit(30, 60_000), async (req, res) => {
  const refreshToken = readCookie(req, REFRESH_COOKIE);
  if (!refreshToken) return res.status(204).end();
  try {
    const data = await supabaseFetch<SupabaseSession>('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    return sendSession(req, res, data);
  } catch {
    res.setHeader('Set-Cookie', clearRefreshCookie(req));
    return res.status(204).end();
  }
});

router.post('/refresh', rateLimit(20, 60_000), async (req, res) => {
  const refreshToken = readCookie(req, REFRESH_COOKIE) || String(req.body?.refreshToken || '');
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token is required' });
  try {
    const data = await supabaseFetch<SupabaseSession>('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    return sendSession(req, res, data);
  } catch (error) {
    return authError(res, error, 'login');
  }
});

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  const auth = req.auth!;
  res.json({ user: await publicUser({ id: auth.id, email: auth.email }, auth.accessToken) });
});

router.post('/logout', async (req, res) => {
  const auth = await readAuth(req);
  if (auth) {
    try {
      await supabaseFetch('/auth/v1/logout?scope=local', { method: 'POST', accessToken: auth.accessToken });
    } catch {
      // Clearing the local refresh cookie is sufficient when the remote session already expired.
    }
  }
  res.setHeader('Set-Cookie', clearRefreshCookie(req));
  return res.status(204).end();
});

export default router;
