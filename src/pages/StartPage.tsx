import { useState } from 'react';
import type { Discipline } from '../types/listing';
import { DISCIPLINE_GROUPS, DISCIPLINES_QUERY, loadPicks, savePicks, toggleInList } from '../lib/filters';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { Chip } from '../components/Chip';

/**
 * "What do you make?": shown on a first visit (and from "Edit" on the list). The picks are kept in this
 * browser only and pre-filter the list. Skipping shows everything and the screen won't appear again.
 */
export function StartPage() {
  useDocumentTitle('What do you make?');
  const [picks, setPicks] = useState<Discipline[]>(() => loadPicks() ?? []);

  const finish = (chosen: Discipline[]) => {
    savePicks(chosen);
    window.location.hash = chosen.length ? `#/?${DISCIPLINES_QUERY(chosen)}` : '#/';
  };

  return (
    <div className="start">
      <h1>What do you make?</h1>
      <p className="start__sub">Pick one or more. We'll show you open calls for your work first, with every fee up front.</p>

      {DISCIPLINE_GROUPS.map((g) => (
        <section key={g.label} className="chip-group" aria-label={g.label}>
          <h2 className="chip-group__label">{g.label}</h2>
          <div className="chips">
            {g.items.map((d) => (
              <Chip key={d} on={picks.includes(d)} onToggle={() => setPicks(toggleInList(picks, d))}>{d}</Chip>
            ))}
          </div>
        </section>
      ))}

      <div className="start__actions">
        <button type="button" className="button button--wide" disabled={!picks.length} onClick={() => finish(picks)}>
          Continue
        </button>
        <p className="start__hint" aria-live="polite">
          {picks.length ? `${picks.length} chosen. Calls open to any medium are always included.` : 'Choose at least one to continue.'}
        </p>
        <button type="button" className="link-button" onClick={() => finish([])}>Skip, show me everything</button>
      </div>
    </div>
  );
}
