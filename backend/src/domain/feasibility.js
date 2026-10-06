import { accessOptions } from './destinations.js';
import { roomsFor } from './budget.js';

/**
 * Deterministic reality check from the baseline data, done BEFORE asking Gemma.
 * floor = cheapest realistic total (round trip + cheapest beds + budget food + local transport).
 */
export function assessFeasibility(prefs, dest) {
  if (!dest) return { known: false, notes: [] };

  const n = prefs.travellers;
  const nights = Math.max(prefs.days - 1, 0);
  const access = accessOptions(dest, prefs.origin);
  const cheapestAccess = access.length ? Math.min(...access.map((a) => a.cost)) : null;
  const fastestHours = access.length ? Math.min(...access.map((a) => a.hours)) : null;
  const cheapestBedNight = Math.min(dest.hostelBedPerNight * n, dest.stayPerNight.budget * roomsFor(n));

  const floor = Math.round(
    (cheapestAccess ?? 0) * 2 * n +
      cheapestBedNight * nights +
      dest.foodPerPersonPerDay.budget * n * prefs.days +
      dest.localTransportPerPersonPerDay * 0.5 * n * prefs.days
  );

  const notes = [];
  if (cheapestAccess === null) notes.push(`No baseline route data from ${prefs.origin}; travel costs are AI estimates.`);
  if (fastestHours !== null && fastestHours * 2 > prefs.days * 24 * 0.5) {
    notes.push(`Round-trip travel takes at least ~${Math.round(fastestHours * 2)} h, a large share of a ${prefs.days}-day trip.`);
  }

  return {
    known: true,
    floor,
    feasible: prefs.budget >= floor,
    shortfall: Math.max(0, floor - prefs.budget),
    oneWayHours: fastestHours,
    routeKnown: cheapestAccess !== null,
    notes,
  };
}
