// Generate a real trip with Gemma and save it as the instant demo trip.
// Run: node --env-file=.env scripts/make-demo.js
import { writeFileSync } from 'node:fs';
import { exportTrip, generateTrip } from '../src/services/tripService.js';

const inDays = (n) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

const prefs = {
  origin: 'Delhi',
  destination: 'Manali, Himachal',
  startDate: inDays(7), // inside the 16-day forecast window, so the demo shows live weather
  days: 4,
  budget: 20000,
  travellers: 2,
  travellerType: 'friends',
  interests: ['Mountains', 'Photography', 'Food'],
  pace: 'moderate',
  stay: 'budget',
  transport: 'bus',
  diet: 'any',
  constraints: '',
  avoid: [],
};

const started = Date.now();
const trip = await generateTrip(prefs);
const full = await exportTrip(trip.id);
writeFileSync(new URL('../src/data/demo-trip.json', import.meta.url), `${JSON.stringify(full, null, 1)}\n`);
console.log(`Demo trip saved: "${trip.version.plan.title}" · ₹${trip.version.budget.total} · ${((Date.now() - started) / 1000).toFixed(0)} s`);
process.exit(0);
