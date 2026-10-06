// Code-first understanding of a modification request. Cheap, instant and deterministic:
// hard numbers (budget, people, days, day scope) are parsed here so the feasibility check
// can run before Gemma is called. Gemma still interprets the nuance.

const WORD_NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const num = (s) => WORD_NUM[s?.toLowerCase()] ?? Number(s);

const STRATEGY_PATTERNS = {
  budget: /\b(cheap|cheaper|expensive|budget|cost|costs|save|saving|afford|reduce|lower|cut)\b|₹|\brs\.?\s?\d|\binr\b|\d\s?k\b/i,
  fatigue: /\b(tiring|tired|exhausting|hectic|relax|relaxed|slow|slower|easier|rest|chill|less walking|lazy)\b/i,
  family: /\b(parents?|mom|dad|mother|father|family|kids?|children|child|elderly|grand(?:ma|pa|parents)?|senior)\b/i,
  food: /\b(food|foodie|eat|eating|cuisine|restaurant|street food|veg|vegetarian|vegan|jain|halal|dining|cafe|cafes)\b/i,
  hidden_gem: /\b(hidden[- ]gems?|offbeat|off-beat|less touristy|untouristy|local secret|unexplored|crowd-free)\b/i,
  replace: /\b(replace|swap|instead of|substitute|remove|drop|skip)\b/i,
};

export const INTEREST_WORDS = {
  Photography: /photo|photography|camera|sunrise|sunset/i,
  Mountains: /mountain|hills?|peaks?|snow|trek/i,
  Nature: /nature|forest|waterfall|lake|outdoors/i,
  Food: /food|cuisine|eat/i,
  Adventure: /adventure|rafting|paragliding|bungee/i,
  'Culture & history': /culture|history|heritage|fort|palace|museum/i,
  Beaches: /beach/i,
  Spiritual: /spiritual|temple|ghat|yoga/i,
};

function parseAmount(raw, unit) {
  let n = Number(raw.replace(/,/g, ''));
  if (/^k|thousand/i.test(unit || '')) n *= 1000;
  if (/^l|lakh/i.test(unit || '')) n *= 100_000;
  return Math.round(n);
}

