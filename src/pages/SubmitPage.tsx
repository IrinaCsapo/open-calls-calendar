import { useDocumentTitle } from '../lib/useDocumentTitle';
import { SUBMIT_FORM_URL } from '../lib/site';

export function SubmitPage() {
  useDocumentTitle('Submit an open call');
  return (
    <div className="prose">
      <h1>Submit an open call or event</h1>
      <p>Know of an open call, prize, residency, grant or artist event we're missing? Organisers welcome too.</p>
      <p>We'll need the fees, all of them: the entry fee, and anything selected artists pay later (hanging, exhibition or
        participation fees, required framing or shipping) and any commission on sales. Calls with a fee that only appears
        after you're selected are still listed, but labelled clearly.</p>
      <p><a className="button" href={SUBMIT_FORM_URL} target="_blank" rel="noopener noreferrer">Open the submission form ↗</a></p>
      <p className="small muted">The form is on GitHub, so you'll need a free GitHub account. We check every submission before it goes live.</p>
    </div>
  );
}
