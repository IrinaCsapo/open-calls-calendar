import type { ReactNode } from 'react';

/** A toggle chip (outlined pill; filled with a ✓ when on, so it never relies on colour alone). */
export function Chip({ on, onToggle, children }: { on: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <button type="button" className={`chip${on ? ' is-on' : ''}`} aria-pressed={on} onClick={onToggle}>
      {on && <span aria-hidden="true">✓ </span>}
      {children}
    </button>
  );
}
