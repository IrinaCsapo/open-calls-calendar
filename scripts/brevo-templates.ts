// The two emails Brevo sends when someone signs up for Magpie's weekly email (adapted from BuilderBee):
//
//   1. "Confirm" (double opt-in): sent straight after signing up, with the confirm button
//   2. "Welcome": sent once they've confirmed (Brevo calls it the "final confirmation email"). It shows open calls
//      near the subscriber's place (contact.PLACE, sent by the sign-up box), or what's closing soon.
//
//   npx tsx scripts/brevo-templates.ts --preview   writes email-preview/confirm.html and welcome-<place>.html
//   npx tsx scripts/brevo-templates.ts             creates or updates both templates in Brevo
//   npx tsx scripts/brevo-templates.ts --send-test also sends the welcome email to the first BREVO_TEST_EMAILS address
//
// The welcome email lists current calls, so .github/workflows/brevo-templates.yml re-uploads it every morning.
// Setup in Brevo (once): see docs/brevo-setup.md. Needs BREVO_API_KEY (a GitHub secret).
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  INK, MUTED, OPEN, PLACES, SANS, SENDER, SITE, FOOTER, SUBMIT_BOX, button, byPlace, card, closingSoon, eyebrow, h1, h2,
  layout, nearPlace, p, track, what, type Place,
} from './email-parts';

// ---- 1. Confirm. Brevo replaces {{ doubleoptin }} with the confirm link. ----
const CONFIRM = {
  name: 'Magpie: confirm the weekly email',
  subject: 'Confirm your Magpie weekly email',
  html: layout(
    'Confirm your Magpie weekly email',
    'One click and you’re in: open calls for artists, every fee up front, every Monday.',
    `<tr><td class="mp-pad" style="padding:28px 32px 12px">
      ${h1('One click and you’re in')}
      ${p('You asked for the <strong>Magpie weekly email</strong>: open calls, prizes, residencies and events for artists, with every fee shown up front, every Monday morning.')}
      ${p('Please confirm it’s really you:')}
      ${button('{{ doubleoptin }}', 'Yes, send me the weekly email')}
    </td></tr>
    <tr><td class="mp-pad" style="padding:8px 32px 28px">
      ${p('Didn’t sign up? Just ignore this email and you won’t hear from us.', `font-size:15px;color:${MUTED}`)}
    </td></tr>`,
    `You’re getting this because someone entered this address at <a href="${SITE}/" style="color:${MUTED}">magpie.cool</a>. We never sell your data or give it to anyone else. <a href="${SITE}/privacy" style="color:${MUTED}">Privacy policy</a>`,
  ),
};

// ---- 2. Welcome ----
const C = 'welcome';
const cards = (list: typeof OPEN) => list.map((l) => card(l, C)).join('');
const soon = closingSoon(5);
const fallback = soon.length
  ? `${eyebrow('Closing soon', '#fde2c2', '#6e3300')}${h2('Don’t miss these')}${cards(soon)}`
  : '';
const nearBlock = (pl: Place) => {
  const near = nearPlace(pl, 5);
  if (near.length < 2) return '';   // too few to be useful: they get "closing soon" instead
  return `${eyebrow(`Near you · ${pl}`)}${h2('Open calls near you')}${cards(near)}`;
};
const picks = byPlace(nearBlock, fallback);

const WELCOME = {
  name: 'Magpie: welcome to the weekly email',
  subject: 'Welcome to Magpie',
  html: layout(
    'Welcome to Magpie',
    'You’re subscribed. Here’s what lands in your inbox every Monday, and a few calls to start with.',
    `<tr><td class="mp-pad" style="padding:28px 32px 8px">
      ${h1('You’re subscribed!')}
      ${p('Thanks for joining the <strong>Magpie weekly email</strong>. Every Monday morning you’ll get one short email with:')}
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        ${what('#fde2c2', 'Closing this week', 'Last chances: calls whose deadline is in the next seven days.')}
        ${what('#d4f7ee', 'New on Magpie', 'Every open call, prize, residency and event added in the last week.')}
        ${what('#efe8f6', 'Near you and free to enter', 'Calls in your part of the world, and ones that cost nothing to enter or if you’re selected.')}
      </table>
      ${p('Every fee is shown up front: the entry fee, and anything you’d pay if you’re selected.', `font-size:15px;color:${MUTED};margin-top:6px`)}
    </td></tr>
    ${picks ? `<tr><td class="mp-pad" style="padding:18px 32px 4px">
      ${picks}
      <p style="margin:4px 0 0">${button(track(`${SITE}/`, C), `See all ${OPEN.length} open calls`)}${button(track(`${SITE}/start`, C), 'Pick what you make', false)}</p>
    </td></tr>` : ''}
    ${SUBMIT_BOX(C)}`,
    FOOTER('You’re getting this because you signed up at magpie.cool. Every weekly email has an unsubscribe link.'),
  ),
};

