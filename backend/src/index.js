import { config, configWarnings } from './config.js';
import { createApp } from './app.js';

for (const warning of configWarnings()) console.warn(`⚠ ${warning}`);

createApp().listen(config.port, () => {
  console.log(`WanderWise API on http://localhost:${config.port}`);
});
