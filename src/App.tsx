import { useEffect, useRef } from 'react';
import { HomePage } from './pages/HomePage';
import { ListingPage } from './pages/ListingPage';
import { SubmitPage } from './pages/SubmitPage';
import { AboutPage } from './pages/AboutPage';
import { StartPage } from './pages/StartPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { useHashRoute } from './lib/useHashRoute';
import { FEED_PATH, SITE_NAME } from './lib/site';

import logo from './assets/magpie-logo-header.png';

export function App() {
  const { path } = useHashRoute();
  const listingMatch = path.match(/^\/listing\/([a-z0-9-]+)\/?$/);

  let page;
  if (path === '/') page = <HomePage />;
  else if (listingMatch) page = <ListingPage id={listingMatch[1]} />;
  else if (path === '/submit') page = <SubmitPage />;
  else if (path === '/about') page = <AboutPage />;
  else if (path === '/start') page = <StartPage />;
  else page = <NotFoundPage />;

  // On page change (not filter changes): scroll to top and focus the new h1 for screen readers.
  const previousPath = useRef(path);
  useEffect(() => {
    if (previousPath.current === path) return;
    previousPath.current = path;
    window.scrollTo(0, 0);
    const h1 = document.querySelector<HTMLElement>('main h1');
    if (h1) { h1.tabIndex = -1; h1.focus({ preventScroll: true }); }
  }, [path]);

  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        Skip to content
      </a>
      <header className="site-header">
        <a href="#/" className="site-name">
          <img className="site-name__logo" src={logo} alt={SITE_NAME} width="640" height="203" />
        </a>
        <nav aria-label="Main" className="site-nav">
          <a href="#/" aria-current={path === '/' || path.startsWith('/listing/') ? 'page' : undefined}>Events</a>
          <a href="#/about" aria-current={path === '/about' ? 'page' : undefined}>About</a>
          <a href="#/submit" className="site-nav__submit" aria-current={path === '/submit' ? 'page' : undefined}>
            Submit <span className="site-nav__long">an open call</span>
          </a>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>{page}</main>
      <footer className="site-footer">
        <nav className="site-footer__links" aria-label="More">
          <a href={`webcal://${location.host}${import.meta.env.BASE_URL}${FEED_PATH}`}>Subscribe to all deadlines</a>
          <a href="#/about">How we label fees</a>
          <a href="#/start">Tell us what you make</a>
        </nav>
        <p>Fees and dates come from organisers' pages and can change. Always check before you pay.</p>
        <p className="site-footer__credit">
          Project created by designer and artist <a href="https://irinacsapo.co.uk" target="_blank" rel="noopener noreferrer">Irina Csapo</a>
        </p>
      </footer>
    </>
  );
}
