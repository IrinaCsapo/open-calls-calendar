// Draws a 1200×630 link-preview card for every listing: dist/og/<id>.jpg. It's what WhatsApp, iMessage, LinkedIn,
// Slack and others show when someone shares magpie.cool/listing/<id>: the listing's image on a colour wash, the title
// in Sorts Mill Goudy, the deadline, every fee, the top prize and the Magpie logo, with a little grain.
//
// satori lays out the card (fonts in scripts/fonts), resvg draws it, sharp fetches/resizes the organiser's image and
// saves a small JPEG (well under WhatsApp's ~300 KB limit). If an image can't be fetched the card is drawn without it.
//
//   npx tsx scripts/build-og.ts            all listings (run by `npm run build`)
//   npx tsx scripts/build-og.ts <id>…      just these, for checking a design change
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { LISTINGS } from '../src/lib/listings';
import { formatFull, formatRange, isOpportunity } from '../src/lib/dates';
import { formatMoney } from '../src/lib/money';
import { place, wash } from '../src/components/ListingCard';
import type { Listing } from '../src/types/listing';

const W = 1200, H = 630;
const INK = '#1f3456', MUTED = '#56627a';
const PILL = {
  free: { background: '#d4f7ee', color: '#0b4f42' },
  caution: { background: '#fde2c2', color: '#6e3300' },
  paid: { background: '#e8f1fd', color: '#183f73' },
  unknown: { background: '#ece6f0', color: '#42354b' },
};

const font = (f: string) => readFileSync(new URL(`fonts/${f}`, import.meta.url));
const fonts = [
  { name: 'Inter', data: font('Inter-400.ttf'), weight: 400 as const, style: 'normal' as const },
  { name: 'Inter', data: font('Inter-600.ttf'), weight: 600 as const, style: 'normal' as const },
  { name: 'Inter', data: font('Inter-700.ttf'), weight: 700 as const, style: 'normal' as const },
  { name: 'Goudy', data: font('SortsMillGoudy-Regular.ttf'), weight: 400 as const, style: 'normal' as const },
  { name: 'Goudy', data: font('SortsMillGoudy-Italic.ttf'), weight: 400 as const, style: 'italic' as const },
];
const logoBuf = readFileSync(new URL('../src/assets/magpie-logo-header.png', import.meta.url));
const logo = `data:image/png;base64,${logoBuf.toString('base64')}`;

