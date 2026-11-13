import { useId, useState } from 'react';
import { FORMATS, LISTING_TYPES, OPPORTUNITY_TYPES } from '../types/listing';
import {
  CLOSING_FILTERS, DISCIPLINE_GROUPS, MAX_FEES, PLACES, SORTS, SORT_LABELS, countActive, toggleInList,
  type Filters, type Kind, type Place, type PriceFilter,
} from '../lib/filters';
import { formatMoney } from '../lib/money';
import { Chip } from './Chip';
import type { PlaceSetting } from '../lib/location';
import { IconCheck, IconPin, IconSearch } from './Icons';

interface Props {
  filters: Filters;
  onChange: (next: Filters) => void;
  onReset: () => void;
  count: number;
  location: {
    setting: PlaceSetting;
    guess: Place | null;
    onSetting: (v: PlaceSetting) => void;
    onLocate: () => void;
    onForget: () => void;
    locating: 'idle' | 'asking' | 'denied';
    hasCoords: boolean;
  };
}

const KIND_LABELS: Record<Kind, string> = { all: 'Everything', apply: 'Things to apply for', attend: 'Events to go to' };

/**
 * BuilderBee-style filter bar: a big search box, then one bar of quick chips (format, price, where)
 * with "More filters" for everything else and the live count on the right.
 */
