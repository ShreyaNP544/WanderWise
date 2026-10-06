// Fast offline checks for the deterministic domain logic (no Gemma calls).
// Run: node scripts/check-domain.js
import assert from 'node:assert/strict';
import { extractJson } from '../src/ai/json.js';
import { findDestination, matchAttraction } from '../src/domain/destinations.js';
import { assessFeasibility } from '../src/domain/feasibility.js';
import { parseInstruction } from '../src/domain/instruction.js';

const prefs = { origin: 'Mumbai', destination: 'Manali, Himachal', days: 5, budget: 20000, travellers: 2, travellerType: 'friends', interests: ['Mountains', 'Photography'], pace: 'moderate', avoid: [] };

const cases = [
  ['Reduce the budget from ₹20,000 to ₹15,000 but keep the photography experiences.', (r) => {
    assert.equal(r.patch.budget, 15000);
    assert.ok(r.strategies.includes('budget'));
    assert.ok(r.keepInterests.includes('Photography'), JSON.stringify(r.keep));
  }],
  ['make it 15k', (r) => assert.equal(r.patch.budget, 15000)],
  ['Make day 2 less tiring', (r) => {
    assert.deepEqual(r.scope.days, [2]);
    assert.ok(r.strategies.includes('fatigue'));
    assert.equal(r.patch.pace, undefined);
  }],
  ["Actually, we're travelling with my parents now", (r) => {
    assert.equal(r.patch.travellerType, 'parents');
    assert.equal(r.patch.travellers, 4);
    assert.ok(r.strategies.includes('family'));
  }],
  ['We are 3 people now, with my parents', (r) => assert.equal(r.patch.travellers, 3)],
  ['I care more about food than sightseeing', (r) => {
    assert.ok(r.strategies.includes('food'));
    assert.equal(r.patch.interests[0], 'Food');
  }],
  ['Add one hidden-gem experience', (r) => assert.ok(r.strategies.includes('hidden_gem'))],
  ['I want more nature and less shopping', (r) => {
    assert.equal(r.patch.interests[0], 'Nature');
    assert.ok(r.patch.avoid.includes('shopping'));
  }],
  ['Replace the expensive activities', (r) => assert.ok(r.strategies.includes('replace') && r.strategies.includes('budget'))],
  ['Cut it to 3 days', (r) => assert.equal(r.patch.days, 3)],
  ['make it vegetarian', (r) => assert.equal(r.patch.diet, 'vegetarian')],
  ['Bring it under 16,000 but keep the photography spots', (r) => {
    assert.equal(r.patch.budget, 16000);
    assert.ok(r.keepInterests.includes('Photography'));
  }],
  ['Cut it to 3 days', (r) => assert.equal(r.patch.budget, undefined)],
];

for (const [text, check] of cases) {
  check(parseInstruction(text, prefs, 19600));
  console.log('✓', text);
}

assert.equal(findDestination('Manali, Himachal').id, 'manali');
assert.equal(findDestination('north goa beaches').id, 'goa');
assert.equal(findDestination('Atlantis'), null);
const f = assessFeasibility({ ...prefs, travellers: 4, budget: 15000 }, findDestination('Manali'));
assert.equal(f.feasible, false);
console.log('✓ feasibility: 4 people, ₹15,000 → floor', f.floor, 'shortfall', f.shortfall);
console.log('✓ feasibility: 2 people, ₹20,000 → floor', assessFeasibility(prefs, findDestination('Manali')).floor);

// Provenance must not match on the destination's own name
const manali = findDestination('Manali');
const places = { attractions: [{ name: 'Manali Sanctuary' }, { name: 'Hidimba Devi Temple' }] };
assert.equal(matchAttraction(places, { title: 'Check-in and Rest', place: 'Manali' }, 'Manali'), null);
assert.equal(matchAttraction(places, { title: 'Hadimba Devi Temple Walk', place: 'Manali' }, 'Manali')?.name, 'Hidimba Devi Temple'); // alternate spelling still matches
assert.equal(matchAttraction(places, { title: 'Hidimba Devi Temple', place: 'Old Manali' }, 'Manali')?.name, 'Hidimba Devi Temple');
assert.equal(matchAttraction(manali, { title: 'Old Manali Café Hopping', place: 'Old Manali' })?.name, 'Old Manali village walk & cafés');
console.log('✓ provenance matching');

assert.deepEqual(extractJson('Sure! ```json\n{"a":1,}\n```'), { a: 1 });
assert.deepEqual(extractJson('schema {"x":string} then answer {"a":{"b":[1,2]}} done'), { a: { b: [1, 2] } });
console.log('✓ JSON extraction');
