// Option values must match backend/src/domain/schemas.js.

export const TRAVELLER_TYPES = [
  { value: 'solo', label: 'Solo' },
  { value: 'friends', label: 'Friends' },
  { value: 'couple', label: 'Couple' },
  { value: 'family', label: 'Family with kids' },
  { value: 'parents', label: 'With parents' },
];

export const INTERESTS = [
  'Mountains', 'Beaches', 'Photography', 'Food', 'Culture & history', 'Adventure',
  'Nature', 'Spiritual', 'Wildlife', 'Nightlife', 'Shopping', 'Hidden gems',
];

export const PACES = [
  { value: 'relaxed', label: 'Relaxed', hint: '2 things a day, long breaks' },
  { value: 'moderate', label: 'Moderate', hint: 'A good balance' },
  { value: 'packed', label: 'Packed', hint: 'See as much as possible' },
];

export const STAY_TIERS = [
  { value: 'budget', label: 'Budget', hint: 'Hostels, homestays' },
  { value: 'mid', label: 'Comfort', hint: '3-star, private rooms' },
  { value: 'premium', label: 'Premium', hint: 'Resorts, boutique' },
];

export const TRANSPORT_MODES = [
  { value: 'train', label: 'Train' },
  { value: 'bus', label: 'Bus' },
  { value: 'flight', label: 'Flight' },
  { value: 'any', label: 'Cheapest sensible' },
];

export const DIETS = [
  { value: 'any', label: 'No preference' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'jain', label: 'Jain' },
  { value: 'halal', label: 'Halal' },
];

export const SUGGESTED_DESTINATIONS = [
  'Manali, Himachal', 'Goa', 'Jaipur', 'Rishikesh', 'Udaipur', 'Munnar, Kerala',
  'Varanasi', 'Darjeeling', 'Pondicherry', 'Coorg',
];

export const BUDGET_PRESETS = [10000, 20000, 35000, 50000];
