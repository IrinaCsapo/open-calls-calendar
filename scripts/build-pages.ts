// Runs after `vite build`. For every page it writes a real HTML file (dist/about.html, dist/listing/<id>.html,
// dist/open-calls/photography.html…), so each address is served as a normal page (status 200), with:
//
//  - its own title, description, link preview and canonical address
//  - the page's actual text inside <div id="root">: AI crawlers (ChatGPT, Claude, Perplexity…) and link-preview bots
//    don't run JavaScript, so without this they'd see an empty page. The app replaces it as it starts.
//  - structured data (schema.org JSON-LD): Organization, Event, FAQPage, CollectionPage, BreadcrumbList
//
// It also writes sitemap.xml, llms.txt and llms-full.txt (plain-text guides for AI tools), and open-calls.json.
// dist/404.html stays as the fallback for anything else.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { LISTINGS } from '../src/lib/listings';
import { closesAt, formatFull, formatRange, isLive, isOpportunity } from '../src/lib/dates';
import type { Listing } from '../src/types/listing';
import { feeSummary } from '../src/lib/money';
import { CONTACT_EMAIL, FEED_PATH, SITE_NAME, SITE_URL } from '../src/lib/site';
import { COLLECTIONS, collectionsFor, type Collection } from '../src/lib/collections';
import { FAQ, linkParts, plainAnswer } from '../src/lib/faq';

const dist = new URL('../dist/', import.meta.url);
const base = readFileSync(new URL('index.html', dist), 'utf8');
const LINKEDIN = 'https://www.linkedin.com/in/irinacsapo/';
const ORIGIN = SITE_URL.replace(/\/$/, '');
const TODAY = new Date().toISOString().slice(0, 10);

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const abs = (path: string) => (path.startsWith('http') ? path : `${ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`);

const now = Date.now();
const LIVE = LISTINGS.filter((l) => isLive(l, now)).sort((a, b) => closesAt(a) - closesAt(b));
const listingUrl = (l: Listing) => `${SITE_URL}listing/${l.id}`;
const collectionPath = (c: Collection) => `open-calls/${c.slug}`;

// ---- Small facts about a listing, in words -------------------------------------------------------

function where(l: Listing): string {
  if (l.format === 'Online') return l.region === 'Global' ? 'Online, open worldwide' : `Online (${l.country || l.region})`;
  const at = [l.venue, l.city, l.country].filter(Boolean).join(', ');
  return l.format === 'Hybrid' ? `${at}, and online` : at;
}
const when = (l: Listing) =>
  isOpportunity(l) && l.deadline ? `Deadline ${formatFull(l.deadline)}` : `${formatRange(l.start_date!, l.end_date)}`;
const fees = (l: Listing) => { const f = feeSummary(l); return [f.headline, f.selected].filter(Boolean).join('; '); };
/** One line: "Prize · Organiser · London, United Kingdom · Deadline 5 December 2026 · Free to enter; Pay if selected: £250" */
const oneLine = (l: Listing) => [l.type, l.organiser, where(l), when(l), fees(l)].join(' · ');

// ---- Structured data -----------------------------------------------------------------------------

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

const ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}icon-512.png`,
  email: CONTACT_EMAIL,
  description: 'A free, independent calendar of open calls, prizes, residencies, grants and events for artists worldwide, with every fee shown up front. Updated every morning.',
  founder: { '@type': 'Person', name: 'Irina Csapo', jobTitle: 'Designer and artist', url: LINKEDIN, sameAs: [LINKEDIN, 'https://irinacsapo.co.uk', 'https://www.instagram.com/irina_csapo_art'] },
};

const breadcrumbs = (trail: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [{ name: SITE_NAME, path: '/' }, ...trail].map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: abs(t.path) })),
});

const itemList = (list: Listing[]) => ({
  '@type': 'ItemList',
  numberOfItems: list.length,
  itemListElement: list.map((l, i) => ({ '@type': 'ListItem', position: i + 1, url: listingUrl(l), name: l.title })),
});

// ---- The page's text, as plain HTML ------------------------------------------------------------

const a = (href: string, text: string) => `<a href="${esc(href)}">${esc(text)}</a>`;
const listingItems = (list: Listing[]) =>
  `<ul>${list.map((l) => `<li>${a(`/listing/${l.id}`, l.title)}: ${esc(oneLine(l))}</li>`).join('')}</ul>`;
const browseLinks = () => (['Kinds', 'Disciplines', 'Places'] as const).map((g) =>
  `<h2>${g === 'Kinds' ? 'Browse by kind' : g === 'Disciplines' ? 'Browse by what you make' : 'Browse by place'}</h2>
  <ul>${COLLECTIONS.filter((c) => c.group === g).map((c) => `<li>${a(`/${collectionPath(c)}`, c.title)} (${LIVE.filter(c.match).length} open)</li>`).join('')}</ul>`).join('');
const nav = `<p>${a('/', 'All open calls')} · ${a('/open-calls', 'Browse')} · ${a('/faq', 'FAQ')} · ${a('/about', 'About')} · ${a('/submit', 'Submit an open call')}</p>`;
const footer = `<p>Magpie is a free, independent project by ${a('https://irinacsapo.co.uk', 'designer')} and ${a('https://www.instagram.com/irina_csapo_art', 'artist')} ${a(LINKEDIN, 'Irina Csapo')}. Contact: ${esc(CONTACT_EMAIL)}. Updated ${formatFull(TODAY)}.</p>`;

function listingBody(l: Listing) {
  const f = feeSummary(l);
  const opp = isOpportunity(l);
  const rows: [string, string][] = [
    ['Type', l.type],
    ['Organiser', l.organiser],
    ...(opp && l.deadline ? [['Deadline', formatFull(l.deadline)] as [string, string]] : []),
    ...(l.start_date ? [['Dates', formatRange(l.start_date, l.end_date)] as [string, string]] : []),
    ['Where', where(l)],
    ['Disciplines', l.disciplines.join(', ')],
    ['Who can apply', l.eligibility],
    [opp ? 'Cost to enter' : 'Cost', l.fee_details ?? f.headline],
    ...(opp ? [['If you’re selected', l.selected_fee === 'Yes' ? `Fee: ${l.selected_fee_details ?? 'yes'}` : l.selected_fee === 'None' ? 'Nothing more to pay the organiser' : 'Not stated by the organiser'] as [string, string]] : []),
    ...(l.commission ? [['Commission on sales', l.commission] as [string, string]] : []),
    ...(l.prizes.length ? [['What you get', l.prizes.join('; ')] as [string, string]] : []),
  ];
  return `${nav}
  <article>
    <h1>${esc(l.title)}</h1>
    <p>${esc(`${l.type} by ${l.organiser}. ${when(l)}. ${f.headline}${f.selected ? `; ${f.selected}` : ''}.`)}</p>
    ${l.commercial ? '<p><strong>Commercial opportunity:</strong> this organiser runs paid exhibitions, publications or awards as a business.</p>' : ''}
    <dl>${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    <p>${a(l.apply_url, opp ? 'Apply on the organiser’s site' : 'Register on the organiser’s site')} · Details checked on ${a(l.source, 'the organiser’s page')}, added ${formatFull(l.added)}.</p>
  </article>
  <h2>Browse more</h2>
  <ul>${collectionsFor(l).map((c) => `<li>${a(`/${collectionPath(c)}`, c.title)}</li>`).join('')}</ul>
  ${footer}`;
}

// ---- Writing a page -----------------------------------------------------------------------------

interface Meta { title: string; description: string; image?: string; data?: object[]; body?: string }

function page(path: string, meta: Meta) {
  const url = abs(path ? `/${path}` : '/');
  let html = base
    .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${esc(url)}"`)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${esc(meta.description)}"`)
    .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${esc(meta.title)}"`)
    .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${esc(meta.description)}"`)
    .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${esc(url)}"`);
  for (const d of meta.data ?? []) {
    html = html.replace('</head>', `    <script type="application/ld+json">${JSON.stringify(d).replace(/</g, '\\u003c')}</script>\n  </head>`);
  }
  if (meta.image) {
    html = html
      .replace(/<meta property="og:image" content="[^"]*"/, `<meta property="og:image" content="${esc(meta.image)}"`)
      .replace(/<meta property="og:image:alt" content="[^"]*"/, `<meta property="og:image:alt" content="${esc(meta.title)}"`);
  }
  if (meta.body) html = html.replace('<div id="root"></div>', `<div id="root"><div class="prerender">${meta.body.replace(/\n\s*/g, '')}</div></div>`);
  // the home page is index.html; the rest are <path>.html, not <path>/index.html: GitHub Pages serves /listing/<id>
  // straight from the .html file (status 200), where a folder would first redirect to /listing/<id>/
  const file = new URL(path ? `${path}.html` : 'index.html', dist);
  mkdirSync(new URL('.', file), { recursive: true });
  writeFileSync(file, html);
}

