// Draws the email header picture once: public/email/hero.jpg (1200×520), the site's headline in Sorts Mill Goudy on
// a grainy rainbow wash, like the hero on magpie.cool. Also copies the logo to public/email/logo.png.
//   npx tsx scripts/email-hero.ts
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const W = 1200, H = 520;
const font = (f: string) => readFileSync(new URL(`fonts/${f}`, import.meta.url));
const fonts = [
  { name: 'Goudy', data: font('SortsMillGoudy-Regular.ttf'), weight: 400 as const, style: 'normal' as const },
  { name: 'Goudy', data: font('SortsMillGoudy-Italic.ttf'), weight: 400 as const, style: 'italic' as const },
];
const h = (type: string, style: Record<string, unknown>, ...children: unknown[]) => ({ type, props: { style, children } });

const blobs = [
  'radial-gradient(30% 55% at 12% 40%, #bb9ce0, transparent 70%)',
  'radial-gradient(28% 55% at 32% 62%, #7fb5f2, transparent 70%)',
  'radial-gradient(26% 50% at 55% 38%, #6fdcc1, transparent 70%)',
  'radial-gradient(28% 55% at 75% 60%, #f3cd66, transparent 70%)',
  'radial-gradient(28% 55% at 92% 40%, #f6a466, transparent 70%)',
].join(', ');

const tree = h('div', { width: W, height: H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  backgroundColor: '#faf9f6', backgroundImage: blobs, fontFamily: 'Goudy', color: '#1f3456' },
  h('div', { fontSize: 104, lineHeight: 1.02, letterSpacing: -1.5 }, 'Open calls, prizes'),
  h('div', { display: 'flex', fontSize: 104, lineHeight: 1.02, letterSpacing: -1.5 }, 'and events ',
    h('span', { fontStyle: 'italic', marginLeft: 22 }, 'for artists')),
);

const svg = await satori(tree as never, { width: W, height: H, fonts });
const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
// paper grain, like the site's paint
const px = Buffer.alloc(W * H * 4);
let s = 11;
for (let i = 0; i < W * H; i++) { s = (s * 1103515245 + 12345) >>> 0; const v = (s >>> 16) & 255; px.set([v, v, v, 46], i * 4); }
const grain = await sharp(px, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();

mkdirSync(new URL('../public/email/', import.meta.url), { recursive: true });
await sharp(png).composite([{ input: grain, blend: 'soft-light' }]).jpeg({ quality: 82, mozjpeg: true })
  .toFile(new URL('../public/email/hero.jpg', import.meta.url).pathname);
copyFileSync(new URL('../src/assets/magpie-logo-header.png', import.meta.url), new URL('../public/email/logo.png', import.meta.url));
console.log('✓ wrote public/email/hero.jpg and public/email/logo.png');
