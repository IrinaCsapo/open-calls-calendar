# Magpie

A global calendar for artists: open calls, prizes, residencies, grants, events and meetups across visual art,
photography, music, film, writing and performance. Closing soonest first, and **every fee shown up front**:
the entry fee, anything you pay if you're selected (hanging fees, "secure your space" fees), and commission.

**Live site:** https://magpie.cool/

Sister project of [BuilderBee](https://builderbee.club/), built the same way.

## Run it locally

You need [Node.js](https://nodejs.org) 22 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:5173/open-calls-calendar/

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with live reload |
| `npm run validate` | Checks `src/data/listings.json` for mistakes |
| `npm run build` | Validates, type-checks, builds into `dist/`, and writes the `deadlines.ics` feed |
| `npm run check-links` | Checks every apply link and image still loads (`-- <id>` for just one) |

## What's on it

- **Today's date and time** in a small strip above the navbar (right-aligned), in the visitor's time zone (for working out deadlines).
- **Near you**: a row at the top with calls in the visitor's country, then the rest of their continent, guessed from
  their time zone (no permission prompt). It highlights, it doesn't filter. Under *More filters → Your location* they
  can pick a place, turn it off, or "Use my exact location" (asks the browser; sorts in-person events by distance;
  the coordinates never leave their browser). See [`src/lib/location.ts`](src/lib/location.ts).

- **"What do you make?"** (`/start`, linked in the footer): pick disciplines as chips; Continue shows the list filtered
  to them. The picks are remembered on that page (in the visitor's browser only); a plain visit always opens unfiltered. Skipping shows everything.

- **Closing soonest first**, grouped into "Closing this week", "Closing in the next month" and "Later". Countdowns
  use the organiser's timezone (a deadline closes at the end of that day there). Listings hide themselves once the
  deadline passes (events: once they end). Their pages stay up so shared links work.
- **Fee label on every card**: ✓ *Free, no fees if selected* · ! *Free to enter, pay if selected: £250 hanging fee* ·
  *£15 to enter* · ? *Entry fee not stated*. Fees are shown in the organiser's currency, as they state them
  (the "entry fee up to" filter and the price/prize sorting compare currencies roughly in the background).
- **Filter bar** like BuilderBee's: a search box, then Free / Paid chips and a "Where" dropdown (UK, US, Canada,
  Australia and every continent; online calls open worldwide always show), with "More filters" (closed by default) for the rest.
- **Money filters**: free to enter, paid, totally free, entry fee up to £5/10/25/50/100, hide calls that charge selected
  artists, hide calls that don't state their fees, has a cash prize. Plus type, discipline, region, format,
  closing within N days, and search. Every filtered view is a shareable link.
- **Prizes** listed on every card and page. Sort by biggest cash prize or cheapest to enter.
- **Calendar view** (deadlines and event dates on a month grid), **add one deadline to your calendar**, and a
  feed of every deadline (`deadlines.ics`), with a **Subscribe** page (`/subscribe`, not linked anywhere for now) that has one
  button per calendar: Google, Apple, Outlook, plus copy-the-link. (A single `webcal://` link does nothing for most Google Calendar users.)

## The weekly email (Brevo)

Sign-up journey (adapted from BuilderBee): **The weekly roundup** box above the footer
([`SubscribeBox.tsx`](src/components/SubscribeBox.tsx)) sends the email and the visitor's rough place (UK, Europe, US…)
to Magpie's Brevo form → Brevo sends our **confirm** email → they land on **/subscribed**
([`SubscribedPage.tsx`](src/pages/SubscribedPage.tsx)) → Brevo sends our **welcome** email with calls near their place
(or closing soon). The box stays hidden until `NEWSLETTER_FORM_URL` in [`src/lib/site.ts`](src/lib/site.ts) is set.

- [`scripts/email-parts.ts`](scripts/email-parts.ts): shared email layout, header picture (`public/email/hero.jpg`, drawn by
  [`scripts/email-hero.ts`](scripts/email-hero.ts)), listing cards with a navy date tile, fee and perk pills, and a
  thumbnail (`/thumb/<id>.jpg`, made by `build-og.ts`). Commercial listings stay out of emails.
- [`scripts/brevo-templates.ts`](scripts/brevo-templates.ts): the confirm and welcome emails, uploaded to Brevo by
  [`brevo-templates.yml`](.github/workflows/brevo-templates.yml) after listings change and every night.
- [`scripts/weekly-email.ts`](scripts/weekly-email.ts): Mondays 07:17 UTC ([`weekly-email.yml`](.github/workflows/weekly-email.yml))
  it saves the week's email in Brevo as a **draft** and sends a test; you press send. Sections: near you, closing this
  week, new on Magpie, events, free with no fees if selected.
- Previews: `npx tsx scripts/brevo-templates.ts --preview` and `npx tsx scripts/weekly-email.ts --preview` (to `email-preview/`).
- Setup: [`docs/brevo-setup.md`](docs/brevo-setup.md). Needs `BREVO_API_KEY` (secret), `BREVO_LIST_ID` and `BREVO_TEST_EMAILS` (variables).

## Link previews

Sharing a listing (WhatsApp, iMessage, LinkedIn, Slack…) shows a 1200×630 card drawn at build time by
[`scripts/build-og.ts`](scripts/build-og.ts): the organiser's image on the listing's colour wash, the title in Sorts Mill
Goudy, the deadline, fee pills, the top prize and the logo, with a little grain (`dist/og/<id>.jpg`, about 70 KB each).
Fonts are in `scripts/fonts/` (OFL). If an image can't be fetched the card is drawn without it. Check a design change
with `npx tsx scripts/build-og.ts <id>` and open `dist/og/<id>.jpg`. The home and About pages use `public/og-image.jpg`.

## Google

The build writes `sitemap.xml` (every open listing plus the main pages), and `public/robots.txt` points to it. Every page
has a canonical address, and events carry schema.org `Event` data for Google's event results.

## The daily scout (7:00 London)

A scheduled Claude routine follows [`docs/scout.md`](docs/scout.md) every morning: it checks a watchlist of
open-call sites (Arts to Hearts, opencallforartists, Parker Harris, CuratorSpace, ArtRabbit, CaFÉ, TransArtists,
LensCulture, PRS Foundation…), runs at least 15 varied searches across disciplines and countries, confirms each
deadline **and every fee** on the organiser's own page, adds up to 15 new listings, runs the build (which validates
everything), and pushes to `main`. Each run adds a line to [`docs/scout-log.md`](docs/scout-log.md), even when
it finds nothing. Manage the routine at https://claude.ai/code/routines.

## Listing fields

The model and allowed values live in [`src/types/listing.ts`](src/types/listing.ts). Highlights:

| Field | Notes |
|---|---|
| `type` | Open call, Prize, Residency, Grant, Fellowship, Commission (you apply: need `deadline`) · Event, Meetup, Workshop (you go: need `start_date`) |
| `disciplines` | Any medium, Painting, Drawing, Printmaking, Collage, Mixed media, Sculpture, Ceramics, Textiles, Craft, Photography, Film & video, Digital art, Illustration, Music, Sound, Performance, Writing, Design |
| `entry_fee` | `Free`, `Paid` (then `fee_amount` = cheapest way in, + `currency`), `Unknown` |
| `fee_details` | Full structure: `"£15 per work, 3 for £35"` |
| `selected_fee` | `None`, `Yes` (then `selected_fee_details`: `"£250 hanging fee"`), `Unknown` |
| `commission` | `"30% on sales"` |
| `commercial` | `true` for businesses selling opportunities to artists (pay-to-exhibit, paid virtual shows, art books, awards). They get their own **Commercial opportunities** row at the bottom of the home page, with a price tag on each card; free calls and genuine institutions fill the rows above |
| `selected_fee_amount` | The fee if selected as a number, in `currency` (for the price tag: "£170 if selected") |
| `prizes` | Each prize as stated: `["£10,000 first prize", "Solo show"]`; `prize_kinds`, and `prize_value` (largest cash prize) for sorting |
| `region` | Europe, UK, North America, LatAm, Africa, Asia, Middle East, Oceania, Global |

**Typos fail the build.** [`scripts/validate-listings.ts`](scripts/validate-listings.ts) runs first and checks
allowed values, dates, timezones, duplicate ids/links, and the money rules (a paid entry needs an amount, a
"Yes" selected fee needs details, a cash prize value needs a currency…).

Approximate exchange rates for comparing fees are in [`src/lib/money.ts`](src/lib/money.ts).

## Deploys

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): `npm ci`,
`npm run build`, publish `dist/` to GitHub Pages. One-time setup: **Settings → Pages → Source: GitHub Actions**.
Pages have normal addresses (`/about`, `/listing/<id>`, `/?price=free-entry`). GitHub Pages has no server, so the build
writes a real HTML file for every page ([`scripts/build-pages.ts`](scripts/build-pages.ts)), each listing with its own
link-preview title and description, and copies `index.html` to `dist/404.html` as the fallback for anything else. Old
`/#/...` links are converted on load ([`src/lib/useHashRoute.ts`](src/lib/useHashRoute.ts)). The site lives at its own domain,
**magpie.cool** (bought on Squarespace; DNS points at GitHub Pages): `public/CNAME`, `base: '/'` in `vite.config.ts` and
`SITE_URL` in `src/lib/site.ts`.

