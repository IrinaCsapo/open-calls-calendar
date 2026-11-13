import { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface WordRotatorProps {
  /** The first word is the one it starts and finishes on */
  words: string[];
  /** The words' colours, in turn (defaults to the live hero's) */
  colors?: string[];
  /** Milliseconds each word stays */
  every?: number;
  /** Full rounds before it settles back on the first word. Infinity (the default) keeps it going. */
  rounds?: number;
}

/**
 * Swaps the last word of the headline: open call → residency → prize → …
 * Decorative: the heading carries the full sentence for screen readers, so this is aria-hidden.
 * No movement with reduced motion. Keeps looping unless `rounds` is set.
 */
// Each word takes the next colour, all from the site palette and at least 4.5:1 on the background:
// blue 6.3:1, burnt orange 5.3:1, teal 5.4:1, plum 6.6:1.
const COLORS = ['#1d5cb4', '#b1530c', '#0b7a6a', '#7a4f93'];

export function WordRotator({ words, colors = COLORS, every = 2400, rounds = Infinity }: WordRotatorProps) {
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState<number>();
  const measure = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let step = 0;
    const total = words.length * rounds;           // ends back on words[0]
    const id = window.setInterval(() => {
      if (document.hidden) return;                 // don't race through words in a background tab
      step += 1;
      setIndex(step % words.length);
      if (step >= total) window.clearInterval(id);
    }, every);
    return () => window.clearInterval(id);
  }, [words, every, rounds]);

  // The space for the word eases to each new word's width, so the line doesn't jump
  useLayoutEffect(() => {
    const el = measure.current?.children[index] as HTMLElement | undefined;
    if (!el) return;
    const update = () => setWidth(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [index]);

  return (
    <span className="word-rotator" aria-hidden="true" style={{ width }}>
      <span key={index} className="word-rotator__word" style={{ color: colors[index % colors.length] }}>
        {words[index]}
      </span>
      {/* Invisible copies, used to measure each word */}
      <span ref={measure} className="word-rotator__measure">
        {words.map((w) => <span key={w}>{w}</span>)}
      </span>
    </span>
  );
}
