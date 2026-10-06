import {
  baselineBlock, COST_RULES, feasibilityBlock, HONESTY_RULES, JSON_ONLY, liveDataBlock, PLAN_JSON_SHAPE, PLAN_RULES,
  preferencesBlock, PRIORITY_ORDER, ROLE,
} from './shared.js';

/** T1 trip generation (with T10 summary folded in via whyItWorks/summary). */
export function buildPlanPrompt({ prefs, grounding, live, feasibility }) {
  return [
    ROLE,
    '## Task\nDesign a complete day-by-day trip for this traveller.',
    preferencesBlock(prefs),
    baselineBlock(grounding),
    liveDataBlock(live),
    feasibilityBlock(feasibility, prefs.budget),
    PRIORITY_ORDER,
    PLAN_RULES,
    COST_RULES,
    HONESTY_RULES,
    `## Output\nExactly ${prefs.days} days, numbered 1 to ${prefs.days}. JSON shape:\n${PLAN_JSON_SHAPE}`,
    JSON_ONLY,
  ]
    .filter(Boolean)
    .join('\n\n');
}
