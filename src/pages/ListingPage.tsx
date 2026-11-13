import { useMemo, useState, type ReactNode } from 'react';
import type { Listing } from '../types/listing';
import { LISTINGS, findListing } from '../lib/listings';
import { closesAt, formatFull, formatRange, isLive, isOpportunity, timeLeft, useNow } from '../lib/dates';
import { convert, feeSummary, formatMoney, guessCurrency, isTotallyFree } from '../lib/money';
import { downloadIcs } from '../lib/ics';
import { getListHash } from '../lib/useHashRoute';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { REPORT_URL } from '../lib/site';
import { Placeholder, isNew, place } from '../components/ListingCard';
import { ListingRow } from '../components/ListingRow';
import { ShareLink } from '../components/ShareLink';
import { NotFoundPage } from './NotFoundPage';

const FORMAT_ICON = { Online: '🌐', 'In person': '📍', Hybrid: '🔀' } as const;

/** Up to 4 other open listings that share a discipline (closing soonest), topped up with the same type. */
function moreLikeThis(l: Listing, now: number): Listing[] {
  const own = l.disciplines.filter((d) => d !== 'Any medium');
  const others = LISTINGS.filter((x) => x.id !== l.id && isLive(x, now)).sort((a, b) => closesAt(a) - closesAt(b));
  const similar = others.filter((x) => own.some((d) => x.disciplines.includes(d)));
  const sameType = others.filter((x) => x.type === l.type && !similar.includes(x));
  return [...similar, ...sameType].slice(0, 4);
}

/** One row of the "What it costs" breakdown, with a symbol so it never relies on colour. */
function CostRow({ tone, label, children }: { tone: 'good' | 'warn' | 'paid' | 'unknown'; label: string; children: ReactNode }) {
  const icon = { good: '✓', warn: '!', paid: '•', unknown: '?' }[tone];
  return (
    <div className={`cost-row cost-row--${tone}`}>
      <span className="cost-row__icon" aria-hidden="true">{icon}</span>
      <div>
        <dt>{label}</dt>
        <dd>{children}</dd>
      </div>
    </div>
  );
}

