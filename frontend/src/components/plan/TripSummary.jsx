import { CalendarDays, Gauge, MapPin, Users, Wallet } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
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
  return (
    <Card as="aside" className="p-6" aria-label="Trip summary">
      <h2 className="text-xl font-bold">Your trip so far</h2>
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
    </Card>
  );
}
