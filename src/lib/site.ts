// Site-wide names and links. Change them here and they update everywhere.
// The name is a placeholder until we pick one (see README "Naming").
export const SITE_NAME = 'Open Calls Calendar';
export const SITE_TAGLINE = 'Open calls, prizes, residencies and events for artists, with every fee shown up front.';
export const SITE_URL = 'https://irinacsapo.github.io/open-calls-calendar/';
export const REPO_URL = 'https://github.com/IrinaCsapo/open-calls-calendar';
export const SUBMIT_FORM_URL = `${REPO_URL}/issues/new?template=submit-listing.yml`;
export const REPORT_URL = (id: string) =>
  `${REPO_URL}/issues/new?title=${encodeURIComponent(`[Correction] ${id}`)}&labels=correction`;
/** Subscribe-able calendar of every deadline, generated at build time by scripts/build-feed.ts */
export const FEED_PATH = 'deadlines.ics';
