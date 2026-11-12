import { useEffect, useState } from 'react';
import type { Listing } from '../types/listing';
import { OPPORTUNITY_TYPES } from '../types/listing';

// Dates in listings.json are plain calendar dates (YYYY-MM-DD). For display we treat
// them as UTC midnight so formatting never shifts a day in other timezones.
const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

/** Today's date in the visitor's local timezone, as YYYY-MM-DD. */
export function todayISO(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const addDaysISO = (iso: string, days: number) => {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...opts });
const fullFmt = fmt({ day: 'numeric', month: 'long', year: 'numeric' });
const shortFmt = fmt({ day: 'numeric', month: 'short' });
const monthFmt = fmt({ month: 'long', year: 'numeric' });
const weekdayFmt = fmt({ weekday: 'short' });

/** "28 March 2027" */
export const formatFull = (iso: string) => fullFmt.format(toDate(iso));
/** "28 Mar" */
export const formatShort = (iso: string) => shortFmt.format(toDate(iso));
/** "March 2027" */
export const formatMonth = (iso: string) => monthFmt.format(toDate(iso));
/** "Sat" */
export const formatWeekday = (iso: string) => weekdayFmt.format(toDate(iso));

/** "27 to 28 February 2027", or one full date. */
export function formatRange(start: string, end?: string): string {
  if (!end || start === end) return formatFull(start);
  return `${formatFull(start)} to ${formatFull(end)}`;
}

/** Open calls, prizes, residencies… (you apply) vs events, meetups, workshops (you go). */
export const isOpportunity = (l: Listing) => (OPPORTUNITY_TYPES as readonly string[]).includes(l.type);

/** The date that decides priority: the deadline, or for events with no deadline, the start date. */
export const keyDate = (l: Listing): string => (l.deadline ?? l.start_date)!;

/** UTC milliseconds for a wall-clock time on a date in an IANA timezone. */
export function zonedTime(dateISO: string, time: string, timeZone: string): number {
  const guess = Date.parse(`${dateISO}T${time}Z`);
  try {
    const name = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
      .formatToParts(new Date(guess)).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
    const m = name.match(/GMT([+-])(\d{2}):?(\d{2})?/);
    const offsetMin = m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) : 0;
    return guess - offsetMin * 60_000;
  } catch {
    return guess;
  }
}

/** When it stops being possible to apply / register (UTC ms). Deadlines close at the end of their day. */
export function closesAt(l: Listing): number {
  return l.deadline ? zonedTime(l.deadline, '23:59:59', l.timezone) : zonedTime(l.start_date!, '00:00:00', l.timezone);
}

/** Still worth showing: you can still apply, or (for events) it hasn't finished yet. */
export function isLive(l: Listing, now = Date.now()): boolean {
  if (closesAt(l) > now) return true;
  if (isOpportunity(l)) return false;
  const end = l.end_date ?? l.start_date;
  return !!end && zonedTime(end, '23:59:59', l.timezone) > now;
}

const span = (ms: number) => {
  const mins = Math.max(1, Math.floor(ms / 60_000));
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export interface TimeLeft {
  label: string;     // "Closes in 2d 14h"
  urgency: 'urgent' | 'soon' | 'later' | 'closed';
}

const DAY = 86_400_000;

export function timeLeft(l: Listing, now = Date.now()): TimeLeft {
  const closes = closesAt(l);
  const left = closes - now;
  const urgency = left < 3 * DAY ? 'urgent' : left < 14 * DAY ? 'soon' : 'later';
  if (left > 0) {
    const verb = l.deadline ? (isOpportunity(l) ? 'Closes' : 'Registration closes') : 'Starts';
    return { label: `${verb} in ${span(left)}`, urgency };
  }
  if (!isOpportunity(l) && isLive(l, now)) return { label: 'Happening now', urgency: 'later' };
  return { label: isOpportunity(l) ? 'Closed' : 'Ended', urgency: 'closed' };
}

/** "Closing soonest" groups. */
export function urgencyGroup(l: Listing, now = Date.now()): 'week' | 'month' | 'later' | 'now' {
  const left = closesAt(l) - now;
  if (left <= 0) return 'now';
  if (left < 7 * DAY) return 'week';
  if (left < 31 * DAY) return 'month';
  return 'later';
}


/** Re-renders every minute so countdowns stay current. */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}
