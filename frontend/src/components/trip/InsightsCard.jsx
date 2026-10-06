import { AlertTriangle, BadgeCheck, ClipboardCheck, Lightbulb, Scale, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card.jsx';

function List({ Icon, title, items, tone = 'text-brand-700' }) {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className={`flex items-center gap-2 text-sm font-bold ${tone}`}>
        <Icon className="size-4" aria-hidden="true" /> {title}
      </h3>
      <ul className="mt-2 grid list-disc gap-1.5 pl-5 text-sm text-ink/85 marker:text-line">
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

export function InsightsCard({ plan, warnings }) {
  return (
    <Card className="grid gap-5 p-6">
      <h2 className="text-xl font-bold">Why this plan</h2>
      <List Icon={Sparkles} title="Made for you" items={plan.whyItWorks} />
      <List Icon={AlertTriangle} title="Heads up" items={warnings} tone="text-warn" />
      <List Icon={Scale} title="Trade-offs Gemma made" items={plan.tradeoffNotes} />
      <List Icon={ClipboardCheck} title="Check before you go" items={plan.checkBefore} tone="text-sunset-600" />
      <List Icon={Lightbulb} title="Assumptions" items={plan.assumptions} tone="text-muted" />
    </Card>
  );
}

/** Where the facts came from: makes "real data → Gemma → plan" visible. */
export function SourcesCard({ trip }) {
  const ctx = trip.context;
  const acts = trip.version.plan.days.flatMap((d) => d.activities).filter((a) => a.category !== 'transport');
  const count = (s) => acts.filter((a) => a.source === s).length;
  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        <BadgeCheck className="size-5 text-brand-700" aria-hidden="true" /> Grounded in real data
      </h2>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          ['baseline', 'Curated'],
          ['real_place', 'Real place'],
          ['ai_estimate', 'AI estimate'],
        ].map(([k, label]) => (
          <div key={k} className="rounded-xl bg-paper p-2">
            <dd className="font-display text-2xl font-bold">{count(k)}</dd>
            <dt className="text-[11px] font-semibold text-muted">{label}</dt>
          </div>
        ))}
      </dl>
      <ul className="mt-4 grid gap-1.5 text-sm text-ink/85">
        {trip.destination.hasBaseline && <li>✓ Typical prices, routes and attractions from the WanderWise dataset</li>}
        {ctx?.location && (
          <li>
            ✓ Located {ctx.location.name}, {ctx.location.region}
            {ctx.distanceKm ? ` · ${ctx.distanceKm.toLocaleString('en-IN')} km from ${trip.preferences.origin}` : ''}
          </li>
        )}
        {ctx?.places?.length > 0 && <li>✓ {ctx.places.length} real places nearby (Wikipedia)</li>}
        {ctx?.weather?.status === 'forecast' && <li>✓ Live forecast for your dates (Open-Meteo)</li>}
        {ctx?.weather?.status === 'out_of_range' && <li className="text-muted">• Dates are beyond the 16-day forecast, so there is no weather forecast.</li>}
        {ctx?.weather?.status === 'no_dates' && <li className="text-muted">• Add travel dates to get a weather forecast.</li>}
        {!trip.destination.hasBaseline && <li className="text-warn">• No curated data for this destination: costs are AI estimates.</li>}
      </ul>
      {ctx?.places?.length > 0 && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold text-brand-700">Real places Gemma could choose from</summary>
          <ul className="mt-2 grid gap-1">
            {ctx.places.map((p) => (
              <li key={p.name}>
                <a href={p.url} target="_blank" rel="noreferrer" className="hover:underline">{p.name}</a>
                {p.description && <span className="text-muted"> · {p.description}</span>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}
