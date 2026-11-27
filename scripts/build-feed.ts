// Runs after `vite build`: writes dist/deadlines.ics, a calendar people can subscribe to
// (Google Calendar → "From URL", Apple Calendar → File → New Calendar Subscription).
// It holds every listing that's still open, so new deadlines show up in their calendar by themselves.
import { mkdirSync, writeFileSync } from 'node:fs';
import { LISTINGS } from '../src/lib/listings';
import { isLive } from '../src/lib/dates';
import { buildIcs } from '../src/lib/ics';
import { FEED_PATH, SITE_NAME, SITE_URL } from '../src/lib/site';

const live = LISTINGS.filter((l) => isLive(l));
const ics = buildIcs(live.map((listing) => ({ listing, pageUrl: `${SITE_URL}listing/${listing.id}` })), `${SITE_NAME}: deadlines`);
writeFileSync(new URL(`../dist/${FEED_PATH}`, import.meta.url), ics);
console.log(`✓ wrote dist/${FEED_PATH} (${live.length} listings)`);

// One small calendar file per listing, at magpie.cool/cal/<id>.ics, for the "Apple" button. A real file on the site
// (served as text/calendar) opens straight in the Calendar app on iPhone, where a downloaded one lands in Files.
mkdirSync(new URL('../dist/cal/', import.meta.url), { recursive: true });
for (const listing of live) {
  writeFileSync(new URL(`../dist/cal/${listing.id}.ics`, import.meta.url),
    buildIcs([{ listing, pageUrl: `${SITE_URL}listing/${listing.id}` }], undefined, true));
}
console.log(`✓ wrote dist/cal/<id>.ics (${live.length} files)`);
