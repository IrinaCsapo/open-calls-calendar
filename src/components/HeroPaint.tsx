import { useEffect, useRef } from 'react';

/**
 * Interactive hero background: click (or touch) and drag to leave soft, grainy blobs of colour.
 * The hue drifts through the spectrum as you paint, blobs linger, then slowly fade.
 *
 * How it works (plain canvas, no libraries):
 * - an offscreen half-resolution "paint" canvas gets radial-gradient stamps along the pointer's path
 * - every ~0.4 s a little of every blob is erased there, so they fade over ~45 seconds
 * - the visible canvas draws the paint blurred (soft blobs), then noise on top of the colour only (grain)
 * Decorative only (aria-hidden); the hero text and buttons sit above it and keep working.
 */

const SCALE = 0.5;           // canvas pixels per CSS pixel (it's blurred, so half is plenty)
// Fading: every FADE_EVERY ms, FADE of the colour is erased (half gone after ~10 s, near nothing after ~45 s).
// Not per frame: the canvas stores transparency in whole steps of 1/255, so a tiny per-frame fade
// would round to "no change" and leave ghosts.
const FADE = 0.03;
const FADE_EVERY = 450;
const IDLE_STOP = 45_000;    // after this long without a stroke, clear the last faint traces and stop

function makeGrain(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const img = g.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

export function HeroPaint() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement?.parentElement;   // the hero section
    const view = canvas?.getContext('2d');
    if (!canvas || !host || !view) return;
    const paint = document.createElement('canvas');      // where the blobs live (offscreen)
    const ctx = paint.getContext('2d')!;
    const grain = view.createPattern(makeGrain(), 'repeat')!;
    const canFilter = 'filter' in view;                   // canvas blur; older Safari falls back to CSS blur
    if (!canFilter) canvas.classList.add('hero-paint__canvas--css-blur');

    let w = 1, h = 1;           // paint canvas size
    let vw = 1, vh = 1;         // visible canvas size (CSS pixels)
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const nvw = Math.max(1, Math.round(r.width)), nvh = Math.max(1, Math.round(r.height));
      if (nvw === vw && nvh === vh) return;
      canvas.width = vw = nvw; canvas.height = vh = nvh;
      // keep what's been painted when the window changes size
      const keep = document.createElement('canvas');
      keep.width = paint.width; keep.height = paint.height;
      keep.getContext('2d')!.drawImage(paint, 0, 0);
      paint.width = w = Math.max(1, Math.round(vw * SCALE)); paint.height = h = Math.max(1, Math.round(vh * SCALE));
      ctx.drawImage(keep, 0, 0, w, h);
      render();
    };
    const render = () => {
      view.clearRect(0, 0, vw, vh);
      if (canFilter) view.filter = 'blur(20px) saturate(1.1)';
      view.drawImage(paint, 0, 0, vw, vh);
      if (canFilter) {
        view.filter = 'none';
        // grain only where there is colour
        view.globalCompositeOperation = 'source-atop';
        view.globalAlpha = 0.2;
        view.fillStyle = grain;
        view.fillRect(0, 0, vw, vh);
        view.globalAlpha = 1;
        view.globalCompositeOperation = 'source-over';
      }
    };
    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);

    let hue = 250;
    let last: { x: number; y: number } | null = null;
    let painting = false;
    let raf = 0;
    let lastStroke = 0;
    let lastFade = 0;

    const radius = () => Math.max(46, Math.min(w, h * 1.6) * 0.085);
    const stamp = (x: number, y: number, r: number) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const c = `hsla(${hue.toFixed(0)}, 88%, 62%,`;
      g.addColorStop(0, `${c} 0.5)`);
      g.addColorStop(0.45, `${c} 0.26)`);
      g.addColorStop(1, `${c} 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      hue = (hue + 1.6) % 360;
    };

    const tick = (t: number) => {
      if (t - lastFade >= FADE_EVERY) {
        lastFade = t;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = `rgba(0,0,0,${FADE})`;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
      }
      if (performance.now() - lastStroke < IDLE_STOP) raf = requestAnimationFrame(tick);
      else { ctx.clearRect(0, 0, w, h); raf = 0; }   // the last faint traces go at once
      render();
    };
    const wake = () => { lastStroke = performance.now(); if (!raf) { lastFade = lastStroke; raf = requestAnimationFrame(tick); } };

    const toCanvas = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();   // same box as the paint canvas, at SCALE
      return { x: (e.clientX - r.left) * SCALE, y: (e.clientY - r.top) * SCALE };
    };
    const paintTo = (p: { x: number; y: number }, pressure = 1) => {
      const r = radius() * (0.75 + 0.5 * pressure);
      if (!last) stamp(p.x, p.y, r);
      else {
        const d = Math.hypot(p.x - last.x, p.y - last.y);
        const steps = Math.max(1, Math.ceil(d / (r * 0.3)));
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          stamp(last.x + (p.x - last.x) * t, last.y + (p.y - last.y) * t, r);
        }
      }
      last = p;
      wake();
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      painting = true; last = null;
      paintTo(toCanvas(e), e.pressure || 1);
    };
    const onMove = (e: PointerEvent) => { if (painting) paintTo(toCanvas(e), e.pressure || 1); };
    const onUp = () => { painting = false; last = null; };

    host.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    // A first brushstroke so the effect is discoverable: a soft arc behind the headline.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const intro = [0.18, 0.26, 0.34, 0.42, 0.5, 0.58, 0.66, 0.74, 0.82].map((t) => ({ x: w * t, y: h * (0.62 - 0.22 * Math.sin(Math.PI * t)) }));
    if (reduced) {
      intro.forEach((p) => stamp(p.x, p.y, radius()));
      render();
    } else {
      let i = 0;
      const step = () => {
        if (i >= intro.length) { last = null; return; }
        paintTo(intro[i++], 0.8);
        window.setTimeout(step, 70);
      };
      last = null;
      window.setTimeout(step, 350);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  return (
    <div className="hero-paint" aria-hidden="true">
      <canvas ref={canvasRef} className="hero-paint__canvas" />
    </div>
  );
}
