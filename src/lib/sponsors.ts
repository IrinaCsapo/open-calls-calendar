import data from '../data/sponsors.json';

/**
 * Paid "Sponsored" features (magpie.cool/sponsor). Add one to src/data/sponsors.json with the dates it runs,
 * both inclusive (UK dates): it shows on the homepage, and in the Monday email if a Monday falls in that week.
 * Always labelled "Sponsored", always apart from the listings, never changes how listings are ordered.
 */
export interface Sponsor {
  id: string;
  name: string;          // who's paying: "Pin One Photo"
  title: string;         // the headline: "Photograph a Christmas tree, pin it on the map"
  blurb: string;         // one or two sentences
  url: string;           // their page (plain link, no referral codes)
  image?: string;        // a full image URL, landscape works best
  start: string;         // YYYY-MM-DD
  end: string;           // YYYY-MM-DD
}

export const SPONSORS = data as Sponsor[];

/** A made-up sponsor for checking the layout: add ?sponsor-preview to the homepage, or --sponsor-preview to the email. */
export const SAMPLE_SPONSOR: Sponsor = {
  id: 'sample',
  name: 'Sample Studio',
  title: 'A sample sponsored feature',
  blurb: 'This is what a sponsored feature looks like: a picture, a headline, a sentence or two about the project and a link. Only you can see it.',
  url: 'https://magpie.cool/sponsor',
  image: 'https://magpie.cool/og-image.jpg',
  start: '2000-01-01',
  end: '2000-01-01',
};

/** The sponsor running on this date (YYYY-MM-DD), if any. */
export const sponsorOn = (dateISO: string): Sponsor | undefined =>
  SPONSORS.find((s) => s.start <= dateISO && dateISO <= s.end);
