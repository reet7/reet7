import { defineConfig, type Plugin } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { allPages } from './src/render/pages.ts';

const root = import.meta.dirname;

function writePages(): Record<string, string> {
  const inputs: Record<string, string> = {};
  for (const [file, html] of Object.entries(allPages())) {
    const abs = resolve(root, file);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, html);
    inputs[file.replace(/\/?index\.html$/, '') || 'home'] = abs;
  }
  return inputs;
}

// HTML is generated from the typed content module so pages stay static and crawlable.
function pages(): Plugin {
  return {
    name: 'generate-pages',
    configureServer(server) {
      server.watcher.add(resolve(root, 'src/content'));
      server.watcher.on('change', (f) => {
        if (f.includes('/src/content/') || f.includes('/src/render/')) writePages();
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [pages()],
  build: { rollupOptions: { input: writePages() }, assetsInlineLimit: 0 },
});
