import { useEffect, useState } from 'react';
import logo from '../assets/magpie-logo-header.png';

/**
 * The Magpie logo, with a bird that comes to life. The logo is one picture (640×203), drawn three times, each copy
 * clipped to one part: everything that stays still (wordmark, perch, body and legs), the head, and the tail. The
 * image loads once. On page load the magpie turns its head, then flickers its tail; hovering the logo does it again.
 * Nothing moves for people who prefer reduced motion. Cut lines are in src/styles.css ("Magpie logo").
 */
export function MagpieLogo({ alt }: { alt: string }) {
  // plays once per visit, shortly after the first page appears
  const [hello, setHello] = useState(false);
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem('magpie:hello') === '1'; sessionStorage.setItem('magpie:hello', '1'); } catch { /* fine */ }
    if (seen) return;
    setHello(true);
    const t = setTimeout(() => setHello(false), 3200);
    return () => clearTimeout(t);
  }, []);
  return (
    <span className={`logo${hello ? ' is-hello' : ''}`}>
      <img className="logo__part logo__still site-name__logo" src={logo} alt={alt} width="640" height="203" />
      <img className="logo__part logo__head" src={logo} alt="" aria-hidden="true" width="640" height="203" />
      <img className="logo__part logo__tail" src={logo} alt="" aria-hidden="true" width="640" height="203" />
    </span>
  );
}
