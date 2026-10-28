// Shared, dependency-free definitions used by the public world, the API and the admin.

// Places on the map where a product can live. Bespoke slots have hand-drawn buildings;
// generic slots draw a building in the style the admin picks. Isles appear only when used.
export const SLOTS = {
  'london-tower': { label: 'London · tower with shield', pos: [820, 210], alt: 290 },
  'london-works': { label: 'London · building site with crane', pos: [940, 310], alt: 245 },
  'lagos-highway': { label: 'Lagos ⇄ Victoria Island highway', pos: [840, 792], alt: 200 },
  'lagos-care': { label: 'Lagos · care home with heart', pos: [585, 710], alt: 215 },
  'calgary-house': { label: 'Calgary · house under the Rockies', pos: [230, 315], alt: 215 },
  'calgary-plot': { label: 'Calgary · open plot', pos: [120, 380], alt: 210, generic: true },
  'london-plot': { label: 'London · open plot', pos: [790, 345], alt: 210, generic: true },
  'north-isle': { label: 'New island · north (bridged to Calgary)', pos: [495, 180], alt: 230, generic: true, isle: true },
  'south-isle': { label: 'New island · south (bridged to Calgary)', pos: [225, 630], alt: 230, generic: true, isle: true }
};

export const STYLES = { tower: 'Office tower', house: 'House', shop: 'Shop with awning', campus: 'Campus' };

export const STATUS = { live: 'Live', pilot: 'Pilot', in_lab: 'In the lab', coming_soon: 'Coming soon' };

export const HQ_POS = { pos: [464, 474], alt: 240 };

export const DEFAULT_PRODUCTS = [
  { id: 'scamfendr', slot: 'london-tower', name: 'Scamfendr', line: 'Check a business before you pay.', place: 'UK', status: 'live', color: '#2E86C1', url: 'https://scamfendr.uk', cta: 'Visit ↗', style: 'tower', inTour: true, visible: true, sort: 1 },
  { id: 'vervet', slot: 'london-works', name: 'Vervet', line: 'Prove you were watching. Compliance for cross-border payments.', place: 'UK ⇄ Nigeria', status: 'in_lab', color: '#F6C343', url: 'https://vervethq.com', cta: 'Peek ↗', style: 'tower', inTour: true, visible: true, sort: 2 },
  { id: 'ganusii', slot: 'lagos-highway', name: 'Ganusii', line: 'Lagos commutes, shared.', place: 'Lagos', status: 'pilot', color: '#1E4D3A', url: 'https://ganusii.com', cta: 'Visit ↗', style: 'tower', inTour: true, visible: true, sort: 3 },
  { id: 'notiscare', slot: 'lagos-care', name: 'NotisCare', line: 'Know before the family calls.', place: 'Nigeria', status: 'live', color: '#24304F', url: 'https://notis.care', cta: 'Visit ↗', style: 'tower', inTour: true, visible: true, sort: 4 },
  { id: 'nestlo', slot: 'calgary-house', name: 'Nestlo', line: 'Your Alberta settlement plan, built for you.', place: 'Canada', status: 'live', color: '#1F6F6B', url: 'https://nestlo.ca', cta: 'Visit ↗', style: 'house', inTour: true, visible: true, sort: 5 },
  { id: 'soon-ca', slot: 'calgary-plot', name: 'Coming soon', line: 'Something new is being built here.', place: 'Canada', status: 'coming_soon', color: '#FFE3D8', url: '#contact', cta: 'Get notified', style: 'house', inTour: false, visible: true, sort: 6 },
  { id: 'soon-uk', slot: 'london-plot', name: 'Coming soon', line: 'Something new is being built here.', place: 'UK', status: 'coming_soon', color: '#FFE3D8', url: '#contact', cta: 'Get notified', style: 'shop', inTour: false, visible: true, sort: 7 }
];

export const DEFAULT_CONTENT = {
  tagline: 'Building for everyday people, powered by AI.',
  hint: 'Hover a place to meet it. Click to visit.',
  hq: { name: 'Undaunted Lab', line: 'Where the paper planes take off.', cta: 'Our story' },
  story: {
    title: 'We build the tools we wish existed.',
    paragraphs: [
      'Undaunted Lab is an AI-native product studio. We make small, sharp tools for the moments that test people: a convincing scam, a first month in a new country, a long commute, a quiet change in someone you care for.',
      'Our products serve people in the UK, Nigeria and Canada. Every one of them has AI at its core.'
    ],
    rules: [
      { title: 'AI at the core', body: 'Each product is designed around what a model can do for someone, from day one.' },
      { title: 'People decide', body: 'AI notices, sorts and drafts. A person makes the call that matters.' },
      { title: 'Meet people where they are', body: 'WhatsApp in Lagos, Telegram in the UK, a QR code in Calgary. No app store hurdles.' }
    ],
    founder: 'Founded by Opeyemi, who brings a background in financial crime to building products. He writes about AI and financial safety.'
  },
  notes: {
    title: 'Notes from the bench.',
    intro: 'Short essays on AI productivity, financial safety and building in public.',
    items: [
      { tag: 'AI productivity', title: 'Posts on building with AI', url: 'https://www.linkedin.com/' },
      { tag: 'Financial safety', title: 'Posts on fraud, scams and staying safe', url: 'https://www.linkedin.com/' },
      { tag: 'Building in public', title: 'Updates from the lab', url: 'https://www.linkedin.com/' }
    ]
  },
  contact: {
    title: 'Hey, let’s build together.',
    email: 'opeyemi@undauntedlab.com',
    topics: ['Partner or invest', 'Build with us', 'Press', 'A product']
  },
  settings: { tourSeconds: 4.4, linkedin: 'https://www.linkedin.com/' }
};
