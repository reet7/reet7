import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, posix, relative, resolve } from 'node:path';
import type { Plugin } from 'vite';
import { site } from '../src/content/index.ts';
import { OG_IMAGE, renderOgImage, robots, sitemap } from './assets/meta.ts';
import {
  GENERATED_DIR,
  renderPicture,
  resolvePictures,
  type PictureSet,
} from './assets/pictures.ts';
import { pages } from './pages.ts';
import { renderDocument } from './templates/document.ts';
import { faviconSvg } from './templates/wordmark.ts';

const FONT_FILE = /inter-tight-latin-wght-normal-[\w-]+\.woff2$/;

function write(file: string, data: string | Buffer): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, data);
}

/** Rasterising artwork is the slow part of a build, so it is skipped while its inputs are unchanged. */
async function writeArtwork(publicDir: string, pictures: PictureSet): Promise<void> {
  const outDir = resolve(publicDir, GENERATED_DIR);
  const stamp = resolve(outDir, '.stamp');
  const hash = createHash('sha1');
  for (const picture of pictures.generated) hash.update(picture.name).update(picture.svg());
  const digest = hash.digest('hex');
  if (existsSync(stamp) && readFileSync(stamp, 'utf8') === digest) return;

  for (const picture of pictures.generated) {
    for (const { path, data } of await renderPicture(picture))
      write(resolve(publicDir, path), data);
  }
  write(resolve(publicDir, OG_IMAGE.path), await renderOgImage());
  write(stamp, digest);
}

function writeStatics(publicDir: string): void {
  write(resolve(publicDir, 'favicon.svg'), faviconSvg(site.brand.charAt(0)));
  write(resolve(publicDir, 'sitemap.xml'), sitemap(pages.map((page) => page.path)));
  write(resolve(publicDir, 'robots.txt'), robots());
}

function writePages(root: string, pictures: PictureSet): Record<string, string> {
  const inputs: Record<string, string> = {};
  for (const page of pages) {
    const file = resolve(root, page.path, 'index.html');
    const depth = page.path.split('/').filter(Boolean).length;
    write(file, renderDocument(page, { root: '../'.repeat(depth) || './', pictures }));
    inputs[page.path.replace(/\/$/, '').replaceAll('/', '-') || 'home'] = file;
  }
  return inputs;
}

/**
 * Renders the static site from the content module: one HTML document per route (used as
 * build inputs, so the output is a true multi-page site), artwork, favicon, sitemap and robots.
 */
export function sitePlugin(): Plugin {
  let root = process.cwd();
  let publicDir = resolve(root, 'public');

  return {
    name: 'portfolio-site',
    async config(config) {
      root = resolve(config.root ?? process.cwd());
      publicDir = resolve(root, 'public');
      const pictures = await resolvePictures(publicDir);
      await writeArtwork(publicDir, pictures);
      writeStatics(publicDir);
      return { build: { rollupOptions: { input: writePages(root, pictures) } } };
    },
    configureServer(server) {
      const sources = [resolve(root, 'site'), resolve(root, 'src/content')];
      server.watcher.add(sources);
      server.watcher.on('change', (file) => {
        if (sources.some((dir) => file.startsWith(dir))) void server.restart();
      });
    },
    transformIndexHtml: {
      order: 'post',
      handler(_html, { bundle, filename }) {
        const font = Object.keys(bundle ?? {}).find((name) => FONT_FILE.test(name));
        if (!font) return [];
        const from = posix.dirname(relative(root, filename).split('\\').join('/'));
        return [
          {
            tag: 'link',
            attrs: {
              rel: 'preload',
              as: 'font',
              type: 'font/woff2',
              crossorigin: '',
              href: posix.relative(from, font),
            },
            injectTo: 'head-prepend',
          },
        ];
      },
    },
  };
}
