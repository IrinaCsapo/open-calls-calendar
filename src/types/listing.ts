// Single source of truth for the listing data model.
// The allowed-value lists are used by the type, the build-time validator and the
// filters, so they can never drift apart.

/** What kind of thing it is. The first group has an application deadline; the second happens on a date. */
export const LISTING_TYPES = [
  'Open call',    // exhibition / submission open call
  'Prize',        // competition or award
  'Residency',
  'Grant',        // funding, bursary
  'Fellowship',   // programme, mentoring scheme, development programme
  'Commission',
  'Event',        // talk, opening, screening, fair, festival
  'Meetup',
  'Workshop',
] as const;

/** Types that are about applying (shown with a deadline). The rest are things you go to. */
export const OPPORTUNITY_TYPES = ['Open call', 'Prize', 'Residency', 'Grant', 'Fellowship', 'Commission'] as const;

export const DISCIPLINES = [
  'Any medium',
  'Painting',
  'Drawing',
  'Printmaking',
  'Sculpture',
  'Ceramics',
  'Textiles',
  'Craft',
  'Photography',
  'Film & video',
  'Digital art',
  'Illustration',
  'Music',
  'Sound',
  'Performance',
  'Writing',
  'Design',
] as const;

export const FORMATS = ['In person', 'Online', 'Hybrid'] as const;
// "Global" is for online opportunities that aren't tied to one region.
export const REGIONS = ['Europe', 'UK', 'North America', 'LatAm', 'Africa', 'Asia', 'Middle East', 'Oceania', 'Global'] as const;

/** Is there a fee to apply / enter / attend? */
export const ENTRY_FEES = ['Free', 'Paid', 'Unknown'] as const;
/** Is there a fee to pay if you're selected (hanging fee, exhibition fee, "secure your space", etc.)? */
export const SELECTED_FEES = ['None', 'Yes', 'Unknown'] as const;

export const PRIZE_KINDS = ['Cash', 'Exhibition', 'Residency', 'Publication', 'Mentoring', 'Sales', 'Commission', 'Other'] as const;

/** Currencies we can convert for the "max fee" filter (approximate rates live in src/lib/money.ts). */
export const CURRENCIES = ['GBP', 'USD', 'EUR', 'CAD', 'AUD', 'NZD', 'CHF', 'SEK', 'NOK', 'DKK', 'JPY', 'INR', 'SGD', 'HKD', 'ZAR', 'MXN', 'BRL', 'AED'] as const;

export type ListingType = (typeof LISTING_TYPES)[number];
export type Discipline = (typeof DISCIPLINES)[number];
export type Format = (typeof FORMATS)[number];
export type Region = (typeof REGIONS)[number];
export type EntryFee = (typeof ENTRY_FEES)[number];
export type SelectedFee = (typeof SELECTED_FEES)[number];
export type PrizeKind = (typeof PRIZE_KINDS)[number];
export type Currency = (typeof CURRENCIES)[number];

export interface Listing {
  id: string;                 // slug, e.g. "woman-artist-award-2026"
  title: string;
  organiser: string;
  type: ListingType;
  disciplines: Discipline[];  // at least one; "Any medium" if open to all
  format: Format;             // virtual exhibitions and online events are "Online"
  timezone: string;           // IANA, e.g. "Europe/London" (the organiser's, for online)
  city: string;               // empty string for online
  country: string;            // empty string for online with no home country
  region: Region;
  venue?: string;
  lat?: number;               // required for in person / hybrid
  lng?: number;

  deadline?: string;          // YYYY-MM-DD: applications / registration close (end of that day)
  start_date?: string;        // YYYY-MM-DD: when the event / exhibition / residency happens
  end_date?: string;          // YYYY-MM-DD

  eligibility: string;        // who can apply, in the organiser's words, briefly

  // ---- money: the whole point of the site ----
  entry_fee: EntryFee;
  fee_amount?: number;        // cheapest way in (e.g. one work), in `currency`. Required when entry_fee is "Paid"
  currency?: Currency;        // required when fee_amount or prize_value is set
  fee_details?: string;       // "£15 per work, 3 for £35"
  selected_fee: SelectedFee;  // charged if you're selected (hanging / exhibition / participation fee)
  selected_fee_details?: string; // "£250 to secure wall space" (required when selected_fee is "Yes")
  commission?: string;        // "30% on sales"

  prizes: string[];           // each prize as the organiser states it: ["£10,000 first prize", "Solo show in London"]
  prize_kinds: PrizeKind[];
  prize_value?: number;       // largest single cash prize, in `currency` (for sorting); only if stated

  apply_url: string;          // where to apply / register
  image_url?: string;         // the official page's og:image, loaded from the organiser's host
  source: string;             // URL where the details were confirmed
  added: string;              // YYYY-MM-DD the listing was added (drives the "New" badge)
}
