import app from './app';
import { config, hasSupabase } from './config';

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Sira API listening on http://localhost:${config.port}`);
  if (!hasSupabase()) console.warn('Supabase is not configured; /api/health works but data endpoints will return 503.');
});
