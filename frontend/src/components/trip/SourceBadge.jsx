import { BadgeCheck, Database, Sparkles } from 'lucide-react';
import { cn } from '../../lib/cn.js';

const SOURCES = {
  baseline: { Icon: Database, label: 'Curated data', title: 'Place and typical cost from the WanderWise dataset', cls: 'bg-brand-50 text-brand-700 ring-brand-100' },
  real_place: { Icon: BadgeCheck, label: 'Real place', title: 'Matched to a real place on Wikipedia; cost is an estimate', cls: 'bg-sky-50 text-sky-700 ring-sky-100' },
  ai_estimate: { Icon: Sparkles, label: 'AI estimate', title: 'Suggested by Gemma; not verified against a data source', cls: 'bg-paper text-muted ring-line' },
};

export function SourceBadge({ activity }) {
  const s = SOURCES[activity.source] || SOURCES.ai_estimate;
  const content = (
    <>
      <s.Icon className="size-3" aria-hidden="true" />
      {s.label}
    </>
  );
  const cls = cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1', s.cls);
  if (activity.source !== 'ai_estimate' && activity.placeUrl) {
    return (
      <a href={activity.placeUrl} target="_blank" rel="noreferrer" className={cn(cls, 'hover:underline')} title={`${s.title} (opens Wikipedia)`}>
        {content}
      </a>
    );
  }
  return (
    <span className={cls} title={s.title}>
      {content}
    </span>
  );
}
