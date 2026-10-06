import express from 'express';
import cors from 'cors';
import { config } from './config.js';

const app = express();
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: '200kb' }));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    providers: {
      hosted: config.gemini.apiKey ? config.gemini.model : null,
      local: config.ollama.model,
    },
    store: config.mongoUri ? 'mongodb' : 'memory',
  });
});

app.listen(config.port, () => {
  console.log(`WanderWise API on http://localhost:${config.port}`);
});
