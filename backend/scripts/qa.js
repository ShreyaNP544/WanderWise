// Fast QA battery against a running API (no slow Gemma calls except where noted).
// Run: node scripts/qa.js [baseUrl]
const BASE = process.argv[2] || 'http://localhost:5000/api';
const valid = {
  origin: 'Delhi', destination: 'Jaipur', days: 3, budget: 15000, travellers: 2, travellerType: 'friends',
  interests: ['Culture & history'], pace: 'moderate', stay: 'budget', transport: 'train', diet: 'any', avoid: [],
};

async function call(method, path, body, raw) {
  const t = Date.now();
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
      signal: AbortSignal.timeout(20_000),
    });
    const json = await res.json().catch(() => null);
    return { status: res.status, code: json?.error?.code, msg: json?.error?.message, fields: json?.error?.details?.map((d) => d.field).join(','), ms: Date.now() - t, json };
  } catch (e) {
    return { status: 'ERR', msg: e.message, ms: Date.now() - t };
  }
}

const cases = [
  ['1 empty preferences', () => call('POST', '/trips', { preferences: {} }), (r) => r.status === 400 && r.code === 'VALIDATION_ERROR'],
  ['1 missing body', () => call('POST', '/trips', undefined), (r) => r.status === 400],
  ['2 invalid budget (text)', () => call('POST', '/trips', { preferences: { ...valid, budget: 'lots' } }), (r) => r.status === 400 && r.fields?.includes('budget')],
  ['2 negative budget', () => call('POST', '/trips', { preferences: { ...valid, budget: -5 } }), (r) => r.status === 400],
  ['3 budget below minimum (₹500)', () => call('POST', '/trips', { preferences: { ...valid, budget: 500 } }), (r) => r.status === 400 && r.fields?.includes('budget')],
  ['4 budget above maximum', () => call('POST', '/trips', { preferences: { ...valid, budget: 50_000_000 } }), (r) => r.status === 400],
  ['5 invalid destination (no Gemma call)', () => call('POST', '/trips', { preferences: { ...valid, destination: 'Qwzxplorvania' } }), (r) => r.status === 400 && r.fields === 'destination'],
  ['6 trip too long (30 days)', () => call('POST', '/trips', { preferences: { ...valid, days: 30 } }), (r) => r.status === 400 && r.fields?.includes('days')],
  ['7 trip too short (0 days)', () => call('POST', '/trips', { preferences: { ...valid, days: 0 } }), (r) => r.status === 400],
  ['17 malformed JSON body', () => call('POST', '/trips', undefined, '{"preferences": {'), (r) => r.status === 400 && r.code === 'VALIDATION_ERROR'],
  ['17 oversized text field', () => call('POST', '/trips', { preferences: { ...valid, constraints: 'x'.repeat(5000) } }), (r) => r.status === 400],
  ['17 unknown trip id', () => call('GET', '/trips/doesNotExist123'), (r) => r.status === 404],
  ['17 malicious trip id', () => call('GET', '/trips/%7B%22%24ne%22%3A1%7D'), (r) => r.status === 400 || r.status === 404],
  ['17 remix too short', () => call('POST', '/trips/doesNotExist123/modify', { instruction: 'a' }), (r) => r.status === 400],
  ['17 remix too long', () => call('POST', '/trips/doesNotExist123/modify', { instruction: 'x'.repeat(400) }), (r) => r.status === 400],
  ['17 unknown API route', () => call('GET', '/nope'), (r) => r.status === 404 && r.code === 'NOT_FOUND'],
  ['15 sample trip opens (refresh-safe, persisted)', () => call('POST', '/trips/demo', {}), (r) => r.status === 201],
];

let demoId;
let pass = 0;
for (const [name, run, ok] of cases) {
  const r = await run();
  if (name.startsWith('15')) demoId = r.json?.trip?.id;
  const good = ok(r);
  pass += good;
  console.log(`${good ? '✓' : '✗'} ${name.padEnd(42)} → ${r.status} ${r.code || ''} ${r.fields ? `[${r.fields}]` : ''} ${r.ms}ms${good ? '' : `  ${r.msg}`}`);
}

if (demoId) {
  const again = await call('GET', `/trips/${demoId}`);
  const ok = again.status === 200;
  pass += ok;
  console.log(`${ok ? '✓' : '✗'} ${'15 reload trip by id (browser refresh)'.padEnd(42)} → ${again.status} ${again.ms}ms`);

  // 14 duplicate requests: two remixes at once on the same trip → second must get 409 BUSY, not a race.
  const [a, b] = await Promise.all([
    call('POST', `/trips/${demoId}/modify`, { instruction: 'Add more local food' }),
    new Promise((r) => setTimeout(r, 300)).then(() => call('POST', `/trips/${demoId}/modify`, { instruction: 'Add more local food' })),
  ]);
  const dupOk = b.status === 409 && b.code === 'BUSY';
  pass += dupOk;
  console.log(`${dupOk ? '✓' : '✗'} ${'14 duplicate remix while one is running'.padEnd(42)} → second: ${b.status} ${b.code || ''} (first: ${a.status === 'ERR' ? 'still running (client timeout, fine)' : a.status})`);
}
console.log(`\n${pass}/${cases.length + (demoId ? 2 : 0)} passed`);
