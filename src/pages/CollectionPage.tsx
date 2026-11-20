import { useMemo } from 'react';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { LISTINGS } from '../lib/listings';
import { closesAt, isLive, useNow } from '../lib/dates';
import { COLLECTIONS, collectionUrl, type Collection } from '../lib/collections';
import { ListingRow } from '../components/ListingRow';

const GROUPS = [
  { group: 'Kinds', title: 'By kind' },
  { group: 'Disciplines', title: 'By what you make' },
  { group: 'Places', title: 'By place' },
] as const;

/** Links to every collection, with how many calls are open in each. */
function Browse({ now, current }: { now: number; current?: string }) {
  const live = LISTINGS.filter((l) => isLive(l, now));
  return (
    <nav className="browse" aria-label="Browse open calls">
      {GROUPS.map((g) => (
        <section key={g.group} className="browse__group">
          <h2>{g.title}</h2>
          <ul>
            {COLLECTIONS.filter((c) => c.group === g.group).map((c) => (
              <li key={c.slug}>
                <a href={collectionUrl(c)} aria-current={c.slug === current ? 'page' : undefined}>
                  {c.label} <span className="browse__n">{live.filter(c.match).length}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}

/** magpie.cool/open-calls: every way to browse. */
export function CollectionsHubPage() {
  useDocumentTitle('Browse open calls');
  const now = useNow();
  return (
    <div className="collection">
      <header className="submit__head collection__head">
        <p className="about-eyebrow">Browse</p>
        <h1>Open calls for artists, by kind, discipline and place</h1>
        <p className="about-lede">Open calls, prizes, residencies, grants and events for artists worldwide, every fee shown up
          front. Pick a page to see what’s open now, closing soonest first.</p>
      </header>
      <Browse now={now} />
    </div>
  );
}

/** magpie.cool/open-calls/<slug>: e.g. open calls for photographers, or in the UK. */
export function CollectionPage({ c }: { c: Collection }) {
  useDocumentTitle(c.title);
  const now = useNow();
  const { main, commercial } = useMemo(() => {
    const list = LISTINGS.filter((l) => isLive(l, now) && c.match(l)).sort((a, b) => closesAt(a) - closesAt(b));
    return { main: list.filter((l) => !l.commercial), commercial: list.filter((l) => l.commercial) };
  }, [c, now]);

  return (
    <div className="collection">
      <header className="submit__head collection__head">
        <p className="about-eyebrow"><a href="/open-calls">Browse</a> · {c.label}</p>
        <h1>{c.h1}</h1>
        <p className="about-lede">{c.intro}</p>
      </header>
      <div className="rows">
        {main.length > 0
          ? <ListingRow id={`c-${c.slug}`} title="Open now" listings={main} now={now} startOpen />
          : <p className="collection__empty">Nothing open here right now. New calls are added every morning: <a href="/">see everything that’s open</a>.</p>}
        {commercial.length > 0 && (
          <ListingRow id={`c-${c.slug}-commercial`} title="Commercial opportunities" listings={commercial} now={now}
            note="Run as a business: you pay to enter or to be shown. Listed apart, with the price on the card." />
        )}
      </div>
      <Browse now={now} current={c.slug} />
    </div>
  );
}
