import { useDocumentTitle } from '../lib/useDocumentTitle';
import { FEED_PATH, SITE_NAME } from '../lib/site';

export function AboutPage() {
  useDocumentTitle('About');
  return (
    <div className="prose">
      <h1>About {SITE_NAME}</h1>
      <p>Open calls are scattered across websites, newsletters and Instagram posts, and too many only tell you about the
        fees once you've filled in a long form. This calendar puts them in one place, closing soonest first, with every
        cost on the card.</p>

      <h2 id="fees">How we label fees</h2>
      <dl className="details">
        <dt>✓ Free, no fees if selected</dt>
        <dd>Nothing to pay to enter and nothing to pay if you're chosen.</dd>
        <dt>! Free to enter, pay if selected</dt>
        <dd>Free to apply, but selected artists are asked to pay something: a hanging fee, an exhibition fee, a fee to
          "secure your space". The amount is on the card.</dd>
        <dt>£15 to enter</dt>
        <dd>The cheapest way in (usually one work). The full fee structure is on the listing's page. If you've chosen a
          different currency we show a rough conversion next to it.</dd>
        <dt>? Not stated</dt>
        <dd>The organiser's page doesn't say. Check their terms before you apply. You can hide these with "Hide calls that
          don't state all their fees".</dd>
      </dl>

      <h2>Where the listings come from</h2>
      <p>A research assistant checks artist opportunity sites, organisers and social posts every morning at 7:00 (London),
        confirms each deadline and fee on the organiser's own page, and adds what's new. You can also <a href="#/submit">submit one</a>.</p>

      <h2>Never miss a deadline</h2>
      <p>Subscribe to <a href={`webcal://${location.host}${import.meta.env.BASE_URL}${FEED_PATH}`}>the deadlines calendar</a> in
        Apple Calendar, Google Calendar or Outlook, and new deadlines appear by themselves.</p>
    </div>
  );
}
