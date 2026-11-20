import { useMemo, type ReactNode } from 'react';
import type { Listing } from '../types/listing';
import { LISTINGS, findListing } from '../lib/listings';
import { closesAt, formatFull, formatRange, isLive, isOpportunity, timeLeft, useNow } from '../lib/dates';
import { feeSummary, isTotallyFree, priceTag } from '../lib/money';
import { downloadIcs } from '../lib/ics';
import { getListHash } from '../lib/useHashRoute';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { REPORT_URL } from '../lib/site';
import { Placeholder, isNew, place, wash } from '../components/ListingCard';
import { ListingRow } from '../components/ListingRow';
import { ShareLink } from '../components/ShareLink';
import { NotFoundPage } from './NotFoundPage';
import { FormatIcon, IconFlag, IconBuilding, IconCalendar, IconCheck, IconClock, IconGlobe, IconMoney, IconSwatch, IconTicket, IconUnknown, IconUsers, IconWarn } from '../components/Icons';
import { perks } from '../lib/perks';
import { collectionUrl, collectionsFor } from '../lib/collections';


/** Up to 4 other open listings that share a discipline (closing soonest), topped up with the same type. */
function moreLikeThis(l: Listing, now: number): Listing[] {
  const own = l.disciplines.filter((d) => d !== 'Any medium');
  const others = LISTINGS.filter((x) => x.id !== l.id && isLive(x, now)).sort((a, b) => closesAt(a) - closesAt(b));
  const similar = others.filter((x) => own.some((d) => x.disciplines.includes(d)));
  const sameType = others.filter((x) => x.type === l.type && !similar.includes(x));
  return [...similar, ...sameType].slice(0, 4);
}

/** One cell of the "Good to know" grid: icon, small label, the fact, and an optional line under it. */
function Fact({ icon, label, children, sub, wide }: { icon: ReactNode; label: string; children: ReactNode; sub?: ReactNode; wide?: boolean }) {
  return (
    <div className={`gtk-fact${wide ? ' gtk-fact--wide' : ''}`}>
      <span className="gtk-fact__icon">{icon}</span>
      <div>
        <dt className="gtk-eyebrow">{label}</dt>
        <dd className="gtk-fact__value">{children}</dd>
        {sub && <dd className="gtk-fact__sub">{sub}</dd>}
      </div>
    </div>
  );
}

