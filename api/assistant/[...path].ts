// Keep the assistant on an explicit Vercel function route. The Express app
// remains the single request handler, while this route avoids platform-level
// ambiguity around the nested /api/assistant/* path.
import app from '../../server/app.js';

export default app;
