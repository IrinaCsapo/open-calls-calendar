import { DISCIPLINES, FORMATS, LISTING_TYPES, REGIONS } from '../types/listing';
import type { Discipline, Format, Listing, ListingType, Region } from '../types/listing';
import { closesAt, isOpportunity } from './dates';
import { DISPLAY_CURRENCIES, entryFeeIn, isTotallyFree, prizeIn, type DisplayCurrency } from './money';

export const KINDS = ['all', 'apply', 'attend'] as const;
export type Kind = (typeof KINDS)[number];

/** "Free to enter" = no entry fee; "Totally free" = no entry fee and nothing to pay if selected. */
export const PRICE_FILTERS = ['any', 'free-entry', 'totally-free'] as const;
export type PriceFilter = (typeof PRICE_FILTERS)[number];

/** Maximum entry fee, in the visitor's currency. 0 = any. */
export const MAX_FEES = [0, 5, 10, 25, 50, 100] as const;

export const CLOSING_FILTERS = [0, 7, 30, 90] as const;   // days; 0 = any

export const SORTS = ['closing', 'newest', 'prize', 'cheapest'] as const;
export type Sort = (typeof SORTS)[number];
export const SORT_LABELS: Record<Sort, string> = {
  closing: 'Closing soonest',
  newest: 'Newest added',
  prize: 'Biggest cash prize',
  cheapest: 'Cheapest to enter',
};

export interface Filters {
  query: string;
  kind: Kind;
  type: ListingType | '';
  discipline: Discipline | '';
  formats: Format[];          // empty = all
  region: Region | '';
  price: PriceFilter;
  maxFee: number;             // 0 = any
  noSelectedFee: boolean;     // hide anything that charges selected artists
  hideUnknownFees: boolean;   // hide anything whose fees aren't stated
  cashPrize: boolean;
  closingWithin: number;      // days, 0 = any
  sort: Sort;
  currency: DisplayCurrency;
}

export const defaultFilters = (currency: DisplayCurrency): Filters => ({
  query: '', kind: 'all', type: '', discipline: '', formats: [], region: '',
  price: 'any', maxFee: 0, noSelectedFee: false, hideUnknownFees: false, cashPrize: false,
  closingWithin: 0, sort: 'closing', currency,
});

/** Filters that narrow the list (sort and currency don't count). */
export function countActive(f: Filters): number {
  return [
    f.query.trim(), f.kind !== 'all', f.type, f.discipline, f.formats.length, f.region, f.price !== 'any',
    f.maxFee, f.noSelectedFee, f.hideUnknownFees, f.cashPrize, f.closingWithin,
  ].filter(Boolean).length;
}

const normalise = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();

const searchText = (l: Listing) =>
  normalise([
    l.title, l.organiser, l.type, l.city, l.country, l.region, l.venue ?? '', l.format, l.eligibility,
    ...l.disciplines, ...l.prizes,
  ].join(' '));

