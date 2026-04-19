import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load .env from repo root (server/src -> server -> root).
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { default: app } = await import('./app.js');

const port = Number(process.env.PORT) || 3001;

app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`);
});
