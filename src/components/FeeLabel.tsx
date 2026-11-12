import type { Currency, Listing } from '../types/listing';
import { feeSummary } from '../lib/money';

const ICON = { free: '✓', caution: '!', paid: '£', unknown: '?' } as const;

/**
 * The money line on every card and detail page. Never colour alone: each tone has a
 * symbol and the words say everything.
 */
export function FeeLabel({ listing, currency, size = 'card' }: { listing: Listing; currency: Currency; size?: 'card' | 'page' }) {
  const s = feeSummary(listing, currency);
  return (
    <div className={`fee fee--${s.tone} fee--${size}`}>
      <p className="fee__headline">
        <span className="fee__icon" aria-hidden="true">{s.tone === 'paid' ? '' : ICON[s.tone]}</span>
        <strong>{s.headline}</strong>
        {s.approx && <span className="fee__approx"> ({s.approx})</span>}
      </p>
      {s.selected && <p className={`fee__selected${listing.selected_fee === 'Yes' ? ' fee__selected--warn' : ''}`}>{s.selected}</p>}
      {size === 'page' && listing.commission && <p className="fee__selected">Commission on sales: {listing.commission}</p>}
    </div>
  );
}
