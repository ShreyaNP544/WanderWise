// End-to-end scenarios against real Gemma. Run: node --env-file=.env scripts/scenarios.js
// Prints a compact report and writes full results to scripts/scenario-results.json.
import { writeFileSync } from 'node:fs';
import { generateTrip, modifyTrip } from '../src/services/tripService.js';

const base = { startDate: undefined, stay: 'budget', transport: 'train', diet: 'any', constraints: '', avoid: [] };

const SCENARIOS = [
  {
    name: 'Goa friends trip',
    prefs: { ...base, origin: 'Mumbai', destination: 'Goa', days: 5, budget: 25000, travellers: 2, travellerType: 'friends', interests: ['Beaches', 'Food', 'Nightlife'], pace: 'moderate' },
    edits: [
      'Reduce the budget from ₹25,000 to ₹18,000 but keep the beach and food experiences.',
      'Make day 3 less tiring',
      "Actually, we're travelling with my parents now",
      { option: 0 },
    ],
  },
  {
    name: 'Rishikesh solo adventure',
    prefs: { ...base, origin: 'Delhi', destination: 'Rishikesh', days: 3, budget: 12000, travellers: 1, travellerType: 'solo', interests: ['Adventure', 'Spiritual', 'Nature'], pace: 'packed', transport: 'bus' },
    edits: ['Add one hidden-gem experience'],
  },
  {
    name: 'Jaipur family with kids',
    prefs: { ...base, origin: 'Delhi', destination: 'Jaipur', days: 3, budget: 30000, travellers: 4, travellerType: 'family', interests: ['Culture & history', 'Food', 'Shopping'], pace: 'relaxed', stay: 'mid', constraints: 'Travelling with a 6-year-old' },
    edits: ['I care more about food than sightseeing'],
  },
  {
    name: 'Chikmagalur couple (no baseline data)',
    prefs: { ...base, origin: 'Bengaluru', destination: 'Chikmagalur, Karnataka', days: 4, budget: 20000, travellers: 2, travellerType: 'couple', interests: ['Nature', 'Mountains', 'Food'], pace: 'relaxed', diet: 'vegetarian', transport: 'bus' },
    edits: [],
  },
];

const results = [];
const line = (s) => console.log(s);

function describe(trip) {
  const v = trip.version;
  const acts = v.plan.days.flatMap((d) => d.activities);
  return {
    days: v.plan.days.length,
    total: v.budget.total,
    cap: v.budget.cap,
    status: v.budget.status,
    activities: acts.length,
    baseline: acts.filter((a) => a.source === 'baseline').length,
    energy: v.plan.days.map((d) => d.energy).join(''),
    model: `${v.ai?.model}${v.ai?.repaired ? ' (repaired)' : ''}${v.ai?.fallback ? ' (fallback)' : ''}`,
    warnings: v.warnings,
  };
}

for (const sc of SCENARIOS) {
  line(`\n━━ ${sc.name}`);
  const record = { name: sc.name, steps: [] };
  let t = Date.now();
  let trip;
  try {
    trip = await generateTrip(sc.prefs);
    const d = describe(trip);
    line(`  GENERATE ${((Date.now() - t) / 1000).toFixed(1)}s · ${d.days} days · ₹${d.total} / ₹${d.cap} [${d.status}] · ${d.activities} acts (${d.baseline} baseline) · energy ${d.energy} · ${d.model}`);
    line(`    "${trip.version.plan.title}"`);
    d.warnings.forEach((w) => line(`    ⚠ ${w}`));
    record.steps.push({ step: 'generate', seconds: (Date.now() - t) / 1000, ...d, trip });
  } catch (err) {
    line(`  GENERATE FAILED: ${err.code} ${err.message}`);
    record.steps.push({ step: 'generate', error: `${err.code} ${err.message}` });
    results.push(record);
    continue;
  }

  for (const edit of sc.edits) {
    t = Date.now();
    const body = typeof edit === 'string' ? { instruction: edit } : { optionId: trip.pendingConflict?.options[edit.option]?.id };
    const label = typeof edit === 'string' ? `"${edit}"` : `choose option ${body.optionId}: ${trip.pendingConflict?.options[edit.option]?.label}`;
    try {
      const res = await modifyTrip(trip.id, body);
      trip = res.trip;
      const secs = ((Date.now() - t) / 1000).toFixed(1);
      if (res.kind === 'conflict') {
        const c = trip.pendingConflict;
        line(`  MODIFY ${label}\n    → CONFLICT ${secs}s: ${c.message}`);
        c.options.forEach((o) => line(`      [${o.id}] ${o.label}: ~₹${o.estimateTotal} · ${o.tradeoff} · patch ${JSON.stringify(o.patch)}`));
        record.steps.push({ step: label, kind: 'conflict', seconds: Number(secs), conflict: c });
      } else {
        const d = describe(trip);
        const diff = trip.version.diff;
        const ch = trip.version.change;
        line(`  MODIFY ${label}\n    → APPLIED ${secs}s · ₹${ch.budgetBefore} → ₹${d.total} / ₹${d.cap} [${d.status}] · +${diff.added.length} ~${diff.modified.length} -${diff.removed.length} =${diff.unchanged} · energy ${d.energy} · ${d.model}`);
        line(`    summary: ${ch.summary}`);
        if (ch.preserved?.length) line(`    kept: ${ch.preserved.join(' | ')}`);
        ch.notes?.forEach((n) => line(`    ℹ ${n}`));
        d.warnings.forEach((w) => line(`    ⚠ ${w}`));
        record.steps.push({ step: label, kind: 'applied', seconds: Number(secs), ...d, diff, change: ch });
      }
    } catch (err) {
      line(`  MODIFY ${label} FAILED: ${err.code} ${err.message}`);
      record.steps.push({ step: label, error: `${err.code} ${err.message}` });
    }
  }
  results.push(record);
}

writeFileSync(new URL('./scenario-results.json', import.meta.url), JSON.stringify(results, null, 2));
line('\nFull results: scripts/scenario-results.json');
