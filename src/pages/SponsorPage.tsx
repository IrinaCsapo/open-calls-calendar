import { useEffect } from 'react';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { CONTACT_EMAIL } from '../lib/site';
import { wash } from '../components/ListingCard';
import { IconCheck, IconWarn } from '../components/Icons';

const ENQUIRY = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Sponsored feature on Magpie')}&body=${encodeURIComponent(
  'Hi Magpie,\n\nI’d like to feature:\n\nProject name:\nLink:\nWhat it is, in a sentence or two:\nWhich week (if it matters):\n\nThanks!',
)}`;

/**
 * magpie.cool/sponsor: paid features for projects artists might enjoy.
 * TEST PAGE, kept hidden: nothing links here, it isn't in the sitemap or prerendered (so a direct visit gets
 * GitHub Pages' 404 status), and it tells search engines not to index it.
 */
export function SponsorPage() {
  useDocumentTitle('Sponsored features');
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  return (
    <div className="submit sponsor">
      <header className="submit__head">
        <p className="about-eyebrow">Sponsored features</p>
        <h1>Have a project you’d like artists to see?</h1>
        <p className="about-lede">Magpie is a free calendar of open calls, prizes, residencies and events, read by artists
          around the world. If you run something they’d enjoy, a tool, a course, a community project or a space, you can
          feature it on the site and in our Monday email.</p>
      </header>

      <ul className="sponsor__offer">
        <li style={{ background: wash('sponsor-site', true) }}>
          <h2>On magpie.cool for a week</h2>
          <p>Your project, with a picture and a link, in a clearly labelled “Sponsored” spot on the homepage.</p>
        </li>
        <li style={{ background: wash('sponsor-email', true) }}>
          <h2>In the Monday email</h2>
          <p>A short feature in that week’s newsletter, which goes to subscribers with the week’s new calls.</p>
        </li>
      </ul>

      <section className="sponsor__price" aria-labelledby="sponsor-price">
        <h2 id="sponsor-price">US$15 for a week</h2>
        <p>A launch price while Magpie is new. Ask us for the latest visitor and subscriber numbers before you decide.</p>
        <p><a className="button" href={ENQUIRY}>Ask about a feature</a></p>
        <p className="small muted">Or email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We reply within a couple of days.</p>
      </section>

      <ul className="submit__rules">
        <li className="about-label about-label--good">
          <span className="about-label__icon"><IconCheck /></span>
          <div>
            <h2>Always labelled</h2>
            <p>Sponsored features are marked “Sponsored” and kept apart from the listings. They never change where a call
              appears or how its fees are shown.</p>
          </div>
        </li>
        <li className="about-label about-label--warn">
          <span className="about-label__icon"><IconWarn /></span>
          <div>
            <h2>What we don’t feature</h2>
            <p>Pay-to-exhibit offers, calls with hidden fees, or anything we wouldn’t recommend to an artist friend. We read
              every request and can say no. Open calls go on the calendar for free: <a href="/submit">submit one here</a>.</p>
          </div>
        </li>
      </ul>
    </div>
  );
}
