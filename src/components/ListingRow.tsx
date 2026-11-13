import { useState } from 'react';
import type { Currency, Listing } from '../types/listing';
import { ListingCard } from './ListingCard';

const ROW = 4; // one row of four until "Show all" is pressed

/** A section like "Closing this week": serif title, count, "Show all N →", then a row of cards. */
export function ListingRow({ id, title, listings, currency, now, startOpen = false }: {
  id: string; title: string; listings: Listing[]; currency: Currency; now: number; startOpen?: boolean;
}) {
  const [open, setOpen] = useState(startOpen);
  const shown = open ? listings : listings.slice(0, ROW);
  const more = listings.length > ROW;
  return (
    <section className={`row row--${id}`} aria-labelledby={`row-${id}`}>
      <div className="row__head">
        <h2 id={`row-${id}`} className="row__title">
          {title}
          <span className="row__count"><span className="sr-only">, </span>{listings.length} {listings.length === 1 ? 'listing' : 'listings'}</span>
        </h2>
        {more && (
          <button type="button" className="button button--secondary" aria-expanded={open} aria-controls={`row-list-${id}`} onClick={() => setOpen(!open)}>
            {open ? 'Show fewer' : `Show all ${listings.length}`}<span className="sr-only"> {title.toLowerCase()}</span>
            <span aria-hidden="true">{open ? ' ↑' : ' →'}</span>
          </button>
        )}
      </div>
      <ul id={`row-list-${id}`} className={`row__items${open ? ' is-expanded' : ''}`}>
        {shown.map((l) => <li key={l.id}><ListingCard listing={l} currency={currency} now={now} /></li>)}
      </ul>
    </section>
  );
}
