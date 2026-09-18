import { Router } from 'express';
import { rateLimit } from './rateLimit';
import { requireAuth, type AuthenticatedRequest } from './auth';
import { supabaseFetch } from './supabaseRest';

const router = Router();

router.post('/login', rateLimit(12, 60_000), async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim();
    const password = String(req.body?.password || '');
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const data = await supabaseFetch('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    res.json(data);
  } catch (e) { next(e); }
});

router.post('/refresh', rateLimit(20, 60_000), async (req, res, next) => {
  try {
    const refreshToken = String(req.body?.refreshToken || '');
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token is required' });
    const data = await supabaseFetch('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    res.json(data);
  } catch (e) { next(e); }
});

router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.auth });
});

router.post('/logout', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    await supabaseFetch('/auth/v1/logout', { method: 'POST', accessToken: req.auth!.accessToken });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
