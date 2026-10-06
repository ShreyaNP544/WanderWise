import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import * as ai from '../ai/index.js';
import { inr } from '../ai/prompts/shared.js';
import { buildContext, contextForPrompt } from '../grounding/index.js';
import { computeBudget } from '../domain/budget.js';
import { findDestination, groundingFor } from '../domain/destinations.js';
import { diffPlans } from '../domain/diff.js';
import { assessFeasibility } from '../domain/feasibility.js';
import { INTEREST_WORDS, parseInstruction } from '../domain/instruction.js';
import { annotateProvenance, applyScope, constraintWarnings, deriveDayEnergy, normalizeIds } from '../domain/planOps.js';
import { AppError } from '../middleware/errors.js';
import { getStore } from '../store/index.js';

const MAX_VERSIONS = 15;
const newId = () => randomBytes(9).toString('base64url');
const inFlight = new Set(); // one modification per trip at a time

function finalize(plan, dest, places) {
  return deriveDayEnergy(annotateProvenance(normalizeIds(plan), dest, places));
}

const budgetUnderstanding = { patch: {}, scope: { days: null }, strategies: ['budget'], keep: [], keepInterests: [], assumptions: [] };

/** If code finds the plan over budget, ask Gemma for one targeted saving pass. Keeps the better result. */
async function enforceBudget({ plan, prefs, dest, grounding, live, places, history, keep = [] }) {
  const budget = computeBudget(plan, prefs);
  if (budget.status === 'within') return { plan, budget, meta: null };
  try {
    const fixed = await ai.editPlan({
      plan,
      prefs,
      previousPrefs: prefs,
      grounding,
      live,
      request: `The plan is ${inr(budget.total - budget.cap)} over the ${inr(budget.cap)} budget. Bring it under budget by cutting the lowest-priority spending.`,
      understood: { ...budgetUnderstanding, keep },
      budget: { current: budget.total, cap: budget.cap, needed: Math.round(budget.total - budget.cap * 0.92) },
      history,
    });
    const fixedPlan = finalize(fixed.plan, dest, places);
    const fixedBudget = computeBudget(fixedPlan, prefs);
    if (fixedBudget.total < budget.total) return { plan: fixedPlan, budget: fixedBudget, meta: fixed.meta };
  } catch (err) {
    console.warn(JSON.stringify({ scope: 'trip', event: 'budget_repair_failed', code: err.code }));
  }
  return { plan, budget, meta: null };
}

function overBudgetWarning(budget, feasibility) {
  if (budget.status === 'within') return [];
  const floor = feasibility?.known && feasibility.floor > budget.cap ? ` The cheapest realistic version costs about ${inr(feasibility.floor)}.` : '';
  return [`This plan is ${inr(budget.total - budget.cap)} over your ${inr(budget.cap)} budget.${floor}`];
}

const EMPTY_WARNING = /^(none|n\/a|no warnings?|nothing)\b/i;
const cleanWarnings = (list = []) => list.filter((w) => w && !EMPTY_WARNING.test(w.trim()));

/** Code referees Gemma's options: a raised budget must clear the bare-minimum floor with a margin. */
function normalizeOptions(options, floor) {
  const minBudget = Math.ceil((floor * 1.15) / 500) * 500;
  return options.map((o) => {
    if (o.patch.budget && o.patch.budget < minBudget) {
      return { ...o, patch: { ...o.patch, budget: minBudget }, estimateTotal: Math.max(o.estimateTotal, Math.round(floor * 1.05)) };
    }
    return o;
  });
}

function makeVersion({ prefs, plan, budget, change = null, diff = null, warnings = [], ai: aiMeta, instruction = null }) {
  return {
    createdAt: new Date().toISOString(),
    instruction,
    preferences: prefs,
    plan,
    budget,
    change,
    diff,
    warnings: [...new Set(warnings)],
    ai: aiMeta,
  };
}

export function serializeTrip(trip) {
  const version = trip.versions[trip.current];
  const dest = findDestination(version.preferences.destination);
  return {
    id: trip.id,
    createdAt: trip.createdAt,
    destination: { name: dest ? `${dest.name}, ${dest.state}` : version.preferences.destination, hasBaseline: Boolean(dest) },
    preferences: version.preferences,
    version,
    current: trip.current,
    versionCount: trip.versions.length,
    history: trip.history,
    pendingConflict: trip.pendingConflict,
    // The version this one was derived from, so the UI can show a real before/after.
    previous: trip.current > 0 ? { plan: trip.versions[trip.current - 1].plan, budget: trip.versions[trip.current - 1].budget } : null,
    context: trip.context && {
      location: trip.context.location,
      distanceKm: trip.context.distanceKm,
      places: trip.context.places.map(({ name, description, url }) => ({ name, description, url })),
      weather: trip.context.weather,
      sources: trip.context.sources,
      fetchedAt: trip.context.fetchedAt,
    },
  };
}