export function parseInstruction(text, prefs, currentTotal) {
  const t = text.trim();
  const patch = {};
  const assumptions = [];

  // ── Budget: take the last amount mentioned ("from ₹20,000 to ₹15,000" → 15000)
  const amounts = [...t.matchAll(/(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)\s*(k|thousand|lakhs?|l)?\b|([\d,]+(?:\.\d+)?)\s*(k|thousand|lakhs?)\b/gi)]
    .map((m) => (m[1] ? parseAmount(m[1], m[2]) : parseAmount(m[3], m[4])))
    .filter((n) => n >= 1000 && n <= 1_000_000);
  // Bare numbers count when budget words introduce them ("under 16,000", "budget to 15000")
  const bare = [...t.matchAll(/\b(?:under|below|within|budget(?:\s+(?:of|to|is))?|cap(?:\s+(?:it\s+)?at)?|max(?:imum)?|to)\s+(?:about\s+|around\s+)?([\d]{1,2},\d{2},\d{3}|[\d]{1,3},\d{3}|\d{4,7})\b/gi)]
    .map((m) => parseAmount(m[1]))
    .filter((n) => n >= 1000 && n <= 1_000_000);
  amounts.push(...bare);
  const pct = t.match(/\b(?:by|cut|reduce|lower)\D{0,12}(\d{1,2})\s?%/i);
  if (amounts.length) patch.budget = amounts.at(-1);
  else if (pct) patch.budget = Math.round((prefs.budget * (100 - Number(pct[1]))) / 100);

  // ── Travellers
  const people = t.match(/\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:of us|people|persons|travell?ers|adults|friends|members)\b/i);
  const family = /\bparents\b/i.test(t) ? 'parents' : /\b(kids?|children|child|family)\b/i.test(t) ? 'family' : null;
  if (people) patch.travellers = num(people[1]);
  if (family && family !== prefs.travellerType) {
    patch.travellerType = family;
    if (!people && family === 'parents') {
      patch.travellers = Math.min(12, prefs.travellers + 2);
      assumptions.push(`Assumed both parents join, making ${patch.travellers} travellers. Say "we are 3" to correct this.`);
    }
  }

  // ── Days
  const daysAbs = t.match(/\b(?:make it|cut (?:it )?to|reduce (?:it )?to|shorten (?:it )?to|extend (?:it )?to|change (?:it )?to|only|just)\s+(\d{1,2}|one|two|three|four|five|six|seven)\s+days?\b/i)
    || t.match(/\b(\d{1,2})[- ]day trip\b/i);
  if (daysAbs) patch.days = num(daysAbs[1]);
  else if (/\b(add|one more|extra|another) day\b/i.test(t)) patch.days = Math.min(14, prefs.days + 1);
  else if (/\b(one|a) day (shorter|less)\b|\bshorten (it )?by (a|one) day\b/i.test(t)) patch.days = Math.max(1, prefs.days - 1);

  // ── Diet
  const diet = t.match(/\b(vegetarian|vegan|jain|halal)\b/i) || (/\bveg\b/i.test(t) ? ['', 'vegetarian'] : null);
  if (diet && !/\bnon[- ]veg/i.test(t)) patch.diet = diet[1].toLowerCase();

  // ── Scope: specific days, else the whole trip
  const lastDay = patch.days || prefs.days;
  const scopeDays = new Set([...t.matchAll(/\bday\s*(\d{1,2})\b/gi)].map((m) => Number(m[1])).filter((d) => d >= 1 && d <= lastDay));
  if (/\bfirst day\b/i.test(t)) scopeDays.add(1);
  if (/\blast day\b/i.test(t)) scopeDays.add(lastDay);

  // ── Strategies
  const strategies = Object.entries(STRATEGY_PATTERNS)
    .filter(([, re]) => re.test(t))
    .map(([name]) => name);
  if (patch.budget && !strategies.includes('budget')) strategies.push('budget');
  if (patch.travellerType && !strategies.includes('family')) strategies.push('family');

  // "Cut it to 3 days" is about days, not money, unless money is actually mentioned.
  const mentionsMoney = /₹|\brs\b|\binr\b|budget|cost|cheap|expensive|save|saving|afford|price|spend|\d\s?k\b/i.test(t);
  if (!mentionsMoney && !patch.budget && (patch.days || patch.travellers)) {
    const i = strategies.indexOf('budget');
    if (i >= 0) strategies.splice(i, 1);
  }

  // "cheaper" with no number → aim ~15% under the current total
  if (strategies.includes('budget') && !patch.budget && /\b(cheap|cheaper|expensive|save|reduce|lower|cut)\b/i.test(t) && currentTotal) {
    patch.budget = Math.max(1000, Math.round((Math.min(currentTotal, prefs.budget) * 0.85) / 500) * 500);
    assumptions.push(`No amount given; aiming for about 15% cheaper (₹${patch.budget.toLocaleString('en-IN')}).`);
  }

  // Pace drifts down for whole-trip fatigue requests
  if (strategies.includes('fatigue') && scopeDays.size === 0 && prefs.pace !== 'relaxed') {
    patch.pace = prefs.pace === 'packed' ? 'moderate' : 'relaxed';
  }

  // ── Things the user explicitly wants kept
  const keep = [];
  for (const m of t.matchAll(/\b(?:keep|preserve|retain|don'?t (?:lose|remove|drop)|but keep)\s+(?:the\s+|my\s+|all\s+)?([a-z][a-z &'-]{2,40}?)(?=\s*(?:experiences?|activities|spots|things|parts?|stuff)?\s*(?:[,.;!]|$|\bbut\b|\band\b|\bwhile\b))/gi)) {
    keep.push(m[1].trim());
  }
  const keepInterests = Object.keys(INTEREST_WORDS).filter((k) => keep.some((phrase) => INTEREST_WORDS[k].test(phrase)));

  // "more X" moves an interest to the front; "less X" adds it to avoid
  const more = Object.keys(INTEREST_WORDS).filter((k) => new RegExp(`\\bmore\\s+(?:${INTEREST_WORDS[k].source})`, 'i').test(t));
  if (more.length || (strategies.includes('food') && !patch.diet)) {
    const front = more.length ? more : ['Food'];
    patch.interests = [...new Set([...front, ...prefs.interests])].slice(0, 8);
  }
  const less = [...t.matchAll(/\b(?:less|no more|fewer|avoid)\s+([a-z]+)/gi)].map((m) => m[1].toLowerCase());
  if (less.length) patch.avoid = [...new Set([...(prefs.avoid || []), ...less])].slice(0, 8);

  return {
    patch,
    scope: { days: scopeDays.size ? [...scopeDays].sort((a, b) => a - b) : null },
    strategies: strategies.length ? strategies : ['general'],
    keep,
    keepInterests,
    assumptions,
  };
}
