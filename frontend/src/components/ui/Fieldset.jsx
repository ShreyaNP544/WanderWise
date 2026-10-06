import { cn } from '../../lib/cn.js';

/** Group of related controls (chips, radio cards) with a real <legend>. */
export function Fieldset({ legend, hint, error, optional, className, children }) {
  return (
    <fieldset className={cn('flex flex-col gap-2.5', className)}>
      <legend className="mb-2.5 text-sm font-semibold text-ink">
        {legend}
        {optional && <span className="ml-1 font-normal text-muted">(optional)</span>}
        {hint && <span className="mt-0.5 block font-normal text-muted">{hint}</span>}
      </legend>
      {children}
      {error && (
        <p className="text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