// A tiny element helper, so this file needs no JSX: h('div', { style }, ...children)
type El = { type: string; props: Record<string, unknown> };
const h = (type: string, props: Record<string, unknown>, ...children: (El | string | false | undefined)[]): El => ({
  type,
  props: { ...props, children: children.filter((c) => c !== false && c !== undefined) },
});

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).replace(/[\s,;:·–-]+\S*$/, '')}…` : s);

/** The organiser's image, shrunk to fit the frame. Hotlinked images can be slow, huge, or webp (resvg can't draw webp). */
async function picture(url: string, boxW: number, boxH: number) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/130 Safari/537.36' }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`${res.status}`);
  const { data, info } = await sharp(Buffer.from(await res.arrayBuffer()))
    .rotate()
    .resize(boxW * 2, boxH * 2, { fit: 'inside', withoutEnlargement: true })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  const scale = Math.min(boxW / info.width, boxH / info.height);
  return { src: `data:image/jpeg;base64,${data.toString('base64')}`, width: Math.round(info.width * scale), height: Math.round(info.height * scale) };
}

function pills(l: Listing): { text: string; tone: keyof typeof PILL }[] {
  const apply = isOpportunity(l);
  const out: { text: string; tone: keyof typeof PILL }[] = [];
  if (l.entry_fee === 'Free') out.push({ text: apply ? 'Free to enter' : 'Free', tone: 'free' });
  else if (l.entry_fee === 'Paid') out.push({ text: l.fee_amount !== undefined && l.currency ? `${formatMoney(l.fee_amount, l.currency)}${apply ? ' to enter' : ''}` : 'Paid', tone: 'paid' });
  else out.push({ text: apply ? 'Entry fee not stated' : 'Price not stated', tone: 'unknown' });
  if (apply) {
    if (l.selected_fee === 'Yes') out.push({ text: 'Pay if selected', tone: 'caution' });
    else if (l.selected_fee === 'None') out.push({ text: 'No fees if selected', tone: 'free' });
    else out.push({ text: 'Fees if selected not stated', tone: 'unknown' });
  }
  return out;
}

async function card(l: Listing) {
  const FRAME_W = 450, FRAME_H = 518, TEXT_W = W - 112 - 48 - FRAME_W;
  let pic: Awaited<ReturnType<typeof picture>> | undefined;
  if (l.image_url) {
    try { pic = await picture(l.image_url, FRAME_W - 60, FRAME_H - 60); }
    catch (e) { console.warn(`  ! ${l.id}: image not loaded (${(e as Error).message}), drawing the card without it`); }
  }

  const kicker = isOpportunity(l)
    ? `${l.type} · Closes ${formatFull(l.deadline!)}`
    : `${l.type} · ${formatRange(l.start_date!, l.end_date)}`;
  const title = clip(l.title, 84);
  const size = title.length > 56 ? 46 : title.length > 26 ? 54 : 66;
  const prize = l.prizes[0] ? clip(l.prizes[0], 44) : '';

  const tree = h('div', { style: { width: W, height: H, display: 'flex', backgroundColor: '#faf9f6', backgroundImage: wash(l.id).replace(/, #f4f1ea$/, ''), fontFamily: 'Inter', color: INK } },
   h('div', { style: { position: 'absolute', left: 56, top: 56, width: W - 112, height: H - 112, display: 'flex', alignItems: 'center', gap: 48 } },
    // Left: text
    h('div', { style: { width: TEXT_W, height: H - 112, minHeight: 0, flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' } },
      h('img', { src: logo, width: 151, height: 48, style: { marginBottom: 24 } }),
      h('div', { style: { fontSize: 21, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: MUTED, marginBottom: 12 } }, kicker),
      h('div', { style: { fontFamily: 'Goudy', fontSize: size, lineHeight: 1.06, letterSpacing: -0.5, marginBottom: 14 } }, title),
      h('div', { style: { fontSize: 24, color: MUTED, marginBottom: 20 } }, clip(`${l.organiser} · ${place(l)}`, 64)),
      h('div', { style: { display: 'flex', gap: 10, flexWrap: 'wrap' } },
        ...pills(l).map((p) => h('div', { style: { ...PILL[p.tone], fontSize: 23, fontWeight: 600, padding: '9px 20px', borderRadius: 999 } }, p.text)),
      ),
      prize && h('div', { style: { fontSize: 23, marginTop: 16, color: INK } }, `Prize: ${prize}`),
      h('div', { style: { marginTop: 'auto', fontSize: 21, color: MUTED } }, 'magpie.cool · every fee up front'),
    ),
    // Right: the organiser's image on a brighter wash, or the wash with the bird's-eye title
    h('div', { style: { width: FRAME_W, height: FRAME_H, flexShrink: 0, borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f1ea', backgroundImage: wash(l.id, true).replace(/, #f4f1ea$/, '') } },
      pic
        ? h('img', { src: pic.src, width: pic.width, height: pic.height, style: { borderRadius: 6, boxShadow: '0 10px 30px rgba(31,52,86,0.18)' } })
        : h('div', { style: { fontFamily: 'Goudy', fontStyle: 'italic', fontSize: 40, color: INK, padding: 40, textAlign: 'center' } }, l.organiser),
    ),
   ),
  );

  const svg = await satori(tree as never, { width: W, height: H, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
  return sharp(png).composite([{ input: grain, blend: 'soft-light' }]).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
}

// Paper grain, the same on every card (seeded), drawn once
const grain = await (() => {
  const px = Buffer.alloc(W * H * 4);
  let s = 7;
  for (let i = 0; i < W * H; i++) {
    s = (s * 1103515245 + 12345) >>> 0;
    const v = (s >>> 16) & 255;
    px.set([v, v, v, 38], i * 4);
  }
  return sharp(px, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
})();

const only = process.argv.slice(2);
const list = only.length ? LISTINGS.filter((l) => only.includes(l.id)) : LISTINGS;
const out = new URL('../dist/og/', import.meta.url);
mkdirSync(out, { recursive: true });

let i = 0, done = 0, bytes = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (i < list.length) {
    const l = list[i++];
    const jpg = await card(l);
    writeFileSync(new URL(`${l.id}.jpg`, out), jpg);
    done++; bytes += jpg.length;
  }
}));
console.log(`✓ drew ${done} link-preview cards in dist/og/ (average ${Math.round(bytes / done / 1024)} KB)`);
