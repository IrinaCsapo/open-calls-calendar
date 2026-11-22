import { useMemo, type ReactNode } from 'react';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { LISTINGS } from '../lib/listings';
import { isLive, useNow } from '../lib/dates';
import { wash } from '../components/ListingCard';
import {
  IconBadge, IconBell, IconBuilding, IconCalendar, IconCheck, IconClock, IconMail, IconMoney, IconPin, IconRefresh, IconSearch, IconTicket, IconUnknown, IconWarn,
} from '../components/Icons';
import { isTotallyFree } from '../lib/money';
import bird from '../assets/magpie-bird.png';
import { HeroPaint } from '../components/HeroPaint';

function Feature({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className="about-card">
      <span className="about-card__icon">{icon}</span>
      <h3>{title}</h3>
      <p>{children}</p>
    </li>
  );
}

const LABELS = [
  { tone: 'good', icon: <IconCheck />, sample: 'Free to enter · No fees if selected', title: 'Free, no fees if selected',
    text: "Nothing to pay to enter, and nothing to pay if you're chosen." },
  { tone: 'warn', icon: <IconWarn />, sample: 'Free to enter · Pay if selected', title: 'Free to enter, pay if selected',
    text: 'Free to apply, but selected artists are asked to pay something: a hanging fee, an exhibition fee, a fee to "secure your space". The amount is on the listing.' },
  { tone: 'paid', icon: <IconMoney />, sample: '£15 to enter', title: 'Paid entry',
    text: "The cheapest way in, usually one work, in the organiser's own currency. The full fee structure is on the listing's page." },
  { tone: 'unknown', icon: <IconUnknown />, sample: 'Entry fee not stated', title: 'Not stated',
    text: 'The organiser\'s page doesn\'t say. Check their terms before you apply, or hide these with "Fees stated" under More filters.' },
] as const;

