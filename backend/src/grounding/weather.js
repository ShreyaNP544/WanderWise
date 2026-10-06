import { getJson } from './http.js';

const FORECAST_DAYS = 16; // Open-Meteo's free forecast horizon

// WMO weather codes → short labels
const WMO = [
  [[0], 'Clear'], [[1, 2], 'Partly cloudy'], [[3], 'Overcast'], [[45, 48], 'Fog'],
  [[51, 53, 55, 56, 57], 'Drizzle'], [[61, 63, 66, 80, 81], 'Rain'], [[65, 67, 82], 'Heavy rain'],
  [[71, 73, 75, 77, 85, 86], 'Snow'], [[95, 96, 99], 'Thunderstorm'],
];
const describe = (code) => WMO.find(([codes]) => codes.includes(code))?.[1] || 'Mixed';

const isoDate = (d) => d.toISOString().slice(0, 10);

/**
 * Daily forecast for the trip dates, only when they fall inside the forecast window.
 * Returns { status: 'forecast', days[] } | { status: 'out_of_range' | 'no_dates' | 'unavailable' }.
 * We never ask Gemma to guess weather.
 */
export async function forecastForTrip(location, startDate, days) {
  if (!location) return { status: 'unavailable' };
  if (!startDate) return { status: 'no_dates' };

  const start = new Date(`${startDate}T00:00:00Z`);
  const today = new Date(`${isoDate(new Date())}T00:00:00Z`);
  const offset = Math.round((start - today) / 86_400_000);
  if (offset < 0 || offset + 1 > FORECAST_DAYS) return { status: 'out_of_range' };

  const end = new Date(start.getTime() + (Math.min(days, FORECAST_DAYS - offset) - 1) * 86_400_000);
  const data = await getJson(
    `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}` +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
      `&timezone=Asia%2FKolkata&start_date=${startDate}&end_date=${isoDate(end)}`,
    { ttlMs: 60 * 60 * 1000, source: 'open-meteo-forecast' }
  );
  const d = data?.daily;
  if (!d?.time?.length) return { status: 'unavailable' };

  return {
    status: 'forecast',
    source: 'Open-Meteo forecast',
    fetchedAt: new Date().toISOString(),
    days: d.time.map((date, i) => ({
      day: i + 1,
      date,
      summary: describe(d.weather_code[i]),
      maxC: Math.round(d.temperature_2m_max[i]),
      minC: Math.round(d.temperature_2m_min[i]),
      rainChance: d.precipitation_probability_max?.[i] ?? null,
    })),
  };
}
