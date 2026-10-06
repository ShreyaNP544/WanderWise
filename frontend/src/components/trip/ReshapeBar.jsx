import { useState } from 'react';
import { ArrowUp, Undo2, Wand2 } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { RESHAPE_SUGGESTIONS } from '../../lib/trip.js';

/** Sticky command bar: every message is an edit to the current plan, not a chat. */
export function ReshapeBar({ onSubmit, onUndo, canUndo, busy }) {
  const [text, setText] = useState('');
  const submit = (value) => {
    const v = value.trim();
    if (v.length < 3 || busy) return;
    onSubmit(v);
    setText('');
  };

  return (
    <div className="sticky bottom-0 z-20 border-t border-line/70 bg-paper/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <ul className="mb-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label="Suggestions">
          {RESHAPE_SUGGESTIONS.map((s) => (
            <li key={s} className="shrink-0">
              <button
                type="button"
                disabled={busy}
                onClick={() => submit(s)}
                className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-ink ring-1 ring-line hover:ring-brand-500 disabled:opacity-50"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit(text);
          }}
        >
          <label htmlFor="reshape" className="sr-only">
            Remix your trip
          </label>
          <div className="relative flex-1">
            <Wand2 className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-brand-700" aria-hidden="true" />
            <input
              id="reshape"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={300}
              disabled={busy}
              placeholder="Remix your trip, e.g. “Make this trip 30% cheaper but keep the mountains”"
              className="h-13 w-full rounded-full bg-surface pl-12 pr-4 text-base shadow-card ring-1 ring-line placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
            />
          </div>
          <Button type="submit" size="lg" className="size-13 px-0!" disabled={busy || text.trim().length < 3} aria-label="Apply change">
            <ArrowUp className="size-5" aria-hidden="true" />
          </Button>
          {canUndo && (
            <Button variant="secondary" size="lg" className="hidden sm:inline-flex" onClick={onUndo} disabled={busy}>
              <Undo2 className="size-4" aria-hidden="true" /> Undo
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
