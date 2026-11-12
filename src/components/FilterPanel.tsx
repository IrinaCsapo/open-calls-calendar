import { useId } from 'react';
import { DISCIPLINES, FORMATS, LISTING_TYPES, OPPORTUNITY_TYPES, REGIONS } from '../types/listing';
import {
  CLOSING_FILTERS, MAX_FEES, SORTS, SORT_LABELS, countActive, toggleInList,
  type Filters, type Kind, type PriceFilter,
} from '../lib/filters';
import { DISPLAY_CURRENCIES, formatMoney } from '../lib/money';

interface Props {
  filters: Filters;
  onChange: (next: Filters) => void;
  onReset: () => void;
}

const KIND_LABELS: Record<Kind, string> = { all: 'Everything', apply: 'Things to apply for', attend: 'Events to go to' };
const PRICE_LABELS: Record<PriceFilter, string> = {
  any: 'Any price',
  'free-entry': 'Free to enter',
  'totally-free': 'Totally free (no fees if selected either)',
};

export function FilterPanel({ filters: f, onChange, onReset }: Props) {
  const id = useId();
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => onChange({ ...f, [key]: value });
  const types = f.kind === 'apply' ? OPPORTUNITY_TYPES : f.kind === 'attend' ? LISTING_TYPES.filter((t) => !(OPPORTUNITY_TYPES as readonly string[]).includes(t)) : LISTING_TYPES;
  const active = countActive(f);

  return (
    <form className="filters" role="search" aria-label="Filter listings" onSubmit={(e) => e.preventDefault()}>
      <div className="filters__row">
        <label className="field field--grow">
          <span>Search</span>
          <input type="search" value={f.query} placeholder="photography, London, residency…" onChange={(e) => set('query', e.target.value)} />
        </label>
        <label className="field">
          <span>Sort</span>
          <select value={f.sort} onChange={(e) => set('sort', e.target.value as Filters['sort'])}>
            {SORTS.map((s) => <option key={s} value={s}>{SORT_LABELS[s]}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Show money in</span>
          <select value={f.currency} onChange={(e) => set('currency', e.target.value as Filters['currency'])}>
            {DISPLAY_CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
      </div>

      <fieldset className="segmented">
        <legend className="sr-only">What to show</legend>
        {(Object.keys(KIND_LABELS) as Kind[]).map((k) => (
          <label key={k} className={f.kind === k ? 'is-on' : ''}>
            <input type="radio" name={`${id}-kind`} checked={f.kind === k}
              onChange={() => onChange({ ...f, kind: k, type: '' })} />
            {KIND_LABELS[k]}
          </label>
        ))}
      </fieldset>

      <div className="filters__row">
        <label className="field">
          <span>Type</span>
          <select value={f.type} onChange={(e) => set('type', e.target.value as Filters['type'])}>
            <option value="">All types</option>
            {types.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Discipline</span>
          <select value={f.discipline} onChange={(e) => set('discipline', e.target.value as Filters['discipline'])}>
            <option value="">All disciplines</option>
            {DISCIPLINES.filter((d) => d !== 'Any medium').map((d) => <option key={d}>{d}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Region</span>
          <select value={f.region} onChange={(e) => set('region', e.target.value as Filters['region'])}>
            <option value="">Anywhere</option>
            {REGIONS.filter((r) => r !== 'Global').map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Closing within</span>
          <select value={f.closingWithin} onChange={(e) => set('closingWithin', Number(e.target.value))}>
            {CLOSING_FILTERS.map((d) => <option key={d} value={d}>{d ? `${d} days` : 'Any time'}</option>)}
          </select>
        </label>
        <fieldset className="field checks">
          <legend>Format</legend>
          {FORMATS.map((fm) => (
            <label key={fm}>
              <input type="checkbox" checked={f.formats.includes(fm)} onChange={() => set('formats', toggleInList(f.formats, fm))} /> {fm}
            </label>
          ))}
        </fieldset>
      </div>

      <fieldset className="filters__money">
        <legend>Money</legend>
        <div className="filters__row">
          <label className="field">
            <span>Price</span>
            <select value={f.price} onChange={(e) => set('price', e.target.value as PriceFilter)}>
              {(Object.keys(PRICE_LABELS) as PriceFilter[]).map((p) => <option key={p} value={p}>{PRICE_LABELS[p]}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Entry fee up to</span>
            <select value={f.maxFee} onChange={(e) => set('maxFee', Number(e.target.value))}>
              {MAX_FEES.map((m) => <option key={m} value={m}>{m ? formatMoney(m, f.currency) : 'Any amount'}</option>)}
            </select>
          </label>
          <div className="checks">
            <label>
              <input type="checkbox" checked={f.noSelectedFee} onChange={(e) => set('noSelectedFee', e.target.checked)} />
              {' '}Hide calls that charge you if you're selected
            </label>
            <label>
              <input type="checkbox" checked={f.hideUnknownFees} onChange={(e) => set('hideUnknownFees', e.target.checked)} />
              {' '}Hide calls that don't state all their fees
            </label>
            <label>
              <input type="checkbox" checked={f.cashPrize} onChange={(e) => set('cashPrize', e.target.checked)} />
              {' '}Has a cash prize
            </label>
          </div>
        </div>
        {f.maxFee > 0 && <p className="hint">Fees in other currencies are converted roughly. Calls that don't say their fee are hidden.</p>}
      </fieldset>

      {active > 0 && (
        <button type="button" className="link-button" onClick={onReset}>Clear {active} {active === 1 ? 'filter' : 'filters'}</button>
      )}
    </form>
  );
}
