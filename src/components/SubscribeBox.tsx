import { useState } from 'react';
import { BUTTONDOWN_USERNAME } from '../lib/site';
import { wash } from './ListingCard';

/**
 * "Get the weekly roundup": a Buttondown sign-up box. Buttondown wants a normal form post (not fetch), so the
 * form opens Buttondown's confirmation page in a new tab and this box says thank you. Hidden until
 * BUTTONDOWN_USERNAME is set in src/lib/site.ts.
 */
export function SubscribeBox() {
  const [sent, setSent] = useState(false);
  if (!BUTTONDOWN_USERNAME) return null;
  const action = `https://buttondown.com/api/emails/embed-subscribe/${BUTTONDOWN_USERNAME}`;

  return (
    <section className="subscribe-box" aria-labelledby="subscribe-title" style={{ background: wash('weekly-roundup', true) }}>
      <div className="subscribe-box__text">
        <h2 id="subscribe-title">The weekly roundup</h2>
        <p>Every Monday: new open calls, what closes this week, and what's free to enter. Every fee up front.</p>
      </div>
      {sent ? (
        <p className="subscribe-box__done" role="status">
          Nearly there! Check your inbox and click the link to confirm.
        </p>
      ) : (
        <form
          className="subscribe-box__form"
          action={action}
          method="post"
          target="buttondown"
          onSubmit={() => {
            window.open(`https://buttondown.com/${BUTTONDOWN_USERNAME}`, 'buttondown');
            window.setTimeout(() => setSent(true), 0);
          }}
        >
          <label className="sr-only" htmlFor="subscribe-email">Email address</label>
          <input id="subscribe-email" type="email" name="email" required placeholder="Your email" autoComplete="email" />
          <input type="hidden" name="embed" value="1" />
          <input type="hidden" name="tag" value="website" />
          <button type="submit" className="button">Subscribe</button>
        </form>
      )}
      <p className="subscribe-box__small">Free. One email a week. Unsubscribe any time.</p>
    </section>
  );
}
