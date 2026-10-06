import { Router } from 'express';
import { config } from '../config.js';

export const metaRouter = Router();

metaRouter.get('/health', (req, res) => {
  res.json({
    ok: true,
    ai: {
      ready: false, // flips to true once the Gemma gateway lands
      hosted: config.gemini.apiKey ? [config.gemini.model, config.gemini.fallbackModel] : [],
      local: config.ollama.model,
    },
    store: config.mongoUri ? 'mongodb' : 'memory',
    time: new Date().toISOString(),
  });
});
