import { AlertTriangle, Info, RotateCw } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { Button } from './Button.jsx';

const tones = {
  error: { box: 'bg-red-50 ring-red-200 text-red-900', Icon: AlertTriangle },
  info: { box: 'bg-brand-50 ring-brand-100 text-brand-900', Icon: Info },
};

export function Alert({ tone = 'error', title, children, onRetry, className }) {
  const { box, Icon } = tones[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-2xl p-4 ring-1', box, className)}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="flex-1 text-sm">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="mt-0.5">{children}</div>}
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="self-start">
          <RotateCw className="size-4" aria-hidden="true" /> Retry
        </Button>
      )}
    </div>
  );
}
