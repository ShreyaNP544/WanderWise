import { Scale } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Card } from '../ui/Card.jsx';
import { formatINR } from '../../lib/format.js';

/** The "honest trade-offs" moment: an impossible request gets options, not a fake plan. */
export function ConflictCard({ conflict, onChoose, onDismiss, busy }) {
  return (
    <Card className="overflow-hidden ring-2 ring-warn/40" role="region" aria-labelledby="conflict-title">
      <div className="bg-amber-50 p-5 sm:p-6">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-warn">
          <Scale className="size-4" aria-hidden="true" /> That doesn't quite fit
        </p>
        <h2 id="conflict-title" className="mt-1 text-xl font-bold">{conflict.message}</h2>
        <p className="mt-1 text-sm text-muted">
          You asked: “{conflict.request}”. The cheapest realistic version costs about {formatINR(conflict.floor)}. Pick a trade-off:
        </p>
      </div>
      <ul className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
        {conflict.options.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              disabled={busy}
              onClick={() => onChoose(o)}
              className="flex h-full w-full flex-col rounded-2xl bg-surface p-4 text-left ring-1 ring-line transition hover:-translate-y-0.5 hover:ring-2 hover:ring-brand-500 disabled:opacity-50"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Option {o.id}</span>
              <span className="mt-1 font-display text-lg font-bold leading-snug">{o.label}</span>
              {o.estimateTotal > 0 && <span className="mt-1 text-sm font-semibold text-brand-700">≈ {formatINR(o.estimateTotal)}</span>}
              {o.tradeoff && <span className="mt-2 text-sm text-muted">{o.tradeoff}</span>}
              {o.patch?.budget && <span className="mt-auto pt-3 text-xs font-semibold">New budget: {formatINR(o.patch.budget)}</span>}
            </button>
          </li>
        ))}
      </ul>
      <div className="flex justify-end px-5 pb-5 sm:px-6">
        <Button variant="ghost" size="sm" onClick={onDismiss} disabled={busy}>
          Keep my current plan
        </Button>
      </div>
    </Card>
  );
}
