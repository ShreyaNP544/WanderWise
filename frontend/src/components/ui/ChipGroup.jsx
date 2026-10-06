import { Check } from 'lucide-react';
import { cn } from '../../lib/cn.js';

/** Multi-select chips backed by real checkboxes (keyboard + screen-reader friendly). */
export function ChipGroup({ name, options, value, onChange, max }) {
  const toggle = (option) =>
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const checked = value.includes(option);
        const disabled = !checked && max !== undefined && value.length >= max;
        return (
          <label
            key={option}
            className={cn(
              'inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium ring-1 transition-colors',
              'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-500',
              checked ? 'bg-brand-700 text-white ring-brand-700' : 'bg-surface text-ink ring-line hover:ring-brand-500',
              disabled && 'cursor-not-allowed opacity-40'
            )}
          >
            <input
              type="checkbox"
              name={name}
              className="sr-only"
              checked={checked}
              disabled={disabled}
              onChange={() => toggle(option)}
            />
            {checked && <Check className="size-4" aria-hidden="true" />}
            {option}
          </label>
        );
      })}
    </div>
  );
}
