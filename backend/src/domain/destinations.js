import { readFileSync } from 'node:fs';

const dataset = JSON.parse(readFileSync(new URL('../data/destinations.json', import.meta.url), 'utf8'));

const ORIGIN_ALIASES = {
  mumbai: ['mumbai', 'bombay', 'thane', 'navi mumbai'],
  delhi: ['delhi', 'new delhi', 'gurgaon', 'gurugram', 'noida', 'ghaziabad', 'ncr'],
  bengaluru: ['bengaluru', 'bangalore'],
};

const norm = (s = '') => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

export function findDestination(text) {
  const t = ` ${norm(text)} `;
  return dataset.destinations.find((d) => d.aliases.some((a) => t.includes(` ${norm(a)} `))) || null;
}

export function originKey(origin) {
  const t = ` ${norm(origin)} `;
  return Object.keys(ORIGIN_ALIASES).find((k) => ORIGIN_ALIASES[k].some((a) => t.includes(` ${a} `))) || null;
}

export function accessOptions(dest, origin) {
  const key = originKey(origin);
  return (dest && key && dest.access[key]) || [];
}

/** The slice of the dataset a prompt needs: small, factual, labelled. */
export function groundingFor(dest, prefs) {
  if (!dest) return null;
  return {
    destination: `${dest.name}, ${dest.state}`,
    bestMonths: dest.bestMonths,
    gettingThere: dest.gateway,
    fromOrigin: accessOptions(dest, prefs.origin),
    stayPerRoomPerNight: dest.stayPerNight,
    hostelBedPerNight: dest.hostelBedPerNight,
    foodPerPersonPerDay: dest.foodPerPersonPerDay,
    localTransportPerPersonPerDay: dest.localTransportPerPersonPerDay,
    attractions: dest.attractions,
    savingsLevers: dest.savingsLevers,
  };
}

const STOP = new Set(['the', 'and', 'of', 'ki', 'ka', 'walk', 'trip', 'day', 'visit', 'tour', 'to', 'at', 'in', 'near', 'from', 'with']);
const stem = (w) => (w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w);
const tokens = (s, ignore) => norm(s).split(' ').map(stem).filter((w) => w.length > 2 && !STOP.has(w) && !ignore?.has(w));

/**
 * Match a planned activity to a known attraction (for provenance).
 * The destination's own name never counts ("Manali" alone must not match "Manali Sanctuary").
 */
export function matchAttraction(dest, activity, destinationName = '') {
  if (!dest) return null;
  const ignore = new Set(tokens(`${destinationName} ${dest.name || ''} ${(dest.aliases || []).join(' ')}`));
  const hay = new Set(tokens(`${activity.title} ${activity.place}`, ignore));
  let best = null;
  for (const a of dest.attractions) {
    const words = tokens(a.name, ignore);
    if (!words.length) continue;
    const hits = words.filter((w) => hay.has(w)).length;
    const score = hits / words.length;
    if (hits > 0 && score >= 0.5 && (!best || score > best.score)) best = { attraction: a, score };
  }
  return best?.attraction || null;
}