/** magpie.cool/how-it-works: what Magpie does, how fees are labelled, and where the listings come from. */
export function HowItWorksPage() {
  useDocumentTitle('How it works');
  const now = useNow();
  const stats = useMemo(() => {
    const live = LISTINGS.filter((l) => isLive(l, now));
    const countries = new Set(live.map((l) => l.country).filter(Boolean));
    return {
      live: live.length, countries: countries.size,
      totallyFree: live.filter((l) => isTotallyFree(l) && !l.commercial).length,
      commercial: live.filter((l) => l.commercial).length,
    };
  }, [now]);

  return (
    <div className="about">
      <section className="about-hero">
        <HeroPaint />
        <div className="about-hero__text">
          <p className="about-eyebrow">How it works</p>
          <h1>Every open call, every fee, <em>in one place</em></h1>
          <p className="about-lede">Open calls are scattered across websites, newsletters and Instagram posts, and too many
            only mention the fees once you've filled in a long form. Like a magpie, we collect the good ones, check the costs,
            and put them in one calendar, closing soonest first.</p>
          <p className="hero__hint about-hero__hint" aria-hidden="true"><span className="hero__hint--mouse">Click and drag to paint</span><span className="hero__hint--touch">Drag sideways to paint</span></p>
        </div>
        <div className="about-hero__art" style={{ background: wash('about-magpie') }} aria-hidden="true">
          <img src={bird} alt="" width="440" height="440" />
        </div>
      </section>

      <ul className="about-stats" aria-label="Right now">
        <li><strong>{stats.live}</strong><span>open listings right now</span></li>
        <li><strong>{stats.totallyFree}</strong><span>completely free: nothing to enter, nothing if selected</span></li>
        <li><strong>{stats.countries}</strong><span>countries, plus online calls open worldwide</span></li>
      </ul>

      <section className="about-section" aria-labelledby="what-h">
        <h2 id="what-h">What Magpie does</h2>
        <ul className="about-grid">
          <Feature icon={<IconMoney />} title="Every fee up front">The entry fee, anything you'd pay if selected, and commission on sales, on every listing.</Feature>
          <Feature icon={<IconClock />} title="Closing soonest first">Deadlines that are about to pass come first, with a countdown in your time zone.</Feature>
          <Feature icon={<IconRefresh />} title="Updated every morning">New calls appear daily: painting, collage, photography, music, residencies, grants and more.</Feature>
          <Feature icon={<IconPin />} title="Near you">Calls in your country and continent at the top, plus online ones you can enter from anywhere.</Feature>
        </ul>
      </section>

      <section className="about-section" aria-labelledby="free-first">
        <h2 id="free-first">Free first, and no pay-to-exhibit in disguise</h2>
        <ul className="about-grid">
          <Feature icon={<IconCheck />} title="Free calls come first">Calls that cost nothing to enter and nothing if you're
            selected are what Magpie is for. Switch on <a href="/?price=totally-free">Free only</a> to see just those, or
            browse <a href="/open-calls/free">free open calls</a>.</Feature>
          <Feature icon={<IconBuilding />} title="Real galleries and institutions">The main calendar is for galleries, museums,
            charities, festivals, publishers and funders who show, pay or support artists.</Feature>
          <Feature icon={<IconTicket />} title="Commercial, clearly labelled">Some organisers sell exhibitions, book pages or
            awards to artists as a business. They sit apart, at the bottom, under “Commercial opportunities”, with a price tag
            showing everything you'd pay{stats.commercial > 0 && <> ({stats.commercial} right now)</>}.</Feature>
          <Feature icon={<IconWarn />} title="Fees if selected, always shown">A free call that charges a “hanging fee” once you're
            chosen is labelled “Pay if selected”, with the amount. <a href="/faq">How to spot pay-to-exhibit</a>.</Feature>
        </ul>
      </section>

      <section className="about-section" aria-labelledby="never-miss">
        <h2 id="never-miss">Never miss a deadline</h2>
        <ul className="about-grid">
          <Feature icon={<IconMail />} title="The weekly email">Every Monday: calls closing that week, new calls, and calls near
            you. Sign up at the bottom of any page.</Feature>
          <Feature icon={<IconBell />} title="A reminder for one call">On any open call, ask for an email three days before it
            closes. That one email, and nothing else.</Feature>
          <Feature icon={<IconCalendar />} title="In your calendar">Add one deadline with a reminder, or <a href="/subscribe">subscribe
            to every deadline</a> in Google, Apple or Outlook calendar.</Feature>
          <Feature icon={<IconSearch />} title="Browse your way">By <a href="/open-calls">discipline, place or kind</a>: photography,
            residencies, the UK, online, and more.</Feature>
        </ul>
      </section>

      <section className="about-section" aria-labelledby="fees">
        <h2 id="fees">How we label fees</h2>
        <ul className="about-labels">
          {LABELS.map((l) => (
            <li key={l.title} className={`about-label about-label--${l.tone}`}>
              <span className="about-label__icon">{l.icon}</span>
              <div>
                <h3>{l.title}</h3>
                <p className="about-label__sample"><span className="sr-only">On a card: </span>{l.sample}</p>
                <p>{l.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="about-section" aria-labelledby="scout-h">
        <h2 id="scout-h">Where the listings come from</h2>
        <ol className="about-steps">
          <li className="about-card">
            <span className="about-card__icon"><IconSearch /></span>
            <span className="about-step__n">1</span>
            <h3>We search, every morning</h3>
            <p>At 7:00 (London) a research assistant checks artist opportunity sites, organisers and social posts for new calls.</p>
          </li>
          <li className="about-card">
            <span className="about-card__icon"><IconBadge /></span>
            <span className="about-step__n">2</span>
            <h3>We check the small print</h3>
            <p>Every deadline and every fee is confirmed on the organiser's own page, including their FAQ and terms.</p>
          </li>
          <li className="about-card">
            <span className="about-card__icon"><IconCalendar /></span>
            <span className="about-step__n">3</span>
            <h3>It lands in the calendar</h3>
            <p>New listings appear on the site straight away, closing soonest first, with every fee on the card.</p>
          </li>
        </ol>
      </section>

      <section className="about-cta" style={{ background: wash('about-cta-band', true) }}>
        <h2>Know an open call we're missing?</h2>
        <p>Organisers and artists can send us calls, prizes, residencies and events. We check every one before it goes live.</p>
        <p className="about-cta__actions">
          <a className="button" href="/submit">Submit an open call</a>
          <a className="button button--secondary" href="/">Browse calls</a>
        </p>
      </section>
    </div>
  );
}
