import { config, assertSupabase } from './config.js';

type FetchOptions = RequestInit & {
  accessToken?: string;
  serviceRole?: boolean;
};

export class SupabaseHttpError extends Error {
  status: number;
  details: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function apiKey(serviceRole = false) {
  if (serviceRole) {
    if (!config.supabaseServiceRoleKey) throw new SupabaseHttpError(503, 'Service role key is not configured');
    return config.supabaseServiceRoleKey;
  }
  return config.supabaseAnonKey;
}

export async function supabaseFetch<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
  assertSupabase();
  const key = apiKey(Boolean(options.serviceRole));
  const token = options.accessToken || key;
  const headers = new Headers(options.headers || {});
  headers.set('apikey', key);
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof Uint8Array) && !(options.body instanceof ArrayBuffer)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${config.supabaseUrl}${path}`, { ...options, headers });
  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = text; }
  }
  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'message' in payload
      ? String((payload as { message?: unknown }).message)
      : `Supabase request failed (${response.status})`;
    throw new SupabaseHttpError(response.status, message, payload);
  }
  return payload as T;
}

export function restPath(table: string, params: Record<string, string | number | boolean | undefined | null>) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
  }
  return `/rest/v1/${table}?${qs.toString()}`;
}

export async function rpc<T = unknown>(name: string, body: unknown, accessToken?: string) {
  return supabaseFetch<T>(`/rest/v1/rpc/${name}`, {
    method: 'POST',
    accessToken,
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
}