function matchesQuery(l: Listing, query: string): boolean {
  const words = normalise(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = searchText(l);
  return words.every((w) => text.includes(w));
}

// Choosing one of these also shows listings tagged with its neighbours: collage calls are often
// advertised as "mixed media" and the other way round. "Any medium" always matches.
const RELATED: Partial<Record<Discipline, Discipline[]>> = {
  Collage: ['Mixed media'],
  'Mixed media': ['Collage'],
};
const matchesDiscipline = (l: Listing, d: Discipline) =>
  [d, 'Any medium', ...(RELATED[d] ?? [])].some((x) => l.disciplines.includes(x as Discipline));

const hasUnknownFees = (l: Listing) =>
  l.entry_fee === 'Unknown' || (l.entry_fee === 'Paid' && l.fee_amount === undefined) || (isOpportunity(l) && l.selected_fee === 'Unknown');

export function applyFilters(list: Listing[], f: Filters, now = Date.now()): Listing[] {
  return list.filter((l) => {
    if (!matchesQuery(l, f.query)) return false;
    if (f.kind === 'apply' && !isOpportunity(l)) return false;
    if (f.kind === 'attend' && isOpportunity(l)) return false;
    if (f.type && l.type !== f.type) return false;
    if (f.discipline && !matchesDiscipline(l, f.discipline)) return false;
    if (f.formats.length && !f.formats.includes(l.format)) return false;
    if (f.region && l.region !== f.region && l.region !== 'Global') return false;
    if (f.price === 'free-entry' && l.entry_fee !== 'Free') return false;
    if (f.price === 'totally-free' && !isTotallyFree(l)) return false;
    if (f.maxFee) {
      const fee = entryFeeIn(l, f.currency);
      if (fee === undefined || fee > f.maxFee) return false;
    }
    if (f.noSelectedFee && l.selected_fee === 'Yes') return false;
    if (f.hideUnknownFees && hasUnknownFees(l)) return false;
    if (f.cashPrize && !l.prize_kinds.includes('Cash')) return false;
    if (f.closingWithin && closesAt(l) - now > f.closingWithin * 86_400_000) return false;
    return true;
  });
}

export function sortListings(list: Listing[], f: Filters): Listing[] {
  const byClosing = (a: Listing, b: Listing) => closesAt(a) - closesAt(b) || a.title.localeCompare(b.title);
  const sorted = [...list];
  switch (f.sort) {
    case 'newest':
      return sorted.sort((a, b) => b.added.localeCompare(a.added) || byClosing(a, b));
    case 'prize':
      return sorted.sort((a, b) => prizeIn(b, f.currency) - prizeIn(a, f.currency) || byClosing(a, b));
    case 'cheapest': {
      const fee = (l: Listing) => entryFeeIn(l, f.currency) ?? Number.MAX_SAFE_INTEGER;
      return sorted.sort((a, b) => fee(a) - fee(b) || byClosing(a, b));
    }
    default:
      return sorted.sort(byClosing);
  }
}

export function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

// ---- URL query string <-> Filters ---------------------------------------
// Every filtered view has a shareable link. Unknown values are ignored.

const pick = <T extends string>(allowed: readonly T[], value: string | null): T | '' =>
  value && (allowed as readonly string[]).includes(value) ? (value as T) : '';
const pickNum = (allowed: readonly number[], value: string | null) => {
  const n = Number(value);
  return allowed.includes(n) ? n : 0;
};

export function filtersFromQuery(q: URLSearchParams, fallbackCurrency: DisplayCurrency): Filters {
  const formats = (q.get('format') ?? '').split(',').map((x) => pick(FORMATS, x)).filter((x): x is Format => !!x);
  return {
    query: (q.get('q') ?? '').slice(0, 100),
    kind: pick(KINDS, q.get('kind')) || 'all',
    type: pick(LISTING_TYPES, q.get('type')),
    discipline: pick(DISCIPLINES, q.get('discipline')),
    formats: [...new Set(formats)],
    region: pick(REGIONS, q.get('region')),
    price: pick(PRICE_FILTERS, q.get('price')) || 'any',
    maxFee: pickNum(MAX_FEES, q.get('maxfee')),
    noSelectedFee: q.get('noselfee') === '1',
    hideUnknownFees: q.get('known') === '1',
    cashPrize: q.get('cash') === '1',
    closingWithin: pickNum(CLOSING_FILTERS, q.get('within')),
    sort: pick(SORTS, q.get('sort')) || 'closing',
    currency: pick(DISPLAY_CURRENCIES, q.get('cur')) || fallbackCurrency,
  };
}

export function filtersToQuery(f: Filters, fallbackCurrency: DisplayCurrency): string {
  const q = new URLSearchParams();
  if (f.query.trim()) q.set('q', f.query.trim());
  if (f.kind !== 'all') q.set('kind', f.kind);
  if (f.type) q.set('type', f.type);
  if (f.discipline) q.set('discipline', f.discipline);
  if (f.formats.length) q.set('format', FORMATS.filter((x) => f.formats.includes(x)).join(','));
  if (f.region) q.set('region', f.region);
  if (f.price !== 'any') q.set('price', f.price);
  if (f.maxFee) q.set('maxfee', String(f.maxFee));
  if (f.noSelectedFee) q.set('noselfee', '1');
  if (f.hideUnknownFees) q.set('known', '1');
  if (f.cashPrize) q.set('cash', '1');
  if (f.closingWithin) q.set('within', String(f.closingWithin));
  if (f.sort !== 'closing') q.set('sort', f.sort);
  if (f.currency !== fallbackCurrency) q.set('cur', f.currency);
  return q.toString();
}
