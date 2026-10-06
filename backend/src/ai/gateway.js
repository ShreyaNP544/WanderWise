import { createHash } from 'node:crypto';
import { config } from '../config.js';
import { AppError } from '../middleware/errors.js';
import { extractJson } from './json.js';
import { aiStudioProvider } from './providers/aiStudio.js';
import { ollamaProvider } from './providers/ollama.js';

// ─── Provider chain: hosted Gemma 4 → second hosted Gemma 4 → local Gemma (Ollama) ───
function buildProviders() {
  const providers = [];
  const { apiKey, model, fallbackModel } = config.gemini;
  const hosted = { apiKey, thinking: config.ai.thinking, timeoutMs: config.ai.hostedTimeoutMs };
  if (apiKey) {
    providers.push(aiStudioProvider({ ...hosted, model }));
    if (fallbackModel && fallbackModel !== model) providers.push(aiStudioProvider({ ...hosted, model: fallbackModel }));
  }
  if (config.ollama.enabled) {
    providers.push(ollamaProvider({ url: config.ollama.url, model: config.ollama.model, timeoutMs: config.ai.localTimeoutMs }));
  }
  return providers;
}

const providers = buildProviders();

export const providerSummary = () => providers.map((p) => `${p.name}:${p.model}`);

// ─── Response cache: rehearsing the demo shouldn't burn quota ───
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_MAX = 200;
const cache = new Map();

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key, value) {
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(key, { at: Date.now(), value });
}

// ─── Logging: metadata only, never prompt or user text ───
function log(event) {
  console.log(JSON.stringify({ at: new Date().toISOString(), scope: 'ai', ...event }));
}

function validate(raw, schema, check) {
  let parsed;
  try {
    parsed = extractJson(raw);
  } catch (err) {
    return { ok: false, error: err.message };
  }
  const result = schema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.slice(0, 6).map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`);
    return { ok: false, error: `Schema validation failed: ${issues.join('; ')}` };
  }
  const problem = check?.(result.data);
  if (problem) return { ok: false, error: problem };
  return { ok: true, data: result.data };
}

const repairPrompt = (prompt, error, previous) =>
  `${prompt}

## Correction needed
Your previous answer could not be used: ${error}
Previous answer (truncated):
<previous_answer>${previous.slice(0, 3000)}</previous_answer>
Return the corrected, COMPLETE JSON object only. No markdown, no commentary.`;

/**
 * The single entry point to Gemma. Returns { data, meta } or throws AppError(503).
 * @param task   short label for logs/cache (e.g. "plan", "modify")
 * @param schema zod schema the answer must satisfy
 * @param check  optional extra semantic check: (data) => errorString | null
 */
export async function generateJSON({ task, prompt, schema, check, temperature = 0.4, maxOutputTokens = 8192 }) {
  if (!providers.length) {
    throw new AppError(503, 'AI_UNAVAILABLE', 'No Gemma provider is configured. Add GEMINI_API_KEY or run Ollama.', { retryable: false });
  }

  const key = createHash('sha256').update(`${task}\n${temperature}\n${prompt}`).digest('hex');
  if (config.ai.cache) {
    const hit = cacheGet(key);
    if (hit) {
      log({ task, outcome: 'cache_hit' });
      return structuredClone(hit);
    }
  }

  const failures = [];
  for (const provider of providers) {
    const started = Date.now();
    let repaired = false;
    try {
      let { text, tokens } = await provider.complete({ prompt, temperature, maxOutputTokens });
      let result = validate(text, schema, check);

      if (!result.ok) {
        log({ task, provider: provider.name, model: provider.model, outcome: 'invalid', error: result.error.slice(0, 300), ms: Date.now() - started });
        if (config.ai.debug) console.log(text.slice(0, 2000));
        ({ text, tokens } = await provider.complete({ prompt: repairPrompt(prompt, result.error, text), temperature: 0.2, maxOutputTokens }));
        result = validate(text, schema, check);
        repaired = true;
      }

      const ms = Date.now() - started;
      if (result.ok) {
        const meta = { provider: provider.name, model: provider.model, latencyMs: ms, repaired, fallback: failures.length > 0 };
        log({ task, provider: provider.name, model: provider.model, outcome: 'ok', repaired, ms, tokens, promptChars: prompt.length });
        const value = { data: result.data, meta };
        if (config.ai.cache) cacheSet(key, value);
        return structuredClone(value);
      }
      failures.push(`${provider.model}: invalid output`);
      log({ task, provider: provider.name, model: provider.model, outcome: 'invalid_after_repair', error: result.error.slice(0, 300), ms });
    } catch (err) {
      failures.push(`${provider.model}: ${err.kind || 'error'}`);
      log({ task, provider: provider.name, model: provider.model, outcome: 'error', kind: err.kind, error: err.message?.slice(0, 200), ms: Date.now() - started });
    }
  }

  throw new AppError(503, 'AI_UNAVAILABLE', 'Gemma is busy right now. Please try again in a moment.', {
    retryable: true,
    details: failures.map((f) => ({ field: 'provider', message: f })),
  });
}
