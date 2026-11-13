import { useState } from 'react';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { FEED_PATH, SITE_NAME } from '../lib/site';
import { IconCalendar, IconCheck, IconLink } from '../components/Icons';

/**
 * Subscribe to every deadline in your own calendar. One button per calendar app, because a single
 * webcal:// link only works when a desktop calendar app is set up to open it (it does nothing for most
 * Google Calendar users).
 */
export function SubscribePage() {
  useDocumentTitle('Subscribe to deadlines');
  const [copied, setCopied] = useState(false);
  const host = window.location.host;
  const https = `https://${host}/${FEED_PATH}`;
  const webcal = `webcal://${host}/${FEED_PATH}`;
  const name = `${SITE_NAME} deadlines`;
  const links = [
    { label: 'Google Calendar', href: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`,
      note: 'Opens Google Calendar and asks you to add it. Google checks for new deadlines a few times a day.' },
    { label: 'Apple Calendar (Mac, iPhone, iPad)', href: webcal,
      note: 'Opens the Calendar app with a Subscribe window. On a Mac you can choose how often it refreshes.' },
    { label: 'Outlook', href: `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(https)}&name=${encodeURIComponent(name)}`,
      note: 'Opens Outlook on the web with the calendar ready to add.' },
  ];

  const copy = async () => {
    try { await navigator.clipboard.writeText(https); setCopied(true); window.setTimeout(() => setCopied(false), 3000); }
    catch { window.prompt('Copy this link:', https); }
  };

  return (
    <div className="prose subscribe">
      <h1>Subscribe to deadlines</h1>
      <p>Add every open call's deadline (and every event's date) to your own calendar. New listings appear by themselves
        as the scout adds them each morning, and each entry links back to the full details and fees.</p>

      <ul className="subscribe__list">
        {links.map((l) => (
          <li key={l.label}>
            <a className="button subscribe__button" href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
              <IconCalendar />Add to {l.label}
            </a>
            <p className="hint">{l.note}</p>
          </li>
        ))}
        <li>
          <button type="button" className="button button--secondary subscribe__button" onClick={copy}>
            {copied ? <><IconCheck />Link copied</> : <><IconLink />Copy the calendar link</>}
          </button>
          <p className="hint">For any other calendar app: look for "Subscribe", "Add calendar from URL" or "New calendar
            subscription" and paste <code>{https}</code></p>
        </li>
      </ul>
      <p className="small muted">It's a subscription, not a copy: if a deadline changes or a call is withdrawn, your
        calendar updates too. You can remove it any time from your calendar's settings.</p>
    </div>
  );
}
