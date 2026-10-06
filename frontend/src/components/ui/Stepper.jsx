import { Check } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export function Stepper({ steps, current }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Progress">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.id} className="flex flex-1 items-center gap-2" aria-current={active ? 'step' : undefined}>
            <span
              className={cn(
                'grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold',
                done && 'bg-brand-700 text-white',
                active && 'bg-sunset-500 text-white',
                !done && !active && 'bg-surface text-muted ring-1 ring-line'
              )}
            >
              {done ? <Check className="size-4" aria-label="done" /> : i + 1}
            </span>
            <span className={cn('hidden text-sm font-semibold sm:block', active ? 'text-ink' : 'text-muted')}>
              {step.title}
            </span>
            {i < steps.length - 1 && <span className={cn('h-px flex-1', done ? 'bg-brand-500' : 'bg-line')} aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
