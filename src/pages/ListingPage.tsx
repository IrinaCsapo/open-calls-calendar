import { useMemo, type ReactNode } from 'react';
import type { Listing } from '../types/listing';
import { EXHIBITIONS, LISTINGS, findListing, isExhibition } from '../lib/listings';
import { closesAt, endsAt, formatFull, formatRange, isLive, isOpportunity, timeLeft, useNow } from '../lib/dates';
import { feeSummary, isTotallyFree, priceTag } from '../lib/money';
import { calendarLinks, downloadIcs } from '../lib/ics';
import { getListHash } from '../lib/useHashRoute';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { REPORT_URL, SITE_URL } from '../lib/site';
import { OpenToFacts, Placeholder, isNew, place, useListingImage, wash } from '../components/ListingCard';
import { ListingRow } from '../components/ListingRow';
import { ShareLink } from '../components/ShareLink';
import { ReminderBox } from '../components/ReminderBox';
import { NotFoundPage } from './NotFoundPage';
import { FormatIcon, IconFlag, IconBuilding, IconCalendar, IconCheck, IconClock, IconGlobe, IconMoney, IconPin, IconSwatch, IconTicket, IconUnknown, IconUsers, IconWarn } from '../components/Icons';
import { perks } from '../lib/perks';
import { collectionUrl, collectionsFor } from '../lib/collections';


