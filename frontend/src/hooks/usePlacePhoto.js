import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { matchDestination } from '../lib/destinations.js';

/**
 * Live, credited photo for a place name (debounced, cached server-side).
 * skipCurated: curated destinations already have bundled photos, so skip the call.
 * strict: only accept an exact Wikipedia article match (for free-text activity names).
 */
export function usePlacePhoto(text, { delay = 600, skipCurated = true, strict = false, thumb = false } = {}) {
  const [photo, setPhoto] = useState(null);
  const place = (text || '').trim();
  const skip = place.length < 3 || (skipCurated && Boolean(matchDestination(place)));

  useEffect(() => {
    if (skip) {
      setPhoto(null);
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api
        .placePhoto(place, { strict, thumb, signal: controller.signal })
        .then((r) => setPhoto(r.photo || null))
        .catch(() => {});
    }, delay);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [place, skip, strict, thumb, delay]);

  return photo;
}
