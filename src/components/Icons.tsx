// Heroicons (outline, MIT licence, https://heroicons.com), one place for every icon on the site.
// Decorative: always aria-hidden, the words beside them carry the meaning.
import type { ComponentType, SVGProps } from 'react';
import {
  ArrowsRightLeftIcon, BanknotesIcon, CalendarDaysIcon, CheckIcon, ClockIcon, ExclamationTriangleIcon,
  GlobeAltIcon, LinkIcon, MagnifyingGlassIcon, MapPinIcon, QuestionMarkCircleIcon, TrophyIcon,
} from '@heroicons/react/24/outline';
import type { Format } from '../types/listing';

type HeroIcon = ComponentType<SVGProps<SVGSVGElement> & { title?: string }>;

const make = (Svg: HeroIcon) => function Icon({ className = '' }: { className?: string }) {
  return <Svg className={`icon ${className}`} aria-hidden="true" focusable="false" strokeWidth={1.75} />;
};

export const IconClock = make(ClockIcon);
export const IconCalendar = make(CalendarDaysIcon);
export const IconPin = make(MapPinIcon);
export const IconGlobe = make(GlobeAltIcon);
export const IconHybrid = make(ArrowsRightLeftIcon);
export const IconTrophy = make(TrophyIcon);
export const IconLink = make(LinkIcon);
export const IconSearch = make(MagnifyingGlassIcon);
export const IconCheck = make(CheckIcon);
export const IconWarn = make(ExclamationTriangleIcon);
export const IconUnknown = make(QuestionMarkCircleIcon);
export const IconMoney = make(BanknotesIcon);

export const FormatIcon = ({ format }: { format: Format }) =>
  format === 'Online' ? <IconGlobe /> : format === 'Hybrid' ? <IconHybrid /> : <IconPin />;
