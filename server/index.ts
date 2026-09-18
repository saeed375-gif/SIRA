import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import publicApi from './publicApi';
import authApi from './authApi';
import adminApi from './adminApi';
import { config, hasSupabase } from './config';
import { SupabaseHttpError } from './supabaseRest';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, supabaseConfigured: hasSupabase() }));
app.use('/api/auth', authApi);
app.use('/api/admin', adminApi);
app.use('/api', publicApi);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err?.status || (err instanceof SupabaseHttpError ? err.status : 500);
  if (status >= 500) console.error('[Sira API]', err?.message || err);
  const message = status >= 500 ? 'تعذر إتمام الطلب حاليًا.' : (err?.message || 'Request failed');
  res.status(status).json({ error: message });
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(__dirname, '../dist');
app.use(express.static(dist, { maxAge: '1h' }));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(dist, 'index.html'), (error) => error ? next() : undefined);
});

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Sira API listening on http://localhost:${config.port}`);
  if (!hasSupabase()) console.warn('Supabase is not configured; /api/health works but data endpoints will return 503.');
});
