import { useMemo } from 'react';
import { findListing } from '../lib/listings';
import { formatFull, formatRange, isLive, isOpportunity, timeLeft, useNow } from '../lib/dates';
import { guessCurrency } from '../lib/money';
import { downloadIcs } from '../lib/ics';
import { getListHash } from '../lib/useHashRoute';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { REPORT_URL } from '../lib/site';
import { FeeLabel } from '../components/FeeLabel';
import { place } from '../components/ListingCard';
import { NotFoundPage } from './NotFoundPage';

export function ListingPage({ id }: { id: string }) {
  const l = findListing(id);
  useDocumentTitle(l?.title ?? 'Not found');
  const now = useNow();
  const currency = useMemo(guessCurrency, []);
  if (!l) return <NotFoundPage />;

  const left = timeLeft(l, now);
  const opp = isOpportunity(l);
  const pageUrl = window.location.href;

  const rows: [string, React.ReactNode][] = [
    ['Organiser', l.organiser],
    ['Type', l.type],
    ['Disciplines', l.disciplines.join(', ')],
    ['Where', `${place(l)}${l.venue ? ` (${l.venue})` : ''}`],
    ...(l.deadline ? [[opp ? 'Deadline' : 'Register by', `${formatFull(l.deadline)} (end of day, ${l.timezone.replace(/_/g, ' ')} time)`] as [string, string]] : []),
    ...(l.start_date ? [[opp ? 'Exhibition / programme dates' : 'Dates', formatRange(l.start_date, l.end_date)] as [string, string]] : []),
    ['Who can apply', l.eligibility],
  ];

  return (
    <article className="listing">
      <p><a href={getListHash()}>← Back to all listings</a></p>
      {!isLive(l, now) && <p className="notice">{opp ? 'This call has closed.' : 'This event has ended.'} The details are kept so shared links still work.</p>}

      <p className="card__meta">
        <span className="tag">{l.type}</span>
        <span className={`countdown countdown--${left.urgency}`}>{left.label}</span>
      </p>
      <h1>{l.title}</h1>

      {l.image_url && <img className="listing__img" src={l.image_url} alt="" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.hidden = true; }} />}

      <section aria-labelledby="money">
        <h2 id="money">What it costs</h2>
        <FeeLabel listing={l} currency={currency} size="page" />
        <dl className="details">
          <dt>Entry fee</dt>
          <dd>{l.entry_fee === 'Free' ? 'Free' : l.entry_fee === 'Paid' ? (l.fee_details ?? 'Paid') : 'Not stated by the organiser'}</dd>
          {opp && (
            <>
              <dt>If you're selected</dt>
              <dd>{l.selected_fee === 'Yes' ? l.selected_fee_details : l.selected_fee === 'None' ? 'Nothing more to pay' : 'Not stated by the organiser. Check their terms before you apply.'}</dd>
            </>
          )}
          {l.commission && (<><dt>Commission on sales</dt><dd>{l.commission}</dd></>)}
        </dl>
      </section>

      <section aria-labelledby="prizes">
        <h2 id="prizes">{opp ? 'Prizes and what you get' : 'Prizes'}</h2>
        {l.prizes.length ? <ul>{l.prizes.map((p) => <li key={p}>{p}</li>)}</ul> : <p className="muted">None stated.</p>}
      </section>

      <section aria-labelledby="details">
        <h2 id="details">Details</h2>
        <dl className="details">
          {rows.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
        </dl>
      </section>

      <p className="actions">
        <a className="button" href={l.apply_url} target="_blank" rel="noopener noreferrer">{opp ? 'Apply on the organiser\'s site' : 'Register on the organiser\'s site'} ↗</a>
        <button type="button" className="button button--secondary" onClick={() => downloadIcs(l, pageUrl)}>
          {opp && l.deadline ? 'Add deadline to my calendar' : 'Add to my calendar'}
        </button>
      </p>

      <p className="small muted">
        Checked on {formatFull(l.added)} from <a href={l.source} target="_blank" rel="noopener noreferrer">the organiser's page</a>.
        Fees and dates can change, so check before you pay anything.{' '}
        <a href={REPORT_URL(l.id)} target="_blank" rel="noopener noreferrer">Something wrong? Tell us</a>.
      </p>
    </article>
  );
}
