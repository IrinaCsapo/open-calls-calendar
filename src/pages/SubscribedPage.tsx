import { useMemo, useState } from 'react';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { LISTINGS } from '../lib/listings';
import { closesAt, isLive, isOpportunity, useNow } from '../lib/dates';
import { guessPlace, loadPlaceSetting, nearYou } from '../lib/location';
import { SITE_URL } from '../lib/site';
import { wash } from '../components/ListingCard';
import { ListingRow } from '../components/ListingRow';
import { HeroPaint } from '../components/HeroPaint';
import { IconCheck, IconLink, IconSearch, IconSwatch } from '../components/Icons';
import bird from '../assets/magpie-bird.png';

/** The next Monday after today, e.g. "Monday 23 November" */
function nextMonday(now = new Date()) {
  const d = new Date(now);
  d.setDate(d.getDate() + (((8 - d.getDay()) % 7) || 7));
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

const WHAT = [
  { colour: '#fde2c2', title: 'Closing this week', text: 'Last chances: calls whose deadline is in the next seven days.' },
  { colour: '#d4f7ee', title: 'New on Magpie', text: 'Every open call, prize, residency and event added in the last week.' },
  { colour: '#efe8f6', title: 'Near you, and free', text: 'Calls in your part of the world, and ones that cost nothing to enter or if you’re selected.' },
];

/**
 * Where Brevo sends people after they click "Yes, send me the weekly email" (set as the form's confirmation
 * redirect in Brevo). Says what they've signed up for, when it arrives, and gives them something to look at now.
 */
export function SubscribedPage() {
  useDocumentTitle('You’re subscribed');
  const now = useNow();
  const [copied, setCopied] = useState(false);
  const setting = loadPlaceSetting();
  const place = setting === 'off' ? null : setting === 'auto' ? guessPlace() : setting;
  const { title, list } = useMemo(() => {
    const open = LISTINGS.filter((l) => isLive(l, now) && !l.commercial).sort((a, b) => closesAt(a) - closesAt(b));
    const near = nearYou(open, place, null);
    return near.length >= 2
      ? { title: `Near you · ${place}`, list: near.slice(0, 8) }
      : { title: 'Closing soon', list: open.filter(isOpportunity).slice(0, 8) };
  }, [now, place]);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(SITE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard blocked: the address is on screen anyway */ }
  };

  return (
    <div className="about subscribed">
      <section className="about-hero">
        <HeroPaint />
        <div className="about-hero__text">
          <p className="about-eyebrow">You’re in</p>
          <h1>You’re subscribed to the <em>Magpie weekly</em></h1>
          <p className="about-lede">Thanks for confirming! Every Monday morning you’ll get one short email with open calls,
            prizes, residencies and events for artists, every fee up front. Your first one arrives on <strong>{nextMonday()}</strong>.
            A welcome email with a few calls to start with is on its way now.</p>
        </div>
        <div className="about-hero__art" style={{ background: wash('subscribed-magpie') }} aria-hidden="true">
          <img src={bird} alt="" width="440" height="440" />
        </div>
      </section>

      <section className="about-section" aria-labelledby="sub-what">
        <h2 id="sub-what">What’s in it</h2>
        <ul className="subscribed__what">
          {WHAT.map((w) => (
            <li key={w.title} style={{ background: w.colour }}>
              <h3>{w.title}</h3>
              <p>{w.text}</p>
            </li>
          ))}
        </ul>
        <p className="subscribed__small">It comes from <strong>hello@magpie.cool</strong>. Add it to your contacts so it doesn’t land
          in spam. Every email has an unsubscribe link, and we never sell your data.</p>
      </section>

      <section className="about-section" aria-labelledby="sub-next">
        <h2 id="sub-next">While you wait</h2>
        <ul className="about-grid subscribed__next">
          <li className="about-card">
            <span className="about-card__icon"><IconSearch /></span>
            <h3>Browse what’s open</h3>
            <p>Every open call, closing soonest first, with every fee on the card.</p>
            <a className="button" href="/">Browse open calls</a>
          </li>
          <li className="about-card">
            <span className="about-card__icon"><IconSwatch /></span>
            <h3>Tell us what you make</h3>
            <p>Pick your disciplines and see the calls for your work first.</p>
            <a className="button button--secondary" href="/start">Pick what you make</a>
          </li>
          <li className="about-card">
            <span className="about-card__icon"><IconLink /></span>
            <h3>Tell a friend</h3>
            <p>Know an artist who’d love this? Send them magpie.cool.</p>
            <button type="button" className="button button--secondary" onClick={share}>
              {copied ? <><IconCheck />Link copied</> : <><IconLink />Copy the link</>}
            </button>
            <span className="sr-only" role="status">{copied ? 'Link copied' : ''}</span>
          </li>
        </ul>
      </section>

      {list.length > 0 && (
        <div className="rows">
          <ListingRow id="subscribed-picks" title={title} listings={list} now={now} />
        </div>
      )}
    </div>
  );
}
