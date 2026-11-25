import { useEffect, useRef, useState } from 'react';
import { HomePage } from './pages/HomePage';
import { ListingPage } from './pages/ListingPage';
import { SubmitPage } from './pages/SubmitPage';
import { AboutPage } from './pages/AboutPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { StartPage } from './pages/StartPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { SubscribedPage } from './pages/SubscribedPage';
import { SubscribeBox } from './components/SubscribeBox';
import { SubscribePage } from './pages/SubscribePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { FaqPage } from './pages/FaqPage';
import { ExhibitionsPage } from './pages/ExhibitionsPage';
import { EventsPage } from './pages/EventsPage';
import { findListing, isEvent, isExhibition } from './lib/listings';
import { CollectionPage, CollectionsHubPage } from './pages/CollectionPage';
import { findCollection } from './lib/collections';
import { useHashRoute, useLinkInterceptor } from './lib/useHashRoute';
import { SITE_NAME, SUPPORT_URL } from './lib/site';
import { TodayBar } from './components/TodayBar';

import { MagpieLogo } from './components/MagpieLogo';

export function App() {
  const { path } = useHashRoute();
  useLinkInterceptor();
  const listingMatch = path.match(/^\/listing\/([a-z0-9-]+)\/?$/);
  const exhibitionPage = !!listingMatch && (() => { const x = findListing(listingMatch[1]); return !!x && isExhibition(x); })();
  const eventPage = !!listingMatch && (() => { const x = findListing(listingMatch[1]); return !!x && isEvent(x); })();
  const collection = findCollection(path.match(/^\/open-calls\/([a-z0-9-]+)\/?$/)?.[1] ?? '');

  let page;
  if (path === '/') page = <HomePage />;
  else if (listingMatch) page = <ListingPage id={listingMatch[1]} />;
  else if (path === '/submit') page = <SubmitPage />;
  else if (path === '/about') page = <AboutPage />;
  else if (path === '/how-it-works') page = <HowItWorksPage />;
  else if (path === '/start') page = <StartPage />;
  else if (path === '/privacy') page = <PrivacyPage />;
  else if (path === '/subscribed') page = <SubscribedPage />;
  else if (path === '/subscribe') page = <SubscribePage />;
  else if (path === '/faq') page = <FaqPage />;
  else if (path === '/exhibitions') page = <ExhibitionsPage />;
  else if (path === '/events') page = <EventsPage />;
  else if (path === '/open-calls' || path === '/open-calls/') page = <CollectionsHubPage />;
  else if (collection) page = <CollectionPage key={collection.slug} c={collection} />;
  else page = <NotFoundPage />;

  // On page change (not filter changes): scroll to top and focus the new h1 for screen readers.
  // Phones: the links live in a drop-down menu. It closes on navigation, Escape, or a tap outside it.
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => { setMenuOpen(false); }, [path]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMenuOpen(false); document.getElementById('menu-toggle')?.focus(); } };
    const onTap = (e: PointerEvent) => { if (!headerRef.current?.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onTap);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onTap); };
  }, [menuOpen]);

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
      <div className="today-strip">
        <div className="topbar">
          <TodayBar />
          <p className="topbar__note">Free, no ads · <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">☕ Buy me a coffee</a></p>
        </div>
      </div>
      <header className={`site-header${menuOpen ? ' is-menu-open' : ''}`} ref={headerRef}>
        <a href="/" className="site-name">
          <MagpieLogo alt={SITE_NAME} />
        </a>
        <button type="button" id="menu-toggle" className="menu-toggle" aria-expanded={menuOpen} aria-controls="site-nav"
          onClick={() => setMenuOpen(!menuOpen)}>
          <span className="sr-only">{menuOpen ? 'Close menu' : 'Menu'}</span>
          <span className="menu-toggle__lines" aria-hidden="true"><span /><span /><span /></span>
        </button>
        <div className="menu-veil" aria-hidden="true" onClick={() => setMenuOpen(false)} />
        <nav aria-label="Main" id="site-nav" className="site-nav">
          <a style={{ '--i': 0 } as React.CSSProperties} href="/" aria-current={path === '/' || (listingMatch && !exhibitionPage && !eventPage) || path.startsWith('/open-calls') ? 'page' : undefined}>Open calls</a>
          <a style={{ '--i': 1 } as React.CSSProperties} href="/exhibitions" aria-current={path === '/exhibitions' || exhibitionPage ? 'page' : undefined}>Exhibitions</a>
          <a style={{ '--i': 2 } as React.CSSProperties} href="/events" aria-current={path === '/events' || eventPage ? 'page' : undefined}>Events</a>
          <a style={{ '--i': 3 } as React.CSSProperties} href="/how-it-works" aria-current={path === '/how-it-works' ? 'page' : undefined}>How it works</a>
          <a style={{ '--i': 4 } as React.CSSProperties} href="/about" aria-current={path === '/about' ? 'page' : undefined}>About</a>
          <a style={{ '--i': 5 } as React.CSSProperties} href="/submit" className="site-nav__menu-submit" aria-current={path === '/submit' ? 'page' : undefined}>
            Submit an open call <span aria-hidden="true">→</span>
          </a>
          <a style={{ '--i': 6 } as React.CSSProperties} href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="site-nav__menu-submit site-nav__menu-coffee">
            <span aria-hidden="true">☕</span> Buy me a coffee
          </a>
        </nav>
        <a href="/submit" className="site-nav__submit" aria-current={path === '/submit' ? 'page' : undefined}>
          Submit <span className="site-nav__long">an open call</span>
        </a>
      </header>
      <main id="main" tabIndex={-1}>{page}</main>
      {/* the homepage has the sign-up in its hero instead */}
      {path !== '/' && path !== '/submit' && path !== '/start' && path !== '/subscribed' && <div className="subscribe-wrap"><SubscribeBox /></div>}
      <footer className="site-footer">
        <nav className="site-footer__links" aria-label="More">
          <a href="/exhibitions">Exhibitions</a>
          <a href="/events">Workshops and events</a>
          <a href="/open-calls">Browse by discipline and place</a>
          <a href="/open-calls/free">Free open calls</a>
          <a href="/faq">FAQ</a>
          <a href="/how-it-works#fees">How we label fees</a>
          <a href="/start">Tell us what you make</a>
          <a href="/privacy">Privacy</a>
        </nav>
        <p>Fees and dates come from organisers' pages and can change. Always check before you pay.</p>
        <p className="site-footer__credit">
          Project created by <a href="https://irinacsapo.co.uk" target="_blank" rel="noopener noreferrer">designer</a> and{' '}
          <a href="https://www.instagram.com/irina_csapo_art" target="_blank" rel="noopener noreferrer">artist</a>{' '}
          <a href="https://www.linkedin.com/in/irinacsapo/" target="_blank" rel="noopener noreferrer">Irina Csapo</a>.
          Magpie is free, with no ads. If it helps you, you can{' '}
          <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">buy me a coffee</a> ☕
        </p>
      </footer>
    </>
  );
}
