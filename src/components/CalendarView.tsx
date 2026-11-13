import { useMemo, useState } from 'react';
import type { Listing } from '../types/listing';
import { formatMonth, isOpportunity, keyDate, todayISO } from '../lib/dates';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const shiftMonth = (ym: string, by: number) => {
  const d = new Date(`${ym}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + by);
  return d.toISOString().slice(0, 7);
};

/** A month grid: each opportunity sits on its deadline, each event on its start date. */
export function CalendarView({ listings }: { listings: Listing[] }) {
  const today = todayISO();
  const [month, setMonth] = useState(today.slice(0, 7));

  const byDay = useMemo(() => {
    const map = new Map<string, Listing[]>();
    for (const l of listings) {
      const d = keyDate(l);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(l);
    }
    return map;
  }, [listings]);

  const first = new Date(`${month}-01T00:00:00Z`);
  const lead = (first.getUTCDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`),
  ];
  while (cells.length % 7) cells.push(null);
  const inMonth = listings.filter((l) => keyDate(l).startsWith(month)).length;

  return (
    <section className="calendar" aria-label={`Calendar for ${formatMonth(`${month}-01`)}`}>
      <div className="calendar__nav">
        <button type="button" onClick={() => setMonth(shiftMonth(month, -1))} disabled={month <= today.slice(0, 7)}>← Previous</button>
        <h2 aria-live="polite">{formatMonth(`${month}-01`)} <span className="muted">({inMonth})</span></h2>
        <button type="button" onClick={() => setMonth(shiftMonth(month, 1))}>Next →</button>
      </div>
      <p className="hint">Open calls show on their deadline, events on the day they start.</p>
      <div className="calendar__grid" role="table">
        <div role="row" className="calendar__row">
          {WEEKDAYS.map((d) => <div role="columnheader" key={d} className="calendar__head">{d}</div>)}
        </div>
        {Array.from({ length: cells.length / 7 }, (_, w) => (
          <div role="row" className="calendar__row" key={w}>
            {cells.slice(w * 7, w * 7 + 7).map((day, i) => {
              const items = day ? byDay.get(day) ?? [] : [];
              return (
                <div role="cell" key={i} className={`calendar__cell${day === today ? ' is-today' : ''}${!day ? ' is-empty' : ''}`}>
                  {day && <span className="calendar__day">{Number(day.slice(8))}</span>}
                  {items.map((l) => (
                    <a key={l.id} href={`/listing/${l.id}`} className={`calendar__item ${isOpportunity(l) ? 'is-deadline' : 'is-event'}`}>
                      <span className="sr-only">{isOpportunity(l) ? 'Deadline: ' : 'Event: '}</span>
                      {l.title}
                    </a>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
