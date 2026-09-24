import app from './app.js';
import { config, hasOpenAI, hasSupabase } from './config.js';

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Sira API listening on http://localhost:${config.port}`);
  if (!hasSupabase()) console.warn('Supabase is not configured; /api/health works but data endpoints will return 503.');
  if (!hasOpenAI()) console.warn('OpenAI is not configured; the Sira assistant will remain unavailable until OPENAI_API_KEY is set.');
});
