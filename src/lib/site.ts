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
/**
 * The Brevo sign-up form for the weekly email: its "action" link, from Brevo → Contacts → Forms → the form → Share →
 * HTML code (looks like https://xxxx.sibforms.com/serve/MUIF...). The sign-up box stays hidden while this is empty.
 * Setup: docs/brevo-setup.md.
 */
export const NEWSLETTER_FORM_URL =
  'https://e858efc7.sibforms.com/serve/MUIFAGKglxJyf9h-XbV9i-l3CbqynKbY0jeAbVz9IxXDEj6Tz8eHaJ26eLad9W6zfy6yo5UAChDB-0EjtoGVzRbjg-0rTFVx24b1t43puen_GCLNfMAuR9JzgCSIvBWVZ1h-XaR2aU9K0AVj9UH74FN0LBmjgDM2Axa0z8cs9QSQNKFoTaS2YOhedaFYoanzcuQM9pXJp0kU3_7I7g==';
/**
 * The Brevo form for one-off deadline reminders (a separate form and list from the weekly email, no double opt-in):
 * its "action" link, like NEWSLETTER_FORM_URL. The "Email me before it closes" box on listings stays hidden while
 * this is empty. scripts/reminders.ts sends the reminders. Setup: docs/brevo-setup.md.
 */
export const REMINDER_FORM_URL =
  'https://e858efc7.sibforms.com/serve/MUIFABspnl_ZEZJ-v8QAeDYl2n336Rup1DPIM2sjcp9PS4bS_EO_tFjWDIefdLTgeHv7dQcVCr00y906yuTqcryQEA-GueJW6Z1shdlmleooHJJkNCKoVTF-Z_mr8MnAwGv8cu5f6IF3GP2Nz8Z--ymIsdsLubhxQhGeuk91ouWRs-JjEk37pEOQ7vs_XuWZp0xWyTUrtgEI8ZIbcw==';
/** Buy Me a Coffee: supporters keep Magpie free (footer, About page, emails). */
export const SUPPORT_URL = 'https://buymeacoffee.com/irina.csapo';
/** Where people can reach us (forwards to Irina's inbox). */
export const CONTACT_EMAIL = 'hello@magpie.cool';
