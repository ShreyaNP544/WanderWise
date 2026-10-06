// "Continue planning": a per-browser list of trips you've opened. Convenience only;
// trips themselves live on the server.
const KEY = 'wanderwise:recent-trips';

export function getRecentTrips() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function rememberTrip(trip) {
  try {
    const entry = {
      id: trip.id,
      title: trip.version.plan.title,
      destination: trip.preferences.destination,
      days: trip.preferences.days,
      total: trip.version.budget.total,
      at: Date.now(),
    };
    const list = [entry, ...getRecentTrips().filter((t) => t.id !== trip.id)].slice(0, 6);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable: ignore */
  }
}

export function forgetTrip(id) {
  try {
    localStorage.setItem(KEY, JSON.stringify(getRecentTrips().filter((t) => t.id !== id)));
  } catch {
    /* ignore */
  }
}
