# Magpie

A global calendar for artists: open calls, prizes, residencies, grants, events and meetups across visual art,
photography, music, film, writing and performance. Closing soonest first, and **every fee shown up front**:
the entry fee, anything you pay if you're selected (hanging fees, "secure your space" fees), and commission.

**Live site:** https://irinacsapo.github.io/open-calls-calendar/

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

- **"What do you make?"** (`#/start`, linked above the results): pick disciplines as chips; the list then opens filtered to
  them (kept in the visitor's browser only). Skipping shows everything.

- **Closing soonest first**, grouped into "Closing this week", "Closing in the next month" and "Later". Countdowns
  use the organiser's timezone (a deadline closes at the end of that day there). Listings hide themselves once the
  deadline passes (events: once they end). Their pages stay up so shared links work.
- **Fee label on every card**: ✓ *Free, no fees if selected* · ! *Free to enter, pay if selected: £250 hanging fee* ·
  *£15 to enter (≈ $19)* · ? *Entry fee not stated*. Fees in other currencies get a rough conversion.
- **Filter bar** like BuilderBee's: a search box, then Free / Paid chips and a "Where" dropdown (UK, US, Canada,
  Australia and every continent; online calls open worldwide always show), with "More filters" (closed by default) for the rest.
- **Money filters**: free to enter, paid, totally free, entry fee up to £5/10/25/50/100, hide calls that charge selected
  artists, hide calls that don't state their fees, has a cash prize. Plus type, discipline, region, format,
  closing within N days, and search. Every filtered view is a shareable link.
- **Prizes** listed on every card and page. Sort by biggest cash prize or cheapest to enter.
- **Calendar view** (deadlines and event dates on a month grid), **add one deadline to your calendar**, and a
  **subscribable feed of every deadline** (`deadlines.ics`).

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
| `prizes` | Each prize as stated: `["£10,000 first prize", "Solo show"]`; `prize_kinds`, and `prize_value` (largest cash prize) for sorting |
| `region` | Europe, UK, North America, LatAm, Africa, Asia, Middle East, Oceania, Global |

**Typos fail the build.** [`scripts/validate-listings.ts`](scripts/validate-listings.ts) runs first and checks
allowed values, dates, timezones, duplicate ids/links, and the money rules (a paid entry needs an amount, a
"Yes" selected fee needs details, a cash prize value needs a currency…).

Approximate exchange rates for comparing fees are in [`src/lib/money.ts`](src/lib/money.ts).

## Deploys

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): `npm ci`,
`npm run build`, publish `dist/` to GitHub Pages. One-time setup: **Settings → Pages → Source: GitHub Actions**.
Hash URLs (`#/listing/<id>`, `#/?price=free-entry`) mean no server config is needed. When it gets its own
domain: set `base: '/'` in `vite.config.ts`, add `public/CNAME`, and update `SITE_URL` in `src/lib/site.ts`.

## Design

Soft warm-white background (`#FAF9F6`), a BuilderBee-style centred hero, accent colours blue, sky, orange,
lavender, teal and butter, BuilderBee-style rows of square cards, Medium-style chips, navy (`#1F3456`) and white fully rounded buttons, navy text throughout, big headlines in **Sorts Mill Goudy**, the wordmark in **Crimson Text** semibold and body text in **Inter** (all Google Fonts).
For a different headline face (e.g. **Exposure** by 205TF, paid): add the font files and
change `--font-display` in [`src/styles.css`](src/styles.css). All colours are tokens at the top of that file,
with contrast ratios noted. The site name is `SITE_NAME` in [`src/lib/site.ts`](src/lib/site.ts) (plus `index.html`).