const T = (s: string) => `${s} · ${SITE_NAME}`;
const MONTH = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date());
const main = LIVE.filter((l) => !l.commercial);
const commercial = LIVE.filter((l) => l.commercial);
const week = main.filter((l) => closesAt(l) - now < 7 * 86_400_000);

// The fallback for unknown addresses: the bare app (it shows "This page flew off"), never indexed
writeFileSync(new URL('404.html', dist), base.replace('</head>', '    <meta name="robots" content="noindex" />\n  </head>'));

// Home
page('', {
  title: 'Magpie: open calls for artists, every fee up front',
  description: `${LIVE.length} open calls, prizes, residencies and events for artists worldwide, closing soonest first, with every entry fee and any fee if you’re selected shown up front. Free, updated daily.`,
  data: [ORGANIZATION, { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Open calls for artists', url: SITE_URL, mainEntity: itemList(main) }],
  body: `${nav}
    <h1>Open calls for artists, every fee up front</h1>
    <p>Magpie is a free calendar of open calls, prizes, residencies, grants and events for artists, photographers and musicians
    worldwide. Every listing shows what it costs to enter and anything you’d pay if you’re selected. ${LIVE.length} are open
    now, closing soonest first. Updated every morning.</p>
    ${week.length ? `<h2>Closing this week</h2>${listingItems(week)}` : ''}
    <h2>All open calls (${main.length})</h2>${listingItems(main)}
    ${commercial.length ? `<h2>Commercial opportunities</h2><p>Run as a business: you pay to enter or to be shown.</p>${listingItems(commercial)}` : ''}
    ${browseLinks()}
    <h2>Questions</h2><ul>${FAQ.map((f) => `<li>${a('/faq', f.q)}</li>`).join('')}</ul>
    ${footer}`,
});

page('about', {
  title: T('About'),
  description: 'Every open call, every fee, in one place. How Magpie finds open calls and labels their fees.',
  data: [ORGANIZATION, breadcrumbs([{ name: 'About', path: '/about' }])],
  body: `${nav}<h1>Every open call, every fee, in one place</h1>
    <p>Open calls are scattered across websites, newsletters and Instagram posts, and too many only mention the fees once you’ve
    filled in a long form. Magpie collects them, checks the costs, and puts them in one calendar, closing soonest first.</p>
    <h2>Free first</h2>
    <p>Calls that cost nothing to enter and nothing if you’re selected come first, from galleries, museums, charities,
    festivals, publishers and funders who show, pay or support artists. Organisers that sell exhibitions, book pages or awards
    to artists as a business are listed apart, under “Commercial opportunities”, with a price tag.</p>
    <h2>Never miss a deadline</h2>
    <p>A weekly email every Monday, a reminder email three days before any call closes, or every deadline in your calendar.</p>
    <h2>How we label fees</h2><ul>
    <li><strong>Free, no fees if selected:</strong> nothing to pay to enter, and nothing to pay if you’re chosen.</li>
    <li><strong>Free to enter, pay if selected:</strong> free to apply, but selected artists pay something (a hanging fee, an exhibition fee, a fee to “secure your space”). The amount is on the listing.</li>
    <li><strong>Paid entry:</strong> the cheapest way in, usually one work, in the organiser’s own currency.</li>
    <li><strong>Not stated:</strong> the organiser’s page doesn’t say.</li></ul>
    <h2>Where the listings come from</h2>
    <p>Every morning at 7:00 London time, artist opportunity sites, organisers and social posts are searched for new calls. Every
    deadline and fee is confirmed on the organiser’s own page, including their FAQ and terms, before it is added.</p>
    ${footer}`,
});

page('faq', {
  title: T('Questions about open calls for artists'),
  description: 'What an open call is, where to find free open calls, whether to pay entry fees, and how to spot pay-to-exhibit.',
  data: [{
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: plainAnswer(f) } })),
  }, breadcrumbs([{ name: 'FAQ', path: '/faq' }])],
  body: `${nav}<h1>Questions about open calls</h1>
    ${FAQ.map((f) => `<h2>${esc(f.q)}</h2>${f.a.map((p) => `<p>${linkParts(p).map((x) => ('href' in x ? a(x.href, x.text) : esc(x.text))).join('')}</p>`).join('')}`).join('')}
    ${footer}`,
});

