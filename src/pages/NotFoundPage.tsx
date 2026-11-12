import { useDocumentTitle } from '../lib/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Not found');
  return (
    <div className="empty">
      <h1>We couldn't find that page</h1>
      <p>It may have been removed, or the link has a typo. <a href="#/">See all listings</a>.</p>
    </div>
  );
}
