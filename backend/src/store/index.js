import { memoryStore } from './memoryStore.js';
import { mongoStore } from './mongoStore.js';

let store = memoryStore();

export const getStore = () => store;

/** Use MongoDB when configured and reachable; otherwise stay in memory so the app always runs. */
export async function initStore(uri) {
  if (!uri) return store;
  try {
    store = await mongoStore(uri);
    console.log('✓ Connected to MongoDB');
  } catch (err) {
    console.warn(`⚠ MongoDB unavailable (${err.message.slice(0, 120)}); using in-memory store.`);
  }
  return store;
}
