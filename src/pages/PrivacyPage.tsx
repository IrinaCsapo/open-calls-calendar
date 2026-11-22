import { useDocumentTitle } from '../lib/useDocumentTitle';
import { CONTACT_EMAIL } from '../lib/site';

const UPDATED = '22 November 2026';

/** Plain-English privacy notice. Keep it true: update it whenever a new service is added to the site. */
export function PrivacyPage() {
  useDocumentTitle('Privacy');
  return (
    <article className="letter privacy" aria-labelledby="privacy-title">
      <div className="letter__paper">
      <header className="privacy__head">
        <p className="about-eyebrow letter__eyebrow">Privacy</p>
        <h1 id="privacy-title" className="letter__title">Your privacy</h1>
        <p className="about-lede">Magpie collects as little as it can. No ads, no tracking cookies, and we never sell or share your
          details. Here is everything, in plain English.</p>
      </header>

      <section className="privacy__notice">
        <h2>Magpie will never ask you for money</h2>
        <p>Magpie will never email, message or call you asking you to pay to enter an open call, prize, residency or exhibition,
          or to pay a fee because you've been selected. We don't take entry fees, we don't collect payments for organisers, and
          we never ask for your card or bank details.</p>
        <p>Every fee shown on Magpie comes from the organiser's own page, and you pay it, if you choose to apply, directly to the
          organiser on their site. If you get a message claiming to be from Magpie and asking for money, it isn't from us:
          please don't pay, and forward it to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
        <p>The only payment connected to Magpie is optional: a “Buy me a coffee” to support the site, which goes through Buy Me
          a Coffee and is never required for anything.</p>
      </section>

      <section>
        <h2>Who runs Magpie</h2>
        <p>Magpie is a project by Irina Csapo, a designer and artist in the UK. For anything about your data, email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </section>

      <section>
        <h2>Visiting the site</h2>
        <ul>
          <li><strong>Visit counts:</strong> we use <a href="https://umami.is" target="_blank" rel="noopener noreferrer">Umami</a>,
            run on our own account, to count visits and see which pages are read. It uses no cookies and stores no personal data:
            we see totals like "120 visits from the UK today", never who you are.</li>
          <li><strong>Your settings stay on your device:</strong> the disciplines you pick and your "Near you" place are saved in
            your browser only. We never see them.</li>
          <li><strong>Near you:</strong> we guess your country from your device's time zone, inside your browser. If you click
            "Use my exact location", your browser asks first, and the location is only used on your device to sort events by
            distance. It is never sent to us.</li>
          <li><strong>Images and fonts:</strong> listing images load from the organisers' own websites, and fonts from Google Fonts.
            Like any website, those services see your IP address when your browser fetches them.</li>
        </ul>
      </section>

      <section>
        <h2>Submitting an open call</h2>
        <p>The Submit form is run by <a href="https://tally.so/help/privacy-policy" target="_blank" rel="noopener noreferrer">Tally</a>.
          We use what you send to check the call and add it to Magpie. Your email is optional, and we only use it to tell you when
          your listing is live. We delete submissions we don't need once they've been checked.</p>
      </section>

      <section>
        <h2>The weekly email</h2>
        <p>If you sign up, your email address (and your rough place, like "UK" or "Europe", guessed from your time zone so we
          can show calls near you) is kept by our email service,{' '}
          <a href="https://www.brevo.com/legal/privacypolicy/" target="_blank" rel="noopener noreferrer">Brevo</a>, and used only to
          send you the Magpie emails. You confirm by email before anything is sent, and every email has a link to unsubscribe
          straight away. We may see whether emails are opened and links clicked, to know if the roundup is useful.</p>
      </section>

      <section>
        <h2>Supporting Magpie</h2>
        <p>The “Buy me a coffee” links go to{' '}
          <a href="https://www.buymeacoffee.com/privacy-policy" target="_blank" rel="noopener noreferrer">Buy Me a Coffee</a>, which
          handles the payment and anything you choose to share there. Magpie never sees your card details.</p>
      </section>

      <section>
        <h2>Deadline reminders</h2>
        <p>If you ask for a reminder on a listing, your email address and which call it's for are kept by Brevo and used only
          to send that reminder, three days before the deadline. It's one email per call; you won't be added to the weekly
          email unless you sign up for it. Want your address removed? Email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>Under UK data protection law you can ask what we hold about you, ask us to correct it, or ask us to delete it. Email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we'll reply within a month. You can also complain to the{' '}
          <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener noreferrer">Information Commissioner's Office</a>.</p>
      </section>

      <p className="small muted">Last updated {UPDATED}.</p>
      </div>
    </article>
  );
}
