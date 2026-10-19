import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { metaRouter } from './routes/meta.js';
import { tripsRouter } from './routes/trips.js';

const frontendDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');

export function createApp() {
  const app = express();
  // Behind Vercel's proxy, so rate limits key on the real client IP rather than the proxy's.
  if (process.env.VERCEL) app.set('trust proxy', 1);

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json({ limit: '100kb' }));

  const api = express.Router();
  api.use(apiLimiter);
  api.use(metaRouter);
  api.use('/trips', tripsRouter);
  api.use(notFound);
  app.use('/api', api);

  // On Vercel the platform routes /api/* here; accept the paths whether or not the prefix is kept.
  if (process.env.VERCEL) app.use('/', api);

  // In production one service serves both the API and the built React app.
  if (!process.env.VERCEL && fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
