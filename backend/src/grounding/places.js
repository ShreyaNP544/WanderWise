import { getJson } from './http.js';

const DAY = 24 * 60 * 60 * 1000;

// Keep places a traveller would visit; drop administrative and institutional pages.
const KEEP = /temple|fort|palace|lake|falls|waterfall|peak|mountain|hill|beach|park|garden|museum|sanctuary|reserve|monastery|church|mosque|ghat|cave|valley|dam|viewpoint|market|bazaar|bridge|island|river|stepwell|mahal|tomb|shrine|ashram|gompa|pass|trek|zoo|tea estate|plantation|heritage|monument|landmark|tourist/i;
const DROP = /constituency|district|diocese|taluk|tehsil|ward|school|college|university|hospital|company|railway division|airport|village in|census town|panchayat|neighbourhood|bank|newspaper|politician|cricket|film/i;

/**
 * Notable real places within ~10 km, from Wikipedia GeoSearch + short descriptions.
 * Everything returned has a Wikipedia article and coordinates, so we can call it a real place.
 */
export async function nearbyPlaces(location, limit = 15) {
  if (!location) return [];
  const data = await getJson(
    'https://en.wikipedia.org/w/api.php?action=query&format=json&generator=geosearch' +
      `&ggscoord=${location.lat}%7C${location.lon}&ggsradius=10000&ggslimit=150` +
      '&prop=description%7Ccoordinates&redirects=1',
    { ttlMs: 7 * DAY, source: 'wikipedia-geosearch' }
  );
  const pages = Object.values(data?.query?.pages || {});
  return pages
    .map((p) => ({
      name: p.title,
      description: p.description || '',
      lat: p.coordinates?.[0]?.lat,
      lon: p.coordinates?.[0]?.lon,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`,
    }))
    .filter((p) => p.description && KEEP.test(`${p.name} ${p.description}`) && !DROP.test(`${p.name} ${p.description}`))
    .slice(0, limit);
}
