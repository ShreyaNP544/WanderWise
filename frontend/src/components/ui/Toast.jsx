import { createContext, useCallback, useContext, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../../lib/cn.js';

const ToastContext = createContext(() => {});

const TONES = {
  success: { Icon: CheckCircle2, cls: 'text-ok' },
  error: { Icon: AlertTriangle, cls: 'text-danger' },
  info: { Icon: Info, cls: 'text-brand-700' },
};

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    ({ title, body, tone = 'success', duration = 5000 }) => {
      const id = nextId++;
      setToasts((t) => [...t.slice(-2), { id, title, body, tone }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map(({ id, title, body, tone }) => {
          const { Icon, cls } = TONES[tone];
          return (
            <div key={id} className="animate-toast pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-2xl" role="status">
              <Icon className={cn('mt-0.5 size-5 shrink-0', cls === 'text-ok' ? 'text-green-400' : cls === 'text-danger' ? 'text-red-400' : 'text-brand-100')} aria-hidden="true" />
              <div className="flex-1 text-sm">
                <p className="font-semibold">{title}</p>
                {body && <p className="mt-0.5 text-white/75">{body}</p>}
              </div>
              <button type="button" onClick={() => dismiss(id)} className="rounded-full p-0.5 text-white/60 hover:text-white" aria-label="Dismiss">
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
