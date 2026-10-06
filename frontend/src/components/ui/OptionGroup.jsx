import { cn } from '../../lib/cn.js';

/** Single-select radio cards. options: [{ value, label, hint? }] */
export function OptionGroup({ name, options, value, onChange, columns = 3 }) {
  const cols = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-4', 5: 'grid-cols-2 sm:grid-cols-5' };
  return (
    <div className={cn('grid gap-2', cols[columns])}>
      {options.map((option) => {
        const checked = value === option.value;
        return (
          <label
            key={option.value}
            className={cn(
              'flex cursor-pointer flex-col rounded-2xl px-4 py-3 ring-1 transition-colors',
              'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-500',
              checked ? 'bg-brand-50 ring-2 ring-brand-500' : 'bg-surface ring-line hover:ring-brand-500'
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              className="sr-only"
              checked={checked}
              onChange={() => onChange(option.value)}
            />
            <span className={cn('text-sm font-semibold', checked ? 'text-brand-900' : 'text-ink')}>{option.label}</span>
            {option.hint && <span className="mt-0.5 text-xs text-muted">{option.hint}</span>}
          </label>
        );
      })}
    </div>
  );
}
