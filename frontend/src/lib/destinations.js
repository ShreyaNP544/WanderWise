// Destination photos (Wikimedia Commons Featured/Quality images, credited) + light matching for the UI.
// Data ids mirror backend/src/data/destinations.json. Full credits: public/images/CREDITS.md.
// Places without a hand-picked photo get one from /api/photo (see hooks/usePlacePhoto.js).

const commons = (file) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`;

const photo = (id, alt, credit, license, file) => ({ src: `/images/${id}.jpg`, alt, credit, license, source: commons(file) });

export const HERO_PHOTO = photo('hero', 'Snow-capped peaks above Kardang village in Lahaul, Himachal Pradesh', 'Timothy A. Gonsalves', 'CC BY-SA 4.0', 'Kardang West Lahaul Himachal Oct22 A7C 03376.jpg');

// No photo of the place → null, and <Photo> renders a neutral branded panel (never a misleading landscape).

export const DESTINATIONS = [
  {
    id: 'manali', name: 'Manali', region: 'Himachal Pradesh', blurb: 'Snow peaks, pine valleys, café villages',
    aliases: ['manali', 'himachal', 'kullu', 'solang'],
    photo: photo('manali', 'Snow on the Rohtang range above the pine forests of Manali', 'Timothy A. Gonsalves', 'CC BY-SA 4.0', 'Snow Rohtang Range Manali May24 A7CR 00128.jpg'),
  },
  {
    id: 'goa', name: 'Goa', region: 'Goa', blurb: 'Palm coves, Goan food, Portuguese lanes',
    aliases: ['goa', 'palolem', 'calangute', 'panaji', 'mandrem'],
    photo: photo('goa', 'Palm trees leaning over the sea at Cola Bay, South Goa', 'Timothy A. Gonsalves', 'CC BY-SA 4.0', 'Laterite Cliffs Cola Bay Goa Jan19 DSC06161.jpg'),
  },
  {
    id: 'jaipur', name: 'Jaipur', region: 'Rajasthan', blurb: 'Forts, bazaars and the Pink City',
    aliases: ['jaipur', 'pink city'],
    photo: photo('jaipur', 'Jal Mahal water palace glowing at dusk, Jaipur', 'A.Savin', 'FAL', 'Jaipur 03-2016 39 Jal Mahal - Water Palace.jpg'),
  },
  {
    id: 'udaipur', name: 'Udaipur', region: 'Rajasthan', blurb: 'Lake palaces and golden sunsets',
    aliases: ['udaipur'],
    photo: photo('udaipur', 'The City Palace glowing above Lake Pichola, Udaipur', 'Jakub Hałun', 'CC BY-SA 4.0', '20191207 City Palace, Udaipur 1701 7325.jpg'),
  },
  {
    id: 'jaisalmer', name: 'Jaisalmer', region: 'Rajasthan', blurb: 'Golden fort, dunes and desert camps',
    aliases: ['jaisalmer', 'golden city', 'thar'],
    photo: photo('jaisalmer', 'The golden sandstone walls of Jaisalmer Fort', 'Gérard Janot', 'CC BY-SA 3.0', 'Jaisalmer forteresse.jpg'),
  },
  {
    id: 'rishikesh', name: 'Rishikesh', region: 'Uttarakhand', blurb: 'Ganga ghats, rafting and yoga',
    aliases: ['rishikesh', 'haridwar'],
    photo: photo('rishikesh', 'Suspension bridge over the turquoise Ganga in Rishikesh', 'Snehrashmi', 'CC BY-SA 4.0', 'Lakshman Jhula Bridge - Hrishikesh - Uttarakhand 001.jpg'),
  },
  {
    id: 'varanasi', name: 'Varanasi', region: 'Uttar Pradesh', blurb: 'Ancient ghats and river sunrises',
    aliases: ['varanasi', 'banaras', 'benares', 'kashi'],
    photo: photo('varanasi', 'Boats moored below Munshi Ghat, Varanasi', 'Marcin Białek', 'CC BY-SA 3.0', 'Varanasi Munshi Ghat3.jpg'),
  },
  {
    id: 'hampi', name: 'Hampi', region: 'Karnataka', blurb: 'Boulder hills and Vijayanagara ruins',
    aliases: ['hampi', 'hospet', 'hosapete', 'anegundi'],
    photo: photo('hampi', 'Sunset over the granite boulders and river at Hampi', 'Vyacheslav Argenberg', 'CC BY 4.0', 'Hampi, India, Rocky landscape of Hampi, Granite rocks of Matanga Hill.jpg'),
  },
  {
    id: 'munnar', name: 'Munnar', region: 'Kerala', blurb: 'Rolling tea hills and misty mornings',
    aliases: ['munnar', 'idukki'],
    photo: photo('munnar', 'Rolling tea hills under a blue sky near Munnar', 'Rainer Halama', 'CC BY-SA 4.0', 'Eravikulam National Park-WUS07189.jpg'),
  },
  {
    id: 'alleppey', name: 'Alleppey', region: 'Kerala', blurb: 'Backwaters, houseboats and sadya',
    aliases: ['alleppey', 'alappuzha', 'backwaters', 'kumarakom'],
    photo: photo('alleppey', 'A boatman with a violet umbrella on the Kerala backwaters', 'Hans A. Rosbach', 'CC BY-SA 3.0', 'Kerala backwater 20080218-11.jpg'),
  },
  {
    id: 'pondicherry', name: 'Pondicherry', region: 'Puducherry', blurb: 'French lanes and sunrise beaches',
    aliases: ['pondicherry', 'puducherry', 'pondy', 'auroville'],
    photo: photo('pondicherry', 'Fishing boats on the sea at sunrise, Pondicherry', 'Satdeep Gill', 'CC BY-SA 4.0', 'A view from University Beach, Pondicherry 03.jpg'),
  },
  {
    id: 'darjeeling', name: 'Darjeeling', region: 'West Bengal', blurb: 'Tea, toy trains and Kanchenjunga',
    aliases: ['darjeeling'],
    photo: photo('darjeeling', 'Tea plantations on the hills of Darjeeling', 'Vyacheslav Argenberg', 'CC BY 4.0', 'Darjeeling, India, Tea plantations on hills.jpg'),
  },
];

const byId = Object.fromEntries(DESTINATIONS.map((d) => [d.id, d]));

// Day-card banners for what a day is mostly about.
export const THEME_PHOTOS = {
  food: photo('theme-food', 'A Maharashtrian thali with puran poli, curries and rice', 'Sharvarism', 'CC BY-SA 4.0', 'Maharashtrian Mejwani.jpg'),
  spiritual: photo('theme-spiritual', 'Evening Ganga aarti with lamps and incense in Varanasi', 'Jorge Royan', 'CC BY-SA 3.0', 'India - Varanasi puja ceremony - 1772.jpg'),
  adventure: photo('theme-adventure', 'Paragliders above the clouds at Bir, Himachal Pradesh', 'PanWoyteczek', 'CC BY-SA 4.0', 'Paragliding at Bir, HP.jpg'),
};

export const MOMENTS = [
  { photo: THEME_PHOTOS.food, label: 'Thali lunches 🍛' },
  { photo: byId.hampi.photo, label: 'Hampi sunsets' },
  { photo: THEME_PHOTOS.spiritual, label: 'Ganga aarti 🪔' },
  { photo: byId.jaisalmer.photo, label: 'Golden forts' },
  { photo: THEME_PHOTOS.adventure, label: 'Paragliding 🪂' },
  { photo: byId.pondicherry.photo, label: 'Sunrise beaches' },
  { photo: byId.alleppey.photo, label: 'Backwaters' },
  { photo: byId.darjeeling.photo, label: 'Tea estates 🍃' },
];

const THEMES = {
  food: { emoji: '🍛', label: 'Food & flavours' },
  shopping: { emoji: '🛍️', label: 'Markets & bazaars' },
  culture: { emoji: '🏰', label: 'Monuments & heritage' },
  spiritual: { emoji: '🪔', label: 'Temples & rituals' },
  adventure: { emoji: '🪂', label: 'Adventure' },
  nature: { emoji: '🌿', label: 'Into nature' },
};
const CATEGORY_THEME = { food: 'food', shopping: 'shopping', culture: 'culture', sightseeing: 'culture', spiritual: 'spiritual', adventure: 'adventure', nature: 'nature', wildlife: 'nature' };

export function matchDestination(text = '') {
  const t = ` ${text.toLowerCase().replace(/[^a-z ]/g, ' ')} `;
  return DESTINATIONS.find((d) => d.aliases.some((a) => t.includes(` ${a} `))) || null;
}

/** Hand-picked photo for curated places, else the live place photo, else null. */
export const photoFor = (text, livePhoto) => matchDestination(text)?.photo || livePhoto || null;

/**
 * Banner for a day, from its activities. Food, temple and adventure days get themed photos;
 * travel, heritage, market and nature days show the destination itself.
 */
export function dayTheme(day, destinationText, livePhoto) {
  const destPhoto = photoFor(destinationText, livePhoto);
  if (day.type === 'travel') return { emoji: '🧳', label: 'Travel day', photo: destPhoto };
  const counts = {};
  for (const a of day.activities) {
    const t = CATEGORY_THEME[a.category];
    if (t) counts[t] = (counts[t] || 0) + (a.durationHrs || 1);
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!top) return { emoji: '📍', label: 'Explore', photo: destPhoto };
  return { ...THEMES[top], photo: THEME_PHOTOS[top] || destPhoto };
}
