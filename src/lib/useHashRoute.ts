import { useEffect, useState } from 'react';

// Hash routing works on GitHub Pages without any server config.
// URLs look like:  #/            #/?kind=apply&price=free-entry
//                  #/event/woman-artist-award-2026      #/submit     #/about

export interface HashRoute {
  path: string;              // "/", "/event/woman-artist-award-2026", ...
  query: URLSearchParams;
}

export function parseHash(hash = window.location.hash): HashRoute {
  const raw = hash.replace(/^#/, '') || '/';
  const [path, search = ''] = raw.split('?');
  return { path: path || '/', query: new URLSearchParams(search) };
}

export function useHashRoute(): HashRoute {
  const [route, setRoute] = useState(() => parseHash());
  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

/** Update the query part of the current hash without adding a history entry. */
export function replaceHashQuery(query: string) {
  const { path } = parseHash();
  const next = `#${path}${query ? `?${query}` : ''}`;
  if (next !== window.location.hash) history.replaceState(null, '', next);
  if (path === '/') rememberListHash();
}

// Remembers the last filtered list URL, so "Back to all listings" on a detail
// page returns to the same filters even if the visitor arrived some other way.
let lastListHash = '#/';
export const rememberListHash = () => { lastListHash = window.location.hash || '#/'; };
export const getListHash = () => lastListHash;
