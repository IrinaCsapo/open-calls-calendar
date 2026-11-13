import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site at its own domain, https://magpie.cool/ (see public/CNAME)
export default defineConfig({
  base: '/',
  plugins: [react()],
});
