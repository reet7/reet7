import { defineConfig } from 'vite';
import { sitePlugin } from './site/plugin.ts';

export default defineConfig({
  // Relative asset URLs keep the build portable across root domains and sub-path hosts.
  base: './',
  plugins: [sitePlugin()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
  },
});
