// Runs after `vite build`: writes a real HTML file for every page, so magpie.cool/about and
// magpie.cool/listing/<id> are served as normal pages (status 200) rather than through 404.html.
// That matters for search engines and for link previews (WhatsApp, LinkedIn, Slack…), and lets each
// listing have its own preview: its title, deadline and fee, and its image when it has one.
// dist/404.html stays as the fallback for anything else.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { LISTINGS } from '../src/lib/listings';
import { formatFull, isOpportunity } from '../src/lib/dates';
import { feeSummary } from '../src/lib/money';
import { SITE_NAME, SITE_URL } from '../src/lib/site';

const dist = new URL('../dist/', import.meta.url);
const base = readFileSync(new URL('index.html', dist), 'utf8');

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function page(path: string, meta?: { title: string; description: string; image?: string }) {
  let html = base;
  if (meta) {
    const url = `${SITE_URL}${path}`;
    html = html
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`)
      .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${esc(meta.description)}"`)
      .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${esc(meta.title)}"`)
      .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${esc(meta.description)}"`)
      .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${esc(url)}"`);
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
  });
}
console.log(`✓ wrote ${LISTINGS.length + 4} page files`);
