// Shared pieces of Magpie's emails (confirm, welcome, weekly): layout, fonts, pills, buttons and the listing card
// with its navy date tile. Tables and inline styles, so they hold up in Gmail, Outlook and Apple Mail.
// Adapted from BuilderBee's emails (scripts/email-parts.ts there).
import type { Listing } from '../src/types/listing';
import { closesAt, isLive, isOpportunity } from '../src/lib/dates';
import { formatMoney } from '../src/lib/money';
import { perks } from '../src/lib/perks';
import { place } from '../src/components/ListingCard';
import { LISTINGS } from '../src/lib/listings';
import { PLACES, type Place } from '../src/lib/filters';
import { nearYou } from '../src/lib/location';

export const SITE = 'https://magpie.cool';
export const SENDER = { name: 'Magpie', email: 'hello@magpie.cool' };
export const LINKEDIN = 'https://www.linkedin.com/in/irinacsapo/';

export const INK = '#1f3456';
export const MUTED = '#56627a';
export const PAGE_BG = '#f1efe9';
export const SANS = `'Inter',Helvetica,Arial,sans-serif`;
export const SERIF = `'Sorts Mill Goudy',Georgia,'Times New Roman',serif`;

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const day = (d: string) => Number(d.slice(8, 10));
const mon = (d: string) => MONTHS[Number(d.slice(5, 7)) - 1];
/** Links from emails carry a source, so Umami shows how many visits came from them */
export const track = (url: string, campaign: string) => `${url}${url.includes('?') ? '&' : '?'}utm_source=magpie-email&utm_medium=email&utm_campaign=${campaign}`;

// ---- Small pieces ----------------------------------------------------------------------------------------

export const p = (text: string, extra = '') => `<p style="margin:0 0 16px;font:400 17px/1.55 ${SANS};color:${INK};${extra}">${text}</p>`;
export const h1 = (text: string) => `<h1 style="margin:0 0 14px;font:400 36px/1.12 ${SERIF};color:${INK}">${text}</h1>`;
export const h2 = (text: string) => `<h2 style="margin:10px 0 16px;font:400 28px/1.15 ${SERIF};color:${INK}">${text}</h2>`;
export const eyebrow = (text: string, bg = '#d4f7ee', color = '#0b4f42') =>
  `<span style="display:inline-block;padding:4px 12px;border-radius:999px;background:${bg};font:700 12px/1.4 ${SANS};letter-spacing:0.06em;text-transform:uppercase;color:${color}">${text}</span>`;
export const pill = (text: string, bg: string, color = INK, border = bg) =>
  `<span style="display:inline-block;margin:6px 6px 0 0;padding:3px 10px;border:1px solid ${border};border-radius:8px;background:${bg};color:${color};font:600 12px/1.4 ${SANS};white-space:nowrap">${esc(text)}</span>`;
export const button = (href: string, label: string, dark = true) =>
  `<table role="presentation" cellspacing="0" cellpadding="0" style="display:inline-table;margin:0 8px 8px 0"><tr>
    <td bgcolor="${dark ? INK : '#ffffff'}" style="border-radius:999px;border:1.5px solid ${INK}">
      <a href="${href}" style="display:inline-block;padding:13px 24px;font:700 15px/1 ${SANS};color:${dark ? '#ffffff' : INK};text-decoration:none;border-radius:999px">${esc(label)}</a>
    </td></tr></table>`;
/** A soft coloured box with a bold title and a line of text (the "what's in it" list) */
export const what = (colour: string, title: string, text: string) =>
  `<tr><td style="padding:0 0 10px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
    <td bgcolor="${colour}" style="border-radius:16px;padding:14px 18px">
      <p style="margin:0;font:700 16px/1.3 ${SANS};color:${INK}">${title}</p>
      <p style="margin:4px 0 0;font:400 15px/1.45 ${SANS};color:${INK}">${text}</p>
    </td></tr></table></td></tr>`;

// ---- The listing card --------------------------------------------------------------------------------------

/** Navy tile: "closes" (or "starts"), the day in white, the month in apricot */
function dateTile(l: Listing): string {
  const opp = isOpportunity(l);
  const d = opp ? l.deadline! : l.start_date!;
  return `<td class="mp-date" width="64" valign="top" style="padding:0 14px 0 0">
    <table role="presentation" class="mp-tile" width="64" cellspacing="0" cellpadding="0"><tr>
      <td bgcolor="${INK}" align="center" style="border-radius:14px;padding:8px 4px 10px">
        <div style="font:600 10px/1 ${SANS};letter-spacing:0.08em;text-transform:uppercase;color:#c9d4e8">${opp ? 'Closes' : 'Starts'}</div>
        <div class="mp-day" style="margin-top:3px;font:800 24px/1.1 ${SANS};color:#ffffff">${day(d)}</div>
        <div class="mp-mon" style="margin-top:3px;font:700 12px/1 ${SANS};letter-spacing:0.08em;text-transform:uppercase;color:#fdc58f">${mon(d)}</div>
      </td></tr></table>
  </td>`;
}

/** What it costs, as the site's pills: teal free, blue paid, orange pay-if-selected, dashed not stated */
function feePills(l: Listing): string {
  const apply = isOpportunity(l);
  const out: string[] = [];
  if (l.entry_fee === 'Free') out.push(pill(apply ? 'Free to enter' : 'Free', '#d4f7ee', '#0b4f42'));
  else if (l.entry_fee === 'Paid') out.push(pill(l.fee_amount !== undefined && l.currency ? `${formatMoney(l.fee_amount, l.currency)}${apply ? ' to enter' : ''}` : 'Paid', '#e8f1fd', '#183f73'));
  else out.push(pill(apply ? 'Entry fee not stated' : 'Price not stated', '#ffffff', MUTED, '#c9c4b8'));
  if (apply && l.selected_fee === 'Yes') out.push(pill('Pay if selected', '#fde2c2', '#6e3300'));
  return out.join('');
}

