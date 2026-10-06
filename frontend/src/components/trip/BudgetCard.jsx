import { Calculator } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { cn } from '../../lib/cn.js';
import { formatINR } from '../../lib/format.js';
import { BUDGET_PARTS } from '../../lib/trip.js';

export function BudgetCard({ budget, before }) {
  const over = budget.status === 'over';
  const scale = Math.max(budget.total, budget.cap);
  const capPct = (budget.cap / scale) * 100;

  return (
    <Card className="p-6" aria-labelledby="budget-title">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="budget-title" className="text-xl font-bold">Budget</h2>
        <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold', over ? 'bg-red-50 text-danger' : 'bg-green-50 text-ok')}>
          {over ? `${formatINR(budget.total - budget.cap)} over` : `${formatINR(budget.remaining)} to spare`}
        </span>
      </div>

      <p className="mt-3 font-display text-4xl font-bold">
        {before && before !== budget.total && <s className="mr-2 text-xl font-medium text-muted">{formatINR(before)}</s>}
        {formatINR(budget.total)}
      </p>
      <p className="text-sm text-muted">
        of {formatINR(budget.cap)} · {formatINR(budget.perPerson)} per person
      </p>

      <div className="relative mt-5" aria-hidden="true">
        <div className="flex h-3 overflow-hidden rounded-full bg-paper">
          {BUDGET_PARTS.map(({ key, color }) => (
            <div key={key} className={cn(color, 'h-full transition-all duration-700')} style={{ width: `${(budget[key] / scale) * 100}%` }} />
          ))}
        </div>
        <div className="absolute -top-1 h-5 w-0.5 rounded bg-ink" style={{ left: `calc(${capPct}% - 1px)` }} title="Budget cap" />
      </div>

      <dl className="mt-5 grid gap-2 text-sm">
        {BUDGET_PARTS.map(({ key, label, color }) => (
          <div key={key} className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-2 text-muted">
              <span className={cn('size-2.5 rounded-sm', color)} aria-hidden="true" />
              {label}
            </dt>
            <dd className="font-semibold tabular-nums">{formatINR(budget[key])}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-5 flex gap-2 rounded-xl bg-paper p-3 text-xs text-muted">
        <Calculator className="size-4 shrink-0" aria-hidden="true" />
        Totals are calculated by WanderWise from each line item, not by the AI. Prices are typical estimates; confirm before booking.
      </p>
    </Card>
  );
}
