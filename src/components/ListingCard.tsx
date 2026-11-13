import { useState } from 'react';
import type { Listing } from '../types/listing';
import { formatFull, formatShort, isOpportunity, timeLeft } from '../lib/dates';
import { formatMoney } from '../lib/money';

const NEW_DAYS = 3;
const FORMAT_ICON = { Online: '🌐', 'In person': '📍', Hybrid: '🔀' } as const;
const TINTS = ['#9cc6f0', '#f7bd86', '#93e2cf', '#c9b6d4', '#f1d391', '#b3d6f6'];

export function place(l: Listing): string {
  if (l.format === 'Online') return l.region === 'Global' ? 'Online' : `Online · ${l.country || l.region}`;
  const where = [l.city, l.country].filter(Boolean).join(', ');
  return l.format === 'Hybrid' ? `${where} + online` : where;
}

export function isNew(l: Listing, now: number): boolean {
  return now - Date.parse(`${l.added}T00:00:00Z`) < NEW_DAYS * 86_400_000;
}

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/**
 * A soft watercolour wash, always the same for the same listing: two (or, with `rich`, three) blobs of
 * palette colour on warm paper. Used for listings without an image, and behind images that don't fill
 * their frame on the listing page.
 */
// Brighter set for the frame behind images: blue, apricot, mint, lilac, butter, pink
const VIVID = ['#7fb5f2', '#f6a466', '#6fdcc1', '#bb9ce0', '#f3cd66', '#f394bd'];

export function wash(id: string, rich = false): string {
  const h = hash(id);
  const set = rich ? VIVID : TINTS;
  // three different colours, chosen by the listing's id
  const i = h % set.length, j = (i + 1 + ((h >>> 4) % (set.length - 1))) % set.length;
  let k = (j + 1 + ((h >>> 9) % (set.length - 1))) % set.length;
  if (k === i) k = (k + 1) % set.length;
  const a = set[i], b = set[j], c = set[k];
  // Behind images the middle is covered, so the colour gathers at the left and right edges.
  const blobs = rich
    ? [
        `radial-gradient(38% 70% at ${6 + (h % 14)}% ${30 + (h % 35)}%, ${a}, transparent 72%)`,
        `radial-gradient(38% 70% at ${94 - ((h >>> 3) % 14)}% ${70 - ((h >>> 6) % 35)}%, ${b}, transparent 72%)`,
        `radial-gradient(30% 45% at ${h % 2 ? 12 : 88}% ${h % 3 ? 88 : 12}%, ${c}, transparent 70%)`,
      ]
    : [
        `radial-gradient(60% 55% at ${20 + (h % 40)}% ${25 + (h % 30)}%, ${a}, transparent 75%)`,
        `radial-gradient(55% 60% at ${60 + (h % 30)}% ${60 + (h % 25)}%, ${b}, transparent 78%)`,
      ];
  return `${blobs.join(', ')}, #f4f1ea`;
}

/** Listings without an image get the wash with the title on it. */
export function Placeholder({ l }: { l: Listing }) {
  const style = { background: wash(l.id) };
  return (
    <div className="card__placeholder" style={style} aria-hidden="true">
      <span>{l.title}</span>
    </div>
  );
}

function Media({ l }: { l: Listing }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="card__media">
      {l.image_url && !failed
        ? <img className="card__img" src={l.image_url} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
        : <Placeholder l={l} />}
    </div>
  );
}

/** "£20 to enter" / "Free to enter" pill, plus a separate warning pill when selected artists pay. */
function FeePills({ l }: { l: Listing }) {
  const apply = isOpportunity(l);
  let entry: string;
  if (l.entry_fee === 'Free') entry = apply ? 'Free to enter' : 'Free';
  else if (l.entry_fee === 'Paid' && l.fee_amount !== undefined && l.currency) {
    entry = `${formatMoney(l.fee_amount, l.currency)}${apply ? ' to enter' : ''}`;
  } else entry = apply ? 'Entry fee not stated' : 'Price not stated';

  return (
    <>
      <li className={`pill pill--${l.entry_fee === 'Free' ? 'free' : l.entry_fee === 'Paid' ? 'paid' : 'unknown'}`}>
        {l.entry_fee === 'Free' && <span aria-hidden="true">✓ </span>}{entry}
      </li>
      {apply && l.selected_fee === 'Yes' && (
        <li className="pill pill--caution" title={l.selected_fee_details}>
          <span aria-hidden="true">! </span>Pays if selected
          <span className="sr-only">: {l.selected_fee_details}</span>
        </li>
      )}
      {apply && l.selected_fee === 'None' && <li className="pill pill--free"><span aria-hidden="true">✓ </span>No fees if selected</li>}
      {apply && l.selected_fee === 'Unknown' && <li className="pill pill--unknown">? Fees if selected not stated</li>}
    </>
  );
}

export function ListingCard({ listing: l, now }: { listing: Listing; now: number }) {
  const left = timeLeft(l, now);
  const opp = isOpportunity(l);
  const when = opp
    ? { short: `Deadline ${formatShort(l.deadline!)}`, full: `Deadline ${formatFull(l.deadline!)}` }
    : {
        short: `${formatShort(l.start_date!)}${l.end_date && l.end_date !== l.start_date ? `–${formatShort(l.end_date)}` : ''}`,
        full: formatFull(l.start_date!),
      };
  const topPrize = l.prizes[0];

  return (
    <article className="card">
      <Media l={l} />

      <ul className="card__pills" aria-label="Status and fees">
        <li className={`pill pill--time pill--${left.urgency}`}><span aria-hidden="true">⏳</span> {left.label}</li>
        {isNew(l, now) && <li className="pill pill--new">New</li>}
        <FeePills l={l} />
      </ul>

      <h3 className="card__title">
        <a href={`#/listing/${l.id}`}>{l.title}</a>
      </h3>

      <ul className="card__chips" aria-label="Details">
        <li className="info-chip"><span aria-hidden="true">📅 {when.short}</span><span className="sr-only">{when.full}</span></li>
        <li className="info-chip"><span aria-hidden="true">{FORMAT_ICON[l.format]}</span> {place(l)}</li>
        <li className="info-chip">{l.type}</li>
        {topPrize && (
          <li className="info-chip">
            <span aria-hidden="true">🏆</span><span className="sr-only">Prize:</span> {topPrize}
            {l.prizes.length > 1 && <span className="muted"> +{l.prizes.length - 1}</span>}
          </li>
        )}
        <li className="info-chip">{l.disciplines.slice(0, 3).join(' · ')}</li>
      </ul>
    </article>
  );
}
