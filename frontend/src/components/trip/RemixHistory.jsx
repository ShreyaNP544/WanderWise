import { History, Scale, Undo2, Wand2 } from 'lucide-react';
import { Card } from '../ui/Card.jsx';

const ICON = { applied: Wand2, conflict: Scale, undo: Undo2 };
const LABEL = { applied: 'Applied', conflict: 'Needed a trade-off', undo: 'Undone' };

/** The conversation, as a log of edits to the trip, not a chat thread. */
export function RemixHistory({ history }) {
  if (!history?.length) return null;
  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        <History className="size-5 text-brand-700" aria-hidden="true" /> Remix history
      </h2>
      <ol className="mt-4 grid gap-3">
        {[...history].reverse().slice(0, 8).map((h, i) => {
          const Icon = ICON[h.outcome] || Wand2;
          return (
            <li key={`${h.at}-${i}`} className="flex gap-3 text-sm">
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-paper text-brand-700">
                <Icon className="size-3.5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-medium">{h.outcome === 'undo' ? 'Went back one version' : `“${h.instruction}”`}</p>
                <p className="text-xs text-muted">
                  {LABEL[h.outcome]} · {new Date(h.at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
