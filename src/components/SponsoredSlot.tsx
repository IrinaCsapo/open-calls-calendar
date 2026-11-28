import type { Sponsor } from '../lib/sponsors';

/** One clearly labelled sponsored feature, set apart from the listings. */
export function SponsoredSlot({ s }: { s: Sponsor }) {
  return (
    <aside className="sponsored" aria-label={`Sponsored: ${s.name}`}>
      {s.image && <img className="sponsored__img" src={s.image} alt="" loading="lazy" />}
      <div className="sponsored__body">
        <p className="sponsored__label">Sponsored <span aria-hidden="true">·</span> {s.name}</p>
        <h2 className="sponsored__title">{s.title}</h2>
        <p className="sponsored__blurb">{s.blurb}</p>
        <p className="sponsored__actions">
          <a className="button button--secondary" href={s.url} target="_blank" rel="sponsored noopener noreferrer">
            Visit {s.name} <span aria-hidden="true">↗</span>
          </a>
          <a className="sponsored__what" href="/sponsor">What’s this?</a>
        </p>
      </div>
    </aside>
  );
}
