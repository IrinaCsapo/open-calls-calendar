import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './App';
import { upgradeLegacyHashUrl } from './lib/useHashRoute';

upgradeLegacyHashUrl();   // old magpie.cool/#/... links → magpie.cool/...

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
