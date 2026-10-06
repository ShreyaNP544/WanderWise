import { config, configWarnings } from './config.js';
import { createApp } from './app.js';
import { initStore } from './store/index.js';

for (const warning of configWarnings()) console.warn(`⚠ ${warning}`);

await initStore(config.mongoUri);

createApp().listen(config.port, () => {
  console.log(`WanderWise API on http://localhost:${config.port}`);
});
