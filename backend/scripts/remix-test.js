// Chain several "Remix My Trip" requests against the running API.
// Run: node scripts/remix-test.js [baseUrl]
const BASE = process.argv[2] || 'http://localhost:5000/api';
const post = async (path, body) => {
  const t = Date.now();
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: res.status, body: await res.json(), secs: ((Date.now() - t) / 1000).toFixed(1) };
};

const REQUESTS = [
  'Make this trip 30% cheaper',
  'Make day 3 more relaxed',
  "I don't want to wake up before 8 AM",
  'Give me one adventurous activity',
  'Keep the budget unchanged but improve the hotel',
  "I'm travelling with my parents",
];

const { body: demo } = await post('/trips/demo', {});
let trip = demo.trip;
console.log(`Demo trip ${trip.id}: "${trip.version.plan.title}" ₹${trip.version.budget.total}/${trip.version.budget.cap}`);

for (const instruction of REQUESTS.slice(Number(process.argv[3] || 0))) {
  const r = await post(`/trips/${trip.id}/modify`, { instruction });
  if (r.status !== 200) {
    console.log(`\n✗ "${instruction}" → HTTP ${r.status} ${r.body.error?.code}: ${r.body.error?.message} (${r.secs}s)`);
    continue;
  }
  trip = r.body.trip;
  const v = trip.version;
  if (r.body.kind === 'conflict') {
    const c = trip.pendingConflict;
    console.log(`\n⚖ "${instruction}" → CONFLICT (${r.secs}s): ${c.message}`);
    c.options.forEach((o) => console.log(`    [${o.id}] ${o.label} ≈ ₹${o.estimateTotal} ${JSON.stringify(o.patch)}`));
    continue;
  }
  const d = v.diff;
  const starts = v.plan.days.flatMap((day) => day.activities.filter((a) => a.category !== 'transport').map((a) => a.time)).sort();
  console.log(`\n✓ "${instruction}" (${r.secs}s, ${v.ai?.model})`);
  console.log(`    ${v.change.summary}`);
  console.log(`    ₹${v.change.budgetBefore} → ₹${v.budget.total} / cap ₹${v.budget.cap} [${v.budget.status}] · +${d.added.length} ~${d.modified.length} -${d.removed.length} =${d.unchanged}` +
    `${d.stay ? ' · stay changed' : ''}${d.transport ? ' · transport changed' : ''} · energy ${v.plan.days.map((x) => x.energy).join('')} · earliest ${starts[0]}`);
  d.added.forEach((a) => console.log(`    + D${a.day} ${a.title}`));
  d.removed.forEach((a) => console.log(`    - D${a.day} ${a.title}`));
  d.modified.forEach((a) => console.log(`    ~ D${a.day} ${a.title} (${a.fields.join(',')})`));
  if (d.stay) console.log(`    stay: ${d.stay.before}  →  ${d.stay.after}`);
  v.change.notes?.forEach((n) => console.log(`    ℹ ${n}`));
  v.warnings.forEach((w) => console.log(`    ⚠ ${w}`));
}
