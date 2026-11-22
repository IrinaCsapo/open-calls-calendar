// Draws the cover image for Magpie's Buy Me a Coffee page (buymeacoffee.com/irina.csapo):
// brand/buymeacoffee-cover.jpg, 2400×600 (they ask for at least 1600×400). The site's grainy rainbow wash, the magpie,
// and the line in Sorts Mill Goudy; everything important sits in the middle, which their page never crops.
//   npx tsx scripts/bmac-cover.ts
import { mkdirSync, readFileSync } from 'node:fs';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const W = 2400, H = 600;
const font = (f: string) => readFileSync(new URL(`fonts/${f}`, import.meta.url));
const fonts = [
  { name: 'Goudy', data: font('SortsMillGoudy-Regular.ttf'), weight: 400 as const, style: 'normal' as const },
  { name: 'Goudy', data: font('SortsMillGoudy-Italic.ttf'), weight: 400 as const, style: 'italic' as const },
  { name: 'Inter', data: font('Inter-600.ttf'), weight: 600 as const, style: 'normal' as const },
];
const h = (type: string, style: Record<string, unknown>, ...children: unknown[]) => ({ type, props: { style, children } });
const bird = `data:image/png;base64,${readFileSync(new URL('../src/assets/magpie-bird.png', import.meta.url)).toString('base64')}`;

const blobs = [
  'radial-gradient(18% 60% at 6% 45%, #f3cd66, transparent 70%)',
  'radial-gradient(18% 65% at 20% 65%, #f394bd, transparent 70%)',
  'radial-gradient(18% 60% at 36% 35%, #bb9ce0, transparent 70%)',
  'radial-gradient(18% 60% at 64% 62%, #7fb5f2, transparent 70%)',
  'radial-gradient(18% 60% at 80% 38%, #6fdcc1, transparent 70%)',
  'radial-gradient(18% 65% at 95% 60%, #f6a466, transparent 70%)',
].join(', ');

const tree = h('div', { width: W, height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 56,
  backgroundColor: '#faf9f6', backgroundImage: blobs, color: '#1f3456' },
  h('img', { width: 450, height: 450, marginRight: -40, marginTop: 20 }),
  h('div', { display: 'flex', flexDirection: 'column' },
    h('div', { fontFamily: 'Goudy', fontSize: 112, lineHeight: 1.0, letterSpacing: -1.5 }, 'Open calls for artists,'),
    h('div', { fontFamily: 'Goudy', fontStyle: 'italic', fontSize: 112, lineHeight: 1.05, letterSpacing: -1.5 }, 'every fee up front'),
    h('div', { fontFamily: 'Inter', fontWeight: 600, fontSize: 38, marginTop: 26, letterSpacing: 1 }, 'magpie.cool  ·  free, no ads, updated every morning'),
  ),
);
(tree.props.children as { props: Record<string, unknown> }[])[0].props.src = bird;

const svg = await satori(tree as never, { width: W, height: H, fonts });
const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
const px = Buffer.alloc(W * H * 4);
let s = 7;
for (let i = 0; i < W * H; i++) { s = (s * 1103515245 + 12345) >>> 0; const v = (s >>> 16) & 255; px.set([v, v, v, 46], i * 4); }
const grain = await sharp(px, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();

mkdirSync(new URL('../brand/', import.meta.url), { recursive: true });
await sharp(png).composite([{ input: grain, blend: 'soft-light' }]).jpeg({ quality: 88, mozjpeg: true })
  .toFile(new URL('../brand/buymeacoffee-cover.jpg', import.meta.url).pathname);
console.log('✓ wrote brand/buymeacoffee-cover.jpg (2400×600)');
