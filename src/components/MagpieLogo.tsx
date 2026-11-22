import { useEffect, useState } from 'react';
import logo from '../assets/magpie-logo-header.png';

/**
 * The Magpie logo, with a bird that moves. The logo is one picture (640×203); it's drawn three times, each copy clipped
 * to one part: the wordmark and perch (still), the bird's body, and its tail. The image loads once.
 * On page load the bird hops off the perch and lands, then flicks its tail; hovering the logo does it again.
 * Nothing moves for people who prefer reduced motion. Cut lines are in src/styles.css ("Magpie logo").
 */
export function MagpieLogo({ alt }: { alt: string }) {
  // the hello hop plays once per visit, shortly after the page appears
  const [hello, setHello] = useState(false);
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem('magpie:hop') === '1'; sessionStorage.setItem('magpie:hop', '1'); } catch { /* fine */ }
    if (seen) return;
    setHello(true);
    const t = setTimeout(() => setHello(false), 2600);
    return () => clearTimeout(t);
  }, []);
  return (
    <span className={`logo${hello ? ' is-hello' : ''}`}>
      <img className="logo__part logo__word site-name__logo" src={logo} alt={alt} width="640" height="203" />
      <span className="logo__bird" aria-hidden="true">
        <img className="logo__part logo__body" src={logo} alt="" width="640" height="203" />
        <img className="logo__part logo__tail" src={logo} alt="" width="640" height="203" />
      </span>
    </span>
  );
}