page('submit', { title: T('Submit an open call'), description: 'Know an open call, prize, residency or event for artists that we are missing? Send it to Magpie. Free to list.', body: `${nav}<h1>Submit an open call</h1><p>Organisers and artists can send Magpie open calls, prizes, residencies and events. It’s free to list, and we check every deadline and fee before it goes live.</p>${footer}` });
page('subscribed', { title: T('You’re subscribed'), description: 'You’re on the Magpie weekly email: open calls for artists, every fee up front, every Monday.' });
page('privacy', { title: T('Privacy'), description: 'What Magpie collects (very little), and why.', body: `${nav}<h1>Your privacy</h1><p>Magpie collects as little as it can: no ads, no tracking cookies, and we never sell or share your details. Visits are counted with cookieless analytics. The weekly email is sent by Brevo.</p>${footer}` });
page('start', { title: T('What do you make?'), description: 'Pick your disciplines and see open calls for your work first.' });
page('subscribe', { title: T('Subscribe to deadlines'), description: 'Every open call deadline in your own calendar: Google Calendar, Apple Calendar or Outlook.', body: `${nav}<h1>Every deadline in your calendar</h1><p>Subscribe to ${a(`/${FEED_PATH}`, 'the Magpie deadlines calendar')} and every open call deadline appears in Google Calendar, Apple Calendar or Outlook, with new ones added automatically.</p>${footer}` });

