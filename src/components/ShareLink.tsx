import { useState } from 'react';
import { IconLink } from './Icons';

/** Shares the page: the phone's share sheet when there is one, otherwise copies the link. */
export function ShareLink({ title, label = 'Copy link' }: { title: string; label?: string }) {
  const [message, setMessage] = useState('');
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title, url }); return; }
      await navigator.clipboard.writeText(url);
      setMessage('Link copied');
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;   // closed the share sheet
      setMessage('Could not copy. Copy the address from your browser instead.');
    }
    window.setTimeout(() => setMessage(''), 4000);
  };
  return (
    <>
      <button type="button" className="button button--secondary" onClick={share}>
        <IconLink />{label}
      </button>
      <p className="save-card__status" role="status">{message}</p>
    </>
  );
}
