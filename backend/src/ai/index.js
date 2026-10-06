// The AI module's public API. The rest of the app only talks to Gemma through these functions.
import { ConflictSchema, ModifiedPlanSchema, PlanSchema } from '../domain/planSchema.js';
import { generateJSON } from './gateway.js';
import { buildConflictPrompt } from './prompts/conflict.js';
import { buildModifyPrompt } from './prompts/modify.js';
import { buildPlanPrompt } from './prompts/plan.js';

// Long trips need room for the whole JSON, or it gets cut off mid-object.
const outputBudget = (days) => Math.min(16384, 3000 + days * 1200);

const dayCountCheck = (days) => (plan) => {
  if (plan.days.length !== days) return `The plan must have exactly ${days} days but has ${plan.days.length}.`;
  const numbers = plan.days.map((d) => d.day).join(',');
  const expected = Array.from({ length: days }, (_, i) => i + 1).join(',');
  return numbers === expected ? null : `Days must be numbered ${expected} in order (got ${numbers}).`;
};

export async function generatePlan({ prefs, grounding, live, feasibility }) {
  const { data, meta } = await generateJSON({
    task: 'plan',
    prompt: buildPlanPrompt({ prefs, grounding, live, feasibility }),
    schema: PlanSchema,
    check: dayCountCheck(prefs.days),
    temperature: 0.5,
    maxOutputTokens: outputBudget(prefs.days),
  });
  return { plan: data, meta };
}

export async function editPlan(input) {
  const { data, meta } = await generateJSON({
    task: `modify:${input.understood.strategies.join('+')}`,
    prompt: buildModifyPrompt(input),
    schema: ModifiedPlanSchema,
    check: dayCountCheck(input.prefs.days),
    temperature: 0.3,
    maxOutputTokens: outputBudget(input.prefs.days),
  });
  const { change, ...plan } = data;
  return { plan, change, meta };
}

export async function proposeTradeoffs(input) {
  const { data, meta } = await generateJSON({
    task: 'conflict',
    prompt: buildConflictPrompt(input),
    schema: ConflictSchema,
    temperature: 0.3,
    maxOutputTokens: 2048,
  });
  return { conflict: data, meta };
}
