import { useEffect, useRef, useState } from 'react';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { SUBMIT_FORM_URL, TALLY_FORM_ID } from '../lib/site';
import { wash } from '../components/ListingCard';
import { IconCheck, IconWarn } from '../components/Icons';
import bird from '../assets/magpie-bird.png';

const EMBED = `https://tally.so/embed/${TALLY_FORM_ID}?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1`;

export function SubmitPage() {
  useDocumentTitle('Submit an open call');

  // Tally's script loads the form and resizes it to fit its questions (no inner scrollbar). It only takes over
  // an iframe that has data-tally-src and no src yet; if the script is blocked, load the form directly instead.
  const [sent, setSent] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const w = window as unknown as { Tally?: { loadEmbeds: () => void } };
    // Tally loads the form lazily (when it scrolls into view), so only step in if its script never arrives
    const fallback = window.setTimeout(() => { if (!w.Tally && frame.current && !frame.current.src) frame.current.src = EMBED; }, 6000);
    if (w.Tally) w.Tally.loadEmbeds();
    else if (!document.querySelector('script[src="https://tally.so/widgets/embed.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://tally.so/widgets/embed.js';
      script.async = true;
      script.onload = () => w.Tally?.loadEmbeds();
      script.onerror = () => { if (frame.current && !frame.current.src) frame.current.src = EMBED; };   // blocked: load it directly
      document.body.appendChild(script);
    }
    return () => window.clearTimeout(fallback);
  }, [sent]);

  // When the form is sent, Tally tells this page ("Tally.FormSubmitted"). We swap the form for our own
  // thank-you, so Tally's free-plan "make your own form" screen doesn't stay on screen.
  const thanks = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== 'https://tally.so' || typeof e.data !== 'string' || !e.data.includes('Tally.FormSubmitted')) return;
      setSent(true);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);
  useEffect(() => {
    if (!sent || !thanks.current) return;
    thanks.current.scrollIntoView({ block: 'center' });
    thanks.current.focus();
  }, [sent]);

  return (
    <div className="submit">
      <header className="submit__head">
        <p className="about-eyebrow">Submit</p>
        <h1>Send us an open call</h1>
        <p className="about-lede">Know an open call, prize, residency, grant or event for artists that we're missing? Organisers
          and artists are both welcome. We check every submission on the organiser's own page before it goes live.</p>
      </header>

      <ul className="submit__rules">
        <li className="about-label about-label--good">
          <span className="about-label__icon"><IconCheck /></span>
          <div>
            <h2>What we list</h2>
            <p>Open calls, prizes, residencies, grants, commissions and artist events, in any medium, anywhere in the
              world. Free and paid, as long as every fee is clear.</p>
          </div>
        </li>
        <li className="about-label about-label--warn">
          <span className="about-label__icon"><IconWarn /></span>
          <div>
            <h2>Please include every fee</h2>
            <p>The entry fee, and anything selected artists pay later: hanging or exhibition fees, "secure your space",
              framing or shipping you must buy from the organiser, and commission on sales.</p>
          </div>
        </li>
      </ul>

      {sent ? (
        <div ref={thanks} className="submit-thanks" tabIndex={-1} role="status" style={{ background: wash('submit-thanks', true) }}>
          <img src={bird} alt="" width="160" height="160" />
          <h2>Thank you, the magpie has it!</h2>
          <p>We'll check the details and fees on the organiser's page and add it, usually within a day or two. If you left
            your email, we'll tell you when it's live.</p>
          <p className="about-cta__actions">
            <a className="button" href="/">Browse calls</a>
            <button type="button" className="button button--secondary" onClick={() => setSent(false)}>Submit another</button>
          </p>
        </div>
      ) : (
        <div className="submit__form">
          <iframe ref={frame} data-tally-src={EMBED} width="100%" height="1800" title="Submit an open call to Magpie" />
        </div>
      )}

      <p className="small muted submit__alt">
        No account needed. We only use your email to tell you when your listing is live. Prefer GitHub?{' '}
        <a href={SUBMIT_FORM_URL} target="_blank" rel="noopener noreferrer">Use the GitHub form</a>.
      </p>
    </div>
  );
}
