// Runs after `vite build`: writes dist/deadlines.ics, a calendar people can subscribe to
// (Google Calendar → "From URL", Apple Calendar → File → New Calendar Subscription).
// It holds every listing that's still open, so new deadlines show up in their calendar by themselves.
import { writeFileSync } from 'node:fs';
import { LISTINGS } from '../src/lib/listings';
import { isLive } from '../src/lib/dates';
import { buildIcs } from '../src/lib/ics';
import { FEED_PATH, SITE_NAME, SITE_URL } from '../src/lib/site';

const live = LISTINGS.filter((l) => isLive(l));
const ics = buildIcs(live.map((listing) => ({ listing, pageUrl: `${SITE_URL}#/listing/${listing.id}` })), `${SITE_NAME}: deadlines`);
writeFileSync(new URL(`../dist/${FEED_PATH}`, import.meta.url), ics);
console.log(`✓ wrote dist/${FEED_PATH} (${live.length} listings)`);
