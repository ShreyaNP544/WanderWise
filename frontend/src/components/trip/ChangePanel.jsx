import { AlertTriangle, Info, Minus, Pencil, Plus, ShieldCheck, X } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { formatINR } from '../../lib/format.js';

function Group({ Icon, title, tone, items }) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${tone}`}>
        <Icon className="size-3.5" aria-hidden="true" /> {title}
      </h4>
      <ul className="mt-1.5 grid gap-1 text-sm">
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

/** "What changed": Gemma's explanation + the diff computed by code. */
export function ChangePanel({ version, onClose }) {
  const { change, diff, budget } = version;
  if (!change) return null;
  const delta = budget.total - (change.budgetBefore ?? budget.total);

  const changedItems = [
    ...diff.modified.map((m) => (m.before ? `Day ${m.day}: ${m.before} → ${m.title}` : `Day ${m.day}: ${m.title} (${m.fields.join(', ')})`)),
    ...(diff.stay ? [`Stay: ${diff.stay.after}`] : []),
    ...(diff.transport ? [`Transport: ${diff.transport.after}`] : []),
    ...(diff.food ? [`Food budget: ${formatINR(diff.food.before)} → ${formatINR(diff.food.after)} per person/day`] : []),
  ];

  return (
    <Card className="relative overflow-hidden p-5 ring-2 ring-sunset-500/40 sm:p-6" aria-labelledby="change-title" role="region">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-sunset-500" aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-sunset-600">You asked: “{version.instruction}”</p>
          <h2 id="change-title" className="mt-1 text-xl font-bold">{change.summary}</h2>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-1.5 text-muted hover:bg-ink/5 hover:text-ink" aria-label="Close summary">
          <X className="size-5" />
        </button>
      </div>

      {change.reasoning && <p className="mt-2 text-sm text-ink/80">{change.reasoning}</p>}

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-paper px-3 py-1 font-semibold">
          Budget {formatINR(change.budgetBefore)} → {formatINR(budget.total)}
          {delta !== 0 && <span className={delta < 0 ? 'text-ok' : 'text-danger'}> ({delta < 0 ? '−' : '+'}{formatINR(Math.abs(delta))})</span>}
        </span>
        <span className="rounded-full bg-paper px-3 py-1 font-semibold">
          {diff.added.length} added · {diff.modified.length} changed · {diff.removed.length} removed · {diff.unchanged} kept as-is
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Group Icon={Plus} title="Added" tone="text-ok" items={diff.added.map((a) => `Day ${a.day}: ${a.title}`)} />
        <Group Icon={Pencil} title="Changed" tone="text-sunset-600" items={changedItems} />
        <Group Icon={Minus} title="Removed" tone="text-danger" items={diff.removed.map((r) => `Day ${r.day}: ${r.title}`)} />
        <Group Icon={ShieldCheck} title="Deliberately kept" tone="text-brand-700" items={change.preserved} />
      </div>

      {(change.notes?.length > 0 || version.warnings?.length > 0) && (
        <div className="mt-5 grid gap-2 border-t border-line pt-4 text-sm">
          {change.notes?.map((n, i) => (
            <p key={`n${i}`} className="flex gap-2 text-muted">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {n}
            </p>
          ))}
          {version.warnings?.map((w, i) => (
            <p key={`w${i}`} className="flex gap-2 text-warn">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {w}
            </p>
          ))}
        </div>
      )}
    </Card>
  );
}