/** Without curated route data, straight-line distance still gives Gemma (and the user) a reality check. */
function addDistanceNote(feasibility, context) {
  if (context?.distanceKm && !feasibility.routeKnown) {
    feasibility.notes = [...(feasibility.notes || []), `About ${context.distanceKm.toLocaleString('en-IN')} km in a straight line from the origin; road or rail is usually 30–50% longer.`];
  }
}

// ─────────────────────────────── Generate ───────────────────────────────

export async function generateTrip(prefs) {
  const dest = findDestination(prefs.destination);
  const grounding = groundingFor(dest, prefs);
  const feasibility = assessFeasibility(prefs, dest);
  const context = await buildContext(prefs, dest);
  const live = contextForPrompt(context);
  addDistanceNote(feasibility, context);

  const first = await ai.generatePlan({ prefs, grounding, live, feasibility });
  const enforced = await enforceBudget({ plan: finalize(first.plan, dest, context.places), prefs, dest, grounding, live, places: context.places, history: [] });

  const warnings = [
    ...overBudgetWarning(enforced.budget, feasibility),
    ...feasibility.notes,
    ...constraintWarnings(enforced.plan, prefs),
  ];

  const trip = {
    id: newId(),
    createdAt: new Date().toISOString(),
    versions: [makeVersion({ prefs, plan: enforced.plan, budget: enforced.budget, warnings, ai: enforced.meta || first.meta })],
    current: 0,
    history: [],
    pendingConflict: null,
    context,
  };
  await getStore().save(trip);
  return serializeTrip(trip);
}

// ─────────────────────────────── Modify ───────────────────────────────

export async function modifyTrip(id, { instruction, optionId }) {
  if (inFlight.has(id)) throw new AppError(409, 'BUSY', 'Still working on your last change. One moment.', { retryable: true });
  inFlight.add(id);
  try {
    return await runModification(id, { instruction, optionId });
  } finally {
    inFlight.delete(id);
  }
}

