import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { matchDestination } from '../lib/destinations.js';

/** Live, credited photo for any destination the user types (debounced; curated places skip the call). */
export function usePlacePhoto(text, delay = 600) {
  const [photo, setPhoto] = useState(null);
  const place = (text || '').trim();
  const curated = Boolean(matchDestination(place));

  useEffect(() => {
    if (curated || place.length < 3) {
      setPhoto(null);
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api
        .placePhoto(place, { signal: controller.signal })
        .then((r) => setPhoto(r.photo || null))
        .catch(() => {});
    }, delay);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [place, curated, delay]);

  return photo;
}