/** Up to 4 other open listings that share a discipline (closing soonest), topped up with the same type. */
function moreLikeThis(l: Listing, now: number): Listing[] {
  // Exhibitions: others on now or soon, in the same country first, ending soonest
  if (isExhibition(l)) {
    const others = EXHIBITIONS.filter((x) => x.id !== l.id && isLive(x, now)).sort((a, b) => endsAt(a) - endsAt(b));
    return [...others.filter((x) => x.country === l.country), ...others.filter((x) => x.country !== l.country)].slice(0, 4);
  }
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
  const heroImg = useListingImage(l);
  if (!l) return <NotFoundPage />;

  const left = timeLeft(l, now);
  const opp = isOpportunity(l);
  const live = isLive(l, now);
  const fee = feeSummary(l);
  const gets = perks(l);
  const where = l.format === 'Online' ? place(l) : [l.venue, l.city, l.country].filter(Boolean).join(', ');
  const show = isExhibition(l);

  const cal = calendarLinks(l, `${SITE_URL}listing/${l.id}`);
  const feeTone = fee.tone === 'free' ? 'free' : fee.tone === 'caution' ? 'caution' : fee.tone === 'paid' ? 'paid' : 'unknown';

  return (
    <>
      <article className="listing-page">
        <p className="listing-page__back">
          {show
            ? <a href="/exhibitions"><span aria-hidden="true">← </span>Back to exhibitions</a>
            : <a href={getListHash()}><span aria-hidden="true">← </span>Back to all open calls</a>}
        </p>

        {!live && (
          <p className="notice" role="note">
            <strong>{opp ? 'This call has closed.' : show ? 'This exhibition has ended.' : 'This event has ended.'}</strong> It stays here so shared links keep working.
          </p>
        )}

        {/* The hero: everything you need to decide, and the button */}
        <section className="lhero" aria-labelledby="listing-title">
          <div className="lhero__text">
            <ul className="lhero__pills" aria-label="At a glance">
              <li className="pill pill--type">{l.type}</li>
              <li className="pill pill--plain"><FormatIcon format={l.format} />{l.format}</li>
              {isTotallyFree(l)
                ? <li className="pill pill--free-fill"><IconCheck />{show ? 'Free entry' : 'Totally free'}</li>
                : !l.commercial && <li className={`pill pill--${feeTone}`}>{fee.headline}</li>}{/* commercial: the Commercial tag carries the price */}
              {opp && l.selected_fee === 'Yes' && !l.commercial && <li className="pill pill--caution"><IconWarn />Pay if selected</li>}
              {l.commercial && <li className="pill pill--commercial">Commercial · {priceTag(l)}</li>}
              {isNew(l, now) && <li className="pill pill--new">New</li>}
            </ul>
            <h1 id="listing-title" className="lhero__title">{l.title}</h1>
            <p className="lhero__org">by {l.organiser}</p>
            <ul className="lhero__facts" aria-label="Key facts">
              <li><IconCalendar />{opp && l.deadline ? <>Closes {formatFull(l.deadline)}</> : formatRange(l.start_date!, l.end_date)}</li>
              <li><IconPin />{place(l)}</li>
              <li><IconTicket />{fee.headline}</li>
            </ul>
            {live && (
              <a className="button lhero__apply" href={l.apply_url} target="_blank" rel="noopener noreferrer">
                {opp ? 'Apply' : show ? 'Plan your visit' : 'Register'} <span aria-hidden="true">↗</span><span className="sr-only"> on the organiser's site (opens in a new tab)</span>
              </a>
            )}
            <p className={`lhero__left lhero__left--${left.urgency}`}><IconClock />{left.label}</p>
            <p className="lhero__note">
              {show ? 'Opening times and tickets are on the venue’s site.' : <>{opp ? 'You apply' : 'You register'} on the organiser’s site.</>} Magpie is free and never asks for your details.
            </p>
          </div>
          <div className={`lhero__media${l.image_url ? '' : ' lhero__media--wash'}`} style={{ background: wash(l.id, true) }}>
            {l.image_url
              ? heroImg.src && <img src={heroImg.src} alt="" referrerPolicy="no-referrer" onError={heroImg.onError} />
              : <Placeholder l={l} />}
          </div>
        </section>

        <div className="listing-page__layout">
          <div className="listing-page__main">
            <section className="listing-section" aria-labelledby="gtk-h">
              <h2 id="gtk-h">Good to know</h2>

              <div className="gtk-who">
                <span className="gtk-who__icon"><IconUsers /></span>
                <div>
                  <p className="gtk-eyebrow">{show ? 'About the exhibition' : 'Who it\'s for'}</p>
                  <p className="gtk-who__quote">“{l.eligibility.replace(/\.$/, '')}”</p>
                  {!show && (l.open_to || l.open_to_who) && (
                    <ul className="card__facts gtk-who__tags" aria-label="Who can apply">
                      <OpenToFacts l={l} />
                    </ul>
                  )}
                </div>
              </div>

              {l.highlights && l.highlights.length > 0 && (
                <div className="gtk-get gtk-get--highlights">
                  <p className="gtk-eyebrow">Also on</p>
                  <ul className="gtk-get__details">{l.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
                </div>
              )}

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

            {!show && <section className="listing-section" aria-labelledby="cost-h">
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
            </section>}
          </div>

          {/* Save it for later: calendar, an email reminder, the link */}
          <aside className="save-card" aria-labelledby="save-h">
            <h2 id="save-h">Save it for later</h2>
            {live && (
              <>
                <p className="save-card__label">{opp && l.deadline ? 'Add the deadline to your calendar' : 'Add to your calendar'}</p>
                <div className="save-card__cals">
                  <a className="button button--secondary" href={cal.google} target="_blank" rel="noopener noreferrer">Google</a>
                  <a className="button button--secondary" href={cal.outlook} target="_blank" rel="noopener noreferrer">Outlook</a>
                  {/* A real .ics on the site opens in Apple Calendar on iPhone and Mac; in dev the file isn't built, so download one */}
                  <a className="button button--secondary" href={`/cal/${l.id}.ics`}
                    onClick={import.meta.env.DEV ? (e) => { e.preventDefault(); downloadIcs(l, window.location.href); } : undefined}>Apple</a>
                  <a className="button button--secondary" href={cal.office} target="_blank" rel="noopener noreferrer">Microsoft 365</a>
                </div>
                <p className="save-card__small">
                  {opp && l.deadline ? 'Added as an all-day entry on the deadline. ' : 'Added as an all-day event. '}
                  Apple opens it in your Calendar app{opp && l.deadline ? ', with reminders three days before and on the day' : ''}.{' '}
                  {!show && <>Want every deadline? <a href="/subscribe">Subscribe to the calendar</a>.</>}
                </p>
                {opp && <ReminderBox l={l} now={now} />}
              </>
            )}
            <ShareLink title={l.title} label={opp ? 'Copy link to this call' : 'Copy event link'} />
            <a className="save-card__report" href={REPORT_URL(l.id, l.title)}><IconFlag />Report a problem</a>
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <div className="rows listing-page__related">
          <ListingRow id="related" title={show ? 'More exhibitions' : 'More like this'} listings={related} now={now}
            aside={show
              ? <a className="row__all" href="/exhibitions">All exhibitions <span aria-hidden="true">→</span></a>
              : <a className="row__all" href="/">All open calls <span aria-hidden="true">→</span></a>} />
        </div>
      )}
      {!show && <nav className="browse browse--listing" aria-label="More open calls like this">
        <section className="browse__group">
          <h2>Browse more</h2>
          <ul>
            {collectionsFor(l).map((c) => <li key={c.slug}><a href={collectionUrl(c)}>{c.title}</a></li>)}
            <li><a href="/open-calls">Everything, by discipline and place</a></li>
          </ul>
        </section>
      </nav>}
    </>
  );
}
