// The weekly Magpie email, sent through Brevo by .github/workflows/weekly-email.yml (adapted from BuilderBee):
// near you (per subscriber's place), closing this week, new on Magpie, events coming up, and free calls with no fees
// if selected. Commercial operators are left out.
//
//   npx tsx scripts/weekly-email.ts --preview [file]   writes the email to a file (default email-preview/weekly.html)
//   npx tsx scripts/weekly-email.ts                     creates it in Brevo as a DRAFT campaign and sends a test to
//                                                       BREVO_TEST_EMAILS: you check it and press send in Brevo
//   npx tsx scripts/weekly-email.ts --send              creates it and sends it to the whole list straight away
//
// Needs BREVO_API_KEY (secret) and BREVO_LIST_ID (variable); BREVO_TEST_EMAILS (variable) for the test.
import { mkdirSync, writeFileSync } from 'node:fs';
import { closesAt, isOpportunity } from '../src/lib/dates';
import type { Listing } from '../src/types/listing';
import { SAMPLE_SPONSOR, sponsorOn, type Sponsor } from '../src/lib/sponsors';
import {
  COFFEE_NOTE, MUTED, SANS, esc, OPEN, SENDER, SITE, FOOTER, SUBMIT_BOX, button, byPlace, card, eyebrow, h2, layout, nearPlace, p, track, type Place,
} from './email-parts';

const DAY = 86_400_000;
const now = Date.now();
const today = new Date().toISOString().slice(0, 10);
const C = `weekly-${today}`;
const args = process.argv.slice(2);

// ---- Which listings (each appears once, in the first section it fits) ----
const shown = new Set<string>();
const take = (list: Listing[], max: number) => {
  const out = list.filter((l) => !shown.has(l.id)).slice(0, max);
  out.forEach((l) => shown.add(l.id));
  return out;
};
const closing = take(OPEN.filter((l) => isOpportunity(l) && closesAt(l) - now < 7 * DAY), 6);
const fresh = take(OPEN.filter((l) => now - Date.parse(`${l.added}T00:00:00Z`) < 7 * DAY), 6);
const events = take(OPEN.filter((l) => !isOpportunity(l) && closesAt(l) - now < 21 * DAY), 4);
const free = take(OPEN.filter((l) => isOpportunity(l) && l.entry_fee === 'Free' && l.selected_fee === 'None' && closesAt(l) - now < 60 * DAY), 4);

const section = (badge: string, title: string, list: Listing[], note = '') => list.length
  ? `<tr><td class="mp-pad" style="padding:22px 32px 4px">${badge}${h2(title)}${note ? p(note, `font-size:15px;color:${MUTED}`) : ''}${list.map((l) => card(l, C)).join('')}</td></tr>`
  : '';
const near = byPlace((pl: Place) => {
  const list = nearPlace(pl, 4);
  return list.length >= 2 ? `<tr><td class="mp-pad" style="padding:22px 32px 4px">${eyebrow(`Near you · ${pl}`)}${h2('Open calls near you')}${list.map((l) => card(l, C)).join('')}</td></tr>` : '';
}, '');

// This week's sponsored feature (magpie.cool/sponsor), clearly labelled, after the first section
const sponsor = process.argv.includes('--sponsor-preview') ? SAMPLE_SPONSOR : sponsorOn(today);
const sponsored = (s: Sponsor) => `<tr><td class="mp-pad" style="padding:22px 32px 4px">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e2da;border-radius:16px;background:#ffffff">
    ${s.image ? `<tr><td><a href="${esc(s.url)}"><img src="${esc(s.image)}" width="100%" alt="" style="display:block;width:100%;max-height:260px;object-fit:cover;border-radius:16px 16px 0 0;border:0"></a></td></tr>` : ''}
    <tr><td style="padding:18px 20px 12px">
      <div style="margin:0 0 8px;font:700 12px/1.4 ${SANS};letter-spacing:0.06em;text-transform:uppercase;color:${MUTED}">Sponsored · ${esc(s.name)}</div>
      ${h2(esc(s.title))}
      ${p(esc(s.blurb))}
      ${button(esc(s.url), `Visit ${s.name}`, false)}
      <div style="margin-top:6px;font:400 13px/1.4 ${SANS};color:${MUTED}">Sponsored features are paid and kept apart from the listings. <a href="${track(`${SITE}/sponsor`, C)}" style="color:${MUTED}">What’s this?</a></div>
    </td></tr>
  </table>
</td></tr>`;
const sponsorBlock = sponsor ? sponsored(sponsor) : '';

const total = closing.length + fresh.length + events.length + free.length;
const bits = [fresh.length && `${fresh.length} new`, closing.length && `${closing.length} closing this week`].filter(Boolean);
const subject = `Magpie weekly: ${bits.length ? bits.join(', ') : 'open calls for artists'}`;

