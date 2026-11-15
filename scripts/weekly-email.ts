// The weekly roundup email: new listings, what closes in the next 7 days, upcoming events, and free calls.
//
//   npx tsx scripts/weekly-email.ts           print the email (markdown) to check it
//   npx tsx scripts/weekly-email.ts --draft   also save it as a DRAFT in Buttondown (needs BUTTONDOWN_API_KEY)
//
// Run every Monday by .github/workflows/weekly-email.yml. It only ever creates a draft: open Buttondown,
// read it, and press send. (Buttondown's API sends straight away unless the status is "draft".)
import { LISTINGS } from '../src/lib/listings';
import { closesAt, formatFull, formatRange, isLive, isOpportunity } from '../src/lib/dates';
import { feeSummary } from '../src/lib/money';
import { place } from '../src/components/ListingCard';
import { SITE_URL } from '../src/lib/site';
import type { Listing } from '../src/types/listing';

const DAY = 86_400_000;
const now = Date.now();
const live = LISTINGS.filter((l) => isLive(l, now));
const soonest = (a: Listing, b: Listing) => closesAt(a) - closesAt(b);
const shown = new Set<string>();
const take = (list: Listing[], max: number) => {
  const out = list.filter((l) => !shown.has(l.id)).slice(0, max);
  out.forEach((l) => shown.add(l.id));
  return out;
};

// Closing soonest first in every section; a listing appears only once (in the first section it fits).
const closingThisWeek = take(live.filter((l) => isOpportunity(l) && closesAt(l) - now < 7 * DAY).sort(soonest), 15);
const fresh = take(live.filter((l) => now - Date.parse(`${l.added}T00:00:00Z`) < 7 * DAY).sort(soonest), 15);
const events = take(live.filter((l) => !isOpportunity(l) && closesAt(l) - now < 21 * DAY).sort(soonest), 8);
const free = take(
  live.filter((l) => isOpportunity(l) && l.entry_fee === 'Free' && l.selected_fee === 'None' && closesAt(l) - now < 60 * DAY).sort(soonest),
  8,
);

const link = (l: Listing) => `${SITE_URL}listing/${l.id}?utm_source=magpie-weekly&utm_medium=email`;

function item(l: Listing) {
  const fee = feeSummary(l);
  const when = isOpportunity(l) ? `Deadline ${formatFull(l.deadline!)}` : formatRange(l.start_date!, l.end_date);
  const money = [fee.headline, fee.selected].filter(Boolean).join(' · ');
  const prize = l.prizes[0] ? ` · ${l.prizes[0]}` : '';
  return `**[${l.title}](${link(l)})**  \n${l.organiser} · ${place(l)}  \n${when} · ${money}${prize}`;
}

function section(title: string, list: Listing[], note?: string) {
  if (!list.length) return '';
  return `## ${title}\n\n${note ? `${note}\n\n` : ''}${list.map(item).join('\n\n')}\n\n`;
}

const total = closingThisWeek.length + fresh.length + events.length + free.length;
const bits = [
  fresh.length && `${fresh.length} new`,
  closingThisWeek.length && `${closingThisWeek.length} closing this week`,
].filter(Boolean);
const subject = `Magpie weekly: ${bits.length ? bits.join(', ') : 'open calls for artists'}`;

const body = `Hello! Here's this week's roundup from [Magpie](${SITE_URL}?utm_source=magpie-weekly&utm_medium=email): open calls, prizes, residencies and events for artists, with every fee up front.

${section('Closing this week', closingThisWeek, "Last chance. Deadlines are at the end of the day in the organiser's time zone.")}${section('New on Magpie', fresh)}${section('Events coming up', events)}${section('Free to enter, no fees if selected', free)}---

Fees and dates come from the organisers' own pages and can change, so always check before you pay. Know an open call we're missing? [Send it to us](${SITE_URL}submit?utm_source=magpie-weekly&utm_medium=email).
`;

console.log(`Subject: ${subject}\n\n${body}`);

if (process.argv.includes('--draft')) {
  if (total === 0) {
    console.log('Nothing to send this week, so no draft was made.');
  } else {
    const key = process.env.BUTTONDOWN_API_KEY;
    if (!key) throw new Error('BUTTONDOWN_API_KEY is not set');
    const res = await fetch('https://api.buttondown.com/v1/emails', {
      method: 'POST',
      headers: { Authorization: `Token ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body, status: 'draft' }),
    });
    if (!res.ok) throw new Error(`Buttondown said ${res.status}: ${await res.text()}`);
    console.log('✓ Saved as a draft in Buttondown. Open it there, check it, and press send.');
  }
}
