import 'dotenv/config';

const read = (key: string, fallback = '') => (process.env[key] || fallback).trim();

export const config = {
  port: Number(read('PORT', '8787')),
  appUrl: read('APP_URL', 'http://localhost:3000'),
  supabaseUrl: read('SUPABASE_URL'),
  supabaseAnonKey: read('SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: read('SUPABASE_SERVICE_ROLE_KEY'),
};

export const hasSupabase = () => Boolean(config.supabaseUrl && config.supabaseAnonKey);

export function assertSupabase() {
  if (!hasSupabase()) {
    const err = new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.');
    (err as Error & { status?: number }).status = 503;
    throw err;
  }
}
