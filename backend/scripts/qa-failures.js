// Failure-mode QA: run with a broken environment to prove graceful degradation.
// Run: node scripts/qa-failures.js   (it sets its own env; no real key needed)
process.env.GEMINI_API_KEY = 'invalid-key-for-testing';
process.env.OLLAMA_URL = 'http://127.0.0.1:9'; // nothing listens here
process.env.AI_TIMEOUT_MS = '8000';
process.env.AI_CACHE = 'off';

const { generateJSON } = await import('../src/ai/gateway.js');
const { extractJson } = await import('../src/ai/json.js');
const { getJson } = await import('../src/grounding/http.js');
const { buildContext } = await import('../src/grounding/index.js');
const { z } = await import('zod');

const check = (name, ok, detail = '') => console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` → ${detail}` : ''}`);

// 8/9: bad key + local Gemma down → one clean 503, never a crash or hang
let t = Date.now();
try {
  await generateJSON({ task: 'qa', prompt: 'Return {"ok":true}', schema: z.object({ ok: z.boolean() }) });
  check('8/9 bad API key + Ollama down → 503', false, 'unexpectedly succeeded');
} catch (e) {
  check('8/9 bad API key + Ollama down → 503', e.status === 503 && e.code === 'AI_UNAVAILABLE', `${e.status} ${e.code} "${e.message}" in ${Date.now() - t} ms`);
}

// 10: malformed model output is recovered where possible
check('10 JSON in fences with trailing comma', extractJson('Here you go:\n```json\n{"a":[1,2,],}\n```').a.length === 2);
check('10 JSON after prose containing braces', extractJson('Schema {x} then {"days":[{"day":1}]} done').days[0].day === 1);
let threw = false;
try { extractJson('I cannot help with that.'); } catch { threw = true; }
check('10 no JSON at all → error (triggers repair/fallback)', threw);

// 11/12: external data API failure and slowness → null within timeout, trip still plannable
t = Date.now();
const dead = await getJson('http://127.0.0.1:9/never', { timeoutMs: 1500, source: 'qa' });
check('11 unreachable external API → null', dead === null, `${Date.now() - t} ms`);
t = Date.now();
const slow = await getJson('https://httpbin.org/delay/10', { timeoutMs: 1500, source: 'qa' });
check('12 slow external API → timeout → null', slow === null && Date.now() - t < 4000, `${Date.now() - t} ms`);
const ctx = await buildContext({ origin: 'Nowhereville', destination: 'Qwzxplorvania', days: 3 });
check('11 unknown place → empty context, no crash', ctx.location === null && ctx.places.length === 0, `weather: ${ctx.weather.status}`);
process.exit(0);
