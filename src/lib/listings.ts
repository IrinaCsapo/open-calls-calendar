import data from '../data/listings.json';
import type { Listing } from '../types/listing';

// listings.json is checked by scripts/validate-listings.ts before every build.
export const LISTINGS = data as Listing[];
export const findListing = (id: string) => LISTINGS.find((l) => l.id === id);
