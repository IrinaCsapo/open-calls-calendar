import { useEffect } from 'react';

import { SITE_NAME as SITE } from './site';

/** Sets the browser tab title, e.g. "Woman Artist Award · Magpie". */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : SITE;
  }, [title]);
}
