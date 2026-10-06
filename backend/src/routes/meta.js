import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config.js';
import { placePhoto } from '../grounding/photo.js';
import { providerSummary } from '../ai/gateway.js';
import { getStore } from '../store/index.js';

export const metaRouter = Router();

// A credited photo for any destination (Wikipedia/Wikimedia, keyless, cached).
metaRouter.get('/photo', async (req, res) => {
  const place = z.string().trim().min(2).max(80).parse(req.query.place);
  res.set('Cache-Control', 'public, max-age=86400');
  res.json({ photo: await placePhoto(place) });
});

metaRouter.get('/health', (req, res) => {
  const providers = providerSummary();
  res.json({
    ok: true,
    ai: {
      ready: providers.length > 0,
      primary: config.gemini.apiKey ? config.gemini.model : config.ollama.model,
      providers, // model names only, never keys
    },
    store: getStore().kind,
    time: new Date().toISOString(),
  });
});
