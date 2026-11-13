import { useNow } from '../lib/dates';

const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''; } catch { return ''; } })();
const city = tz.split('/').pop()?.replace(/_/g, ' ') ?? '';
const dateFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

/** Today's date and time in the visitor's own time zone, so they can work out deadlines. Updates every minute. */
export function TodayBar() {
  const now = new Date(useNow(30_000));
  return (
    <div className="today-bar">
      <p>
        <span className="today-bar__label">Today</span>{' '}
        <time dateTime={now.toISOString()}>{dateFmt.format(now)} · {timeFmt.format(now)}</time>
        {city && <span className="today-bar__tz"> ({city} time)</span>}
      </p>
    </div>
  );
}
