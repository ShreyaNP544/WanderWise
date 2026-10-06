// Trip-preference business logic: defaults, per-step validation, API payload.
// Limits mirror backend/src/domain/schemas.js so users see errors before a round trip.

export const LIMITS = {
  days: { min: 1, max: 14 },
  budget: { min: 1000, max: 1_000_000 },
  travellers: { min: 1, max: 12 },
  interests: { max: 8 },
};

export const DEFAULT_PREFERENCES = {
  origin: '',
  destination: '',
  startDate: '',
  days: 5,
  budget: 20000,
  travellers: 2,
  travellerType: 'friends',
  interests: [],
  pace: 'moderate',
  stay: 'budget',
  transport: 'train',
  diet: 'any',
  constraints: '',
  avoid: [],
};

export const STEPS = [
  { id: 'where', title: 'Where & when', fields: ['origin', 'destination', 'startDate', 'days'] },
  { id: 'who', title: 'Who & budget', fields: ['travellers', 'travellerType', 'budget'] },
  { id: 'style', title: 'Your style', fields: ['interests', 'pace', 'stay', 'transport', 'diet', 'constraints', 'avoid'] },
];

const inRange = (n, { min, max }) => Number.isInteger(n) && n >= min && n <= max;

function today() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

const rules = {
  origin: (p) => (!p.origin.trim() ? 'Where are you starting from?' : null),
  destination: (p) => (!p.destination.trim() ? 'Where do you want to go?' : null),
  startDate: (p) => (p.startDate && p.startDate < today() ? 'Pick a date from today onwards.' : null),
  days: (p) => (!inRange(p.days, LIMITS.days) ? `Trips can be ${LIMITS.days.min}–${LIMITS.days.max} days.` : null),
  travellers: (p) =>
    !inRange(p.travellers, LIMITS.travellers) ? `${LIMITS.travellers.min}–${LIMITS.travellers.max} travellers.` : null,
  budget: (p) =>
    !inRange(p.budget, LIMITS.budget) ? 'Enter a total budget between ₹1,000 and ₹10,00,000.' : null,
  interests: (p) =>
    p.interests.length === 0
      ? 'Pick at least one interest so the plan feels like yours.'
      : p.interests.length > LIMITS.interests.max
        ? `Pick up to ${LIMITS.interests.max}.`
        : null,
  constraints: (p) => (p.constraints.length > 300 ? 'Keep this under 300 characters.' : null),
};

export function validateFields(prefs, fields) {
  const errors = {};
  for (const field of fields) {
    const message = rules[field]?.(prefs);
    if (message) errors[field] = message;
  }
  return errors;
}

export const validateStep = (prefs, stepIndex) => validateFields(prefs, STEPS[stepIndex].fields);

export const validateAll = (prefs) => validateFields(prefs, STEPS.flatMap((s) => s.fields));

export function toPayload(prefs) {
  const { startDate, constraints, ...rest } = prefs;
  return {
    ...rest,
    origin: prefs.origin.trim(),
    destination: prefs.destination.trim(),
    constraints: constraints.trim(),
    ...(startDate && { startDate }),
  };
}

// Server field errors ("details") → { field: message } for the form.
export function serverErrorsToFields(details = []) {
  return Object.fromEntries(details.map((d) => [d.field.split('.')[0], d.message]));
}
