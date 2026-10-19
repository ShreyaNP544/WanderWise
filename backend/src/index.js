import { config, configWarnings } from './config.js';
import { createApp } from './app.js';
import { initStore } from './store/index.js';

for (const warning of configWarnings()) console.warn(`⚠ ${warning}`);

await initStore(config.mongoUri);

const app = createApp();

// On Vercel the platform runs the exported app as a function; everywhere else we listen normally.
if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`WanderWise API on http://localhost:${config.port}`);
  });
}

export default app;
