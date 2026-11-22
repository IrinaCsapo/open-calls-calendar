import { useDocumentTitle } from '../lib/useDocumentTitle';
import { SUPPORT_URL } from '../lib/site';
import { wash } from '../components/ListingCard';
import photo from '../assets/irina.jpg';

const PORTFOLIO = 'https://irinacsapo.co.uk';
const INSTAGRAM = 'https://www.instagram.com/irina_csapo_art';
const LINKEDIN = 'https://www.linkedin.com/in/irinacsapo/';

/** magpie.cool/about: a short letter from Irina, who makes Magpie. "How it works" has the practical detail. */
export function AboutPage() {
  useDocumentTitle('About');
  return (
    <article className="letter" aria-labelledby="letter-title">
      <div className="letter__paper" style={{ backgroundImage: wash('letter-paper') }}>
        <figure className="letter__photo">
          <img src={photo} alt="Irina Csapo" width="600" height="720" />
          <figcaption>Irina, who makes Magpie</figcaption>
        </figure>

        <p className="about-eyebrow">A letter from Irina</p>
        <h1 id="letter-title" className="letter__title">Why I made Magpie</h1>

        <div className="letter__body">
          <p>Hi, I’m Irina, a <a href={PORTFOLIO} target="_blank" rel="noopener noreferrer">designer</a> and{' '}
            <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer">artist</a> in the UK. I made Magpie because I was
            tired of open calls hiding their fees until you’d filled in a long form, or asking you to pay to display.</p>
          <p>Magpie is a free calendar of open calls, prizes, residencies and exhibitions for artists around the world. Every
            listing shows exactly what it costs to enter, and anything you’d pay if you’re selected. Free calls and real
            galleries come first; pay-to-exhibit operators are labelled clearly. It’s updated every morning and sent out every
            Monday in a short email.</p>
          <p>Magpie has no ads, no paywall and no tracking, and I’d like to keep it that way. Your coffees pay for the running
            costs (the email service, the domain and the daily research that finds and checks new calls) and give me more time
            to check the small print, so you don’t have to.</p>
          <p>Thank you for helping keep Magpie free for every artist.</p>
        </div>

        <p className="letter__sign">Irina</p>
        <p className="letter__who">
          <a href={PORTFOLIO} target="_blank" rel="noopener noreferrer">Portfolio</a> ·{' '}
          <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer">Instagram</a> ·{' '}
          <a href={LINKEDIN} target="_blank" rel="noopener noreferrer">LinkedIn</a> ·{' '}
          <a href="mailto:hello@magpie.cool">hello@magpie.cool</a>
        </p>

        <p className="letter__actions">
          <a className="button" href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">☕ Buy me a coffee</a>
          <a className="button button--secondary" href="/how-it-works">How Magpie works</a>
        </p>
      </div>
    </article>
  );
}
