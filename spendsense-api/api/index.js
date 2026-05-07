import app from '../src/app.js';
import serverless from 'serverless-http';

// Vercel serverless handler
export default serverless(app);
