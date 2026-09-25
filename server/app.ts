import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import publicApi from './publicApi.js';
import authApi from './authApi.js';
import adminApi from './adminApi.js';
import assistantApi from './assistantApi.js';
import { hasSupabase } from './config.js';
import { SupabaseHttpError } from './supabaseRest.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  // Capacitor's Android WebView is served from a localhost-style secure origin.
  // Permit only those native origins so bundled clients can call the deployed API.
  const origin = req.get('origin');
  if (origin === 'https://localhost' || origin === 'capacitor://localhost') {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  if (req.method === 'OPTIONS' && (origin === 'https://localhost' || origin === 'capacitor://localhost')) {
    return res.sendStatus(204);
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, supabaseConfigured: hasSupabase() }));
app.use('/api/auth', authApi);
app.use('/api/admin', adminApi);
app.use('/api/assistant', assistantApi);
app.use('/api', publicApi);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err?.status || (err instanceof SupabaseHttpError ? err.status : 500);
  if (status >= 500) console.error('[Sira API]', err?.message || err);
  const message = status >= 500 ? 'تعذر إتمام الطلب حاليًا.' : (err?.message || 'Request failed');
  res.status(status).json({ error: message });
});

// Local production serving. Vercel serves the Vite output from its CDN and invokes
// this Express app only for /api routes.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(__dirname, '../dist');
app.use(express.static(dist, { maxAge: '1h' }));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(dist, 'index.html'), (error) => error ? next() : undefined);
});

export default app;
