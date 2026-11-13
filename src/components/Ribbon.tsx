import { useEffect, useMemo, useRef, useState } from 'react';

// A twisting paper-like ribbon for the hero (inspired by Handhold), with a watercolour feel:
// - the band is drawn as thin slices shaded by how far it has turned; the turned-over side is blue
// - an SVG filter gives soft, wobbly edges and a fine paper grain
// - moving the pointer over the hero drops pigment blooms that bleed out and fade, clipped to the ribbon
// Decorative only (aria-hidden). With reduced motion there are no blooms.

const W = 1000;
const H = 420;
const N = 320;
const BLOOM_COLOURS = ['#5ca3f8', '#88c6ee', '#aa92b5', '#f7932e', '#4be6cb', '#f1c56b'];

interface Slice { points: string; fill: string }

const mix = (a: number[], b: number[], k: number) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
const rgb = (c: number[]) => `rgb(${c[0]},${c[1]},${c[2]})`;
const BUTTER = [233, 196, 120], CREAM = [246, 238, 220], BLUE = [52, 120, 222], SKY = [196, 220, 245], WHITE = [252, 252, 250];

/**
 * The ribbon as thin slices. Each slice's width is the band's projected width at that point
 * (it shrinks to nothing where the band turns edge-on), and its colour comes from how much it faces
 * us: front side butter-to-cream, back side blue, both paler when facing us full on.
 */
function buildRibbon(): Slice[] {
  const pts = Array.from({ length: N + 1 }, (_, i) => {
    const t = i / N;
    const x = 40 + t * (W - 30);
    const y = H - 30 - t * (H - 120) + 34 * Math.sin(t * Math.PI * 2 + 0.3);
    const theta = t * Math.PI * 3.1 + 0.9;                  // how far the band has turned
    const half = (22 + 48 * Math.sin(Math.PI * Math.min(1, t * 1.1))) * Math.sin(theta);
    return { x, y, half, facing: Math.abs(Math.sin(theta)), back: Math.sin(theta) < 0, t };
  });
  const slices: Slice[] = [];
  for (let i = 0; i < N; i++) {
    const p = pts[i], q = pts[i + 1];
    const base = p.back ? mix(BLUE, SKY, 0.15 + 0.35 * p.t) : mix(BUTTER, CREAM, Math.min(1, 0.25 + Math.sin(p.t * Math.PI) * 0.9));
    const fill = rgb(mix(base, WHITE, p.back ? p.facing * 0.4 : p.facing * 0.35));
    const x2 = q.x + 0.6; // slight overlap hides seams
    slices.push({
      fill,
      points: `${p.x.toFixed(1)},${(p.y - p.half).toFixed(1)} ${x2.toFixed(1)},${(q.y - q.half).toFixed(1)} ${x2.toFixed(1)},${(q.y + q.half).toFixed(1)} ${p.x.toFixed(1)},${(p.y + p.half).toFixed(1)}`,
    });
  }
  return slices;
}

interface Bloom { id: number; x: number; y: number; colour: string }

export function Ribbon() {
  const slices = useMemo(buildRibbon, []);
  const svgRef = useRef<SVGSVGElement>(null);
  const [blooms, setBlooms] = useState<Bloom[]>([]);

  useEffect(() => {
    const svg = svgRef.current;
    const host = svg?.parentElement;
    if (!svg || !host || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let last = { x: -999, y: -999 };
    let id = 0;
    let colour = 0;
    const onMove = (e: PointerEvent) => {
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
      if (Math.hypot(p.x - last.x, p.y - last.y) < 28) return;
      last = { x: p.x, y: p.y };
      const bloom = { id: ++id, x: p.x, y: p.y, colour: BLOOM_COLOURS[colour++ % BLOOM_COLOURS.length] };
      setBlooms((b) => [...b.slice(-22), bloom]);
      window.setTimeout(() => setBlooms((b) => b.filter((x) => x.id !== bloom.id)), 2600);
    };
    host.addEventListener('pointermove', onMove);
    return () => host.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <svg ref={svgRef} className="ribbon" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMaxYMax slice" aria-hidden="true" focusable="false">
      <defs>
        {/* Watercolour: wobbly edges + soft blur + paper grain */}
        <filter id="rb-wc" x="-5%" y="-10%" width="110%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="3" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="G" result="wobble" />
          <feGaussianBlur in="wobble" stdDeviation="2.2" result="soft" />
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="2" result="grain" />
          <feColorMatrix in="grain" type="saturate" values="0" result="grey" />
          <feComponentTransfer in="grey" result="paper">
            <feFuncR type="linear" slope="0.35" intercept="0.72" />
            <feFuncG type="linear" slope="0.35" intercept="0.72" />
            <feFuncB type="linear" slope="0.35" intercept="0.72" />
          </feComponentTransfer>
          <feBlend in="soft" in2="paper" mode="multiply" result="grained" />
          <feComposite in="grained" in2="soft" operator="in" />
        </filter>
        {/* Pigment bleeding into wet paper */}
        <filter id="rb-bleed" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="11" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="34" xChannelSelector="R" yChannelSelector="B" result="d" />
          <feGaussianBlur in="d" stdDeviation="5" />
        </filter>
        <linearGradient id="rb-fade-g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.16" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id="rb-fade" maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
          <rect width={W} height={H} fill="url(#rb-fade-g)" />
        </mask>
        <clipPath id="rb-clip">
          {slices.map((s, i) => <polygon key={i} points={s.points} />)}
        </clipPath>
        {BLOOM_COLOURS.map((c) => (
          <radialGradient key={c} id={`rb-pig-${c.slice(1)}`}>
            <stop offset="0" stopColor={c} stopOpacity="0.85" />
            <stop offset="0.55" stopColor={c} stopOpacity="0.45" />
            <stop offset="0.85" stopColor={c} stopOpacity="0.6" />  {/* darker rim, like a drying watercolour edge */}
            <stop offset="1" stopColor={c} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>

      <g mask="url(#rb-fade)">
      <g filter="url(#rb-wc)">
        {slices.map((s, i) => <polygon key={i} points={s.points} fill={s.fill} />)}
      </g>
      <g clipPath="url(#rb-clip)">
        <g filter="url(#rb-bleed)" className="ribbon__blooms">
          {blooms.map((b) => (
            <circle key={b.id} className="ribbon__bloom" cx={b.x} cy={b.y} r="70" fill={`url(#rb-pig-${b.colour.slice(1)})`} />
          ))}
        </g>
      </g>
      </g>
    </svg>
  );
}
