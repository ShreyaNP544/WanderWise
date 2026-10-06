/** In-memory trip store. Same interface as the Mongo store, used when no MONGODB_URI is set. */
export function memoryStore() {
  const trips = new Map();
  return {
    kind: 'memory',
    async get(id) {
      const trip = trips.get(id);
      return trip ? structuredClone(trip) : null;
    },
    async save(trip) {
      trips.set(trip.id, structuredClone(trip));
      return trip;
    },
  };
}
