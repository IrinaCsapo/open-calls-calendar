import { useEffect, useMemo, useState } from 'react';
import { LISTINGS } from '../lib/listings';
import { isLive, urgencyGroup, useNow } from '../lib/dates';
import { SORT_LABELS, applyFilters, defaultFilters, filtersFromQuery, filtersToQuery, loadPicks, sortListings, type Filters } from '../lib/filters';
import { guessCurrency } from '../lib/money';
import { replaceHashQuery, useHashRoute } from '../lib/useHashRoute';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { FEED_PATH, SITE_TAGLINE } from '../lib/site';
import { FilterPanel } from '../components/FilterPanel';
import { ListingRow } from '../components/ListingRow';
import { CalendarView } from '../components/CalendarView';


const GROUPS = [
  { key: 'week', label: 'Closing this week' },
  { key: 'month', label: 'Closing in the next month' },
  { key: 'later', label: 'Later' },
  { key: 'now', label: 'Happening now' },
] as const;

type View = 'list' | 'calendar';

export function HomePage() {
  useDocumentTitle();
  const { query } = useHashRoute();
  const now = useNow();
  const fallbackCurrency = useMemo(guessCurrency, []);
  // A plain visit (no filters in the link) starts from the disciplines picked on the start screen.
  const fromUrl = (q: URLSearchParams): Filters => {
    const f = filtersFromQuery(q, fallbackCurrency);
    return q.toString() ? f : { ...f, disciplines: loadPicks() ?? [] };
  };
  const [filters, setFiltersState] = useState<Filters>(() => fromUrl(query));

  const [view, setViewState] = useState<View>(query.get('view') === 'calendar' ? 'calendar' : 'list');

  // A hashchange means a link was followed (our own filter changes use replaceState, which doesn't fire one),
  // so take the filters from the new URL.
  const queryString = query.toString();
  useEffect(() => {
    const q = new URLSearchParams(queryString);
    setFiltersState(fromUrl(q));
    setViewState(q.get('view') === 'calendar' ? 'calendar' : 'list');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString, fallbackCurrency]);

  const sync = (f: Filters, v: View) => {
    const q = new URLSearchParams(filtersToQuery(f, fallbackCurrency));
    if (v === 'calendar') q.set('view', 'calendar');
    replaceHashQuery(q.toString());
  };
  const setFilters = (f: Filters) => { setFiltersState(f); sync(f, view); };
  const setView = (v: View) => { setViewState(v); sync(filters, v); };

  const live = useMemo(() => LISTINGS.filter((l) => isLive(l, now)), [now]);
  const shown = useMemo(() => sortListings(applyFilters(live, filters, now), filters), [live, filters, now]);
  const grouped = filters.sort === 'closing';

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <h1 id="hero-title" className="hero__title"><span>Open calls, prizes and</span> <span>events <em>for artists</em></span></h1>
        <p className="hero__lede">{SITE_TAGLINE} Updated every morning.</p>
        <div className="hero__actions">
          <button type="button" className="button hero__button" onClick={() => document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' })}>
            Browse calls
          </button>
          <a className="button button--secondary hero__button" href="#/submit">Submit a call</a>
        </div>
        <p className="hero__links small">
          <a href={`webcal://${location.host}${import.meta.env.BASE_URL}${FEED_PATH}`}>Subscribe to all deadlines</a>
          {' · '}
          <a href="#/about">How we label fees</a>
        </p>
      </section>

      <div id="browse" className="browse-anchor" />
      <FilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters(defaultFilters(filters.currency))} count={shown.length} />

      <div className="toolbar" id="results">
        <p className="result-count">
          {filters.disciplines.length > 0 && <>Showing calls for <strong>{filters.disciplines.join(', ')}</strong>.</>}
          {' '}<a href="#/start" className="small">{filters.disciplines.length ? 'Edit what you make' : 'Tell us what you make'}</a>
        </p>
        <div className="view-switch" role="group" aria-label="View">
          <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>List</button>
          <button type="button" aria-pressed={view === 'calendar'} onClick={() => setView('calendar')}>Calendar</button>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="empty">
          <h2>Nothing matches those filters</h2>
          <p>Try fewer filters, or <a href="#/">see everything</a>.</p>
        </div>
      ) : view === 'calendar' ? (
        <CalendarView listings={shown} />
      ) : grouped ? (
        <div className="rows">
          {GROUPS.map((g) => {
            const items = shown.filter((l) => urgencyGroup(l, now) === g.key);
            return items.length ? <ListingRow key={g.key} id={g.key} title={g.label} listings={items} currency={filters.currency} now={now} /> : null;
          })}
        </div>
      ) : (
        <div className="rows">
          <ListingRow key={filters.sort} id="sorted" title={SORT_LABELS[filters.sort]} listings={shown} currency={filters.currency} now={now} startOpen />
        </div>
      )}
    </>
  );
}
