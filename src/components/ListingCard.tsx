import type { Currency, Listing } from '../types/listing';
import { formatFull, formatShort, isOpportunity, timeLeft } from '../lib/dates';
import { FeeLabel } from './FeeLabel';

const NEW_DAYS = 3;

export function place(l: Listing): string {
  if (l.format === 'Online') return l.region === 'Global' ? 'Online' : `Online · ${l.country || l.region}`;
  const where = [l.city, l.country].filter(Boolean).join(', ');
  return l.format === 'Hybrid' ? `${where} + online` : where;
}

export function isNew(l: Listing, now: number): boolean {
  return now - Date.parse(`${l.added}T00:00:00Z`) < NEW_DAYS * 86_400_000;
}

export function ListingCard({ listing: l, currency, now }: { listing: Listing; currency: Currency; now: number }) {
  const left = timeLeft(l, now);
  const dateLine = isOpportunity(l)
    ? `Deadline ${formatFull(l.deadline!)}`
    : `${formatFull(l.start_date!)}${l.end_date && l.end_date !== l.start_date ? ` to ${formatShort(l.end_date)}` : ''}`;

  return (
    <article className={`card card--${left.urgency}`}>
      {l.image_url && (
        <img className="card__img" src={l.image_url} alt="" loading="lazy" referrerPolicy="no-referrer"
          onError={(e) => { e.currentTarget.hidden = true; }} />
      )}
      <div className="card__body">
        <p className="card__meta">
          <span className="tag">{l.type}</span>
          {isNew(l, now) && <span className="tag tag--new">New</span>}
          <span className={`countdown countdown--${left.urgency}`}>{left.label}</span>
        </p>
        <h3 className="card__title">
          <a href={`#/listing/${l.id}`}>{l.title}</a>
        </h3>
        <p className="card__org">{l.organiser} · {place(l)}</p>
        <p className="card__date">{dateLine}</p>

        <FeeLabel listing={l} currency={currency} />

        {l.prizes.length > 0 && (
          <div className="card__prizes">
            <p className="card__label">Prizes</p>
            <ul>
              {l.prizes.slice(0, 3).map((p) => <li key={p}>{p}</li>)}
              {l.prizes.length > 3 && <li className="muted">+{l.prizes.length - 3} more</li>}
            </ul>
          </div>
        )}

        <p className="card__disciplines">{l.disciplines.join(' · ')}</p>
      </div>
    </article>
  );
}
