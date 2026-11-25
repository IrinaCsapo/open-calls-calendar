import data from '../data/listings.json';
import exhibitions from '../data/exhibitions.json';
import type { Listing } from '../types/listing';

// Both files are checked by scripts/validate-listings.ts before every build.
/** Open calls, prizes, residencies… and events: the main calendar. */
export const LISTINGS = data as Listing[];
/** Exhibitions to go and see: the Exhibitions page. They share magpie.cool/listing/<id> pages with the rest. */
export const EXHIBITIONS = exhibitions as Listing[];
export const findListing = (id: string) => LISTINGS.find((l) => l.id === id) ?? EXHIBITIONS.find((l) => l.id === id);
export const isExhibition = (l: Listing) => l.type === 'Exhibition';
/** Things to go to that aren't exhibitions: each is a row on the Events page (magpie.cool/events). */
export const EVENT_TYPES = ['Workshop', 'Meetup', 'Event'] as const;
export const isEvent = (l: Listing) => (EVENT_TYPES as readonly string[]).includes(l.type);
