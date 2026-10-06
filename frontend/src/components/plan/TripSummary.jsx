import { CalendarDays, Gauge, MapPin, Users, Wallet } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Photo } from '../ui/Photo.jsx';
import { FALLBACK_PHOTO, matchDestination } from '../../lib/destinations.js';
import { formatINR, plural } from '../../lib/format.js';
import { PACES, TRAVELLER_TYPES } from '../../lib/tripOptions.js';

const labelOf = (list, value) => list.find((o) => o.value === value)?.label ?? value;

function Row({ Icon, label, children }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden="true" />
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt>
        <dd className="text-sm font-medium">{children}</dd>
      </div>
    </div>
  );
}

/** Live summary of the trip being described: reassures the user as they fill the form. */
export function TripSummary({ prefs }) {
  const route = [prefs.origin, prefs.destination].map((s) => s.trim()).filter(Boolean);
  const match = matchDestination(prefs.destination);
  return (
    <Card as="aside" className="overflow-hidden" aria-label="Trip summary">
      <Photo key={match?.id || 'fallback'} photo={match?.photo || FALLBACK_PHOTO} className="aspect-video">
        <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" aria-hidden="true" />
        <p className="absolute bottom-3 left-4 font-display text-2xl font-bold text-white">
          {match ? match.name : prefs.destination.trim() || 'Somewhere new'}
        </p>
      </Photo>
      <div className="p-6">
      <h2 className="text-xl font-bold">Your trip so far</h2>
      {match && <p className="mt-1 text-sm text-brand-700">✓ Curated cost &amp; route data available</p>}
      <dl className="mt-5 grid gap-4">
        <Row Icon={MapPin} label="Route">
          {route.length ? route.join(' → ') : <span className="text-muted">Not set yet</span>}
        </Row>
        <Row Icon={CalendarDays} label="When">
          {Number.isInteger(prefs.days) ? plural(prefs.days, 'day') : '—'}
          {prefs.startDate && ` from ${new Date(prefs.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
        </Row>
        <Row Icon={Users} label="Who">
          {Number.isInteger(prefs.travellers) ? plural(prefs.travellers, 'traveller') : '—'} · {labelOf(TRAVELLER_TYPES, prefs.travellerType)}
        </Row>
        <Row Icon={Wallet} label="Budget">
          {Number.isInteger(prefs.budget) ? formatINR(prefs.budget) : '—'} total
        </Row>
        <Row Icon={Gauge} label="Pace">
          {labelOf(PACES, prefs.pace)}
        </Row>
      </dl>
      {prefs.interests.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Interests">
          {prefs.interests.map((i) => (
            <li key={i} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
              {i}
            </li>
          ))}
        </ul>
      )}
      </div>
    </Card>
  );
}
