import { useState } from 'react';
import { IconMail } from './Icons';
import { NEWSLETTER_FORM_URL } from '../lib/site';
import { guessPlace, loadPlaceSetting } from '../lib/location';

/**
 * Signing up for the weekly email: sends the address straight to Magpie's Brevo sign-up form (double opt-in: Brevo
 * emails a confirm link, then sends them to /subscribed), so Magpie itself never stores it. Also sends their place
 * (UK, Europe, US…, from "Near you" or their time zone) so the welcome and weekly emails can show calls near them.
 */
function useSubscribe() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    const setting = loadPlaceSetting();
    const place = setting === 'off' ? '' : setting === 'auto' ? guessPlace() ?? '' : setting;
    const body = new FormData();
    body.append('EMAIL', email.trim());
    body.append('PLACE', place);
    body.append('email_address_check', '');   // Brevo's spam trap: must stay empty
    body.append('locale', 'en');
    try {
      // Brevo doesn't let another site read its reply, so a sent request counts as success
      await fetch(NEWSLETTER_FORM_URL, { method: 'POST', body, mode: 'no-cors' });
      setState('done');
    } catch {
      setState('error');
    }
  };
  return { email, setEmail, state, submit };
}

const DONE = <>Nearly there! Check your inbox for an email from Magpie (hello@magpie.cool) and click “Yes, send me the weekly email”. It can take a minute, so check spam too.</>;
const SMALL = <>Free, every Monday. Unsubscribe any time. <a href="/privacy">Privacy</a></>;
const ERROR = 'Something went wrong. Please try again in a moment.';

/** The email field and button, with the small print under it. */
function SubscribeForm({ id, s, small = SMALL }: { id: string; s: ReturnType<typeof useSubscribe>; small?: React.ReactNode }) {
  return (
    <div className="subscribe-box__action">
      {s.state === 'done' ? (
        <p className="subscribe-box__done" role="status">{DONE}</p>
      ) : (
        <form className="subscribe-box__form" onSubmit={s.submit}>
          <label className="sr-only" htmlFor={id}>Email address</label>
          <input id={id} type="email" name="EMAIL" required placeholder="Your email" autoComplete="email"
            value={s.email} onChange={(e) => s.setEmail(e.target.value)} />
          <button type="submit" className="button" disabled={s.state === 'sending'}>{s.state === 'sending' ? 'Signing up…' : 'Subscribe'}</button>
        </form>
      )}
      <p className="subscribe-box__small">{s.state === 'error' ? ERROR : small}</p>
    </div>
  );
}

/** The sign-up in the homepage hero. Hidden until NEWSLETTER_FORM_URL is set in src/lib/site.ts. */
export function SubscribeHero() {
  const s = useSubscribe();
  // Phones start with one button, so the search bar below is the only field on screen; tapping it shows the field
  const [open, setOpen] = useState(false);
  if (!NEWSLETTER_FORM_URL) return null;
  return (
    <div className={`hero__subscribe${open ? ' is-open' : ''}`}>
      <button type="button" className="button hero__subscribe-toggle" onClick={() => { setOpen(true); setTimeout(() => document.getElementById('hero-email')?.focus(), 0); }}>
        <IconMail />Get new calls every Monday
      </button>
      <div className="hero__subscribe-body">
        <p className="hero__subscribe-label">Get new open calls in your inbox, every Monday</p>
        <SubscribeForm id="hero-email" s={s} />
      </div>
    </div>
  );
}

/** "The Magpie weekly email" box above the footer. Hidden until NEWSLETTER_FORM_URL is set in src/lib/site.ts. */
export function SubscribeBox() {
  const s = useSubscribe();
  if (!NEWSLETTER_FORM_URL) return null;
  return (
    <section className="subscribe-box subscribe-box--warm" aria-labelledby="subscribe-title">
      <div className="subscribe-box__text">
        <p className="subscribe-box__eyebrow">The Magpie weekly email</p>
        <h2 id="subscribe-title">Open calls in your inbox, every Monday</h2>
        <p>One short email with new open calls, prizes, residencies and events for artists, the ones closing that week,
          and calls near you. Every fee shown up front.</p>
      </div>
      <SubscribeForm id="subscribe-email" s={s} />
    </section>
  );
}
