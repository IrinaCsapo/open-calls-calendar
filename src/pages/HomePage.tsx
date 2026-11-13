import { useEffect, useMemo, useState } from 'react';
import { LISTINGS } from '../lib/listings';
import { isLive, urgencyGroup, useNow } from '../lib/dates';
import { SORT_LABELS, applyFilters, defaultFilters, filtersFromQuery, filtersToQuery, sortListings, type Filters } from '../lib/filters';
import { guessCurrency } from '../lib/money';
import { replaceHashQuery, useHashRoute } from '../lib/useHashRoute';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { SITE_TAGLINE } from '../lib/site';
import { FilterPanel } from '../components/FilterPanel';
import { ListingRow } from '../components/ListingRow';
import { HeroPaint } from '../components/HeroPaint';
import { guessPlace, loadPlaceSetting, nearYou, savePlaceSetting, type Coords, type PlaceSetting } from '../lib/location';
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
  // Filters come only from the link: a plain visit always opens unfiltered. (Picks made on "What do you
  // make?" are applied by the link that page sends you to, and remembered there for next time.)
  const fromUrl = (q: URLSearchParams): Filters => filtersFromQuery(q, fallbackCurrency);
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

  // ---- Near you ----
  const guess = useMemo(guessPlace, []);
  const [placeSetting, setPlaceSettingState] = useState<PlaceSetting>(loadPlaceSetting);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState<'idle' | 'asking' | 'denied'>('idle');
  const setPlaceSetting = (v: PlaceSetting) => { setPlaceSettingState(v); savePlaceSetting(v); };
  const place = placeSetting === 'off' ? null : placeSetting === 'auto' ? guess : placeSetting;
  const locate = () => {
    if (!navigator.geolocation) { setLocating('denied'); return; }
    setLocating('asking');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating('idle'); if (placeSetting === 'off') setPlaceSetting('auto'); },
      () => setLocating('denied'),
      { maximumAge: 600_000, timeout: 15_000 },
    );
  };

  const live = useMemo(() => LISTINGS.filter((l) => isLive(l, now)), [now]);
  const shown = useMemo(() => sortListings(applyFilters(live, filters, now), filters), [live, filters, now]);
  const grouped = filters.sort === 'closing';
  const near = useMemo(
    () => (placeSetting === 'off' || filters.places.length ? [] : nearYou(shown, place, coords)),
    [shown, place, coords, placeSetting, filters.places.length],
  );
  const nearTitle = coords ? 'Near you' : place ? `Near you · ${place}` : 'Near you';

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <HeroPaint />
        <h1 id="hero-title" className="hero__title"><span>Open calls, prizes and</span> <span>events <em>for artists</em></span></h1>
        <p className="hero__lede">{SITE_TAGLINE} Updated every morning.</p>
        <div className="hero__actions">
          <button type="button" className="button hero__button" onClick={() => document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' })}>
            Browse calls
          </button>
          <a className="button button--secondary hero__button" href="#/submit">Submit a call</a>
        </div>
        <p className="hero__hint" aria-hidden="true"><span className="hero__hint--mouse">Click and drag to paint</span><span className="hero__hint--touch">Drag sideways to paint</span></p>
      </section>

      <div id="browse" className="browse-anchor" />
      <FilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters(defaultFilters(filters.currency))} count={shown.length}
        location={{ setting: placeSetting, guess, onSetting: setPlaceSetting, onLocate: locate, locating, hasCoords: !!coords, onForget: () => setCoords(null) }} />

      <div className="toolbar" id="results">
        <p className="result-count">
          {filters.disciplines.length > 0 && <>Showing calls for <strong>{filters.disciplines.join(', ')}</strong>.</>}
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
          {near.length > 0 && (
            <ListingRow key={`near-${place}-${!!coords}`} id="near" title={nearTitle} listings={near} now={now}
              note={<>{coords ? 'Closest to your location first.' : 'Based on your time zone.'} Change it under <em>More filters</em>.</>} />
          )}
          {GROUPS.map((g) => {
            const items = shown.filter((l) => urgencyGroup(l, now) === g.key);
            return items.length ? <ListingRow key={g.key} id={g.key} title={g.label} listings={items} now={now} /> : null;
          })}
        </div>
      ) : (
        <div className="rows">
          <ListingRow key={filters.sort} id="sorted" title={SORT_LABELS[filters.sort]} listings={shown} now={now} startOpen />
        </div>
      )}
    </>
  );
}
