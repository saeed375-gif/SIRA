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
  user_metadata?: { display_name?: string };
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
