// Pure helpers for presenting a trip (no React).
import {
  Bike, Coffee, Compass, Flower2, Landmark, Mountain, PawPrint, ShoppingBag, TrainFront, UtensilsCrossed,
} from 'lucide-react';

export const CATEGORY = {
  sightseeing: { label: 'Sightseeing', Icon: Compass },
  nature: { label: 'Nature', Icon: Mountain },
  adventure: { label: 'Adventure', Icon: Bike },
  food: { label: 'Food', Icon: UtensilsCrossed },
  culture: { label: 'Culture', Icon: Landmark },
  shopping: { label: 'Shopping', Icon: ShoppingBag },
  spiritual: { label: 'Spiritual', Icon: Flower2 },
  wildlife: { label: 'Wildlife', Icon: PawPrint },
  rest: { label: 'Rest', Icon: Coffee },
  transport: { label: 'Travel', Icon: TrainFront },
};

export const ENERGY = {
  1: { label: 'Easy day', tone: 'bg-ok' },
  2: { label: 'Moderate day', tone: 'bg-warn' },
  3: { label: 'Intense day', tone: 'bg-danger' },
};

export const BUDGET_PARTS = [
  { key: 'stay', label: 'Stay', color: 'bg-brand-700' },
  { key: 'transport', label: 'Transport', color: 'bg-brand-500' },
  { key: 'food', label: 'Food', color: 'bg-sunset-500' },
  { key: 'activities', label: 'Activities', color: 'bg-amber-400' },
  { key: 'buffer', label: 'Buffer (5%)', color: 'bg-line' },
];

export const mapsUrl = (activity, destination) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${activity.place || activity.title}, ${destination}`)}`;

/** id → 'added' | 'modified' for highlighting after a reshape */
export function changeMarks(diff) {
  const marks = {};
  if (!diff) return marks;
  for (const a of diff.added) marks[a.id] = 'added';
  for (const m of diff.modified) marks[m.id] = 'modified';
  return marks;
}

export function formatDate(iso, opts = { weekday: 'short', day: 'numeric', month: 'short' }) {
  if (!iso) return '';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', opts);
}

export function addDays(iso, n) {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const RESHAPE_SUGGESTIONS = [
  'Make this trip 30% cheaper',
  'Make day 2 more relaxed',
  'Replace touristy places with quieter experiences',
  'Add more local food',
  "I'm travelling with my parents",
  'Give me one adventurous activity',
  "I don't want to wake up before 8 AM",
  'Keep the budget unchanged but improve the hotel',
];

export const LOADING_LINES = {
  create: [
    'Reading your preferences…',
    'Checking routes and travel times…',
    'Finding real places nearby…',
    'Checking the weather for your dates…',
    'Gemma is designing your days…',
    'Balancing your budget, rupee by rupee…',
    'Double-checking every total…',
  ],
  modify: [
    'Understanding your request…',
    'Checking what must stay the same…',
    'Gemma is reshaping your plan…',
    'Re-balancing the budget…',
    'Comparing with your previous version…',
  ],
};
