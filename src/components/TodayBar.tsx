import { useNow } from '../lib/dates';

const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''; } catch { return ''; } })();
const city = tz.split('/').pop()?.replace(/_/g, ' ') ?? '';
const longDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

/**
 * Today's date and time in the visitor's own time zone, in the navbar, so they can work out deadlines.
 * Long form on wide screens, short form on narrower ones. Updates every 30 seconds.
 */
export function TodayBar() {
  const now = new Date(useNow(30_000));
  return (
    <p className="today" title={city ? `${city} time` : undefined}>
      <span className="today__label">Today</span>{' '}
      <time dateTime={now.toISOString()}>
        <span className="today__long">{longDate.format(now)}</span>
        <span className="today__short">{shortDate.format(now)}</span>
        {' · '}{timeFmt.format(now)}
      </time>
      {city && <span className="today__tz"> ({city} time)</span>}
    </p>
  );
}
