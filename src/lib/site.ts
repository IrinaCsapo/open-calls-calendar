// Site-wide names and links. Change them here and they update everywhere.
// Magpie: collects the open calls scattered around the internet.
export const SITE_NAME = 'Magpie';
export const SITE_TAGLINE = 'Open calls, prizes, residencies and events for artists, with every fee shown up front.';
export const SITE_URL = 'https://magpie.cool/';
export const REPO_URL = 'https://github.com/IrinaCsapo/open-calls-calendar';
// The Tally form on the Submit page (no account needed). The ID is the end of its link: https://tally.so/r/rDaMEo
export const TALLY_FORM_ID = 'rDaMEo';
export const SUBMIT_FORM_URL = `${REPO_URL}/issues/new?template=submit-listing.yml`;
/** "Report a problem" on a listing: a pre-filled email (no account needed). */
export const REPORT_URL = (id: string, title: string) =>
  `mailto:hello@magpie.cool?subject=${encodeURIComponent(`Problem with: ${title}`)}&body=${encodeURIComponent(
    `Listing: ${SITE_URL}listing/${id}\n\nWhat's wrong? (a fee, the deadline, a dead link, something else)\n\n`,
  )}`;
/** Subscribe-able calendar of every deadline, generated at build time by scripts/build-feed.ts */
export const FEED_PATH = 'deadlines.ics';
/** Buttondown newsletter username (buttondown.com/<username>). The sign-up box stays hidden while this is empty. */
export const BUTTONDOWN_USERNAME = 'irinacsapo';
/** Where people can reach us (forwards to Irina's inbox). */
export const CONTACT_EMAIL = 'hello@magpie.cool';
