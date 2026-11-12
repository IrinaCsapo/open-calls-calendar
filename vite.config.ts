import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site at https://irinacsapo.github.io/open-calls-calendar/
// When it moves to its own domain, change base to '/' and add public/CNAME.
export default defineConfig({
  base: '/open-calls-calendar/',
  plugins: [react()],
});
