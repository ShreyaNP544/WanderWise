import { baselineBlock, HONESTY_RULES, inr, JSON_ONLY, preferencesBlock, ROLE } from './shared.js';

/** T9 constraint-conflict detection: explain the clash and offer concrete trade-offs. */
export function buildConflictPrompt({ prefs, request, feasibility, grounding, currentTotal }) {
  return [
    ROLE,
    `## Task
The traveller asked for something that cannot be satisfied as stated. Do NOT produce a plan.
Explain the conflict in one plain sentence and offer 2 or 3 options. Each option must relax a DIFFERENT constraint (for example: raise the budget, shorten the trip, cheaper stays/transport, fewer travellers).`,
    preferencesBlock(prefs),
    request ? `<user_request>\n${request}\n</user_request>` : '',
    `## Computed by the system (trust these numbers)
- Budget cap: ${inr(prefs.budget)}
- Cheapest realistic total for ${prefs.travellers} travellers × ${prefs.days} days ≈ ${inr(feasibility.floor)}
- Shortfall ≈ ${inr(feasibility.shortfall)}
${currentTotal ? `- Current plan total: ${inr(currentTotal)}` : ''}`,
    baselineBlock(grounding),
    HONESTY_RULES,
    `## Output JSON shape
{
  "message": "one sentence, plain language, no blame",
  "conflictingConstraints": ["budget ₹15,000", "4 travellers", "5 days"],
  "options": [
    { "id": "A", "label": "short button label", "relaxes": "which constraint gives",
      "estimateTotal": 0, "tradeoff": "what the traveller gives up",
      "instruction": "a concrete edit instruction to apply this option",
      "patch": { "budget": 0, "days": 0, "travellers": 0, "stay": "budget|mid|premium", "transport": "train|bus|flight|any", "pace": "relaxed|moderate|packed" } }
  ]
}
In "patch" include ONLY the fields this option changes. estimateTotal must be realistic given the computed numbers.
The cheapest realistic total is a bare minimum with no comfort margin: any option that raises the budget should raise it to at least 15% above it.
Write amounts in "message" and "tradeoff" with the ₹ symbol and Indian digit grouping (₹29,600).`,
    JSON_ONLY,
  ]
    .filter(Boolean)
    .join('\n\n');
}
