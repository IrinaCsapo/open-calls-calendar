// Draws the site's link-preview picture: public/og-image.jpg (1200×630). The logo, the headline in Sorts Mill Goudy
// and the lede on a soft pastel wash, light enough that the headline stays easy to read in a small preview.
//   npx tsx scripts/og-image.ts
import { readFileSync } from 'node:fs';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const W = 1200, H = 630;
const INK = '#1f3456';
const font = (f: string) => readFileSync(new URL(`fonts/${f}`, import.meta.url));
const fonts = [
  { name: 'Goudy', data: font('SortsMillGoudy-Regular.ttf'), weight: 400 as const, style: 'normal' as const },
  { name: 'Goudy', data: font('SortsMillGoudy-Italic.ttf'), weight: 400 as const, style: 'italic' as const },
  { name: 'Inter', data: font('Inter-400.ttf'), weight: 400 as const, style: 'normal' as const },
];
const h = (type: string, style: Record<string, unknown>, ...children: unknown[]) => ({ type, props: { style: { display: 'flex', ...style }, children } });

// Pale colour washes (low alpha), spread out so no strong colour sits right behind the letters
const blob = (x: number, y: number, rx: number, ry: number, c: string, a: number) =>
  `radial-gradient(${rx}% ${ry}% at ${x}% ${y}%, ${c}${Math.round(a * 255).toString(16).padStart(2, '0')}, transparent 70%)`;
const wash = [
  blob(4, 30, 42, 60, '#f394bd', 0.42),
  blob(28, 78, 40, 55, '#bb9ce0', 0.38),
  blob(52, 20, 40, 50, '#7fb5f2', 0.34),
  blob(76, 80, 40, 55, '#6fdcc1', 0.38),
  blob(98, 30, 40, 60, '#f3cd66', 0.45),
].join(', ');

const logo = `data:image/png;base64,${readFileSync(new URL('../src/assets/magpie-logo-header.png', import.meta.url)).toString('base64')}`;
const meta = await sharp(new URL('../src/assets/magpie-logo-header.png', import.meta.url).pathname).metadata();
const logoH = 58, logoW = Math.round(meta.width! * logoH / meta.height!);

const line = { fontFamily: 'Goudy', fontSize: 104, lineHeight: 1.02, letterSpacing: -1.5, color: INK };
const tree = h('div', { width: W, height: H, position: 'relative', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  backgroundColor: '#faf9f6', backgroundImage: wash },
  h('img', { position: 'absolute', top: 52, left: 60, width: logoW, height: logoH }),
  h('div', line, 'Open calls, prizes and'),
  h('div', line, 'events ', h('span', { fontStyle: 'italic', marginLeft: 22 }, 'for artists')),
  h('div', { marginTop: 40, fontFamily: 'Inter', fontSize: 30, color: '#3a4a66' }, 'Every fee shown up front. Updated every morning.'),
);
// the logo needs a src, not a style
(tree.props.children[0] as { props: Record<string, unknown> }).props.src = logo;

const svg = await satori(tree as never, { width: W, height: H, fonts });
const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
// a faint paper grain
const px = Buffer.alloc(W * H * 4);
let s = 11;
for (let i = 0; i < W * H; i++) { s = (s * 1103515245 + 12345) >>> 0; const v = (s >>> 16) & 255; px.set([v, v, v, 22], i * 4); }
const grain = await sharp(px, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
await sharp(png).composite([{ input: grain, blend: 'soft-light' }]).jpeg({ quality: 86, mozjpeg: true })
  .toFile(new URL('../public/og-image.jpg', import.meta.url).pathname);
console.log('Wrote public/og-image.jpg');
