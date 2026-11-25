import { useMemo, useState } from 'react';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { EVENT_TYPES, LISTINGS, isEvent } from '../lib/listings';
import { closesAt, isLive, useNow } from '../lib/dates';
import { PLACES, matchesPlaces, type Place } from '../lib/filters';
import { replaceHashQuery, useHashRoute } from '../lib/useHashRoute';
import { ListingRow } from '../components/ListingRow';
import { IconCheck, IconSearch } from '../components/Icons';
import type { Listing } from '../types/listing';

const ROWS: { type: (typeof EVENT_TYPES)[number]; title: string; noun: string }[] = [
  { type: 'Workshop', title: 'Workshops', noun: 'workshop' },
  { type: 'Meetup', title: 'Meetups', noun: 'meetup' },
  { type: 'Event', title: 'Talks and events', noun: 'event' },
];

const normalise = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
const text = (l: Listing) => normalise([l.title, l.organiser, l.venue ?? '', l.city, l.country, l.region, l.eligibility, ...l.disciplines].join(' '));

/**
 * magpie.cool/events: workshops, meetups, talks and other events for artists, online and in person, soonest first.
 * The search, place, free and online choices live in the link (?q=…&where=…&free=1&online=1), so a view can be shared.
 */
export function EventsPage() {
  useDocumentTitle('Workshops, meetups and events for artists');
  const now = useNow();
  const { query } = useHashRoute();
  const [q, setQ] = useState(() => query.get('q') ?? '');
  const [where, setWhere] = useState<Place | ''>(() => ((PLACES as readonly string[]).includes(query.get('where') ?? '') ? (query.get('where') as Place) : ''));
  const [free, setFree] = useState(() => query.get('free') === '1');
  const [online, setOnline] = useState(() => query.get('online') === '1');

  const sync = (next: { q?: string; where?: Place | ''; free?: boolean; online?: boolean }) => {
    const v = { q, where, free, online, ...next };
    const p = new URLSearchParams();
    if (v.q.trim()) p.set('q', v.q.trim());
    if (v.where) p.set('where', v.where);
    if (v.free) p.set('free', '1');
    if (v.online) p.set('online', '1');
    replaceHashQuery(p.toString());
  };

  const live = useMemo(() => LISTINGS.filter((l) => isEvent(l) && isLive(l, now)), [now]);
  const shown = useMemo(() => {
    const words = normalise(q).split(/\s+/).filter(Boolean);
    return live.filter((l) => (!words.length || words.every((w) => text(l).includes(w)))
      && matchesPlaces(l, where ? [where] : [])
      && (!free || l.entry_fee === 'Free')
      && (!online || l.format !== 'In person'))
      .sort((a, b) => closesAt(a) - closesAt(b));
  }, [live, q, where, free, online]);
  const filtered = !!(q.trim() || where || free || online);
  const active = [q.trim(), where, free, online].filter(Boolean).length;

  return (
    <div className="exhibitions">
      <header className="submit__head collection__head">
        <p className="about-eyebrow">Online and in person</p>
        <h1>Workshops, meetups and events</h1>
        <p className="about-lede">Workshops, artist meetups and talks to go to, most of them free, soonest first.</p>
      </header>

      <form className="filterbar" role="search" aria-label="Find events" onSubmit={(e) => { e.preventDefault(); document.getElementById('ev-results')?.scrollIntoView({ behavior: 'smooth' }); }}>
        <div className="searchbar">
          <IconSearch className="searchbar__icon" />
          <label className="sr-only" htmlFor="ev-q">Search events</label>
          <input id="ev-q" type="search" value={q} placeholder="Topic, city or organiser" onChange={(e) => { setQ(e.target.value); sync({ q: e.target.value }); }} />
          <button type="submit" className="searchbar__button">Search</button>
        </div>
        <div className="quickbar">
          <div className="quickbar__chips">
            <button type="button" role="switch" aria-checked={free} className={`free-switch${free ? ' is-on' : ''}`}
              onClick={() => { setFree(!free); sync({ free: !free }); }}>
              <span className="free-switch__track" aria-hidden="true"><span className="free-switch__thumb" /></span>
              <span className="free-switch__label">Free<span className="free-switch__sub"> only</span></span>
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
            <button type="button" className={`chip${online ? ' is-on' : ''}`} aria-pressed={online} onClick={() => { setOnline(!online); sync({ online: !online }); }}>
              {online && <IconCheck />}Online
            </button>
            {active > 0 && (
              <button type="button" className="quickbar__clear" onClick={() => { setQ(''); setWhere(''); setFree(false); setOnline(false); replaceHashQuery(''); }}>
                <span aria-hidden="true">✕</span> Clear {active} {active === 1 ? 'filter' : 'filters'}
              </button>
            )}
          </div>
          <p className="quickbar__count" role="status" aria-live="polite"><strong>{shown.length}</strong> {shown.length === 1 ? 'event' : 'events'}</p>
        </div>
        {where && <p className="hint filterbar__hint">Also showing online events open to anyone.</p>}
      </form>

      <div className="rows" id="ev-results">
        {shown.length === 0 && (
          <div className="empty">
            <h2>No events match</h2>
            <p>Try another place or fewer filters. New events are added every week.</p>
          </div>
        )}
        {ROWS.map((r) => {
          const list = shown.filter((l) => l.type === r.type);
          return list.length > 0 && (
            <ListingRow key={`${r.type}-${filtered}`} id={`ev-${r.type.toLowerCase()}`} title={r.title} listings={list} now={now} noun={r.noun} startOpen={filtered} note="Soonest first." />
          );
        })}
      </div>

      <p className="exhibitions__submit">Running a workshop or meetup for artists? <a href="/submit">Tell us about it</a>.</p>
    </div>
  );
}
