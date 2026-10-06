import { cn } from '../../lib/cn.js';

/** Photo with a small, unobtrusive attribution link (licences require credit). */
export function Photo({ photo, className, imgClassName, priority = false, showCredit = true, children }) {
  return (
    <figure className={cn('relative overflow-hidden', className)}>
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
