import { getJson } from './http.js';

const DAY = 24 * 60 * 60 * 1000;
const BAD_FILE = /map|flag|locator|location|emblem|logo|seal|coat[_ ]of|svg|png$|diagram|chart/i;

const strip = (html = '') => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

async function credit(file) {
  const data = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(`File:${file}`)}&prop=imageinfo&iiprop=extmetadata`,
    { ttlMs: 30 * DAY, source: 'commons-credit' }
  );
  const meta = Object.values(data?.query?.pages || {})[0]?.imageinfo?.[0]?.extmetadata || {};
  return { credit: strip(meta.Artist?.value).slice(0, 60) || 'Wikimedia Commons', license: meta.LicenseShortName?.value || 'see source' };
}

/** Lead photo of the place's Wikipedia article, if it's a real landscape photo (not a map or flag). */
async function wikipediaLead(title) {
  const data = await getJson(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&titles=${encodeURIComponent(title)}&prop=pageimages&piprop=thumbnail|name|original&pithumbsize=1600`,
    { ttlMs: 7 * DAY, source: 'wikipedia-photo' }
  );
  const page = Object.values(data?.query?.pages || {})[0];
  const file = page?.pageimage;
  const o = page?.original;
  if (!file || !o || BAD_FILE.test(file) || !/\.jpe?g$/i.test(file) || o.width < o.height * 1.15 || o.width < 900) return null;
  return { src: page.thumbnail?.source || o.source, file, title: page.title };
}

/** Best community-rated landscape photo of the place on Commons. */
async function commonsQuality(place) {
  const q = `${place} incategory:Quality_images filetype:bitmap`;
  const data = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=8&gsrsearch=${encodeURIComponent(q)}&prop=imageinfo&iiprop=url|size&iiurlwidth=1600`,
    { ttlMs: 7 * DAY, source: 'commons-search' }
  );
  const pages = Object.values(data?.query?.pages || {}).sort((a, b) => a.index - b.index);
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    const file = p.title.replace(/^File:/, '');
    if (ii && ii.width >= ii.height * 1.2 && ii.width >= 1600 && !BAD_FILE.test(file)) return { src: ii.thumburl, file, title: place };
  }
  return null;
}

/**
 * A credited, landscape photo for any Indian destination. Keyless (Wikipedia + Wikimedia Commons),
 * cached, and optional: returns null when nothing suitable exists, and the UI falls back gracefully.
 */
export async function placePhoto(text) {
  if (!text) return null;
  const place = text.split(',')[0].trim();
  const found = (await wikipediaLead(text.trim())) || (place !== text.trim() && (await wikipediaLead(place))) || (await commonsQuality(place));
  if (!found) return null;
  return {
    src: found.src,
    alt: `${found.title || place}`,
    ...(await credit(found.file)),
    source: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(found.file.replace(/ /g, '_'))}`,
  };
}
