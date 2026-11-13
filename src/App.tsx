import { useEffect, useRef } from 'react';
import { HomePage } from './pages/HomePage';
import { ListingPage } from './pages/ListingPage';
import { SubmitPage } from './pages/SubmitPage';
import { AboutPage } from './pages/AboutPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { useHashRoute } from './lib/useHashRoute';
import { SITE_NAME } from './lib/site';

// The magpie mark: drop an image named magpie-mark (.png, .webp or .svg) into src/assets/ and it appears
// next to the wordmark. Until then the header shows the name alone.
const MARK = Object.values(import.meta.glob<string>('./assets/magpie-mark.{png,webp,svg}', { eager: true, import: 'default' }))[0];

export function App() {
  const { path } = useHashRoute();
  const listingMatch = path.match(/^\/listing\/([a-z0-9-]+)\/?$/);

  let page;
  if (path === '/') page = <HomePage />;
  else if (listingMatch) page = <ListingPage id={listingMatch[1]} />;
  else if (path === '/submit') page = <SubmitPage />;
  else if (path === '/about') page = <AboutPage />;
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
          {MARK && <img className="site-name__mark" src={MARK} alt="" />}
          {SITE_NAME}
        </a>
        <nav aria-label="Main">
          <a href="#/" aria-current={path === '/' ? 'page' : undefined}>Listings</a>
          <a href="#/submit" aria-current={path === '/submit' ? 'page' : undefined}>Submit</a>
          <a href="#/about" aria-current={path === '/about' ? 'page' : undefined}>About</a>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>{page}</main>
      <footer className="site-footer">
        <p>Fees and dates come from organisers' pages and can change. Always check before you pay.</p>
      </footer>
    </>
  );
}
