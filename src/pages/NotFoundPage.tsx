import { useMemo } from 'react';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { LISTINGS } from '../lib/listings';
import { closesAt, isLive, useNow } from '../lib/dates';
import { wash } from '../components/ListingCard';
import { ListingRow } from '../components/ListingRow';
import bird from '../assets/magpie-bird.png';

/** Shown for unknown addresses and listings that don't exist: the magpie, a way back, and what's closing soon. */
export function NotFoundPage() {
  useDocumentTitle('Not found');
  const now = useNow();
  const soon = useMemo(
    () => LISTINGS.filter((l) => isLive(l, now) && !l.commercial).sort((a, b) => closesAt(a) - closesAt(b)).slice(0, 4),
    [now],
  );

  return (
    <>
      <section className="lost">
        <div className="lost__bird" style={{ background: wash('lost-magpie', true) }}>
          <img src={bird} alt="" width="220" height="220" />
        </div>
        <div>
          <p className="about-eyebrow">404</p>
          <h1>This page flew off</h1>
          <p className="about-lede">Magpies collect shiny things, but this one isn't here. The link may have a typo, or the page
            has moved.</p>
          <p className="lost__actions">
            <a className="button" href="/">Browse open calls</a>
            <a className="button button--secondary" href="/submit">Submit a call</a>
          </p>
        </div>
      </section>
      {soon.length > 0 && (
        <div className="rows">
          <ListingRow id="lost-soon" title="Closing soon" listings={soon} now={now} />
        </div>
      )}
    </>
  );
}