export function ListingPage({ id }: { id: string }) {
  const l = findListing(id);
  useDocumentTitle(l?.title ?? 'Not found');
  const now = useNow();
  const [currency] = useState(guessCurrency);
  const related = useMemo(() => (l ? moreLikeThis(l, now) : []), [l, now]);
  if (!l) return <NotFoundPage />;

  const left = timeLeft(l, now);
  const opp = isOpportunity(l);
  const live = isLive(l, now);
  const fee = feeSummary(l, currency);
  const where = l.format === 'Online' ? place(l) : [l.venue, l.city, l.country].filter(Boolean).join(', ');
  const approx = l.entry_fee === 'Paid' && l.fee_amount !== undefined && l.currency && l.currency !== currency
    ? ` (${formatMoney(convert(l.fee_amount, l.currency, currency), currency, true)})` : '';

  return (
    <>
      <article className="listing-page">
        <p className="listing-page__back"><a href={getListHash()}><span aria-hidden="true">← </span>Back to all events</a></p>

        {!live && (
          <p className="notice" role="note">
            <strong>{opp ? 'This call has closed.' : 'This event has ended.'}</strong> It stays here so shared links keep working.
          </p>
        )}

        <header className="listing-page__header">
          <ul className="card__pills" aria-label="Status">
            <li className={`pill pill--time pill--${left.urgency}`}><span aria-hidden="true">⏳</span> {left.label}</li>
            <li className="pill">{l.type}</li>
            {isNew(l, now) && <li className="pill pill--new">New</li>}
            {isTotallyFree(l) && <li className="pill pill--free">✓ Totally free</li>}
          </ul>
          <h1 className="listing-page__title">{l.title}</h1>
          <p className="listing-page__org"><span className="sr-only">Organised by </span>{l.organiser}</p>
        </header>

        <div className="listing-page__layout">
          <div className="listing-page__main">
            <div className={`listing-page__media${l.image_url ? '' : ' listing-page__media--wash'}`}>
              {l.image_url
                ? <img src={l.image_url} alt="" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                : <Placeholder l={l} />}
            </div>

            <section className="listing-section" aria-labelledby="cost-h">
              <h2 id="cost-h">What it costs</h2>
              <dl className="costs">
                <CostRow tone={l.entry_fee === 'Free' ? 'good' : l.entry_fee === 'Paid' ? 'paid' : 'unknown'} label={opp ? 'To enter' : 'To attend'}>
                  {l.entry_fee === 'Free' ? 'Free' : l.entry_fee === 'Paid' ? <>{l.fee_details ?? fee.headline}{approx}</> : <>Not stated by the organiser.{l.fee_details && ` ${l.fee_details}`}</>}
                </CostRow>
                {opp && (
                  <CostRow tone={l.selected_fee === 'Yes' ? 'warn' : l.selected_fee === 'None' ? 'good' : 'unknown'} label="If you're selected">
                    {l.selected_fee === 'Yes' && l.selected_fee_details}
                    {l.selected_fee === 'None' && <>Nothing more to pay the organiser.{l.selected_fee_details && <span className="muted"> Your own costs: {l.selected_fee_details}</span>}</>}
                    {l.selected_fee === 'Unknown' && <>Not stated. Check their terms before you apply.{l.selected_fee_details && ` ${l.selected_fee_details}`}</>}
                  </CostRow>
                )}
                {l.commission && <CostRow tone="paid" label="Commission on sales">{l.commission}</CostRow>}
              </dl>
            </section>

            <section className="listing-section" aria-labelledby="prize-h">
              <h2 id="prize-h">{opp ? 'Prizes and what you get' : 'Prizes'}</h2>
              {l.prizes.length
                ? <ul className="prizes">{l.prizes.map((p) => <li key={p}><span aria-hidden="true">🏆</span> {p}</li>)}</ul>
                : <p className="muted">None stated.</p>}
            </section>

            <section className="listing-section" aria-labelledby="details-h">
              <h2 id="details-h">Details</h2>
              <dl className="facts">
                {l.deadline && <div><dt>{opp ? 'Deadline' : 'Register by'}</dt><dd>{formatFull(l.deadline)} <span className="muted">(end of day, {l.timezone.replace(/_/g, ' ')} time)</span></dd></div>}
                {l.start_date && <div><dt>{opp ? 'Exhibition / programme dates' : 'When'}</dt><dd>{formatRange(l.start_date, l.end_date)}</dd></div>}
                <div><dt>Where</dt><dd><span aria-hidden="true">{FORMAT_ICON[l.format]} </span>{where}</dd></div>
                <div><dt>Who can apply</dt><dd><q>{l.eligibility}</q></dd></div>
                <div><dt>Disciplines</dt><dd><ul className="card__chips">{l.disciplines.map((d) => <li key={d} className="info-chip">{d}</li>)}</ul></dd></div>
                <div><dt>Organiser</dt><dd>{l.organiser}</dd></div>
              </dl>
            </section>

            <p className="small muted listing-page__source">
              Checked on {formatFull(l.added)} from <a href={l.source} target="_blank" rel="noopener noreferrer">the organiser's page</a>.
              Fees and dates can change, so check before you pay anything.{' '}
              <a href={REPORT_URL(l.id)} target="_blank" rel="noopener noreferrer">Something wrong? Tell us</a>.
            </p>
          </div>

          <aside className="listing-panel" aria-label={opp ? 'Apply' : 'Register'}>
            <p className="listing-panel__label">{opp ? (l.deadline ? 'Deadline' : 'Starts') : 'When'}</p>
            <p className="listing-panel__date">{formatFull(opp ? l.deadline! : l.start_date!)}</p>
            <p className={`listing-panel__left listing-panel__left--${left.urgency}`}>{left.label}</p>
            <div className={`fee fee--${fee.tone} listing-panel__fee`}>
              <p className="fee__headline"><strong>{fee.headline}</strong>{fee.approx && <span className="fee__approx"> ({fee.approx})</span>}</p>
              {fee.selected && <p className="fee__selected">{fee.selected}</p>}
            </div>
            {live && (
              <a className="button listing-panel__apply" href={l.apply_url} target="_blank" rel="noopener noreferrer">
                {opp ? 'Apply' : 'Register'} <span aria-hidden="true">↗</span><span className="sr-only"> on the organiser's site (opens in a new tab)</span>
              </a>
            )}
            <p className="listing-panel__note">{opp ? 'You apply' : 'You register'} on the organiser's site.</p>
            {live && (
              <button type="button" className="button button--secondary" onClick={() => downloadIcs(l, window.location.href)}>
                <span aria-hidden="true">📅</span> {opp && l.deadline ? 'Add deadline to calendar' : 'Add to calendar'}
              </button>
            )}
            <ShareLink title={l.title} />
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <div className="rows listing-page__related">
          <ListingRow id="related" title="More like this" listings={related} currency={currency} now={now} />
        </div>
      )}
    </>
  );
}
