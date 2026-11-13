import type { ReactNode } from 'react';
import { IconCheck } from './Icons';

/** A toggle chip (outlined pill; filled with a check mark when on, so it never relies on colour alone). */
export function Chip({ on, onToggle, children }: { on: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <button type="button" className={`chip${on ? ' is-on' : ''}`} aria-pressed={on} onClick={onToggle}>
      {on && <IconCheck />}
      {children}
    </button>
  );
}