const TEMPLATES = [{ ...CONFIRM, tag: 'optin' }, { ...WELCOME, tag: 'welcome' }];

if (process.argv.includes('--preview')) {
  // Brevo picks one {% if %} branch per subscriber; the previews show each branch on its own
  const dir = new URL('../email-preview/', import.meta.url);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL('confirm.html', dir), CONFIRM.html);
  const branch = (html: string, pl: Place | null) => html.replace(/\{% if contact\.PLACE[\s\S]*?\{% endif %\}/, () => {
    const b = pl ? nearBlock(pl) : '';
    return b || fallback;
  });
  writeFileSync(new URL('welcome-closing-soon.html', dir), branch(WELCOME.html, null));
  for (const pl of PLACES) if (nearBlock(pl)) writeFileSync(new URL(`welcome-${pl.toLowerCase().replace(/ /g, '-')}.html`, dir), branch(WELCOME.html, pl));
  console.log(`Wrote previews to email-preview/ (welcome is ${Math.round(WELCOME.html.length / 1024)} KB with every place's block; each subscriber gets one)`);
  process.exit(0);
}

const key = process.env.BREVO_API_KEY;
if (!key) { console.error('BREVO_API_KEY must be set.'); process.exit(1); }

async function brevo(method: string, path: string, body?: unknown) {
  const res = await fetch(`https://api.brevo.com/v3${path}`, {
    method,
    headers: { 'api-key': key!, 'content-type': 'application/json', accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Brevo ${method} ${path} failed (${res.status}): ${text}`);
  return text ? JSON.parse(text) : {};
}

// The PLACE contact attribute (UK, Europe, US…, sent by the sign-up box): create it if this account doesn't have it yet
const attributes: { name: string }[] = (await brevo('GET', '/contacts/attributes')).attributes ?? [];
if (!attributes.some((x) => x.name === 'PLACE')) {
  await brevo('POST', '/contacts/attributes/normal/PLACE', { type: 'text' });
  console.log('Created the PLACE contact attribute');
}

// Update the template with the same name if it exists, otherwise create it
const existing: { id: number; name: string }[] = (await brevo('GET', '/smtp/templates?limit=1000')).templates ?? [];
const ids: Record<string, number> = {};
for (const t of TEMPLATES) {
  const body = { templateName: t.name, subject: t.subject, htmlContent: t.html, sender: SENDER, replyTo: SENDER.email, isActive: true, tag: t.tag };
  const found = existing.find((e) => e.name === t.name);
  if (found) {
    await brevo('PUT', `/smtp/templates/${found.id}`, body);
    ids[t.tag] = found.id;
    console.log(`Updated "${t.name}" (template ${found.id})`);
  } else {
    const made = await brevo('POST', '/smtp/templates', body);
    ids[t.tag] = made.id;
    console.log(`Created "${t.name}" (template ${made.id})`);
  }
}

// --send-test: the welcome email to the first address in BREVO_TEST_EMAILS (never printed: the logs are public)
if (process.argv.includes('--send-test')) {
  const to = (process.env.BREVO_TEST_EMAILS ?? '').split(',')[0]?.trim();
  if (!to) throw new Error('BREVO_TEST_EMAILS is empty');
  await brevo('POST', `/smtp/templates/${ids.welcome}/sendTest`, { emailTo: [to] });
  console.log('Sent a test of the welcome email to the first test address.');
}
void INK; void SANS;