const html = layout(
  subject,
  'Open calls, prizes, residencies and events for artists this week, with every fee up front.',
  `<tr><td class="mp-pad" style="padding:28px 32px 4px">
    ${p('Hello! Here’s this week’s roundup from Magpie: open calls, prizes, residencies and events for artists, with every fee shown up front.')}
  </td></tr>
  ${near}
  ${section(eyebrow('Closing this week', '#fde2c2', '#6e3300'), 'Last chance', closing, 'Deadlines are at the end of the day in the organiser’s time zone.')}
  ${sponsorBlock}
  ${section(eyebrow('New on Magpie'), 'Just added', fresh)}
  ${section(eyebrow('Events', '#efe8f6', '#3f2f57'), 'Coming up', events)}
  ${section(eyebrow('Free', '#d4f7ee', '#0b4f42'), 'Free to enter, no fees if selected', free)}
  <tr><td class="mp-pad" style="padding:10px 32px 0">${button(track(`${SITE}/`, C), `See all ${OPEN.length} open calls`)}</td></tr>
  ${SUBMIT_BOX(C)}
  ${COFFEE_NOTE(C)}`,
  FOOTER('You’re getting this because you signed up for the Magpie weekly email. Fees and dates come from the organisers’ pages and can change, so always check before you pay.'),
  ` <a href="{{ unsubscribe }}" style="color:${MUTED}">Unsubscribe</a>`,
);

if (args.includes('--preview')) {
  const file = args[args.indexOf('--preview') + 1] && !args[args.indexOf('--preview') + 1].startsWith('--') ? args[args.indexOf('--preview') + 1] : 'email-preview/weekly.html';
  mkdirSync(new URL('../email-preview/', import.meta.url), { recursive: true });
  // show the UK "near you" branch, as one subscriber would see it
  writeFileSync(file, html.replace(/\{% if contact\.PLACE[\s\S]*?\{% endif %\}/, (m) => (m.match(/\{% if contact\.PLACE == "UK" %\}([\s\S]*?)\{% (?:elif|else)/)?.[1] ?? '')));
  console.log(`Subject: ${subject}\nWrote ${file}`);
  process.exit(0);
}

if (total === 0) { console.log('Nothing to send this week.'); process.exit(0); }

const key = process.env.BREVO_API_KEY;
const listId = Number((process.env.BREVO_LIST_ID ?? '').replace(/\D/g, ''));   // "#2" or "2"
if (!key || !listId) { console.error('BREVO_API_KEY and BREVO_LIST_ID must be set.'); process.exit(1); }

async function brevo(path: string, body: unknown) {
  const res = await fetch(`https://api.brevo.com/v3${path}`, {
    method: 'POST',
    headers: { 'api-key': key!, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Brevo ${path} failed (${res.status}): ${text}`);
  return text ? JSON.parse(text) : {};
}

// GitHub sometimes runs scheduled jobs hours late, so the workflow also has a backup run. Only one email a week:
// if today's campaign already exists in Brevo (draft or sent), stop.
const recent = await fetch('https://api.brevo.com/v3/emailCampaigns?limit=50&sort=desc', {
  headers: { 'api-key': key!, accept: 'application/json' },
}).then((r) => (r.ok ? r.json() : { campaigns: [] })) as { campaigns?: { id: number; name: string; status: string }[] };
const already = (recent.campaigns ?? []).find((c) => c.name === `Magpie weekly ${today}`);
// "send" with today's draft already made (the usual Monday): send that draft, the one you checked.
if (already && already.status === 'draft' && args.includes('--send') && !args.includes('--force')) {
  await brevo(`/emailCampaigns/${already.id}/sendNow`, {});
  console.log(`Sent this week's draft to list ${listId} (campaign ${already.id}).`);
  process.exit(0);
}
if (already && !args.includes('--force')) {
  console.log(`This week's email already exists in Brevo (${already.status}), so nothing to do.`);
  process.exit(0);
}

const campaign = await brevo('/emailCampaigns', {
  name: `Magpie weekly ${today}`, subject, sender: SENDER, replyTo: SENDER.email, htmlContent: html, recipients: { listIds: [listId] },
});

if (args.includes('--send')) {
  await brevo(`/emailCampaigns/${campaign.id}/sendNow`, {});
  console.log(`Sent to list ${listId} (campaign ${campaign.id}).`);
} else {
  const emailTo = (process.env.BREVO_TEST_EMAILS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (emailTo.length) await brevo(`/emailCampaigns/${campaign.id}/sendTest`, { emailTo });
  console.log(`Saved as a draft (campaign ${campaign.id})${emailTo.length ? ' and sent a test to the test addresses' : ''}. Open Brevo → Campaigns to check it and press send.`);
}
