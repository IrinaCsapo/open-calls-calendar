import { useId, useState } from 'react';
import type { Listing } from '../types/listing';
import { REMINDER_FORM_URL } from '../lib/site';
import { addDaysISO, closesAt, formatFull } from '../lib/dates';
import { IconBell } from './Icons';

const DAYS_BEFORE = 3;

/**
 * "Email me 3 days before it closes", in a listing's side panel. Sends the address and the listing's id to Magpie's
 * Brevo reminders form (Magpie itself never stores it); scripts/reminders.ts sends the email. Only for calls with more
 * than three days to go, and hidden until REMINDER_FORM_URL is set in src/lib/site.ts.
 */
export function ReminderBox({ l, now }: { l: Listing; now: number }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  if (!REMINDER_FORM_URL || !l.deadline || closesAt(l) - now < (DAYS_BEFORE + 0.5) * 86_400_000) return null;
  const on = formatFull(addDaysISO(l.deadline, -DAYS_BEFORE));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    const body = new FormData();
    body.append('EMAIL', email.trim());
    body.append('REMIND', l.id);
    body.append('email_address_check', '');   // Brevo's spam trap: must stay empty
    body.append('locale', 'en');
    try {
      // Brevo doesn't let another site read its reply, so a sent request counts as success
      await fetch(REMINDER_FORM_URL, { method: 'POST', body, mode: 'no-cors' });
      setState('done');
    } catch {
      setState('error');
    }
  };

  if (state === 'done') {
    return <p className="reminder__done" role="status"><IconBell />Done! We’ll email you on <strong>{on}</strong>, three days before it closes.</p>;
  }
  if (!open) {
    return (
      <button type="button" className="button button--secondary" onClick={() => setOpen(true)} aria-expanded="false">
        <IconBell />Email me before it closes
      </button>
    );
  }
  return (
    <form className="reminder" onSubmit={submit}>
      <label htmlFor={`${id}-email`} className="reminder__label">We’ll email you on {on}, three days before it closes.</label>
      <div className="reminder__row">
        <input id={`${id}-email`} type="email" required autoComplete="email" placeholder="Your email" autoFocus
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" className="button" disabled={state === 'sending'}>{state === 'sending' ? 'Saving…' : 'Remind me'}</button>
      </div>
      <p className="reminder__small">
        {state === 'error' ? 'Something went wrong. Please try again in a moment.' : <>One email about this call, nothing else. <a href="/privacy">Privacy</a></>}
      </p>
    </form>
  );
}
