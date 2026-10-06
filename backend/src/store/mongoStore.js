import dns from 'node:dns';
import mongoose from 'mongoose';

// One collection, one document per trip; versions are embedded because a trip
// and its versions are always read together (see docs/ARCHITECTURE.md §5).
const tripSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    createdAt: { type: Date, required: true },
    current: { type: Number, required: true },
    versions: { type: [mongoose.Schema.Types.Mixed], required: true },
    history: { type: [mongoose.Schema.Types.Mixed], default: [] },
    pendingConflict: { type: mongoose.Schema.Types.Mixed, default: null },
    context: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { versionKey: false, timestamps: { createdAt: false, updatedAt: true }, minimize: false }
);

const TripModel = mongoose.models.Trip || mongoose.model('Trip', tripSchema);

const toTrip = (doc) => {
  if (!doc) return null;
  const { _id, updatedAt, ...rest } = doc;
  return { id: _id, ...rest, createdAt: new Date(rest.createdAt).toISOString() };
};

export async function mongoStore(uri) {
  // Some home/office routers refuse the DNS SRV lookups that mongodb+srv:// needs
  // ("querySrv ECONNREFUSED"). dns.setServers only affects dns.resolve*, not normal lookups.
  if (uri.startsWith('mongodb+srv://')) {
    const servers = (process.env.DNS_SERVERS || '8.8.8.8,1.1.1.1').split(',').map((s) => s.trim()).filter(Boolean);
    if (servers.length) dns.setServers(servers);
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  return {
    kind: 'mongodb',
    async get(id) {
      if (typeof id !== 'string') return null; // ids are validated strings; never pass objects to a query
      return toTrip(await TripModel.findById(id).lean());
    },
    async save(trip) {
      const { id, ...rest } = trip;
      await TripModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
      return trip;
    },
  };
}
