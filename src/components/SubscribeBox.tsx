import { useState } from 'react';
import { NEWSLETTER_FORM_URL } from '../lib/site';
import { guessPlace, loadPlaceSetting } from '../lib/location';
import { wash } from './ListingCard';

/**
 * "The weekly roundup": sends the address straight to Magpie's Brevo sign-up form (double opt-in: Brevo emails a
 * confirm link, then sends them to /subscribed), so Magpie itself never stores it. Also sends their place (UK,
 * Europe, US…, from "Near you" or their time zone) so the welcome and weekly emails can show calls near them.
 * Hidden until NEWSLETTER_FORM_URL is set in src/lib/site.ts.
 */
export function SubscribeBox() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  if (!NEWSLETTER_FORM_URL) return null;

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

  return (
    <section className="subscribe-box" aria-labelledby="subscribe-title" style={{ background: wash('weekly-roundup', true) }}>
      <div className="subscribe-box__text">
        <p className="subscribe-box__eyebrow">The Magpie weekly email</p>
        <h2 id="subscribe-title">Open calls in your inbox, every Monday</h2>
        <p>One short email with new open calls, prizes, residencies and events for artists, the ones closing that week,
          and calls near you. Every fee shown up front.</p>
      </div>
      {state === 'done' ? (
        <p className="subscribe-box__done" role="status">
          Nearly there! Check your inbox for an email from Magpie (hello@magpie.cool) and click “Yes, send me the weekly
          email”. It can take a minute, so check spam too.
        </p>
      ) : (
        <form className="subscribe-box__form" onSubmit={submit}>
          <label className="sr-only" htmlFor="subscribe-email">Email address</label>
          <input id="subscribe-email" type="email" name="EMAIL" required placeholder="Your email" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit" className="button" disabled={state === 'sending'}>{state === 'sending' ? 'Signing up…' : 'Subscribe'}</button>
        </form>
      )}
      <p className="subscribe-box__small">
        {state === 'error' ? 'Something went wrong. Please try again in a moment.' : <>Free, from hello@magpie.cool every Monday morning. Unsubscribe in one click, and we never share your email. <a href="/privacy">Privacy</a></>}
      </p>
    </section>
  );
}