## Design

Icons are [Heroicons](https://heroicons.com) (outline, MIT), all in [`src/components/Icons.tsx`](src/components/Icons.tsx).

Soft warm-white background (`#FAF9F6`), a BuilderBee-style centred hero with an interactive paint layer
([`src/components/HeroPaint.tsx`](src/components/HeroPaint.tsx): click and drag to leave grainy blobs of colour that slowly fade; on its own a soft brush loops along both headline lines,
pausing while you paint, off screen, or with reduced motion), accent colours blue, sky, orange,
lavender, teal and butter, BuilderBee-style rows of square cards, Medium-style chips, navy (`#1F3456`) and white fully rounded buttons, navy text throughout, big headlines in **Sorts Mill Goudy**, body text in **Inter** (all Google Fonts).
For a different headline face (e.g. **Exposure** by 205TF, paid): add the font files and
change `--font-display` in [`src/styles.css`](src/styles.css). All colours are tokens at the top of that file,
with contrast ratios noted. The logo is [`src/assets/magpie-logo-colour-horizontal-v2.png`](src/assets/magpie-logo-colour-horizontal-v2.png) (the header uses a 640px copy,
`magpie-logo-header.png`); `public/favicon.png` is the bird on its own and `public/og-image.jpg` the link-preview image.
The site name is `SITE_NAME` in [`src/lib/site.ts`](src/lib/site.ts) (plus `index.html`).
