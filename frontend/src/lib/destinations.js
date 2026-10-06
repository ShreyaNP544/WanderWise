// Destination photos (Wikimedia Commons, credited) + light matching for the UI.
// Data ids mirror backend/src/data/destinations.json.

const commons = (file) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`;

export const HERO_PHOTO = {
  src: '/images/hero.jpg',
  alt: 'The Bhaga river winding through a high Himalayan valley in Lahaul',
  credit: 'Timothy A. Gonsalves',
  license: 'CC BY-SA 4.0',
  source: commons('Bhaga River Darcha Gemur Lahaul Jun24 A7CR 00231.jpg'),
};

export const FALLBACK_PHOTO = {
  src: '/images/generic.jpg',
  alt: 'Houseboats on the Kerala backwaters',
  credit: 'Vyacheslav Argenberg',
  license: 'CC BY 4.0',
  source: commons('Kerala backwaters, Houseboats, India.jpg'),
};

export const DESTINATIONS = [
  {
    id: 'manali', name: 'Manali', region: 'Himachal Pradesh', blurb: 'Snow peaks, pine valleys, café villages',
    aliases: ['manali', 'himachal', 'kullu', 'solang'],
    photo: { src: '/images/manali.jpg', alt: 'Solang valley below snowy peaks near Manali', credit: 'Shubhanshu', license: 'Public domain', source: commons('A view of solang valley on the way to rohtang pass.jpg') },
  },
  {
    id: 'goa', name: 'Goa', region: 'Goa', blurb: 'Beaches, Goan food, Portuguese lanes',
    aliases: ['goa', 'palolem', 'calangute', 'panaji'],
    photo: { src: '/images/goa.jpg', alt: 'Palm-fringed crescent of Palolem beach, South Goa', credit: 'iMahesh', license: 'CC BY-SA 4.0', source: commons('Palolem Beach, South Goa.jpg') },
  },
  {
    id: 'jaipur', name: 'Jaipur', region: 'Rajasthan', blurb: 'Forts, bazaars and the Pink City',
    aliases: ['jaipur', 'pink city'],
    photo: { src: '/images/jaipur.jpg', alt: 'The pink sandstone facade of Hawa Mahal in Jaipur', credit: 'Chainwit.', license: 'CC BY-SA 4.0', source: commons('East facade Hawa Mahal Jaipur from ground level (July 2022) - img 01.jpg') },
  },
  {
    id: 'rishikesh', name: 'Rishikesh', region: 'Uttarakhand', blurb: 'Ganga ghats, rafting and yoga',
    aliases: ['rishikesh', 'haridwar'],
    photo: { src: '/images/rishikesh.jpg', alt: 'Lakshman Jhula suspension bridge over the Ganga in Rishikesh', credit: 'McKay Savage', license: 'CC BY 2.0', source: commons('Rishikesh, Lakshman Jhula.jpg') },
  },
  {
    id: 'udaipur', name: 'Udaipur', region: 'Rajasthan', blurb: 'Lake palaces and golden sunsets',
    aliases: ['udaipur'],
    photo: { src: '/images/udaipur.jpg', alt: 'Lake Pichola glowing at sunset in Udaipur', credit: 'UnpetitproleX', license: 'CC BY-SA 4.0', source: commons('Lake Pichola at sunset, Udaipur, Rajasthan, India.jpg') },
  },
  {
    id: 'munnar', name: 'Munnar', region: 'Kerala', blurb: 'Rolling tea hills and misty mornings',
    aliases: ['munnar', 'idukki'],
    photo: { src: '/images/munnar.jpg', alt: 'Tea plantations covering the hills of Munnar', credit: 'Ingo Mehling', license: 'CC BY-SA 4.0', source: commons('Munnar - Tea Plantations.jpg') },
  },
  {
    id: 'varanasi', name: 'Varanasi', region: 'Uttar Pradesh', blurb: 'Ancient ghats and river sunrises',
    aliases: ['varanasi', 'banaras', 'benares', 'kashi'],
    photo: { src: '/images/varanasi.jpg', alt: 'Wooden boats on the Ganges at sunrise in Varanasi', credit: 'Schwiki', license: 'CC BY-SA 4.0', source: commons('Boats at sunrise Ganges River Varanasi Uttar Pradesh Schwiki.jpg') },
  },
  {
    id: 'darjeeling', name: 'Darjeeling', region: 'West Bengal', blurb: 'Tea, toy trains and Kanchenjunga',
    aliases: ['darjeeling'],
    photo: { src: '/images/darjeeling.jpg', alt: 'Kanchenjunga rising above the rooftops of Darjeeling', credit: 'DaLoetz', license: 'CC BY 4.0', source: commons('Kanchenjunga above roofs of Darjeeling 1.jpg') },
  },
];

export function matchDestination(text = '') {
  const t = ` ${text.toLowerCase().replace(/[^a-z ]/g, ' ')} `;
  return DESTINATIONS.find((d) => d.aliases.some((a) => t.includes(` ${a} `))) || null;
}

export const photoFor = (text) => matchDestination(text)?.photo || FALLBACK_PHOTO;
