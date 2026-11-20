// Deadline reminders: "Email me before it closes" on a listing sends the address and the listing's id (REMIND) to
// Magpie's Brevo reminders form. This script, run every 20 minutes by .github/workflows/reminders.yml:
//
//  1. moves each contact's REMIND into their REMINDERS list ("id1,id2"), so asking about a second call keeps the first
//  2. from 8:00 London time, emails anyone whose saved calls close within three days (one email, all of those calls)
//     and takes those calls off their list
//
// Calls that have closed or vanished are dropped quietly. Emails are never printed: the Actions logs are public.
//
//   npx tsx scripts/reminders.ts --preview   writes email-preview/reminder.html for the next call that closes
//   npx tsx scripts/reminders.ts             does the work (needs BREVO_API_KEY and BREVO_REMINDERS_LIST_ID)
import { mkdirSync, writeFileSync } from 'node:fs';
import { LISTINGS } from '../src/lib/listings';
import { closesAt, formatFull, isLive } from '../src/lib/dates';
import type { Listing } from '../src/types/listing';
import { MUTED, OPEN, SENDER, SITE, FOOTER, button, card, eyebrow, h1, layout, p, track } from './email-parts';

const DAY = 86_400_000;
const DAYS_BEFORE = 3;
const now = Date.now();
const C = 'reminder';

// ---- The email ----
const daysLeft = (l: Listing) => {
  const n = Math.max(1, Math.ceil((closesAt(l) - now) / DAY));
  return n === 1 ? 'Last day' : `${['', '', 'Two', 'Three', 'Four'][n] ?? n} days left`;
};
function reminderEmail(calls: Listing[]) {
  const one = calls.length === 1;
  const subject = one ? `${daysLeft(calls[0])}: ${calls[0].title}` : `${calls.length} calls you saved close soon`;
  const html = layout(
    subject,
    one ? `The deadline is ${formatFull(calls[0].deadline!)}.` : 'The deadlines are coming up. Here they are, closing soonest first.',
    `<tr><td class="mp-pad" style="padding:28px 32px 8px">
      ${eyebrow('Your reminder', '#fde2c2', '#6e3300')}
      ${h1(one ? daysLeft(calls[0]) : 'Closing soon')}
      ${p(one
        ? `You asked us to remind you about this call. Applications close at the end of <strong>${formatFull(calls[0].deadline!)}</strong>, in the organiser’s time zone.`
        : 'You asked us to remind you about these calls. Applications close at the end of the day shown, in the organiser’s time zone.')}
      ${calls.map((l) => card(l, C)).join('')}
      ${one ? `<p style="margin:8px 0 0">${button(track(calls[0].apply_url, C), 'Apply now')}</p>` : ''}
      ${p('Fees and dates come from the organiser’s page and can change, so check before you pay.', `font-size:14px;color:${MUTED};margin-top:16px`)}
    </td></tr>
    <tr><td class="mp-pad" style="padding:8px 32px 28px">
      ${p(`Want more like this? The <strong>Magpie weekly email</strong> lands every Monday with the calls closing that week, new calls, and calls near you. <a href="${track(`${SITE}/`, C)}#hero-email" style="color:#1f3456;font-weight:700">Sign up on magpie.cool</a>.`, 'font-size:15px')}
    </td></tr>`,
    FOOTER('You’re getting this because you asked for a reminder on magpie.cool. It’s a one-off: we won’t email you about this call again. Didn’t ask for it? Reply and we’ll remove your address.'),
  );
  return { subject, html };
}

if (process.argv.includes('--preview')) {
  const sample = OPEN.filter((l) => l.deadline).slice(0, 1);
  mkdirSync(new URL('../email-preview/', import.meta.url), { recursive: true });
  writeFileSync(new URL('../email-preview/reminder.html', import.meta.url), reminderEmail(sample).html);
  writeFileSync(new URL('../email-preview/reminder-several.html', import.meta.url), reminderEmail(OPEN.filter((l) => l.deadline).slice(0, 3)).html);
  console.log('Wrote email-preview/reminder.html and reminder-several.html');
  process.exit(0);
}

// ---- Brevo ----
const key = process.env.BREVO_API_KEY;
const listId = Number((process.env.BREVO_REMINDERS_LIST_ID ?? '').replace(/\D/g, ''));   // "#4" or "4"
if (!key || !listId) { console.error('BREVO_API_KEY and BREVO_REMINDERS_LIST_ID must be set.'); process.exit(1); }

async function brevo(method: string, path: string, body?: unknown) {
  const res = await fetch(`https://api.brevo.com/v3${path}`, {
    method,
    headers: { 'api-key': key!, 'content-type': 'application/json', accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Brevo ${method} ${path.replace(/contacts\/[^/?]+@[^/?]+/, 'contacts/…')} failed (${res.status}): ${text.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '…')}`);
  return text ? JSON.parse(text) : {};
}

// The two contact attributes, made the first time
const attributes: { name: string }[] = (await brevo('GET', '/contacts/attributes')).attributes ?? [];
for (const name of ['REMIND', 'REMINDERS']) {
  if (!attributes.some((x) => x.name === name)) {
    await brevo('POST', `/contacts/attributes/normal/${name}`, { type: 'text' });
    console.log(`Created the ${name} contact attribute`);
  }
}

// Everyone on the reminders list
type Contact = { email: string; attributes?: Record<string, unknown> };
const contacts: Contact[] = [];
for (let offset = 0; ; offset += 500) {
  const page = await brevo('GET', `/contacts/lists/${listId}/contacts?limit=500&offset=${offset}`);
  contacts.push(...(page.contacts ?? []));
  if (!page.contacts?.length || contacts.length >= (page.count ?? 0)) break;
}

const byId = new Map(LISTINGS.map((l) => [l.id, l]));
const londonHour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Europe/London' }).format(now));
const sendingTime = londonHour >= 8 && londonHour < 22;
let saved = 0, sent = 0, failed = 0;

for (const c of contacts) {
  const latest = String(c.attributes?.REMIND ?? '').trim();
  const before = String(c.attributes?.REMINDERS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const ids = [...new Set([...before, ...(latest ? [latest] : [])])]
    .filter((id) => { const l = byId.get(id); return l && l.deadline && isLive(l, now); });   // closed or unknown: drop
  const due = sendingTime ? ids.map((id) => byId.get(id)!).filter((l) => closesAt(l) - now <= DAYS_BEFORE * DAY) : [];
  if (latest && ids.includes(latest)) saved++;

  if (due.length) {
    const { subject, html } = reminderEmail(due.sort((a, b) => closesAt(a) - closesAt(b)));
    try {
      await brevo('POST', '/smtp/email', { sender: SENDER, replyTo: { email: SENDER.email }, to: [{ email: c.email }], subject, htmlContent: html, tags: ['reminder'] });
      sent++;
    } catch (e) {
      failed++;
      console.error(String(e));
      continue;   // keep their list as it was, so the next run tries again
    }
  }
  const remaining = ids.filter((id) => !due.some((l) => l.id === id));
  if (latest || remaining.join(',') !== before.join(',')) {
    await brevo('PUT', `/contacts/${encodeURIComponent(c.email)}`, { attributes: { REMIND: '', REMINDERS: remaining.join(',') } });
  }
}

console.log(`${contacts.length} people on the reminders list · ${saved} new reminders saved · ${sent} reminder emails sent${failed ? ` · ${failed} failed` : ''}${sendingTime ? '' : ' (outside sending hours)'}`);
if (failed) process.exit(1);
