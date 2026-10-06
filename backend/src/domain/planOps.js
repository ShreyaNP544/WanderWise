import { matchAttraction } from './destinations.js';

/** Make activity IDs unique and well-formed (Gemma sometimes repeats them). */
export function normalizeIds(plan) {
  const seen = new Set();
  let n = 0;
  for (const day of plan.days) {
    for (const a of day.activities) {
      if (seen.has(a.id)) {
        do a.id = `x${++n}`;
        while (seen.has(a.id));
      }
      seen.add(a.id);
    }
  }
  return plan;
}

/** Day energy is derived from activities, not trusted from the model. */
export function deriveDayEnergy(plan) {
  for (const day of plan.days) {
    const hard = day.activities.filter((a) => a.energy === 3).length;
    const hours = day.activities.reduce((s, a) => s + (a.category === 'transport' ? 0 : a.durationHrs), 0);
    day.energy = hard >= 2 || hours > 9 ? 3 : hard === 1 || hours > 5 || day.activities.length >= 4 ? 2 : 1;
  }
  return plan;
}

/**
 * Provenance is decided by code, never claimed by the model:
 * an activity is "baseline" only if it matches an attraction in our dataset.
 */
export function annotateProvenance(plan, dest) {
  for (const day of plan.days) {
    for (const a of day.activities) {
      const match = a.category === 'transport' ? null : matchAttraction(dest, a);
      a.source = match ? 'baseline' : 'ai_estimate';
      if (match) {
        a.baselineName = match.name;
        a.baselineCost = match.cost;
        if (match.note) a.note = match.note;
      } else {
        delete a.baselineName;
        delete a.baselineCost;
      }
    }
  }
  return plan;
}

/** Keep days outside the requested scope exactly as they were. */
export function applyScope(prev, next, scopeDays) {
  if (!scopeDays || prev.days.length !== next.days.length) return { plan: next, restored: [] };
  const restored = [];
  next.days = next.days.map((day, i) => {
    if (scopeDays.includes(day.day)) return day;
    if (JSON.stringify(day) !== JSON.stringify(prev.days[i])) restored.push(day.day);
    return structuredClone(prev.days[i]);
  });
  // Day-scoped edits don't get to touch stays or intercity transport either.
  next.stay = structuredClone(prev.stay);
  next.transport = structuredClone(prev.transport);
  return { plan: next, restored };
}

const activityText = (a) => `${a.title} ${a.place} ${a.category} ${a.why}`.toLowerCase();

/** Warnings for constraints the plan doesn't honour (checked by code, after Gemma). */
export function constraintWarnings(plan, prefs, { keepInterests = [], interestPatterns = {} } = {}) {
  const warnings = [];
  const all = plan.days.flatMap((d) => d.activities);

  for (const term of prefs.avoid || []) {
    const hit = all.find((a) => activityText(a).includes(term.toLowerCase()));
    if (hit) warnings.push(`"${hit.title}" may conflict with your wish to avoid ${term}.`);
  }
  if (['parents', 'family'].includes(prefs.travellerType)) {
    const hard = all.filter((a) => a.energy === 3);
    if (hard.length) warnings.push(`${hard.length} strenuous activit${hard.length === 1 ? 'y' : 'ies'} remain; check they suit everyone.`);
  }
  for (const interest of keepInterests) {
    const re = interestPatterns[interest];
    if (re && !all.some((a) => re.test(activityText(a)))) warnings.push(`No clear ${interest.toLowerCase()} experience is left in the plan.`);
  }
  if (plan.days.length !== prefs.days) warnings.push(`Plan has ${plan.days.length} days but the trip is ${prefs.days} days.`);
  return warnings;
}