async function runModification(id, { instruction, optionId }) {
  const store = getStore();
  const trip = await store.get(id);
  if (!trip) throw new AppError(404, 'NOT_FOUND', 'Trip not found.');

  const current = trip.versions[trip.current];
  const prefs = current.preferences;

  // A chosen trade-off option carries a concrete instruction + constraint patch.
  let option = null;
  if (optionId) {
    option = trip.pendingConflict?.options.find((o) => o.id === optionId);
    if (!option) throw new AppError(400, 'VALIDATION_ERROR', 'That option is no longer available.');
    instruction = `${trip.pendingConflict.request ? `${trip.pendingConflict.request}. ` : ''}${option.instruction}`;
  }

  const understood = parseInstruction(instruction, prefs, current.budget.total);
  if (option) {
    Object.assign(understood.patch, option.patch);
    if (option.patch.budget || option.patch.stay || option.patch.transport) understood.strategies = [...new Set([...understood.strategies, 'budget'])];
  }

  const nextPrefs = { ...prefs, ...understood.patch };
  const dest = findDestination(nextPrefs.destination);
  const grounding = groundingFor(dest, nextPrefs);
  const feasibility = assessFeasibility(nextPrefs, dest);
  const history = trip.history.slice(-3).map((h) => h.instruction);
  if (!trip.context) trip.context = await buildContext(nextPrefs, dest);
  const { context } = trip;
  const live = contextForPrompt(context);
  addDistanceNote(feasibility, context);

  // ── Conflict: impossible as stated → offer trade-offs instead of a fake plan
  if (feasibility.known && !feasibility.feasible && !option) {
    const { conflict, meta } = await ai.proposeTradeoffs({
      prefs: nextPrefs, request: instruction, feasibility, grounding, currentTotal: current.budget.total,
    });
    trip.pendingConflict = {
      ...conflict,
      options: normalizeOptions(conflict.options, feasibility.floor),
      request: instruction,
      floor: feasibility.floor,
      ai: meta,
    };
    trip.history.push({ instruction, at: new Date().toISOString(), outcome: 'conflict' });
    await store.save(trip);
    return { kind: 'conflict', trip: serializeTrip(trip) };
  }

  // ── Edit the existing plan
  const currentUnderNew = computeBudget(current.plan, nextPrefs);
  if (currentUnderNew.status === 'over' && !understood.strategies.includes('budget')) understood.strategies.push('budget');
  if (understood.strategies.length > 1) understood.strategies = understood.strategies.filter((s) => s !== 'general');

  const edited = await ai.editPlan({
    plan: current.plan,
    prefs: nextPrefs,
    previousPrefs: prefs,
    grounding,
    live,
    request: instruction,
    understood,
    budget: { current: currentUnderNew.total, cap: nextPrefs.budget, needed: Math.max(0, Math.round(currentUnderNew.total - nextPrefs.budget * 0.92)) },
    history,
  });

  const scoped = applyScope(current.plan, edited.plan, understood.scope.days);
  const keep = [...understood.keep, ...understood.keepInterests];
  const enforced = await enforceBudget({ plan: finalize(scoped.plan, dest, context.places), prefs: nextPrefs, dest, grounding, live, places: context.places, history, keep });

  const diff = diffPlans(current.plan, enforced.plan);
  edited.change.warnings = cleanWarnings(edited.change.warnings);
  const warnings = [
    ...edited.change.warnings,
    ...overBudgetWarning(enforced.budget, feasibility),
    ...constraintWarnings(enforced.plan, nextPrefs, { keepInterests: understood.keepInterests, interestPatterns: INTEREST_WORDS }),
  ];
  const notes = [
    ...understood.assumptions,
    ...(scoped.restored.length ? [`Kept day ${scoped.restored.join(', ')} exactly as before, since you only asked about day ${understood.scope.days.join(', ')}.`] : []),
  ];

  const version = makeVersion({
    prefs: nextPrefs,
    plan: enforced.plan,
    budget: enforced.budget,
    instruction,
    change: { ...edited.change, notes, strategies: understood.strategies, scope: understood.scope, budgetBefore: current.budget.total },
    diff,
    warnings,
    ai: enforced.meta || edited.meta,
  });

  trip.versions = [...trip.versions.slice(0, trip.current + 1), version].slice(-MAX_VERSIONS);
  trip.current = trip.versions.length - 1;
  trip.history.push({ instruction, at: version.createdAt, outcome: 'applied' });
  trip.pendingConflict = null;
  await store.save(trip);
  return { kind: 'applied', trip: serializeTrip(trip) };
}

// ─────────────────────────────── Demo trip ───────────────────────────────

const DEMO_FILE = new URL('../data/demo-trip.json', import.meta.url);

/** A pre-generated showcase trip: opens instantly and never depends on Gemma being up. */
export async function createDemoTrip() {
  let template;
  try {
    template = JSON.parse(await readFile(DEMO_FILE, 'utf8'));
  } catch {
    throw new AppError(404, 'NOT_FOUND', 'The demo trip is not available yet.');
  }
  const trip = { ...structuredClone(template), id: newId(), createdAt: new Date().toISOString() };
  await getStore().save(trip);
  return serializeTrip(trip);
}

/** Used by scripts/make-demo.js to snapshot a real generated trip. */
export async function exportTrip(id) {
  const trip = await getStore().get(id);
  if (!trip) throw new AppError(404, 'NOT_FOUND', 'Trip not found.');
  return trip;
}

// ─────────────────────────────── Read / undo ───────────────────────────────

export async function getTrip(id) {
  const trip = await getStore().get(id);
  if (!trip) throw new AppError(404, 'NOT_FOUND', 'Trip not found.');
  return serializeTrip(trip);
}

export async function undoTrip(id) {
  const store = getStore();
  const trip = await store.get(id);
  if (!trip) throw new AppError(404, 'NOT_FOUND', 'Trip not found.');
  if (trip.current === 0) throw new AppError(400, 'VALIDATION_ERROR', 'Nothing to undo.');
  trip.current -= 1;
  trip.pendingConflict = null;
  trip.history.push({ instruction: 'Undo', at: new Date().toISOString(), outcome: 'undo' });
  await store.save(trip);
  return serializeTrip(trip);
}

export async function dismissConflict(id) {
  const store = getStore();
  const trip = await store.get(id);
  if (!trip) throw new AppError(404, 'NOT_FOUND', 'Trip not found.');
  trip.pendingConflict = null;
  await store.save(trip);
  return serializeTrip(trip);
}
