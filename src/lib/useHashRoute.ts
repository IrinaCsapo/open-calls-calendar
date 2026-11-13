import { useEffect, useState } from 'react';

// Routing with normal paths: magpie.cool/, /about, /listing/rws-open-2027, /?where=UK.
// GitHub Pages has no server, so the build also writes dist/404.html (a copy of index.html): any address it
// doesn't know loads the app, which then shows the right page. Old shared links with "#/" are converted on load.
// (The file keeps its old name and exports so the rest of the app didn't need to change.)

export interface HashRoute {
  path: string;              // "/", "/listing/woman-artist-award-2026", ...
  query: URLSearchParams;
}

const ROUTE_EVENT = 'magpie:route';

export function parseHash(): HashRoute {
  return { path: window.location.pathname.replace(/\/+$/, '') || '/', query: new URLSearchParams(window.location.search) };
}

/** Old links looked like magpie.cool/#/listing/x: turn them into magpie.cool/listing/x. Run once on load. */
export function upgradeLegacyHashUrl() {
  const h = window.location.hash;
  if (h.startsWith('#/')) history.replaceState(null, '', h.slice(1) || '/');
}

/** Go to a page inside the site without reloading. */
export function navigate(to: string, { replace = false } = {}) {
  if (to === window.location.pathname + window.location.search) return;
  history[replace ? 'replaceState' : 'pushState'](null, '', to);
  window.dispatchEvent(new Event(ROUTE_EVENT));
}

export function useHashRoute(): HashRoute {
  const [route, setRoute] = useState(() => parseHash());
  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener('popstate', onChange);      // back / forward
    window.addEventListener(ROUTE_EVENT, onChange);     // navigate()
    return () => { window.removeEventListener('popstate', onChange); window.removeEventListener(ROUTE_EVENT, onChange); };
  }, []);
  return route;
}

/**
 * Makes ordinary <a href="/about"> links move within the app instead of reloading the page.
 * Leaves alone: other sites, new tabs, modified clicks (cmd/ctrl/shift), downloads and in-page anchors (#main).
 */
export function useLinkInterceptor() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href') ?? '';
      if (!href.startsWith('/') || href.startsWith('//')) return;
      e.preventDefault();
      navigate(href);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
}

/** Update the query part of the current address without adding a history entry (filter changes). */
export function replaceHashQuery(query: string) {
  const { path } = parseHash();
  const next = `${path}${query ? `?${query}` : ''}`;
  if (next !== window.location.pathname + window.location.search) history.replaceState(null, '', next);
  if (path === '/') rememberListHash();
}

// Remembers the last filtered list address, so "Back to all events" on a listing page
// returns to the same filters even if the visitor arrived some other way.
let lastListHash = '/';
export const rememberListHash = () => { lastListHash = window.location.pathname + window.location.search || '/'; };
export const getListHash = () => lastListHash;
