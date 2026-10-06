import { CalendarDays, Cpu, Gauge, MapPin, Users } from 'lucide-react';
import { Photo } from '../ui/Photo.jsx';
import { photoFor } from '../../lib/destinations.js';
import { formatINR, plural } from '../../lib/format.js';
import { formatDate } from '../../lib/trip.js';

function Chip({ Icon, children }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-medium ring-1 ring-white/25 backdrop-blur">
      <Icon className="size-4" aria-hidden="true" />
      {children}
    </li>
  );
}

export function TripHeader({ trip, livePhoto }) {
  const { preferences: p, version } = trip;
  const ai = version.ai;
  return (
    <header className="relative isolate overflow-hidden">
      <Photo photo={photoFor(p.destination, trip.context?.photo || livePhoto)} priority className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-t from-brand-900/95 via-brand-900/55 to-brand-900/20" aria-hidden="true" />
      </Photo>
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-20 text-white sm:px-6 sm:pt-28">
        <p className="text-sm font-semibold uppercase tracking-widest text-white/75">
          {p.origin} → {trip.destination.name}
        </p>
        <h1 className="mt-2 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">{version.plan.title}</h1>
        {version.plan.summary && <p className="mt-3 max-w-2xl text-lg text-white/85">{version.plan.summary}</p>}
        <ul className="mt-6 flex flex-wrap gap-2">
          <Chip Icon={CalendarDays}>
            {plural(p.days, 'day')}
            {p.startDate && ` · from ${formatDate(p.startDate, { day: 'numeric', month: 'short' })}`}
          </Chip>
          <Chip Icon={Users}>{plural(p.travellers, 'traveller')} · {p.travellerType}</Chip>
          <Chip Icon={Gauge}>{p.pace} pace</Chip>
          <Chip Icon={MapPin}>{formatINR(p.budget)} budget</Chip>
          {ai?.model && (
            <Chip Icon={Cpu}>
              Planned by {ai.model.replace(/-it$/, '').replace(/^gemma/, 'Gemma').replace(/-/g, ' ')}
              {ai.fallback && ' (fallback)'}
            </Chip>
          )}
        </ul>
      </div>
    </header>
  );
}
