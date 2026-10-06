// Destination photos (Wikimedia Commons Featured/Quality images, credited) + light matching for the UI.
// Data ids mirror backend/src/data/destinations.json. Full credits: public/images/CREDITS.md.

const commons = (file) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`;

const photo = (id, alt, credit, license, file) => ({ src: `/images/${id}.jpg`, alt, credit, license, source: commons(file) });

export const HERO_PHOTO = photo('hero', 'Snow-capped peaks above Kardang village in Lahaul, Himachal Pradesh', 'Timothy A. Gonsalves', 'CC BY-SA 4.0', 'Kardang West Lahaul Himachal Oct22 A7C 03376.jpg');

export const FALLBACK_PHOTO = photo('generic', 'A boatman with a violet umbrella on the Kerala backwaters', 'Hans A. Rosbach', 'CC BY-SA 3.0', 'Kerala backwater 20080218-11.jpg');

export const DESTINATIONS = [
  {
    id: 'manali', name: 'Manali', region: 'Himachal Pradesh', blurb: 'Snow peaks, pine valleys, café villages',
    aliases: ['manali', 'himachal', 'kullu', 'solang'],
    photo: photo('manali', 'Snow on the Rohtang range above the pine forests of Manali', 'Timothy A. Gonsalves', 'CC BY-SA 4.0', 'Snow Rohtang Range Manali May24 A7CR 00128.jpg'),
  },
  {
    id: 'goa', name: 'Goa', region: 'Goa', blurb: 'Beaches, Goan food, Portuguese lanes',
    aliases: ['goa', 'palolem', 'calangute', 'panaji', 'mandrem'],
    photo: photo('goa', 'Mandrem beach and river in North Goa', 'Vyacheslav Argenberg', 'CC BY 4.0', 'Mandrem Beach and Mandrem River, Mandrem, Goa, India (edit).jpg'),
  },
  {
    id: 'jaipur', name: 'Jaipur', region: 'Rajasthan', blurb: 'Forts, bazaars and the Pink City',
    aliases: ['jaipur', 'pink city'],
    photo: photo('jaipur', 'Jal Mahal water palace glowing at dusk, Jaipur', 'A.Savin', 'FAL', 'Jaipur 03-2016 39 Jal Mahal - Water Palace.jpg'),
  },
  {
    id: 'rishikesh', name: 'Rishikesh', region: 'Uttarakhand', blurb: 'Ganga ghats, rafting and yoga',
    aliases: ['rishikesh', 'haridwar'],
    photo: photo('rishikesh', 'Suspension bridge over the turquoise Ganga in Rishikesh', 'Snehrashmi', 'CC BY-SA 4.0', 'Lakshman Jhula Bridge - Hrishikesh - Uttarakhand 001.jpg'),
  },
  {
    id: 'udaipur', name: 'Udaipur', region: 'Rajasthan', blurb: 'Lake palaces and golden sunsets',
    aliases: ['udaipur'],
    photo: photo('udaipur', 'The City Palace rising above Lake Pichola, Udaipur', 'Jakub Hałun', 'CC BY-SA 4.0', '20191207 Lake Pichola, City Palace, Udaipur, 1516 7254.jpg'),
  },
  {
    id: 'munnar', name: 'Munnar', region: 'Kerala', blurb: 'Rolling tea hills and misty mornings',
    aliases: ['munnar', 'idukki'],
    photo: photo('munnar', 'Rolling tea hills under a blue sky near Munnar', 'Rainer Halama', 'CC BY-SA 4.0', 'Eravikulam National Park-WUS07189.jpg'),
  },
  {
    id: 'varanasi', name: 'Varanasi', region: 'Uttar Pradesh', blurb: 'Ancient ghats and river sunrises',
    aliases: ['varanasi', 'banaras', 'benares', 'kashi'],
    photo: photo('varanasi', 'Boats moored below Munshi Ghat, Varanasi', 'Marcin Białek', 'CC BY-SA 3.0', 'Varanasi Munshi Ghat3.jpg'),
  },
  {
    id: 'darjeeling', name: 'Darjeeling', region: 'West Bengal', blurb: 'Tea, toy trains and Kanchenjunga',
    aliases: ['darjeeling'],
    photo: photo('darjeeling', 'Tea plantations on the hills of Darjeeling', 'Vyacheslav Argenberg', 'CC BY 4.0', 'Darjeeling, India, Tea plantations on hills.jpg'),
  },
];

export function matchDestination(text = '') {
  const t = ` ${text.toLowerCase().replace(/[^a-z ]/g, ' ')} `;
  return DESTINATIONS.find((d) => d.aliases.some((a) => t.includes(` ${a} `))) || null;
}

export const photoFor = (text) => matchDestination(text)?.photo || FALLBACK_PHOTO;
