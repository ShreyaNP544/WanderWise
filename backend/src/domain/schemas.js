import { z } from 'zod';

const shortText = (max) => z.string().trim().min(1).max(max);

export const TRAVELLER_TYPES = ['solo', 'friends', 'couple', 'family', 'parents'];
export const PACES = ['relaxed', 'moderate', 'packed'];
export const STAY_TIERS = ['budget', 'mid', 'premium'];
export const TRANSPORT_MODES = ['train', 'bus', 'flight', 'any'];
export const DIETS = ['any', 'vegetarian', 'vegan', 'jain', 'halal'];

export const preferencesSchema = z.object({
  origin: shortText(80),
  destination: shortText(80),
  startDate: z.iso.date().optional(),
  days: z.number().int().min(1).max(14),
  budget: z.number().int().min(1000).max(1_000_000),
  travellers: z.number().int().min(1).max(12),
  travellerType: z.enum(TRAVELLER_TYPES),
  interests: z.array(shortText(40)).min(1).max(8),
  pace: z.enum(PACES),
  stay: z.enum(STAY_TIERS),
  transport: z.enum(TRANSPORT_MODES),
  diet: z.enum(DIETS).default('any'),
  constraints: z.string().trim().max(300).optional().default(''),
  avoid: z.array(shortText(40)).max(8).default([]),
});
