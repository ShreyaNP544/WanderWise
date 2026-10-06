import { useHealth } from '../../hooks/useHealth.js';
import { cn } from '../../lib/cn.js';

const states = {
  checking: { dot: 'bg-muted animate-pulse', text: 'Connecting…' },
  online: { dot: 'bg-ok', text: 'Gemma online' },
  pending: { dot: 'bg-warn', text: 'API online · Gemma not connected' },
  offline: { dot: 'bg-danger', text: 'API offline' },
};

export function StatusBadge() {
  const { status, health } = useHealth();
  const key = status === 'online' && !health?.ai?.ready ? 'pending' : status;
  const { dot, text } = states[key];

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-muted ring-1 ring-line"
      role="status"
      title={health?.ai?.hosted?.length ? `Models: ${health.ai.hosted.join(', ')}` : undefined}
    >
      <span className={cn('size-2 rounded-full', dot)} aria-hidden="true" />
      {text}
    </span>
  );
}