export function FilterPanel({ filters: f, onChange, onReset, count, location: loc }: Props) {
  const id = useId();
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => onChange({ ...f, [key]: value });
  const togglePrice = (p: PriceFilter) => set('price', f.price === p ? 'any' : p);
  const types = f.kind === 'apply' ? OPPORTUNITY_TYPES : f.kind === 'attend' ? LISTING_TYPES.filter((t) => !(OPPORTUNITY_TYPES as readonly string[]).includes(t)) : LISTING_TYPES;
  const active = countActive(f);
  // "More filters" always starts closed; the count next to it says how many of its filters are on.
  const [more, setMore] = useState(false);
  const moreCount = [f.kind !== 'all', f.type, f.formats.length, f.disciplines.length, f.maxFee, f.noSelectedFee, f.hideUnknownFees,
    f.cashPrize, f.closingWithin, f.price === 'totally-free'].filter(Boolean).length;

  return (
    <form className="filterbar" role="search" aria-label="Find open calls"
      onSubmit={(e) => { e.preventDefault(); document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }); }}>
      <div className="searchbar">
        <IconSearch className="searchbar__icon" />
        <label className="sr-only" htmlFor={`${id}-q`}>Search open calls</label>
        <input id={`${id}-q`} type="search" value={f.query} placeholder="Open call, city, medium or prize"
          onChange={(e) => set('query', e.target.value)} />
        <button type="submit" className="searchbar__button">Search</button>
      </div>

      <div className="quickbar">
        <div className="quickbar__chips">
          <div className="chips" role="group" aria-label="Price">
            <Chip on={f.price === 'free-entry'} onToggle={() => togglePrice('free-entry')}>Free</Chip>
            <Chip on={f.price === 'paid'} onToggle={() => togglePrice('paid')}>Paid</Chip>
          </div>
          <span className="quickbar__divider" aria-hidden="true" />
          <label className="where">
            <span className="sr-only">Where</span>
            <select className={`where__select${f.places.length ? ' is-on' : ''}`} value={f.places[0] ?? ''}
              onChange={(e) => set('places', e.target.value ? [e.target.value as Place] : [])}>
              <option value="">Anywhere</option>
              <optgroup label="Countries">
                {PLACES.slice(0, 4).map((p) => <option key={p} value={p}>{p}</option>)}
              </optgroup>
              <optgroup label="Continents">
                {PLACES.slice(4).map((p) => <option key={p} value={p}>{p}</option>)}
              </optgroup>
            </select>
          </label>
          <button type="button" className={`chip chip--more${more ? ' is-open' : ''}`} aria-expanded={more} aria-controls={`${id}-more`} onClick={() => setMore(!more)}>
            More filters{moreCount > 0 && ` (${moreCount})`} <span aria-hidden="true">{more ? '▴' : '▾'}</span>
          </button>
          {active > 0 && (
            <button type="button" className="quickbar__clear" onClick={onReset}>
              <span aria-hidden="true">✕</span> Clear {active} {active === 1 ? 'filter' : 'filters'}
            </button>
          )}
        </div>
        <p className="quickbar__count" role="status" aria-live="polite"><strong>{count}</strong> {count === 1 ? 'listing' : 'listings'}</p>
      </div>
      {f.places.length > 0 && <p className="hint filterbar__hint">Also showing online calls open to artists anywhere.</p>}

      {more && (
        <div id={`${id}-more`} className="filters">
          <fieldset className="segmented">
            <legend className="sr-only">What to show</legend>
            {(Object.keys(KIND_LABELS) as Kind[]).map((k) => (
              <label key={k} className={f.kind === k ? 'is-on' : ''}>
                <input type="radio" name={`${id}-kind`} checked={f.kind === k} onChange={() => onChange({ ...f, kind: k, type: '' })} />
                {KIND_LABELS[k]}
              </label>
            ))}
          </fieldset>

          <div className="filters__section" role="group" aria-labelledby={`${id}-loc`}>
            <p className="filters__heading" id={`${id}-loc`}>Your location</p>
            <p className="hint filters__hint">Used for the "Near you" row at the top. It doesn't hide anything.</p>
            <div className="chips">
              <label className="where">
                <span className="sr-only">Where you are</span>
                <select className="where__select" value={loc.setting} onChange={(e) => loc.onSetting(e.target.value as PlaceSetting)}>
                  <option value="auto">{loc.guess ? `${loc.guess} (from your time zone)` : 'Guess from my time zone'}</option>
                  {PLACES.map((p) => <option key={p} value={p}>{p}</option>)}
                  <option value="off">Don't show "Near you"</option>
                </select>
              </label>
              {loc.hasCoords ? (
                <button type="button" className="chip is-on" onClick={loc.onForget}><IconCheck />Using your exact location · Stop</button>
              ) : (
                <button type="button" className="chip" onClick={loc.onLocate} disabled={loc.locating === 'asking'}>
                  <IconPin />{loc.locating === 'asking' ? 'Finding you…' : 'Use my exact location'}
                </button>
              )}
            </div>
            <p className="hint" role="status">
              {loc.locating === 'denied'
                ? "We couldn't get your location (it may be switched off in your browser). Choose a place from the list instead."
                : loc.hasCoords ? 'Your location stays in this browser: it is never sent or stored.' : ''}
            </p>
          </div>

          <div className="filters__section" role="group" aria-labelledby={`${id}-format`}>
            <p className="filters__heading" id={`${id}-format`}>Format</p>
            <div className="chips">
              {FORMATS.map((fm) => (
                <Chip key={fm} on={f.formats.includes(fm)} onToggle={() => set('formats', toggleInList(f.formats, fm))}>{fm}</Chip>
              ))}
            </div>
          </div>

          <div className="filters__section" role="group" aria-labelledby={`${id}-money`}>
            <p className="filters__heading" id={`${id}-money`}>Money</p>
            <div className="chips">
              <Chip on={f.price === 'totally-free'} onToggle={() => togglePrice('totally-free')}>Totally free (no fees if selected)</Chip>
              <Chip on={f.noSelectedFee} onToggle={() => set('noSelectedFee', !f.noSelectedFee)}>Hide pay-if-selected</Chip>
              <Chip on={f.hideUnknownFees} onToggle={() => set('hideUnknownFees', !f.hideUnknownFees)}>Fees stated</Chip>
              <Chip on={f.cashPrize} onToggle={() => set('cashPrize', !f.cashPrize)}>Cash prize</Chip>
              <label>
                <span className="sr-only">Maximum entry fee</span>
                <select className={`chip-select${f.maxFee ? ' is-on' : ''}`} value={f.maxFee} onChange={(e) => set('maxFee', Number(e.target.value))}>
                  {MAX_FEES.map((m) => <option key={m} value={m}>{m ? `Entry fee up to ${formatMoney(m, f.currency)}` : 'Any entry fee'}</option>)}
                </select>
              </label>
            </div>
            {f.maxFee > 0 && <p className="hint">Fees in other currencies are converted roughly. Calls that don't say their fee are hidden.</p>}
          </div>

          <div className="filters__section" role="group" aria-labelledby={`${id}-disc`}>
            <p className="filters__heading" id={`${id}-disc`}>
              Disciplines{f.disciplines.length > 0 && <span className="muted"> · {f.disciplines.join(', ')}</span>}
            </p>
            {DISCIPLINE_GROUPS.map((g) => (
              <div key={g.label} className="chip-group">
                <p className="chip-group__label">{g.label}</p>
                <div className="chips">
                  {g.items.map((d) => (
                    <Chip key={d} on={f.disciplines.includes(d)} onToggle={() => set('disciplines', toggleInList(f.disciplines, d))}>{d}</Chip>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="filters__row filters__section">
            <label className="field">
              <span>Type</span>
              <select value={f.type} onChange={(e) => set('type', e.target.value as Filters['type'])}>
                <option value="">All types</option>
                {types.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Closing within</span>
              <select value={f.closingWithin} onChange={(e) => set('closingWithin', Number(e.target.value))}>
                {CLOSING_FILTERS.map((d) => <option key={d} value={d}>{d ? `${d} days` : 'Any time'}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Sort</span>
              <select value={f.sort} onChange={(e) => set('sort', e.target.value as Filters['sort'])}>
                {SORTS.map((s) => <option key={s} value={s}>{SORT_LABELS[s]}</option>)}
              </select>
            </label>
          </div>
        </div>
      )}

    </form>
  );
}