/** One row of the "What it costs" breakdown, with a symbol so it never relies on colour. */
function CostRow({ tone, label, children }: { tone: 'good' | 'warn' | 'paid' | 'unknown'; label: string; children: ReactNode }) {
  const Icon = { good: IconCheck, warn: IconWarn, paid: IconMoney, unknown: IconUnknown }[tone];
  return (
    <div className={`cost-row cost-row--${tone}`}>
      <span className="cost-row__icon"><Icon /></span>
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
  const related = useMemo(() => (l ? moreLikeThis(l, now) : []), [l, now]);
  if (!l) return <NotFoundPage />;

  const left = timeLeft(l, now);
  const opp = isOpportunity(l);
  const live = isLive(l, now);
  const fee = feeSummary(l);
  const gets = perks(l);
  const where = l.format === 'Online' ? place(l) : [l.venue, l.city, l.country].filter(Boolean).join(', ');

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
            <li className={`pill pill--time pill--${left.urgency}`}><IconClock />{left.label}</li>
            <li className="pill">{l.type}</li>
            {isNew(l, now) && <li className="pill pill--new">New</li>}
            {isTotallyFree(l) && <li className="pill pill--free"><IconCheck />Totally free</li>}
            {l.commercial && <li className="pill pill--commercial">Commercial</li>}
          </ul>
          <h1 className="listing-page__title">{l.title}</h1>
          <p className="listing-page__org"><span className="sr-only">Organised by </span>{l.organiser}</p>
        </header>

        <div className="listing-page__layout">
          <div className="listing-page__main">
            <div className={`listing-page__media${l.image_url ? '' : ' listing-page__media--wash'}`} style={l.image_url ? { background: wash(l.id, true) } : undefined}>
              {l.image_url
                ? <img src={l.image_url} alt="" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                : <Placeholder l={l} />}
            </div>

            <section className="listing-section" aria-labelledby="gtk-h">
              <h2 id="gtk-h">Good to know</h2>

              <div className="gtk-who">
                <span className="gtk-who__icon"><IconUsers /></span>
                <div>
                  <p className="gtk-eyebrow">Who it's for</p>
                  <p className="gtk-who__quote">“{l.eligibility.replace(/\.$/, '')}”</p>
                </div>
              </div>

              {(gets.length > 0 || l.prizes.length > 0) && (
                <div className="gtk-get">
                  <p className="gtk-eyebrow">What you get</p>
                  {gets.length > 0 && (
                    <ul className="gtk-perks">
                      {gets.map((p) => <li key={p.kind}><p.Icon />{p.label}</li>)}
                    </ul>
                  )}
                  {l.prizes.length > 0 && <ul className="gtk-get__details">{l.prizes.map((p) => <li key={p}>{p}</li>)}</ul>}
                </div>
              )}

              <dl className="gtk-grid">
                {l.deadline && (
                  <Fact icon={<IconCalendar />} label={opp ? 'Deadline' : 'Register by'}
                    sub={<>End of the day, {l.timezone.replace(/_/g, ' ')} time</>}>{formatFull(l.deadline)}</Fact>
                )}
                {l.start_date && (
                  <Fact icon={<IconCalendar />} label={opp ? (l.type === 'Residency' ? 'Residency dates' : 'Exhibition / programme dates') : 'When'}
                    sub={!l.deadline ? <>{l.timezone.replace(/_/g, ' ')} time</> : undefined}>{formatRange(l.start_date, l.end_date)}</Fact>
                )}
                <Fact icon={<FormatIcon format={l.format} />} label="Where" sub={l.format === 'Online' ? undefined : l.format}>{where}</Fact>
                <Fact icon={<IconTicket />} label={opp ? 'Cost to enter' : 'Cost'} sub={fee.selected}>{fee.headline}</Fact>
                <Fact icon={<IconBuilding />} label="Organiser" wide={((l.deadline ? 1 : 0) + (l.start_date ? 1 : 0) + 3) % 2 === 1}>{l.organiser}</Fact>
                <Fact icon={<IconSwatch />} label="Disciplines" wide>{l.disciplines.join(', ')}</Fact>
              </dl>

              <p className="gtk-source">
                <IconGlobe />
                <span>
                  Details checked on <a href={l.source} target="_blank" rel="noopener noreferrer">the organiser's page</a> on {formatFull(l.added)}.
                  Fees and dates can change, so check there before you pay anything.{' '}
                  <a href={REPORT_URL(l.id, l.title)}>Something wrong? Tell us</a>.
                </span>
              </p>
            </section>

            <section className="listing-section" aria-labelledby="cost-h">
              <h2 id="cost-h">What it costs</h2>
              {l.commercial && (
                <p className="commercial-note">
                  <strong>Commercial opportunity: {priceTag(l)}.</strong> This organiser runs paid exhibitions, publications
                  or awards as a business. That's why it's listed apart from free calls and established galleries.
                </p>
              )}
              <dl className="costs">
                <CostRow tone={l.entry_fee === 'Free' ? 'good' : l.entry_fee === 'Paid' ? 'paid' : 'unknown'} label={opp ? 'To enter' : 'To attend'}>
                  {l.entry_fee === 'Free' ? 'Free' : l.entry_fee === 'Paid' ? <>{l.fee_details ?? fee.headline}</> : <>Not stated by the organiser.{l.fee_details && ` ${l.fee_details}`}</>}
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

          </div>

          <aside className="listing-panel" aria-label={opp ? 'Apply' : 'Register'}>
            <p className="listing-panel__label">{opp ? (l.deadline ? 'Deadline' : 'Starts') : 'When'}</p>
            <p className="listing-panel__date">{formatFull(opp ? l.deadline! : l.start_date!)}</p>
            <p className={`listing-panel__left listing-panel__left--${left.urgency}`}>{left.label}</p>
            <div className={`fee fee--${fee.tone} listing-panel__fee`}>
              <p className="fee__headline"><strong>{fee.headline}</strong></p>
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
                <IconCalendar />{opp && l.deadline ? 'Add deadline to calendar' : 'Add to calendar'}
              </button>
            )}
            <ShareLink title={l.title} />
            <a className="listing-panel__report" href={REPORT_URL(l.id, l.title)}><IconFlag />Report a problem</a>
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <div className="rows listing-page__related">
          <ListingRow id="related" title="More like this" listings={related} now={now} />
        </div>
      )}
      <nav className="browse browse--listing" aria-label="More open calls like this">
        <section className="browse__group">
          <h2>Browse more</h2>
          <ul>
            {collectionsFor(l).map((c) => <li key={c.slug}><a href={collectionUrl(c)}>{c.title}</a></li>)}
            <li><a href="/open-calls">Everything, by discipline and place</a></li>
          </ul>
        </section>
      </nav>
    </>
  );
}
