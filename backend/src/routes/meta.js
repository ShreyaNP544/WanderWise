import { Router } from 'express';
import { config } from '../config.js';
import { providerSummary } from '../ai/gateway.js';
import { getStore } from '../store/index.js';

export const metaRouter = Router();

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
