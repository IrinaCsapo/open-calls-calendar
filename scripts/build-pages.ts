// Runs after `vite build`: writes a real HTML file for every page, so magpie.cool/about and
// magpie.cool/listing/<id> are served as normal pages (status 200) rather than through 404.html.
// That matters for search engines and for link previews (WhatsApp, LinkedIn, Slack…), and lets each
// listing have its own preview: its title, deadline and fee, and its image when it has one.
// dist/404.html stays as the fallback for anything else.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { LISTINGS } from '../src/lib/listings';
import { formatFull, isLive, isOpportunity } from '../src/lib/dates';
import type { Listing } from '../src/types/listing';
import { feeSummary } from '../src/lib/money';
import { SITE_NAME, SITE_URL } from '../src/lib/site';

const dist = new URL('../dist/', import.meta.url);
const base = readFileSync(new URL('index.html', dist), 'utf8');

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Every page says which address is the real one (so /?price=free and /listing/x/ count as one page each).
const canonical = (html: string, url: string) =>
  html.replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${esc(url)}"`);

// Structured data for Google: events (Event, Meetup, Workshop) can appear in Google's event listings.
function eventData(l: Listing) {
  const online = l.format === 'Online';
  const place = { '@type': 'Place', name: l.venue || l.city, address: { '@type': 'PostalAddress', addressLocality: l.city, addressCountry: l.country } };
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: l.title,
    startDate: l.start_date,
    ...(l.end_date ? { endDate: l.end_date } : {}),
    eventAttendanceMode: `https://schema.org/${online ? 'Online' : l.format === 'Hybrid' ? 'Mixed' : 'Offline'}EventAttendanceMode`,
    eventStatus: 'https://schema.org/EventScheduled',
    location: online ? { '@type': 'VirtualLocation', url: l.apply_url } : l.format === 'Hybrid' ? [place, { '@type': 'VirtualLocation', url: l.apply_url }] : place,
    ...(l.image_url ? { image: [l.image_url] } : {}),
    description: l.eligibility,
    organizer: { '@type': 'Organization', name: l.organiser },
    offers: {
      '@type': 'Offer',
      url: l.apply_url,
      price: l.entry_fee === 'Free' ? 0 : l.fee_amount ?? undefined,
      priceCurrency: l.entry_fee === 'Free' ? (l.currency ?? 'GBP') : l.currency,
      availability: 'https://schema.org/InStock',
    },
  };
}
const jsonLd = (html: string, data: object) =>
  html.replace('</head>', `    <script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>\n  </head>`);

function page(path: string, meta?: { title: string; description: string; image?: string; data?: object }) {
  let html = canonical(base, `${SITE_URL}${path}`);
  if (meta) {
    const url = `${SITE_URL}${path}`;
    html = html
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`)
      .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${esc(meta.description)}"`)
      .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${esc(meta.title)}"`)
      .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${esc(meta.description)}"`)
      .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${esc(url)}"`);
    if (meta.data) html = jsonLd(html, meta.data);
    if (meta.image) html = html.replace(/<meta property="og:image" content="[^"]*"/, `<meta property="og:image" content="${esc(meta.image)}"`);
  }
  const dir = new URL(`${path}/`, dist);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL('index.html', dir), html);
}

page('about', { title: `About · ${SITE_NAME}`, description: 'Every open call, every fee, in one place. How Magpie finds open calls and labels their fees.' });
page('submit', { title: `Submit an open call · ${SITE_NAME}`, description: 'Know an open call, prize, residency or event for artists that we are missing? Send it to Magpie.' });
page('start', { title: `What do you make? · ${SITE_NAME}`, description: 'Pick your disciplines and see open calls for your work first.' });
page('subscribe', { title: `Subscribe to deadlines · ${SITE_NAME}`, description: 'Every open call deadline in your own calendar.' });

for (const l of LISTINGS) {
  const fee = feeSummary(l);
  const when = isOpportunity(l) ? `Deadline ${formatFull(l.deadline!)}` : formatFull(l.start_date!);
  const bits = [when, [fee.headline, fee.selected].filter(Boolean).join(', '), l.prizes[0]].filter(Boolean);
  page(`listing/${l.id}`, {
    title: `${l.title} · ${SITE_NAME}`,
    description: `${bits.join(' · ')}. ${l.organiser}.`,
    image: l.image_url,
    data: isOpportunity(l) || l.entry_fee === 'Unknown' ? undefined : eventData(l),
  });
}
console.log(`✓ wrote ${LISTINGS.length + 4} page files`);

// sitemap.xml lists every page for search engines; listings that have closed are left out (their pages stay up).
const now = Date.now();
const urls = [
  { loc: SITE_URL, priority: '1.0', freq: 'daily' },
  ...['about', 'submit', 'start'].map((p) => ({ loc: `${SITE_URL}${p}`, priority: '0.5', freq: 'monthly' })),
  ...LISTINGS.filter((l) => isLive(l, now)).map((l) => ({ loc: `${SITE_URL}listing/${l.id}`, priority: '0.8', freq: 'weekly', lastmod: l.added })),
];
writeFileSync(new URL('sitemap.xml', dist), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(u.loc)}</loc>${'lastmod' in u && u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<changefreq>${u.freq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`);
console.log(`✓ wrote dist/sitemap.xml (${urls.length} pages)`);
