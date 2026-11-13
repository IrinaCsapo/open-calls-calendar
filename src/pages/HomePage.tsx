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
import { Ribbon } from '../components/Ribbon';

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

  // First visit ever: ask "What do you make?" (only on the plain home page, never on a shared filtered link).
  useEffect(() => {
    if (!query.toString() && loadPicks() === null) window.location.replace('#/start');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
      <section className="intro">
        <Ribbon />
        <div className="intro__text">
        <h1>Open calls, prizes and events for artists</h1>
        <p>{SITE_TAGLINE} Updated every morning.</p>
        <p className="intro__links">
          <a href={`webcal://${location.host}${import.meta.env.BASE_URL}${FEED_PATH}`}>Subscribe to all deadlines</a>
          {' · '}
          <a href="#/about">How we label fees</a>
        </p>
        </div>
      </section>

      <FilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters(defaultFilters(filters.currency))} />

      <div className="toolbar">
        <p className="result-count" role="status" aria-live="polite">
          {shown.length} of {live.length} {live.length === 1 ? 'listing' : 'listings'}
          {filters.disciplines.length > 0 && <span className="muted"> for {filters.disciplines.join(', ')}</span>}
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
