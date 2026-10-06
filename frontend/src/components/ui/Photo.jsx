import { cn } from '../../lib/cn.js';

/** Photo with a small, unobtrusive attribution link (licences require credit). */
export function Photo({ photo, className, imgClassName, priority = false, showCredit = true, children }) {
  // Only default to `relative` when the caller hasn't positioned it (e.g. an absolute background).
  const positioned = /\b(absolute|fixed|sticky)\b/.test(className || '');
  // No real photo of this place: show a neutral branded panel rather than a misleading landscape.
  if (!photo) {
    return (
      <div className={cn(!positioned && 'relative', 'overflow-hidden bg-linear-to-br from-brand-700 via-brand-900 to-ink', className)} aria-hidden={!children || undefined}>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] bg-size-[22px_22px]" aria-hidden="true" />
        {children}
      </div>
    );
  }
  return (
    <figure className={cn(!positioned && 'relative', 'm-0 overflow-hidden', className)}>
      <img
        src={photo.src}
        alt={photo.alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={cn('size-full object-cover', imgClassName)}
      />
      {children}
      {showCredit && (
        <figcaption className="absolute bottom-1.5 right-2 z-10 text-[10px] leading-none text-white/75 drop-shadow">
          <a href={photo.source} target="_blank" rel="noreferrer" className="hover:text-white hover:underline">
            {photo.credit} · {photo.license}
          </a>
        </figcaption>
      )}
    </figure>
  );
}
