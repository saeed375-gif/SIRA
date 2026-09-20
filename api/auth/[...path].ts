import app from '../../server/app.js';

// Vercel does not route nested /api/auth/* requests through the root
// catch-all function consistently, so keep an explicit auth entry point.
export default app;
