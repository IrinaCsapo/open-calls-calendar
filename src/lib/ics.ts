// Builds iCalendar (.ics) text. Used in the browser ("Add deadline to calendar") and at build
// time for the subscribable feed of every deadline (scripts/build-feed.ts).
import type { Listing } from '../types/listing';
import { isOpportunity } from './dates';

// Text values must escape backslashes, semicolons, commas and newlines (RFC 5545 §3.3.11).
const escapeText = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// Lines longer than 75 bytes must be folded: CRLF followed by a space (§3.1).
function fold(line: string): string {
  const bytes = new TextEncoder();
  const out: string[] = [];
  let current = '';
  for (const ch of line) {
    const limit = out.length === 0 ? 75 : 74;
    if (bytes.encode(current + ch).length > limit) { out.push(current); current = ''; }
    current += ch;
  }
  out.push(current);
  return out.join('\r\n ');
}

const compact = (iso: string) => iso.replace(/-/g, '');
const nextDay = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};
const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

function feeLine(l: Listing): string {
  const entry = l.entry_fee === 'Free' ? 'Free to enter' : l.entry_fee === 'Paid' ? `Entry fee: ${l.fee_details ?? 'paid'}` : 'Entry fee not stated';
  if (!isOpportunity(l)) return entry;
  const sel = l.selected_fee === 'Yes' ? `Pay if selected: ${l.selected_fee_details ?? 'yes'}` : l.selected_fee === 'None' ? 'No fees if selected' : 'Fees if selected: not stated';
  return `${entry}. ${sel}.`;
}

// Reminders for a single deadline someone adds: 9:00 three days before, and 9:00 on the day (the deadline is the end
// of that day). Left out of the subscribed feed of every deadline, which would ring for all of them.
const alarm = (trigger: string, text: string) =>
  ['BEGIN:VALARM', 'ACTION:DISPLAY', `TRIGGER:${trigger}`, `DESCRIPTION:${escapeText(text)}`, 'END:VALARM'];

/** What goes in a calendar entry for a listing: the deadline for opportunities, the event dates for events. */
function entry(l: Listing, pageUrl: string) {
  const deadlineEntry = isOpportunity(l) || !l.start_date;
  const start = deadlineEntry ? l.deadline! : l.start_date!;
  const end = deadlineEntry ? l.deadline! : (l.end_date ?? l.start_date!);
  const where = l.format === 'Online' ? 'Online' : [l.venue, l.city, l.country].filter(Boolean).join(', ');
  const title = deadlineEntry ? `Deadline: ${l.title}` : l.title;
  const description = [
    `${l.type} by ${l.organiser}.`,
    feeLine(l),
    l.prizes.length ? `Prizes: ${l.prizes.join('; ')}` : '',
    `Who can apply: ${l.eligibility}`,
    `Apply / register: ${l.apply_url}`,
    `Details: ${pageUrl}`,
  ].filter(Boolean).join('\n');
  return { deadlineEntry, start, end, where, title, description };
}

/** "Add to calendar" links for Google, Outlook.com and Microsoft 365 (all-day; Apple uses the .ics download). */
export function calendarLinks(l: Listing, pageUrl: string) {
  const e = entry(l, pageUrl);
  const q = (o: Record<string, string>) => new URLSearchParams(o).toString();
  const outlook = (host: string) => `https://${host}/calendar/0/deeplink/compose?${q({
    path: '/calendar/action/compose', rru: 'addevent', subject: e.title, startdt: e.start, enddt: nextDay(e.end),
    allday: 'true', body: e.description, location: e.where,
  })}`;
  return {
    google: `https://calendar.google.com/calendar/render?${q({
      action: 'TEMPLATE', text: e.title, dates: `${compact(e.start)}/${compact(nextDay(e.end))}`, details: e.description, location: e.where,
    })}`,
    outlook: outlook('outlook.live.com'),
    office: outlook('outlook.office.com'),
  };
}

/** One all-day VEVENT: the deadline for opportunities, the event dates for events. */
function vevent(l: Listing, pageUrl: string, alarms = false): string[] {
  const { deadlineEntry, start, end, where, description } = entry(l, pageUrl);
  return [
    'BEGIN:VEVENT',
    `UID:${l.id}@open-calls-calendar`,
    `DTSTAMP:${stamp()}`,
    `DTSTART;VALUE=DATE:${compact(start)}`,
    `DTEND;VALUE=DATE:${compact(nextDay(end))}`,
    `SUMMARY:${escapeText(entry(l, pageUrl).title)}`,
    `LOCATION:${escapeText(where)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `URL:${l.apply_url}`,
    'TRANSP:TRANSPARENT',
    ...(alarms && deadlineEntry ? [
      ...alarm('-P2DT15H', `3 days left: ${l.title}`),
      ...alarm('PT9H', `Closes today: ${l.title}`),
    ] : []),
    'END:VEVENT',
  ];
}

export function buildIcs(listings: { listing: Listing; pageUrl: string }[], calName?: string, alarms = false): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Magpie//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...(calName ? [`X-WR-CALNAME:${escapeText(calName)}`, 'REFRESH-INTERVAL;VALUE=DURATION:PT12H'] : []),
    ...listings.flatMap(({ listing, pageUrl }) => vevent(listing, pageUrl, alarms)),
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** Triggers a download of one listing's .ics file. */
export function downloadIcs(listing: Listing, pageUrl: string) {
  const blob = new Blob([buildIcs([{ listing, pageUrl }], undefined, true)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${listing.id}.ics`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
