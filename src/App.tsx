import { useEffect, useRef } from 'react';
import { HomePage } from './pages/HomePage';
import { ListingPage } from './pages/ListingPage';
import { SubmitPage } from './pages/SubmitPage';
import { AboutPage } from './pages/AboutPage';
import { StartPage } from './pages/StartPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { SubscribedPage } from './pages/SubscribedPage';
import { SubscribeBox } from './components/SubscribeBox';
import { SubscribePage } from './pages/SubscribePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { FaqPage } from './pages/FaqPage';
import { CollectionPage, CollectionsHubPage } from './pages/CollectionPage';
import { findCollection } from './lib/collections';
import { useHashRoute, useLinkInterceptor } from './lib/useHashRoute';
import { SITE_NAME } from './lib/site';
import { TodayBar } from './components/TodayBar';

import logo from './assets/magpie-logo-header.png';

export function App() {
  const { path } = useHashRoute();
  useLinkInterceptor();
  const listingMatch = path.match(/^\/listing\/([a-z0-9-]+)\/?$/);
  const collection = findCollection(path.match(/^\/open-calls\/([a-z0-9-]+)\/?$/)?.[1] ?? '');

  let page;
  if (path === '/') page = <HomePage />;
  else if (listingMatch) page = <ListingPage id={listingMatch[1]} />;
  else if (path === '/submit') page = <SubmitPage />;
  else if (path === '/about') page = <AboutPage />;
  else if (path === '/start') page = <StartPage />;
  else if (path === '/privacy') page = <PrivacyPage />;
  else if (path === '/subscribed') page = <SubscribedPage />;
  else if (path === '/subscribe') page = <SubscribePage />;
  else if (path === '/faq') page = <FaqPage />;
  else if (path === '/open-calls' || path === '/open-calls/') page = <CollectionsHubPage />;
  else if (collection) page = <CollectionPage key={collection.slug} c={collection} />;
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
      <div className="today-strip"><TodayBar /></div>
      <header className="site-header">
        <a href="/" className="site-name">
          <img className="site-name__logo" src={logo} alt={SITE_NAME} width="640" height="203" />
        </a>
        <nav aria-label="Main" className="site-nav">
          <a href="/" aria-current={path === '/' || path.startsWith('/listing/') || path.startsWith('/open-calls') ? 'page' : undefined}>Events</a>
          <a href="/about" aria-current={path === '/about' ? 'page' : undefined}>About</a>
          <a href="/submit" className="site-nav__submit" aria-current={path === '/submit' ? 'page' : undefined}>
            Submit <span className="site-nav__long">an open call</span>
          </a>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>{page}</main>
      {path !== '/submit' && path !== '/start' && path !== '/subscribed' && <div className="subscribe-wrap"><SubscribeBox /></div>}
      <footer className="site-footer">
        <nav className="site-footer__links" aria-label="More">
          <a href="/open-calls">Browse by discipline and place</a>
          <a href="/open-calls/free">Free open calls</a>
          <a href="/faq">FAQ</a>
          <a href="/about">How we label fees</a>
          <a href="/start">Tell us what you make</a>
          <a href="/privacy">Privacy</a>
        </nav>
        <p>Fees and dates come from organisers' pages and can change. Always check before you pay.</p>
        <p className="site-footer__credit">
          Project created by designer and artist <a href="https://irinacsapo.co.uk" target="_blank" rel="noopener noreferrer">Irina Csapo</a>
        </p>
      </footer>
    </>
  );
}
