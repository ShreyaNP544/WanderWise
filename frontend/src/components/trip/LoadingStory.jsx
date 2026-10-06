import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { LOADING_LINES } from '../../lib/trip.js';

/** Narrated progress while Gemma works (calls take 30–90 s; silence feels broken). */
export function LoadingStory({ mode = 'create', title, overlay = false }) {
  const lines = LOADING_LINES[mode];
  const [i, setI] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    const l = setInterval(() => setI((n) => Math.min(n + 1, lines.length - 1)), 6000);
    return () => {
      clearInterval(t);
      clearInterval(l);
    };
  }, [lines.length]);

  const body = (
    <div className="mx-auto flex max-w-md flex-col items-center text-center" role="status" aria-live="polite">
      <span className="relative grid size-20 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-brand-500/20" aria-hidden="true" />
        <span className="grid size-16 place-items-center rounded-full bg-brand-700 text-white shadow-lg">
          <Sparkles className="size-7" aria-hidden="true" />
        </span>
      </span>
      {title && <p className="mt-6 font-display text-2xl font-bold">{title}</p>}
      <p className="mt-3 min-h-6 text-lg text-ink">{lines[i]}</p>
      <div className="mt-5 h-1.5 w-56 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="h-full rounded-full bg-brand-500 transition-all duration-1000" style={{ width: `${Math.min(95, (seconds / 70) * 100)}%` }} />
      </div>
      <p className="mt-3 text-sm text-muted">
        {seconds < 50 ? 'Gemma usually takes 30–60 seconds.' : 'Still working. Complex trips take a little longer.'}
      </p>
    </div>
  );

  if (!overlay) return <div className="px-4 py-24">{body}</div>;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-paper/90 px-4 backdrop-blur-sm">{body}</div>;
}
