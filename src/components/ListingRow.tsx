import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Listing } from '../types/listing';
import { ListingCard } from './ListingCard';

const ROW = 4; // phones: four cards to swipe through until "View all" is pressed

/** How many cards fit across the row (the grid decides; it's a sideways-scrolling strip on phones). */
function useColumns() {
  const ref = useRef<HTMLUListElement>(null);
  const [cols, setCols] = useState(ROW);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const t = getComputedStyle(el).gridTemplateColumns;
      setCols(t && t !== 'none' ? t.split(' ').length : ROW);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, cols] as const;
}

/** A section like "Closing this week": serif title, "18 listings · View all", then a row of cards. */
export function ListingRow({ id, title, listings, now, startOpen = false, note, aside }: {
  id: string; title: string; listings: Listing[]; now: number; startOpen?: boolean; note?: ReactNode;
  aside?: ReactNode;   // shown at the right of the heading line (the List / Calendar switch on the first row)
}) {
  const [open, setOpen] = useState(startOpen);
  const [listRef, cols] = useColumns();
  const shown = open ? listings : listings.slice(0, cols);
  const more = listings.length > cols;
  return (
    <section className={`row row--${id}`} aria-labelledby={`row-${id}`}>
      <div className="row__head">
        <h2 id={`row-${id}`} className="row__title">
          {title}
          <span className="row__count"><span className="sr-only">, </span>{listings.length} {listings.length === 1 ? 'listing' : 'listings'}</span>
        </h2>
        {more && (
          <button type="button" className="row__toggle" aria-expanded={open} aria-controls={`row-list-${id}`} onClick={() => setOpen(!open)}>
            {open ? 'View fewer' : 'View all'}<span className="sr-only"> {title.toLowerCase()}</span>
          </button>
        )}
        {aside && <div className="row__aside">{aside}</div>}
      </div>
      {note && <p className="row__note">{note}</p>}
      <ul ref={listRef} id={`row-list-${id}`} className={`row__items${open ? ' is-expanded' : ''}`}>
        {shown.map((l) => <li key={l.id}><ListingCard listing={l} now={now} /></li>)}
      </ul>
    </section>
  );
}
