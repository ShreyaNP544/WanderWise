// Real-world context for a trip: location, nearby real places, weather.
// Every source is optional, fetched in parallel with short timeouts, and labelled with provenance.
import { distanceKm, geocode } from './geo.js';
import { placePhoto } from './photo.js';
import { nearbyPlaces } from './places.js';
import { forecastForTrip } from './weather.js';

export async function buildContext(prefs, curated) {
  const started = Date.now();
  const known = curated && { name: curated.name, region: curated.state, district: '', lat: curated.lat, lon: curated.lon, elevationM: null };
  const [destination, origin] = await Promise.all([geocode(prefs.destination, known), geocode(prefs.origin)]);

  const [places, weather, photo] = await Promise.all([
    nearbyPlaces(destination),
    forecastForTrip(destination, prefs.startDate, prefs.days),
    curated ? null : placePhoto(destination ? `${destination.name}` : prefs.destination),
  ]);

  const context = {
    fetchedAt: new Date().toISOString(),
    location: destination,
    origin: origin ? { name: origin.name, region: origin.region, lat: origin.lat, lon: origin.lon } : null,
    distanceKm: distanceKm(origin, destination),
    places,
    weather,
    photo,
    sources: [
      destination && 'Open-Meteo Geocoding',
      places.length && 'Wikipedia',
      weather.status === 'forecast' && 'Open-Meteo Forecast',
    ].filter(Boolean),
  };
  console.log(JSON.stringify({
    scope: 'grounding', outcome: 'ok', ms: Date.now() - started,
    located: Boolean(destination), places: places.length, weather: weather.status,
  }));
  return context;
}

/** The compact slice of context that goes into Gemma's prompt. */
export function contextForPrompt(context) {
  if (!context) return null;
  const out = {};
  if (context.location) {
    out.location = `${context.location.name}, ${context.location.region}${context.location.elevationM ? ` (${Math.round(context.location.elevationM)} m elevation)` : ''}`;
  }
  if (context.distanceKm) out.straightLineDistanceFromOriginKm = context.distanceKm;
  if (context.places.length) out.realPlacesNearby = context.places.map((p) => (p.description ? `${p.name} (${p.description})` : p.name));
  if (context.weather.status === 'forecast') {
    out.weatherForecast = context.weather.days.map((d) => `Day ${d.day} ${d.date}: ${d.summary}, ${d.minC}–${d.maxC}°C, rain ${d.rainChance ?? '?'}%`);
  } else {
    out.weatherForecast = context.weather.status === 'out_of_range'
      ? 'Trip is beyond the 16-day forecast window: no forecast available. Do not state weather as fact; use seasonal advice only, labelled as general.'
      : 'No forecast available. Do not state weather as fact.';
  }
  return out;
}
