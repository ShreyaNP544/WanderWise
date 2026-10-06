// Exact diff between two plan versions, computed by code from activity IDs.

const FIELDS = ['title', 'time', 'place', 'costPerPerson', 'durationHrs', 'energy'];

function indexActivities(plan) {
  const map = new Map();
  for (const day of plan.days) for (const a of day.activities) map.set(a.id, { ...a, day: day.day });
  return map;
}

const summarizeStay = (plan) => plan.stay.map((s) => `${s.nights}n ${s.type} (${s.area}) ₹${s.costPerNight}/${s.per}`).join('; ');
const summarizeTransport = (plan) => plan.transport.map((t) => `${t.leg}: ${t.mode} ₹${t.costPerPerson}`).join('; ');

export function diffPlans(prev, next) {
  const before = indexActivities(prev);
  const after = indexActivities(next);

  const added = [];
  const modified = [];
  const removed = [];

  for (const [id, a] of after) {
    const old = before.get(id);
    if (!old) added.push({ id, day: a.day, title: a.title });
    else {
      const fields = FIELDS.filter((f) => old[f] !== a[f]);
      if (old.day !== a.day) fields.push('day');
      if (fields.length) modified.push({ id, day: a.day, title: a.title, fields, before: old.title !== a.title ? old.title : undefined });
    }
  }
  for (const [id, a] of before) if (!after.has(id)) removed.push({ id, day: a.day, title: a.title });

  const stayBefore = summarizeStay(prev);
  const stayAfter = summarizeStay(next);
  const transportBefore = summarizeTransport(prev);
  const transportAfter = summarizeTransport(next);

  return {
    added,
    modified,
    removed,
    unchanged: [...after.keys()].filter((id) => before.has(id) && !modified.some((m) => m.id === id)).length,
    stay: stayBefore !== stayAfter ? { before: stayBefore, after: stayAfter } : null,
    transport: transportBefore !== transportAfter ? { before: transportBefore, after: transportAfter } : null,
    food: prev.foodPerPersonPerDay !== next.foodPerPersonPerDay ? { before: prev.foodPerPersonPerDay, after: next.foodPerPersonPerDay } : null,
  };
}
