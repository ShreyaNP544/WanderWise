// The budget engine. Gemma proposes line items; this code does all the arithmetic.

export const BUFFER_RATE = 0.05;

export const roomsFor = (travellers) => Math.ceil(travellers / 2);

export function computeBudget(plan, prefs) {
  const n = prefs.travellers;
  const days = plan.days.length;

  const stay = plan.stay.reduce((sum, s) => sum + s.nights * s.costPerNight * (s.per === 'bed' ? n : roomsFor(n)), 0);

  let transport = plan.transport.reduce((sum, t) => sum + t.costPerPerson * n, 0);
  transport += (plan.localTransportPerPersonPerDay || 0) * n * days;

  let food = (plan.foodPerPersonPerDay || 0) * n * days;
  let activities = 0;
  for (const day of plan.days) {
    for (const a of day.activities) {
      const cost = a.costPerPerson * n;
      if (a.category === 'transport') transport += cost;
      else if (a.category === 'food') food += cost;
      else activities += cost;
    }
  }

  const subtotal = stay + transport + food + activities;
  const buffer = Math.round(subtotal * BUFFER_RATE);
  const total = subtotal + buffer;
  const cap = prefs.budget;

  return {
    stay: Math.round(stay),
    transport: Math.round(transport),
    food: Math.round(food),
    activities: Math.round(activities),
    buffer,
    total,
    perPerson: Math.round(total / n),
    cap,
    remaining: cap - total,
    status: total <= cap ? 'within' : 'over',
  };
}
