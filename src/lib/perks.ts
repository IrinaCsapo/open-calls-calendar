// "What you get": the kinds of prize or support a call offers, as short labels with an icon.
// Built from `prize_kinds` (and `prize_value` for the cash amount); the full wording is in `prizes`.
import type { ComponentType } from 'react';
import type { Listing, PrizeKind } from '../types/listing';
import { PRIZE_KINDS } from '../types/listing';
import { formatMoney } from './money';
import { IconBag, IconBook, IconBriefcase, IconChat, IconGift, IconHome, IconMoney, IconPhoto } from '../components/Icons';

export interface Perk { kind: PrizeKind; label: string; Icon: ComponentType<{ className?: string }> }

const BASE: Record<PrizeKind, Omit<Perk, 'kind'>> = {
  Cash: { label: 'Cash', Icon: IconMoney },
  Exhibition: { label: 'Exhibition', Icon: IconPhoto },
  Residency: { label: 'Residency', Icon: IconHome },
  Publication: { label: 'Publication', Icon: IconBook },
  Mentoring: { label: 'Mentoring', Icon: IconChat },
  Sales: { label: 'Sales', Icon: IconBag },
  Commission: { label: 'Commission', Icon: IconBriefcase },
  Other: { label: 'More perks', Icon: IconGift },
};

/** In a fixed order (cash first), with the cash amount when we know it: "£5,000 cash". */
export function perks(l: Listing): Perk[] {
  return PRIZE_KINDS.filter((k) => l.prize_kinds.includes(k)).map((kind) => {
    const p = { kind, ...BASE[kind] };
    if (kind === 'Cash' && l.prize_value !== undefined && l.currency) p.label = `${formatMoney(l.prize_value, l.currency)} cash`;
    return p;
  });
}
