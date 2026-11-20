// Heroicons (outline, MIT licence, https://heroicons.com), one place for every icon on the site.
// Decorative: always aria-hidden, the words beside them carry the meaning.
import type { ComponentType, SVGProps } from 'react';
import {
  BellIcon, EnvelopeIcon,
  ArrowPathIcon, ArrowsRightLeftIcon, BanknotesIcon, CheckBadgeIcon, SparklesIcon, CalendarDaysIcon, CheckIcon, ClockIcon, ExclamationTriangleIcon,
  GlobeAltIcon, LinkIcon, MagnifyingGlassIcon, MapPinIcon, QuestionMarkCircleIcon, TrophyIcon,
  UserGroupIcon, GiftIcon, PhotoIcon, HomeModernIcon, BookOpenIcon, ChatBubbleLeftRightIcon, ShoppingBagIcon,
  BriefcaseIcon, TicketIcon, BuildingLibraryIcon, SwatchIcon, FlagIcon,
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
export const IconRefresh = make(ArrowPathIcon);
export const IconBadge = make(CheckBadgeIcon);
export const IconSparkles = make(SparklesIcon);
export const IconUsers = make(UserGroupIcon);
export const IconGift = make(GiftIcon);
export const IconPhoto = make(PhotoIcon);
export const IconHome = make(HomeModernIcon);
export const IconBook = make(BookOpenIcon);
export const IconChat = make(ChatBubbleLeftRightIcon);
export const IconBag = make(ShoppingBagIcon);
export const IconBriefcase = make(BriefcaseIcon);
export const IconTicket = make(TicketIcon);
export const IconBuilding = make(BuildingLibraryIcon);
export const IconBell = make(BellIcon);
export const IconMail = make(EnvelopeIcon);
export const IconSwatch = make(SwatchIcon);
export const IconFlag = make(FlagIcon);

export const FormatIcon = ({ format }: { format: Format }) =>
  format === 'Online' ? <IconGlobe /> : format === 'Hybrid' ? <IconHybrid /> : <IconPin />;
