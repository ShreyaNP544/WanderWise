import { useId } from 'react';
import { cn } from '../../lib/cn.js';

export const inputClass =
  'w-full rounded-xl bg-surface px-4 h-12 text-base text-ink ring-1 ring-line placeholder:text-muted/70 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-500 aria-[invalid=true]:ring-danger';

/**
 * Label + hint + error wrapper. `children` is a render function receiving the
 * props the control needs for accessibility: ({ id, 'aria-describedby', 'aria-invalid' }).
 */
export function Field({ label, hint, error, optional, className, children }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {optional && <span className="ml-1 font-normal text-muted">(optional)</span>}
      </label>
      {children({
        id,
        'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
        'aria-invalid': error ? true : undefined,
      })}
      {hint && !error && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
