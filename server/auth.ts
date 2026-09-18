import type { NextFunction, Request, Response } from 'express';
import { config } from './config';
import { restPath, supabaseFetch } from './supabaseRest';

export type SiraRole = 'admin' | 'editor' | 'reviewer' | 'user';
export type AuthenticatedRequest = Request & {
  auth?: { id: string; email?: string; accessToken: string; roles: SiraRole[] };
};

function bearer(req: Request) {
  const raw = req.get('authorization') || '';
  return raw.toLowerCase().startsWith('bearer ') ? raw.slice(7).trim() : '';
}

export async function readAuth(req: Request) {
  const accessToken = bearer(req);
  if (!accessToken || !config.supabaseUrl || !config.supabaseAnonKey) return null;
  try {
    const user = await supabaseFetch<{ id: string; email?: string }>('/auth/v1/user', { accessToken });
    const roles = await supabaseFetch<Array<{ role: SiraRole }>>(restPath('user_roles', {
      select: 'role',
      user_id: `eq.${user.id}`,
    }), { accessToken });
    return { id: user.id, email: user.email, accessToken, roles: roles.map((r) => r.role) };
  } catch {
    return null;
  }
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const auth = await readAuth(req);
  if (!auth) return res.status(401).json({ error: 'Authentication required' });
  req.auth = auth;
  next();
}

export function requireRole(...allowed: SiraRole[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const auth = req.auth || await readAuth(req);
    if (!auth) return res.status(401).json({ error: 'Authentication required' });
    if (!auth.roles.some((role) => allowed.includes(role))) return res.status(403).json({ error: 'Insufficient permissions' });
    req.auth = auth;
    next();
  };
}
