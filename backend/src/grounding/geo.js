import { getJson } from './http.js';

const DAY = 24 * 60 * 60 * 1000;

const norm = (s = '') => s.toLowerCase().replace(/[^a-z ]/g, ' ').trim();

/**
 * Open-Meteo geocoding (free, no key). Returns the best Indian match, or null.
 * "Manali" alone matches a Chennai suburb too, so a region hint ("Manali, Himachal")
 * must match the result's state/district, and curated destinations pass fixed coordinates.
 */
export async function geocode(text, known) {
  if (known) return { ...known, source: 'WanderWise curated coordinates' };
  if (!text) return null;
  const [place, ...hintParts] = text.split(',').map((s) => s.trim()).filter(Boolean);
  const hint = norm(hintParts.join(' '));
  for (const name of [...new Set([place, text.trim()])]) {
    const data = await getJson(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=10&countryCode=IN&language=en&format=json`,
      { ttlMs: 30 * DAY, source: 'open-meteo-geocoding' }
    );
    let results = data?.results || [];
    if (hint) {
      const words = hint.split(' ').filter((w) => w.length > 3);
      results = results.filter((r) => words.some((w) => norm(`${r.admin1} ${r.admin2} ${r.admin3}`).includes(w)));
    }
    if (!results.length) continue;
    const best = [...results].sort((a, b) => (b.population || 0) - (a.population || 0))[0];
    return {
      name: best.name,
      region: best.admin1 || '',
      district: best.admin2 || '',
      lat: best.latitude,
      lon: best.longitude,
      elevationM: best.elevation ?? null,
      source: 'Open-Meteo Geocoding (GeoNames)',
    };
  }
  return null;
}

export function distanceKm(a, b) {
  if (!a || !b) return null;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)));
}