export function card(l: Listing, campaign: string): string {
  const url = track(`${SITE}/listing/${l.id}`, campaign);
  const k = perks(l);
  const tags = [feePills(l), k.length ? pill(k[0].label + (k.length > 1 ? ` +${k.length - 1}` : ''), '#efe8f6', '#3f2f57') : '', pill(l.type, '#ffffff', INK, '#e5e2da')].join('');
  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 12px;border:1px solid #e5e2da;border-radius:16px;background:#ffffff">
    <tr><td style="padding:16px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
        ${dateTile(l)}
        <td valign="top">
          <a href="${url}" style="font:700 17px/1.3 ${SANS};color:${INK};text-decoration:none">${esc(l.title)}</a>
          <div style="margin-top:4px;font:400 14px/1.4 ${SANS};color:${MUTED}">${esc(l.organiser)} · ${esc(place(l))}</div>
          <div>${tags}</div>
        </td>
        <td class="mp-thumb" width="96" valign="top" style="padding:0 0 0 14px">
          <a href="${url}"><img src="${SITE}/thumb/${l.id}.jpg" width="96" height="96" alt="" style="display:block;width:96px;height:96px;border-radius:12px;border:0"></a>
        </td>
      </tr></table>
    </td></tr>
  </table>`;
}

export const CARD_CSS = `
  @media (max-width: 480px) {
    .mp-pad { padding-left: 18px !important; padding-right: 18px !important; }
    .mp-thumb { display: none !important; }
    .mp-date { width: 56px !important; padding-right: 12px !important; }
    .mp-tile { width: 56px !important; }
    .mp-day { font-size: 20px !important; }
  }
`;

// ---- Picking listings ------------------------------------------------------------------------------------------

const now = Date.now();
/** Open now, free or genuine (commercial operators stay out of emails), closing soonest first */
export const OPEN = LISTINGS.filter((l) => isLive(l, now) && !l.commercial).sort((a, b) => closesAt(a) - closesAt(b));
export const closingSoon = (n: number) => OPEN.filter((l) => isOpportunity(l)).slice(0, n);
export const nearPlace = (pl: Place, n: number) => nearYou(OPEN, pl, null).slice(0, n);
export { PLACES, type Place };

/**
 * Different listings for each subscriber's place. Brevo fills `contact.PLACE` from the sign-up form, and its
 * templates understand {% if %}, so every subscriber sees one block: their place's, or the fallback.
 */
export function byPlace(block: (pl: Place) => string, fallback: string): string {
  const parts = PLACES.map((pl) => ({ pl, html: block(pl) })).filter((x) => x.html);
  if (!parts.length) return fallback;
  return parts.map((x, i) => `{% ${i ? 'elif' : 'if'} contact.PLACE == "${x.pl}" %}${x.html}`).join('') + `{% else %}${fallback}{% endif %}`;
}

// ---- The frame every email shares ------------------------------------------------------------------------------

export const FOOTER = (why: string) =>
  `${why} Magpie is made by designer and artist <a href="${LINKEDIN}" style="color:${MUTED};font-weight:700">Irina Csapo</a>.
  Add hello@magpie.cool to your contacts so we don’t land in spam, and reply any time: we read every email.
  <a href="${SITE}/privacy" style="color:${MUTED}">Privacy policy</a>`;

export function layout(title: string, preheader: string, body: string, footer: string, unsubscribe = '') {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Sorts+Mill+Goudy:ital@0;1&display=swap" rel="stylesheet">
<style>${CARD_CSS}</style>
</head>
<body style="margin:0;padding:0;background:${PAGE_BG}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${PAGE_BG}">${preheader}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${PAGE_BG}"><tr><td align="center" style="padding:24px 10px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden">
  <tr><td class="mp-pad" style="padding:16px 32px;border-bottom:1px solid #e5e2da">
    <a href="${SITE}/"><img src="${SITE}/email/logo.png" width="150" alt="Magpie" style="display:block;width:150px;height:auto;border:0"></a>
  </td></tr>
  <tr><td style="padding:0;line-height:0;font-size:0">
    <a href="${SITE}/"><img src="${SITE}/email/hero.jpg" width="600" alt="Open calls, prizes and events for artists" style="display:block;width:100%;max-width:600px;height:auto;border:0"></a>
  </td></tr>
  ${body}
  <tr><td class="mp-pad" style="padding:0 32px 32px;font:400 12px/1.6 ${SANS};color:${MUTED}">${footer}${unsubscribe}</td></tr>
</table></td></tr></table>
</body></html>`.replace(/\n\s+/g, '\n');   // smaller: Gmail cuts off emails over ~100 KB
}

/** The green "know a call we're missing?" box near the end of the welcome and weekly emails */
export const SUBMIT_BOX = (campaign: string) => `<tr><td class="mp-pad" style="padding:20px 32px 28px">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
    <td bgcolor="#d4f7ee" style="border-radius:20px;padding:22px">
      <h2 style="margin:0 0 6px;font:400 25px/1.2 ${SERIF};color:${INK}">Know an open call we’re missing?</h2>
      <p style="margin:0 0 16px;font:400 15px/1.5 ${SANS};color:${INK}">Free calls and real galleries, festivals and funders that support artists: we’d love to list it. And if a friend would like this email, send them to magpie.cool.</p>
      ${button(track(`${SITE}/submit`, campaign), 'Submit an open call')}
    </td></tr></table>
</td></tr>`;