// Browse: the hub and one page per collection
page('open-calls', {
  title: T('Browse open calls for artists by discipline and place'),
  description: 'Open calls, prizes, residencies, grants and events for artists, by kind, discipline and place. Every fee shown up front.',
  data: [breadcrumbs([{ name: 'Browse', path: '/open-calls' }])],
  body: `${nav}<h1>Open calls for artists, by kind, discipline and place</h1>${browseLinks()}${footer}`,
});
for (const c of COLLECTIONS) {
  const list = LIVE.filter(c.match);
  const free = list.filter((l) => l.entry_fee === 'Free').length;
  const ordinary = list.filter((l) => !l.commercial);
  const paid = list.filter((l) => l.commercial);
  page(collectionPath(c), {
    title: T(`${c.title}, ${MONTH}`),
    description: `${list.length} open now, ${free} free to enter. ${c.intro}`,
    data: [
      { '@context': 'https://schema.org', '@type': 'CollectionPage', name: c.h1, description: c.intro, url: abs(`/${collectionPath(c)}`), dateModified: TODAY, mainEntity: itemList(ordinary) },
      breadcrumbs([{ name: 'Browse', path: '/open-calls' }, { name: c.label, path: `/${collectionPath(c)}` }]),
    ],
    body: `${nav}<h1>${esc(c.h1)}</h1>
      <p>${esc(c.intro)} ${list.length} open now, ${free} of them free to enter. Updated ${formatFull(TODAY)}.</p>
      ${ordinary.length ? listingItems(ordinary) : '<p>Nothing open here right now. New calls are added every morning.</p>'}
      ${paid.length ? `<h2>Commercial opportunities</h2><p>Run as a business: you pay to enter or to be shown.</p>${listingItems(paid)}` : ''}
      ${browseLinks()}${footer}`,
  });
}

// One page per listing
for (const l of LISTINGS) {
  const fee = feeSummary(l);
  const bits = [when(l), [fee.headline, fee.selected].filter(Boolean).join(', '), l.prizes[0]].filter(Boolean);
  const top = collectionsFor(l)[0];
  page(`listing/${l.id}`, {
    title: T(l.title),
    description: `${bits.join(' · ')}. ${l.organiser}.`,
    // the 1200×630 card drawn by scripts/build-og.ts (title, deadline, fees and the organiser's image)
    image: `${SITE_URL}og/${l.id}.jpg`,
    data: [
      ...(isOpportunity(l) || l.entry_fee === 'Unknown' ? [] : [eventData(l)]),
      breadcrumbs([...(top ? [{ name: top.title, path: `/${collectionPath(top)}` }] : []), { name: l.title, path: `/listing/${l.id}` }]),
    ],
    body: listingBody(l),
  });
}
console.log(`✓ wrote ${LISTINGS.length + COLLECTIONS.length + 10} page files`);

