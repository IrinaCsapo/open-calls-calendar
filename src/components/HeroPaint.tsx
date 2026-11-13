import { useEffect, useRef } from 'react';

/**
 * Interactive hero background: click (or touch) and drag to leave soft, grainy blobs of colour.
 * On its own, a soft brush loops along both lines of the headline (not with reduced motion).
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
    const layer = canvas?.parentElement;                 // .hero-paint
    const host = layer?.parentElement;                   // the hero section
    const header = document.querySelector<HTMLElement>('.site-header');
    const view = canvas?.getContext('2d');
    if (!canvas || !layer || !host || !view) return;
    const paint = document.createElement('canvas');      // where the blobs live (offscreen)
    const ctx = paint.getContext('2d')!;
    const grain = view.createPattern(makeGrain(), 'repeat')!;
    // Grainier on phones, where the blobs are smaller and the texture would otherwise get lost
    const grainAlpha = window.matchMedia('(max-width: 40rem)').matches ? 0.36 : 0.2;
    const canFilter = 'filter' in view;                   // canvas blur; older Safari falls back to CSS blur
    if (!canFilter) canvas.classList.add('hero-paint__canvas--css-blur');

    let w = 1, h = 1;           // paint canvas size
    let vw = 1, vh = 1;         // visible canvas size (CSS pixels)
    const resize = () => {
      // the paint reaches up behind the navbar: start the layer at the top of the header
      if (header) layer.style.top = `${header.getBoundingClientRect().top - host.getBoundingClientRect().top}px`;
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
        view.globalAlpha = grainAlpha;
        view.fillStyle = grain;
        view.fillRect(0, 0, vw, vh);
        view.globalAlpha = 1;
        view.globalCompositeOperation = 'source-over';
      }
    };
    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
    if (header) ro.observe(header);

    let hue = 250;
    let last: { x: number; y: number } | null = null;
    let painting = false;
    let raf = 0;
    let disposed = false;          // set on unmount: a stale copy must never draw again
    let startTimer = 0;
    let lastStroke = 0;
    let lastFade = 0;

    const radius = () => Math.max(46, Math.min(w, h * 1.6) * 0.085);
    const stamp = (x: number, y: number, r: number, strength = 1) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const c = `hsla(${hue.toFixed(0)}, 88%, 62%,`;
      g.addColorStop(0, `${c} ${0.5 * strength})`);
      g.addColorStop(0.45, `${c} ${0.26 * strength})`);
      g.addColorStop(1, `${c} 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      hue = (hue + 1.6) % 360;
    };

    // ---- The self-painting brush: a long slow loop along both headline lines ----
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const headline = host.querySelector<HTMLElement>('.hero__title');
    let autoOn = !reduced;          // never moves by itself for people who prefer reduced motion
    let inView = true;
    let autoResumeAt = 0;           // after the visitor paints, wait before carrying on
    let autoT = 0, autoPrev = 0;
    let autoLast: { x: number; y: number } | null = null;
    const AUTO_LOOP = 8;            // seconds per loop
    const AUTO_STRENGTH = 0.42;     // softer than a hand-made stroke

    const autoPoint = (t: number) => {
      if (!headline) return null;
      const c = canvas.getBoundingClientRect(), b = headline.getBoundingClientRect();
      const cx = (b.left + b.width / 2 - c.left) * SCALE, cy = (b.top + b.height / 2 - c.top) * SCALE;
      // A long loop: left to right along the first line, round the end, back along the second line.
      // It reaches a little past both ends of the text, with a slow wobble so no two loops are the same.
      const ax = b.width * 0.54 * SCALE, ay = b.height * 0.25 * SCALE;
      const a = (t / AUTO_LOOP) * Math.PI * 2;
      const wobble = 1 + 0.12 * Math.sin(a * 0.37) + 0.06 * Math.sin(a * 3.1);
      return { x: cx - ax * Math.cos(a), y: cy - ay * Math.sin(a) * wobble };
    };
    const autoStep = (now: number) => {
      const dt = Math.min(0.05, (now - autoPrev) / 1000);
      autoPrev = now;
      if (!autoOn || !inView || painting || now < autoResumeAt) { autoLast = null; return false; }
      autoT += dt;
      const p = autoPoint(autoT);
      if (!p) return false;
      paintSegment(autoLast, p, radius() * 0.95, AUTO_STRENGTH);
      autoLast = p;
      return true;
    };

    const tick = (t: number) => {
      if (disposed) return;
      if (autoStep(t)) lastStroke = performance.now();
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
    const wake = () => {
      if (disposed) return;
      lastStroke = performance.now();
      if (!raf) { lastFade = autoPrev = lastStroke; raf = requestAnimationFrame(tick); }
    };

    const toCanvas = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();   // same box as the paint canvas, at SCALE
      return { x: (e.clientX - r.left) * SCALE, y: (e.clientY - r.top) * SCALE };
    };
    /** Stamps along a line, close enough together to read as one soft stroke. */
    function paintSegment(from: { x: number; y: number } | null, to: { x: number; y: number }, r: number, strength = 1) {
      if (!from) { stamp(to.x, to.y, r, strength); return; }
      const d = Math.hypot(to.x - from.x, to.y - from.y);
      const steps = Math.max(1, Math.ceil(d / (r * 0.3)));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        stamp(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, r, strength);
      }
    }
    const paintTo = (p: { x: number; y: number }, pressure = 1) => {
      paintSegment(last, p, radius() * (0.75 + 0.5 * pressure));
      last = p;
      render();
      wake();
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      painting = true; last = null; autoResumeAt = Infinity;
      paintTo(toCanvas(e), e.pressure || 1);
    };
    const onMove = (e: PointerEvent) => { if (painting) paintTo(toCanvas(e), e.pressure || 1); };
    const onUp = () => {
      if (!painting) return;
      painting = false; last = null;
      autoResumeAt = performance.now() + 4000;   // let their strokes breathe, then carry on
      wake();
    };

    host.addEventListener('pointerdown', onDown);
    header?.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    // Pause the self-painting brush while the hero is off screen (the browser pauses it in background tabs).
    // (a hidden tab reports nothing as visible, but the browser already pauses animation there)
    const io = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting || document.hidden; if (inView && autoOn) wake(); });
    io.observe(host);

    if (reduced) {
      // A still brushstroke behind the headline instead of the moving brush
      for (let i = 0; i <= 24; i++) { const p = autoPoint((i / 24) * AUTO_LOOP * 0.5); if (p) stamp(p.x, p.y, radius(), 0.7); }
      render();
    } else {
      startTimer = window.setTimeout(wake, 300);
    }

    return () => {
      autoOn = false;
      disposed = true;
      window.clearTimeout(startTimer);
      io.disconnect();
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener('pointerdown', onDown);
      header?.removeEventListener('pointerdown', onDown);
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
