import { useState } from 'react';
import { AlertTriangle, ArrowRight, Clock, Info, ShieldCheck, Wallet, Wand2, X } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { cn } from '../../lib/cn.js';
import { formatINR } from '../../lib/format.js';

const travelHours = (plan) =>
  plan.transport.reduce((s, t) => s + (t.hours || 0), 0);

function Delta({ before, after, format = (v) => v, invert = false }) {
  if (before === after) return <span>{format(after)}</span>;
  const better = invert ? after > before : after < before;
  return (
    <span className="whitespace-nowrap">
      <s className="text-muted">{format(before)}</s>
      <ArrowRight className="mx-1 inline size-3 text-muted" aria-hidden="true" />
      <strong className={better ? 'text-ok' : 'text-sunset-600'}>{format(after)}</strong>
    </span>
  );
}

function Stat({ Icon, label, children }) {
  return (
    <div className="rounded-2xl bg-paper px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
        <Icon className="size-3.5" aria-hidden="true" /> {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{children}</p>
    </div>
  );
}

function ActivityRow({ a, status, other }) {
  const tone = {
    removed: 'bg-red-50 text-red-900 ring-red-200',
    added: 'bg-green-50 text-green-900 ring-green-200',
    changed: 'bg-sunset-100/60 ring-sunset-500/30',
    same: 'bg-surface ring-line text-ink/70',
  }[status];
  const label = { removed: 'Removed', added: 'New', changed: 'Changed' }[status];
  return (
    <li className={cn('rounded-xl px-3 py-2 text-sm ring-1', tone, status === 'added' && 'animate-remix-in')}>
      <div className="flex items-start justify-between gap-2">
        <span className={cn('font-medium', status === 'removed' && 'line-through decoration-red-400')}>
          {a.title}
        </span>
        {label && <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</span>}
      </div>
      <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs opacity-80">
        {status === 'changed' && other ? (
          <>
            {other.time !== a.time && <Delta before={other.time} after={a.time} />}
            {other.costPerPerson !== a.costPerPerson && <Delta before={other.costPerPerson} after={a.costPerPerson} format={(v) => `${formatINR(v)}/p`} />}
            {other.durationHrs !== a.durationHrs && <Delta before={other.durationHrs} after={a.durationHrs} format={(v) => `${v} h`} />}
            {other.title !== a.title && <span>was “{other.title}”</span>}
          </>
        ) : (
          <>
            {a.time && <span>{a.time}</span>}
            <span>{a.costPerPerson ? `${formatINR(a.costPerPerson)}/p` : 'Free'}</span>
            {a.durationHrs > 0 && <span>{a.durationHrs} h</span>}
          </>
        )}
      </div>
    </li>
  );
}

function DayCompare({ before, after, diff }) {
  const removed = new Set(diff.removed.map((r) => r.id));
  const added = new Set(diff.added.map((r) => r.id));
  const modified = new Set(diff.modified.map((r) => r.id));
  const beforeById = Object.fromEntries((before?.activities || []).map((a) => [a.id, a]));
  return (
    <div className="rounded-2xl ring-1 ring-line">
      <p className="border-b border-line px-4 py-2.5 font-display text-lg font-bold">
        Day {after.day} <span className="font-sans text-sm font-medium text-muted">· {after.title}</span>
      </p>
      <div className="grid gap-4 p-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Before</p>
          <ul className="grid gap-1.5">
            {(before?.activities || []).map((a) => (
              <ActivityRow key={a.id} a={a} status={removed.has(a.id) ? 'removed' : modified.has(a.id) ? 'changed' : 'same'} />
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-700">After</p>
          <ul className="grid gap-1.5">
            {after.activities.map((a) => (
              <ActivityRow
                key={a.id}
                a={a}
                status={added.has(a.id) ? 'added' : modified.has(a.id) ? 'changed' : 'same'}
                other={beforeById[a.id]}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function OtherChanges({ diff }) {
  const rows = [
    diff.stay && ['Stay', diff.stay.before, diff.stay.after],
    diff.transport && ['Getting there', diff.transport.before, diff.transport.after],
    diff.food && ['Food per person/day', formatINR(diff.food.before), formatINR(diff.food.after)],
    diff.localTransport && ['Local transport per person/day', formatINR(diff.localTransport.before), formatINR(diff.localTransport.after)],
  ].filter(Boolean);
  if (!rows.length) return null;
  return (
    <div className="rounded-2xl ring-1 ring-line">
      <p className="border-b border-line px-4 py-2.5 font-display text-lg font-bold">Stay, transport &amp; food</p>
      <dl className="grid gap-3 p-4 text-sm">
        {rows.map(([label, before, after]) => (
          <div key={label} className="grid gap-1 sm:grid-cols-[11rem_1fr]">
            <dt className="font-semibold">{label}</dt>
            <dd>
              <s className="text-muted">{before || '—'}</s>
              <ArrowRight className="mx-1.5 inline size-3.5 text-muted" aria-hidden="true" />
              <span className="font-medium text-brand-900">{after || '—'}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** The heart of "Remix My Trip": what changed, side by side, and why. */
export function RemixPanel({ trip, onClose }) {
  const { version, previous } = trip;
  const { change, diff, budget } = version;
  const [tab, setTab] = useState('compare');
  if (!change || !diff) return null;

  const changedDays = new Set([...diff.added, ...diff.modified, ...diff.removed].map((x) => x.day));
  const beforeDays = Object.fromEntries((previous?.plan.days || []).map((d) => [d.day, d]));
  const hoursBefore = previous ? travelHours(previous.plan) : null;
  const hoursAfter = travelHours(version.plan);
  const notes = [...(change.notes || [])];
  const nothingChanged = !changedDays.size && !diff.stay && !diff.transport && !diff.food && !diff.localTransport;

  return (
    <Card as="section" className="animate-remix-in relative overflow-hidden p-5 ring-2 ring-sunset-500/40 sm:p-6" aria-labelledby="remix-title">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-linear-to-b from-sunset-500 to-brand-500" aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sunset-600">
            <Wand2 className="size-3.5" aria-hidden="true" /> Remixed: “{version.instruction}”
          </p>
          <h2 id="remix-title" className="mt-1 text-xl font-bold sm:text-2xl">{change.summary}</h2>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-1.5 text-muted hover:bg-ink/5 hover:text-ink" aria-label="Close remix summary">
          <X className="size-5" />
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Stat Icon={Wallet} label="Total">
          <Delta before={change.budgetBefore} after={budget.total} format={formatINR} />
        </Stat>
        <Stat Icon={Clock} label="Intercity travel">
          {hoursBefore === null ? `${hoursAfter} h` : <Delta before={hoursBefore} after={hoursAfter} format={(v) => `${v} h`} />}
        </Stat>
        <Stat Icon={ShieldCheck} label="Activities">
          +{diff.added.length} · ~{diff.modified.length} · −{diff.removed.length} · {diff.unchanged} kept
        </Stat>
      </div>

      <div className="mt-5 flex gap-1 rounded-full bg-paper p-1 text-sm font-semibold" role="tablist" aria-label="Remix details">
        {[
          ['compare', 'Before ↔ After'],
          ['why', 'Why these changes'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn('flex-1 rounded-full px-4 py-2 transition', tab === id ? 'bg-surface shadow-sm' : 'text-muted hover:text-ink')}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3" role="tabpanel">
        {tab === 'compare' ? (
          <>
            {nothingChanged && <p className="rounded-2xl bg-paper p-4 text-sm text-muted">No itinerary items changed; Gemma adjusted spending only. See “Why these changes”.</p>}
            {[...changedDays].sort((a, b) => a - b).map((d) => {
              const after = version.plan.days.find((x) => x.day === d);
              return after ? <DayCompare key={d} before={beforeDays[d]} after={after} diff={diff} /> : null;
            })}
            <OtherChanges diff={diff} />
          </>
        ) : (
          <div className="grid gap-4 text-sm">
            {change.reasoning && <p className="text-base text-ink/85">{change.reasoning}</p>}
            {change.preserved?.length > 0 && (
              <div>
                <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-700">
                  <ShieldCheck className="size-3.5" aria-hidden="true" /> Deliberately kept
                </h3>
                <ul className="mt-2 grid list-disc gap-1 pl-5">{change.preserved.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </div>
            )}
            {notes.map((n, i) => (
              <p key={`n${i}`} className="flex gap-2 text-muted"><Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {n}</p>
            ))}
            {version.warnings?.map((w, i) => (
              <p key={`w${i}`} className="flex gap-2 text-warn"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {w}</p>
            ))}
            <p className="text-xs text-muted">
              Changes are computed by comparing versions in code; days outside your request are locked.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
