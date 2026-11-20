import { useDocumentTitle } from '../lib/useDocumentTitle';
import { FAQ, linkParts } from '../lib/faq';

/** Plain answers to what artists ask about open calls and fees. The same text is in the page's HTML for search engines. */
export function FaqPage() {
  useDocumentTitle('Questions about open calls');
  return (
    <div className="submit privacy faq">
      <header className="submit__head">
        <p className="about-eyebrow">FAQ</p>
        <h1>Questions about open calls</h1>
        <p className="about-lede">What open calls are, where to find free ones, when an entry fee is worth paying, and how to
          spot pay-to-exhibit.</p>
      </header>
      {FAQ.map((f) => (
        <section key={f.q}>
          <h2>{f.q}</h2>
          {f.a.map((p, i) => (
            <p key={i}>
              {linkParts(p).map((x, j) => ('href' in x ? <a key={j} href={x.href}>{x.text}</a> : x.text))}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}
