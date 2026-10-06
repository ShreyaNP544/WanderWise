import { Minus, Plus } from 'lucide-react';

/** − value + control. Pass the Field render props through as `fieldProps`. */
export function NumberStepper({ value, onChange, min, max, unit, fieldProps }) {
  const clamp = (n) => Math.min(max, Math.max(min, n));
  const btn =
    'grid size-12 shrink-0 place-items-center rounded-xl bg-surface ring-1 ring-line text-ink hover:bg-brand-50 ' +
    'disabled:opacity-40 disabled:hover:bg-surface';

  return (
    <div className="flex items-center gap-2">
      <button type="button" className={btn} onClick={() => onChange(clamp(value - 1))} disabled={value <= min} aria-label="Decrease">
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <div className="relative flex-1">
        <input
          {...fieldProps}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={Number.isNaN(value) ? '' : value}
          onChange={(e) => onChange(e.target.value === '' ? NaN : Math.round(Number(e.target.value)))}
          className="h-12 w-full rounded-xl bg-surface text-center text-base font-semibold ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-brand-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        {unit && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">{unit}</span>}
      </div>
      <button type="button" className={btn} onClick={() => onChange(clamp((value || 0) + 1))} disabled={value >= max} aria-label="Increase">
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
