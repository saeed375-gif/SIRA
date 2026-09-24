import 'dotenv/config';

const read = (key: string, fallback = '') => (process.env[key] || fallback).trim();

export const config = {
  port: Number(read('PORT', '8787')),
  appUrl: read('APP_URL', 'http://localhost:3000'),
  supabaseUrl: read('SUPABASE_URL'),
  supabaseAnonKey: read('SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: read('SUPABASE_SERVICE_ROLE_KEY'),
  // Server-only. Never expose this through Vite's VITE_* variables.
  geminiApiKey: read('GEMINI_API_KEY'),
  // Flash-Lite is the fast default for an interactive text assistant.
  geminiModel: read('GEMINI_MODEL', 'gemini-3.5-flash-lite'),
  // A higher-capability backup used only when the primary model is temporarily unavailable.
  geminiFallbackModel: read('GEMINI_FALLBACK_MODEL', 'gemini-3.8-flash'),
};

export const hasSupabase = () => Boolean(config.supabaseUrl && config.supabaseAnonKey);
export const hasGemini = () => Boolean(config.geminiApiKey);

export function assertSupabase() {
  if (!hasSupabase()) {
    const err = new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.');
    (err as Error & { status?: number }).status = 503;
    throw err;
  }
}
