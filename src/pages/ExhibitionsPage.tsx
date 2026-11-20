import { useMemo, useState } from 'react';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { EXHIBITIONS } from '../lib/listings';
import { closesAt, endsAt, isLive, useNow } from '../lib/dates';
import { PLACES, matchesPlaces, type Place } from '../lib/filters';
import { distanceKm, guessPlace, loadPlaceSetting, nearYou, type Coords } from '../lib/location';
import { replaceHashQuery, useHashRoute } from '../lib/useHashRoute';
import { ListingRow } from '../components/ListingRow';
import { IconCheck, IconPin, IconSearch } from '../components/Icons';
import type { Listing } from '../types/listing';

const normalise = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
const text = (l: Listing) => normalise([l.title, l.organiser, l.venue ?? '', l.city, l.country, l.region, l.eligibility, ...l.disciplines, ...(l.highlights ?? [])].join(' '));

/**
 * magpie.cool/exhibitions: shows to go and see, on now and opening soon, searchable by city, gallery or artist.
 * The search, place and free-entry choice live in the link (?q=…&where=…&free=1), so a filtered view can be shared.
 */
export function ExhibitionsPage() {
  useDocumentTitle('Exhibitions to see');
  const now = useNow();
  const { query } = useHashRoute();
  const [q, setQ] = useState(() => query.get('q') ?? '');
  const [where, setWhere] = useState<Place | ''>(() => ((PLACES as readonly string[]).includes(query.get('where') ?? '') ? (query.get('where') as Place) : ''));
  const [free, setFree] = useState(() => query.get('free') === '1');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState<'idle' | 'asking' | 'denied'>('idle');

  const sync = (next: { q?: string; where?: Place | ''; free?: boolean }) => {
    const v = { q, where, free, ...next };
    const p = new URLSearchParams();
    if (v.q.trim()) p.set('q', v.q.trim());
    if (v.where) p.set('where', v.where);
    if (v.free) p.set('free', '1');
    replaceHashQuery(p.toString());
  };
  const locate = () => {
    if (coords) { setCoords(null); return; }
    if (!navigator.geolocation) { setLocating('denied'); return; }
    setLocating('asking');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating('idle'); },
      () => setLocating('denied'),
      { maximumAge: 600_000, timeout: 15_000 },
    );
  };

  const setting = loadPlaceSetting();
  const myPlace = setting === 'off' ? null : setting === 'auto' ? guessPlace() : setting;

  const live = useMemo(() => EXHIBITIONS.filter((l) => isLive(l, now)), [now]);
  const shown = useMemo(() => {
    const words = normalise(q).split(/\s+/).filter(Boolean);
    return live.filter((l) => (!words.length || words.every((w) => text(l).includes(w)))
      && matchesPlaces(l, where ? [where] : [])
      && (!free || l.entry_fee === 'Free'));
  }, [live, q, where, free]);

  const onNow = shown.filter((l) => closesAt(l) <= now).sort((a, b) => endsAt(a) - endsAt(b));
  const soon = shown.filter((l) => closesAt(l) > now).sort((a, b) => closesAt(a) - closesAt(b));
  const filtered = !!(q.trim() || where);
  const near = useMemo(() => {
    if (filtered) return [];
    // on now (ending soonest), then opening soon (opening soonest)
    const order = (a: Listing, b: Listing) => {
      const aOn = closesAt(a) <= now, bOn = closesAt(b) <= now;
      if (aOn !== bOn) return aOn ? -1 : 1;
      return aOn ? endsAt(a) - endsAt(b) : closesAt(a) - closesAt(b);
    };
    const list = nearYou(shown, myPlace, coords);
    if (!coords) {
      const local = myPlace ? list.filter((l) => matchesPlaces(l, [myPlace])) : list;   // their own place first, then the wider region
      return [...local.sort(order), ...list.filter((l) => !local.includes(l)).sort(order)];
    }
    const d = (l: Listing) => (l.lat !== undefined && l.lng !== undefined ? distanceKm(coords, { lat: l.lat, lng: l.lng }) : Infinity);
    return [...list].sort((a, b) => d(a) - d(b));
  }, [shown, myPlace, coords, filtered, now]);
  const active = [q.trim(), where, free].filter(Boolean).length;

  return (
    <div className="exhibitions">
      <header className="submit__head collection__head">
        <p className="about-eyebrow">Exhibitions</p>
        <h1>Exhibitions to see, on now and coming up</h1>
        <p className="about-lede">Open exhibitions, prize shows, galleries and museums worth a visit, with the dates, the price
          of a ticket, and free talks and late openings. Search by city, gallery or artist.</p>
      </header>

      <form className="filterbar" role="search" aria-label="Find exhibitions" onSubmit={(e) => { e.preventDefault(); document.getElementById('ex-results')?.scrollIntoView({ behavior: 'smooth' }); }}>
        <div className="searchbar">
          <IconSearch className="searchbar__icon" />
          <label className="sr-only" htmlFor="ex-q">Search exhibitions</label>
          <input id="ex-q" type="search" value={q} placeholder="City, gallery or artist" onChange={(e) => { setQ(e.target.value); sync({ q: e.target.value }); }} />
          <button type="submit" className="searchbar__button">Search</button>
        </div>
        <div className="quickbar">
          <div className="quickbar__chips">
            <button type="button" role="switch" aria-checked={free} className={`free-switch${free ? ' is-on' : ''}`}
              onClick={() => { setFree(!free); sync({ free: !free }); }}>
              <span className="free-switch__track" aria-hidden="true"><span className="free-switch__thumb" /></span>
              <span className="free-switch__label">Free entry</span>
            </button>
            <span className="quickbar__divider" aria-hidden="true" />
            <label className="where">
              <span className="sr-only">Where</span>
              <select className={`where__select${where ? ' is-on' : ''}`} value={where} onChange={(e) => { setWhere(e.target.value as Place | ''); sync({ where: e.target.value as Place | '' }); }}>
                <option value="">Anywhere</option>
                <optgroup label="Countries">{PLACES.slice(0, 4).map((p) => <option key={p} value={p}>{p}</option>)}</optgroup>
                <optgroup label="Continents">{PLACES.slice(4).map((p) => <option key={p} value={p}>{p}</option>)}</optgroup>
              </select>
            </label>
            <button type="button" className={`chip${coords ? ' is-on' : ''}`} onClick={locate} disabled={locating === 'asking'}>
              {coords ? <><IconCheck />Nearest first · Stop</> : <><IconPin />{locating === 'asking' ? 'Finding you…' : 'Near me'}</>}
            </button>
            {active > 0 && (
              <button type="button" className="quickbar__clear" onClick={() => { setQ(''); setWhere(''); setFree(false); replaceHashQuery(''); }}>
                <span aria-hidden="true">✕</span> Clear {active} {active === 1 ? 'filter' : 'filters'}
              </button>
            )}
          </div>
          <p className="quickbar__count" role="status" aria-live="polite"><strong>{shown.length}</strong> {shown.length === 1 ? 'exhibition' : 'exhibitions'}</p>
        </div>
        {locating === 'denied' && <p className="hint filterbar__hint">We couldn’t get your location. Choose a place instead.</p>}
        {coords && <p className="hint filterbar__hint">Your location stays in this browser: it is never sent or stored.</p>}
      </form>

      <div className="rows" id="ex-results">
        {shown.length === 0 && (
          <div className="empty">
            <h2>No exhibitions match</h2>
            <p>Try another city or fewer filters. New exhibitions are added every week.</p>
          </div>
        )}
        {near.length > 0 && (
          <ListingRow key={`near-${!!coords}`} id="ex-near" title={coords ? 'Near you' : `Near you · ${myPlace}`} listings={near} now={now}
            note={coords ? 'Closest first.' : 'Based on your time zone.'} />
        )}
        {onNow.length > 0 && <ListingRow key={`now-${filtered}`} id="ex-now" title="On now" listings={onNow} now={now} startOpen={filtered} note="Ending soonest first." />}
        {soon.length > 0 && <ListingRow key={`soon-${filtered}`} id="ex-soon" title="Opening soon" listings={soon} now={now} startOpen={filtered} />}
      </div>

      <p className="exhibitions__submit">Know an exhibition artists should see? <a href="/submit">Tell us about it</a>.</p>
    </div>
  );
}
