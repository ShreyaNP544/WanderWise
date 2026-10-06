import { z } from 'zod';

// Schemas for what Gemma returns. Lenient where a sensible default exists
// (so a missing "why" doesn't fail a whole trip), strict where it matters (structure, numbers).

const money = z.coerce.number().min(0).max(500_000).transform(Math.round);
const text = (max = 400) => z.string().trim().max(max);
const list = (max = 200) => z.array(text(max)).max(12).catch([]);

export const CATEGORIES = ['sightseeing', 'nature', 'adventure', 'food', 'culture', 'shopping', 'spiritual', 'wildlife', 'rest', 'transport'];

export const ActivitySchema = z.object({
  id: z.coerce.string().trim().min(1).max(20),
  time: text(10).catch(''),
  title: text(120).min(1),
  place: text(120).catch(''),
  category: z.enum(CATEGORIES).catch('sightseeing'),
  costPerPerson: money,
  durationHrs: z.coerce.number().min(0).max(48).catch(1),
  energy: z.coerce.number().int().min(1).max(3).catch(2),
  why: text(300).catch(''),
  confidence: z.enum(['high', 'medium', 'low']).catch('medium'),
  hiddenGem: z.boolean().optional().catch(undefined),
  whyHidden: text(200).optional().catch(undefined),
});

export const DaySchema = z.object({
  day: z.coerce.number().int().min(1).max(14),
  title: text(120).min(1),
  type: z.enum(['travel', 'explore', 'rest']).catch('explore'),
  activities: z.array(ActivitySchema).min(1).max(8),
});

export const StaySchema = z.object({
  nights: z.coerce.number().int().min(0).max(14),
  area: text(120).catch(''),
  type: text(80).catch('Stay'),
  tier: z.enum(['budget', 'mid', 'premium']).catch('budget'),
  per: z.enum(['room', 'bed']).catch('room'),
  costPerNight: money,
});

export const TransportSchema = z.object({
  leg: text(120).min(1),
  mode: text(40).catch('other'),
  costPerPerson: money,
  hours: z.coerce.number().min(0).max(80).catch(0),
});

export const PlanSchema = z.object({
  title: text(120).min(1),
  summary: text(600).catch(''),
  days: z.array(DaySchema).min(1).max(14),
  stay: z.array(StaySchema).max(6).catch([]),
  transport: z.array(TransportSchema).max(8).catch([]),
  foodPerPersonPerDay: money,
  localTransportPerPersonPerDay: money.catch(0),
  whyItWorks: list(),
  assumptions: list(),
  checkBefore: list(),
  tradeoffNotes: list(),
});

export const ChangeSchema = z.object({
  summary: text(400).min(1),
  reasoning: text(800).catch(''),
  preserved: list(),
  warnings: list(),
});

export const ModifiedPlanSchema = PlanSchema.extend({ change: ChangeSchema });

const PatchSchema = z
  .object({
    budget: z.coerce.number().int().min(1000).max(1_000_000).optional(),
    days: z.coerce.number().int().min(1).max(14).optional(),
    travellers: z.coerce.number().int().min(1).max(12).optional(),
    stay: z.enum(['budget', 'mid', 'premium']).optional(),
    transport: z.enum(['train', 'bus', 'flight', 'any']).optional(),
    pace: z.enum(['relaxed', 'moderate', 'packed']).optional(),
  })
  .catch({});

export const ConflictSchema = z.object({
  message: text(400).min(1),
  conflictingConstraints: list(),
  options: z
    .array(
      z.object({
        id: z.coerce.string().max(4),
        label: text(80).min(1),
        relaxes: text(120).catch(''),
        estimateTotal: money.catch(0),
        tradeoff: text(240).catch(''),
        instruction: text(300).min(1),
        patch: PatchSchema,
      })
    )
    .min(2)
    .max(3),
});
