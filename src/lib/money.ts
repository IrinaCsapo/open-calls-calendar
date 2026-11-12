import type { Currency, Listing } from '../types/listing';
import { isOpportunity } from './dates';

// Approximate value of 1 unit of each currency in GBP (November 2026).
// Only used to compare fees and prizes across currencies ("≈ £12"), never shown as exact.
// Update now and then; being a few percent out doesn't matter for "under £25"-style filters.
const IN_GBP: Record<Currency, number> = {
  GBP: 1, USD: 0.77, EUR: 0.86, CAD: 0.55, AUD: 0.5, NZD: 0.45, CHF: 0.92, SEK: 0.072, NOK: 0.07,
  DKK: 0.115, JPY: 0.0051, INR: 0.0091, SGD: 0.58, HKD: 0.098, ZAR: 0.042, MXN: 0.041, BRL: 0.14, AED: 0.21,
};

/** The currencies a visitor can show approximate amounts in. */
export const DISPLAY_CURRENCIES = ['GBP', 'USD', 'EUR'] as const satisfies readonly Currency[];
export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

export function convert(amount: number, from: Currency, to: Currency): number {
  return (amount * IN_GBP[from]) / IN_GBP[to];
}

export function formatMoney(amount: number, currency: Currency, approx = false): string {
  const value = approx && amount >= 10 ? Math.round(amount) : amount;
  const whole = Number.isInteger(value) || value >= 100;
  const s = new Intl.NumberFormat('en-GB', {
    style: 'currency', currency, maximumFractionDigits: whole ? 0 : 2, minimumFractionDigits: whole ? 0 : 2,
  }).format(value);
  return approx ? `≈ ${s}` : s;
}

/** A sensible default currency from the visitor's timezone. */
export function guessCurrency(): DisplayCurrency {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  if (tz === 'Europe/London' || tz === 'Europe/Belfast') return 'GBP';
  if (tz.startsWith('Europe/')) return 'EUR';
  return 'USD';
}

/** Entry fee in the visitor's currency (0 for free), or undefined if not known. */
export function entryFeeIn(l: Listing, to: Currency): number | undefined {
  if (l.entry_fee === 'Free') return 0;
  if (l.entry_fee === 'Paid' && l.fee_amount !== undefined && l.currency) return convert(l.fee_amount, l.currency, to);
  return undefined;
}

export function prizeIn(l: Listing, to: Currency): number {
  return l.prize_value !== undefined && l.currency ? convert(l.prize_value, l.currency, to) : 0;
}

// ---- The fee label: the most important thing on every card -------------

export type FeeTone = 'free' | 'caution' | 'paid' | 'unknown';

export interface FeeSummary {
  tone: FeeTone;
  headline: string;        // "Free to enter, no fees if selected" / "£15 to enter"
  approx?: string;         // "≈ $19" when the visitor's currency differs
  selected?: string;       // "Pay if selected: £250 hanging fee" / "Fees if selected: not stated"
}

export function feeSummary(l: Listing, display: Currency): FeeSummary {
  const apply = isOpportunity(l);
  const verb = apply ? 'to enter' : '';

  let tone: FeeTone;
  let headline: string;
  let approx: string | undefined;

  if (l.entry_fee === 'Free') {
    tone = 'free';
    headline = apply ? 'Free to enter' : 'Free';
  } else if (l.entry_fee === 'Paid' && l.fee_amount !== undefined && l.currency) {
    tone = 'paid';
    headline = `${formatMoney(l.fee_amount, l.currency)} ${verb}`.trim();
    if (l.currency !== display) approx = formatMoney(convert(l.fee_amount, l.currency, display), display, true);
  } else if (l.entry_fee === 'Paid') {
    tone = 'paid';
    headline = apply ? 'Paid entry' : 'Paid';
  } else {
    tone = 'unknown';
    headline = apply ? 'Entry fee not stated' : 'Price not stated';
  }

  let selected: string | undefined;
  if (apply) {
    if (l.selected_fee === 'Yes') {
      selected = `Pay if selected: ${l.selected_fee_details ?? 'yes'}`;
      if (tone === 'free') tone = 'caution';
    } else if (l.selected_fee === 'Unknown') {
      selected = 'Fees if selected: not stated';
    } else if (tone === 'free') {
      headline = 'Free, no fees if selected';
    } else {
      selected = 'No fees if selected';
    }
  }

  return { tone, headline, approx, selected };
}

/** Totally free: nothing to pay to enter, and nothing to pay if selected. */
export const isTotallyFree = (l: Listing) =>
  l.entry_fee === 'Free' && (!isOpportunity(l) || l.selected_fee === 'None');
