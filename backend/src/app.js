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

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', apiLimiter);
  app.use('/api', metaRouter);
  app.use('/api/trips', tripsRouter);
  app.use('/api', notFound);

  // In production one service serves both the API and the built React app.
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
