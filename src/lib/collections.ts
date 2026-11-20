// Landing pages like magpie.cool/open-calls/photography or /open-calls/uk: one page per discipline, place and kind
// of opportunity, so that search engines and AI answer engines have a page that answers
// "open calls for photographers", "free open calls UK", "artist residencies"… directly.
// Used by the site (CollectionPage) and by scripts/build-pages.ts (static HTML, sitemap, llms.txt), so they match.
import type { Discipline, Listing } from '../types/listing';
import { PLACE_MATCH, type Place } from './filters';
import { isTotallyFree } from './money';

export interface Collection {
  slug: string;
  group: 'Disciplines' | 'Places' | 'Kinds';
  label: string;             // short, for link lists: "Photography"
  h1: string;                // "Open calls for photographers"
  title: string;             // <title> start: "Photography open calls"
  intro: string;             // one or two plain sentences, answering the search directly
  match: (l: Listing) => boolean;
}

const slugify = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Who each discipline is for, for the heading: "Open calls for painters"
const WHO: Partial<Record<Discipline, string>> = {
  Painting: 'painters', Drawing: 'drawing artists', Printmaking: 'printmakers', Collage: 'collage artists',
  'Mixed media': 'mixed media artists', Sculpture: 'sculptors', Ceramics: 'ceramicists', Textiles: 'textile artists',
  Craft: 'craft makers', Photography: 'photographers', 'Film & video': 'filmmakers and video artists',
  'Digital art': 'digital artists', Illustration: 'illustrators', Music: 'musicians', Sound: 'sound artists',
  Performance: 'performance artists', Writing: 'writers', Design: 'designers',
};

const disciplineCollections: Collection[] = (Object.keys(WHO) as Discipline[]).map((d) => ({
  slug: slugify(d),
  group: 'Disciplines',
  label: d,
  h1: `Open calls for ${WHO[d]}`,
  title: `${d} open calls`,
  intro: `Open calls, prizes, residencies and grants that accept ${d.toLowerCase()}, including calls open to any medium. Closing soonest first, with the entry fee and any fee if you're selected on every listing.`,
  // the discipline itself, or "Any medium"
  match: (l) => l.disciplines.includes(d) || l.disciplines.includes('Any medium'),
}));

const PLACE_PAGES: { place: Place; slug: string; name: string }[] = [
  { place: 'UK', slug: 'uk', name: 'the UK' },
  { place: 'Europe', slug: 'europe', name: 'Europe' },
  { place: 'US', slug: 'usa', name: 'the US' },
  { place: 'Canada', slug: 'canada', name: 'Canada' },
  { place: 'Australia', slug: 'australia', name: 'Australia' },
  { place: 'Asia', slug: 'asia', name: 'Asia' },
  { place: 'Latin America', slug: 'latin-america', name: 'Latin America' },
  { place: 'Africa', slug: 'africa', name: 'Africa' },
  { place: 'Middle East', slug: 'middle-east', name: 'the Middle East' },
  { place: 'Oceania', slug: 'oceania', name: 'Oceania' },
];

const placeCollections: Collection[] = [
  ...PLACE_PAGES.map(({ place, slug, name }): Collection => ({
    slug,
    group: 'Places',
    label: place,
    h1: `Open calls for artists in ${name}`,
    title: `Open calls in ${name}`,
    intro: `Open calls, prizes, residencies and events for artists in ${name}, plus online calls you can enter from there. Every fee shown up front, closing soonest first.`,
    match: (l) => PLACE_MATCH[place](l) || (l.format === 'Online' && l.region === 'Global'),
  })),
  {
    slug: 'online',
    group: 'Places',
    label: 'Online',
    h1: 'Online open calls for artists',
    title: 'Online open calls',
    intro: 'Open calls, prizes and events you can enter or join online, from anywhere. Every fee shown up front, closing soonest first.',
    match: (l) => l.format !== 'In person',
  },
];

const kindCollections: Collection[] = [
  {
    slug: 'free', group: 'Kinds', label: 'Free to enter',
    h1: 'Free open calls for artists',
    title: 'Free open calls for artists',
    intro: 'Open calls, prizes and residencies that cost nothing to enter and charge nothing if you’re selected: no entry fee, no hanging fee, no “secure your space” fee.',
    match: (l) => isTotallyFree(l) && !l.commercial,
  },
  {
    slug: 'residencies', group: 'Kinds', label: 'Residencies',
    h1: 'Artist residencies open for applications',
    title: 'Artist residencies',
    intro: 'Artist residencies taking applications now, worldwide, with the application fee and any costs if you’re selected on every listing.',
    match: (l) => l.type === 'Residency' || l.prize_kinds.includes('Residency'),
  },
  {
    slug: 'prizes', group: 'Kinds', label: 'Art prizes',
    h1: 'Art prizes and competitions open now',
    title: 'Art prizes and competitions',
    intro: 'Art prizes, awards and competitions taking entries now, with the prize, the entry fee and any fee if you’re selected.',
    match: (l) => l.type === 'Prize',
  },
  {
    slug: 'grants', group: 'Kinds', label: 'Grants and fellowships',
    h1: 'Grants, fellowships and commissions for artists',
    title: 'Grants and fellowships for artists',
    intro: 'Funding, bursaries, fellowships, development programmes and commissions for artists, taking applications now.',
    match: (l) => l.type === 'Grant' || l.type === 'Fellowship' || l.type === 'Commission',
  },
  {
    slug: 'exhibitions', group: 'Kinds', label: 'Exhibition open calls',
    h1: 'Exhibition open calls for artists',
    title: 'Exhibition open calls',
    intro: 'Calls for artists to show work in an exhibition, with the entry fee and any hanging or exhibition fee if you’re selected.',
    match: (l) => l.type === 'Open call' || l.prize_kinds.includes('Exhibition'),
  },
  {
    slug: 'events', group: 'Kinds', label: 'Events for artists',
    h1: 'Events, talks and workshops for artists',
    title: 'Events and workshops for artists',
    intro: 'Talks, meetups, workshops, fairs and festivals for artists, in person and online.',
    match: (l) => l.type === 'Event' || l.type === 'Meetup' || l.type === 'Workshop',
  },
];

export const COLLECTIONS: Collection[] = [...kindCollections, ...disciplineCollections, ...placeCollections];
export const findCollection = (slug: string) => COLLECTIONS.find((c) => c.slug === slug);
export const collectionUrl = (c: Collection) => `/open-calls/${c.slug}`;

/** The collections a listing belongs to that are worth linking to from its page (its disciplines, place and kind). */
export function collectionsFor(l: Listing): Collection[] {
  return COLLECTIONS.filter((c) => {
    if (c.group === 'Disciplines') return l.disciplines.includes(c.label as Discipline);
    return c.match(l) && !(c.group === 'Places' && c.slug !== 'online' && l.format === 'Online');
  });
}
