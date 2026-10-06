// Tiny fetch helper for external data: short timeout, JSON only, in-memory TTL cache.
// External data is optional: callers get null on any failure and fall back.

const UA = 'WanderWise/0.1 (hackathon travel planner; server-side)';
const cache = new Map();

export async function getJson(url, { ttlMs = 60 * 60 * 1000, timeoutMs = 5000, source } = {}) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value;
  const started = Date.now();
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const value = await res.json();
    cache.set(url, { at: Date.now(), value });
    if (cache.size > 500) cache.delete(cache.keys().next().value);
    return value;
  } catch (err) {
    console.warn(JSON.stringify({ scope: 'grounding', source, outcome: 'error', error: err.message.slice(0, 120), ms: Date.now() - started }));
    return null;
  }
}