// ---- sitemap.xml: every page; closed listings are left out (their pages stay up). Thin browse pages too. ----
const urls = [
  { loc: SITE_URL, priority: '1.0', freq: 'daily', lastmod: TODAY },
  { loc: `${SITE_URL}open-calls`, priority: '0.9', freq: 'daily', lastmod: TODAY },
  ...COLLECTIONS.filter((c) => LIVE.filter(c.match).length >= 2).map((c) => ({ loc: abs(`/${collectionPath(c)}`), priority: '0.8', freq: 'daily', lastmod: TODAY })),
  { loc: `${SITE_URL}faq`, priority: '0.7', freq: 'monthly' },
  ...['about', 'submit', 'subscribe', 'privacy'].map((p) => ({ loc: `${SITE_URL}${p}`, priority: '0.5', freq: 'monthly' })),
  ...LIVE.map((l) => ({ loc: listingUrl(l), priority: '0.8', freq: 'weekly', lastmod: l.added })),
];
writeFileSync(new URL('sitemap.xml', dist), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(u.loc)}</loc>${'lastmod' in u && u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<changefreq>${u.freq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`);
console.log(`✓ wrote dist/sitemap.xml (${urls.length} pages)`);

// ---- llms.txt (https://llmstxt.org): a plain guide for AI tools, and llms-full.txt with every detail ----
const md = (s: string) => s.replace(/[[\]]/g, '');
const intro = `# ${SITE_NAME}

> Magpie (magpie.cool) is a free, independent calendar of open calls, prizes, residencies, grants and events for artists, photographers and musicians worldwide. Every listing shows the entry fee and any fee charged if you're selected. Updated every morning; ${LIVE.length} listings open on ${formatFull(TODAY)}.

Every deadline and fee is checked on the organiser's own page before a listing is added. Fee labels: "Free, no fees if selected" (nothing to pay at all); "Free to enter, pay if selected" (a hanging, exhibition or participation fee if chosen); paid entry (the cheapest way in, in the organiser's currency); "not stated" (the organiser doesn't say). Organisers that sell exhibitions, publications or awards to artists as a business are listed separately as "Commercial opportunities". Made by designer and artist Irina Csapo (${LINKEDIN}). Contact: ${CONTACT_EMAIL}.
`;
const llms = `${intro}
## Browse open calls

${COLLECTIONS.map((c) => `- [${c.h1}](${abs(`/${collectionPath(c)}`)}): ${LIVE.filter(c.match).length} open now`).join('\n')}

## Open now, closing soonest first

${main.map((l) => `- [${md(l.title)}](${listingUrl(l)}): ${oneLine(l)}`).join('\n')}

## Questions

${FAQ.map((f) => `- [${f.q}](${SITE_URL}faq)`).join('\n')}

## Optional

- [Every open listing in full](${SITE_URL}llms-full.txt): eligibility, all fees, prizes and links
- [Open listings as JSON](${SITE_URL}open-calls.json)
- [Deadlines calendar feed](${SITE_URL}${FEED_PATH}): subscribe in Google Calendar, Apple Calendar or Outlook
- [About Magpie and how fees are labelled](${SITE_URL}about)
- [Submit an open call](${SITE_URL}submit)
`;
writeFileSync(new URL('llms.txt', dist), llms);

const full = `${intro}
## Open listings (${LIVE.length}), closing soonest first

${LIVE.map((l) => {
  const f = feeSummary(l);
  return [
    `### ${l.title}`,
    '',
    `- Page: ${listingUrl(l)}`,
    `- Type: ${l.type}${l.commercial ? ' (commercial opportunity)' : ''}`,
    `- Organiser: ${l.organiser}`,
    ...(l.deadline ? [`- Deadline: ${formatFull(l.deadline)} (${l.deadline})`] : []),
    ...(l.start_date ? [`- Dates: ${formatRange(l.start_date, l.end_date)}`] : []),
    `- Where: ${where(l)}`,
    `- Disciplines: ${l.disciplines.join(', ')}`,
    `- Who can apply: ${l.eligibility}`,
    `- Cost to enter: ${l.fee_details ?? f.headline}`,
    ...(isOpportunity(l) ? [`- If selected: ${l.selected_fee === 'Yes' ? l.selected_fee_details ?? 'a fee' : l.selected_fee === 'None' ? 'nothing more to pay the organiser' : 'not stated'}`] : []),
    ...(l.commission ? [`- Commission on sales: ${l.commission}`] : []),
    ...(l.prizes.length ? [`- What you get: ${l.prizes.join('; ')}`] : []),
    `- Apply: ${l.apply_url}`,
    `- Source: ${l.source}`,
  ].join('\n');
}).join('\n\n')}

## Questions about open calls

${FAQ.map((f) => `### ${f.q}\n\n${plainAnswer(f)}`).join('\n\n')}
`;
writeFileSync(new URL('llms-full.txt', dist), full);
console.log(`✓ wrote dist/llms.txt (${Math.round(llms.length / 1024)} KB) and llms-full.txt (${Math.round(full.length / 1024)} KB)`);

// ---- open-calls.json: the open listings, for anyone building on them ----
writeFileSync(new URL('open-calls.json', dist), JSON.stringify({
  name: `${SITE_NAME}: open calls for artists`,
  url: SITE_URL,
  updated: TODAY,
  licence: 'Facts may be reused with a link to magpie.cool. Check fees and deadlines with the organiser before applying.',
  listings: LIVE.map(({ lat: _lat, lng: _lng, ...l }) => ({ ...l, url: listingUrl(l as Listing) })),
}, null, 1));
console.log('✓ wrote dist/open-calls.json');
