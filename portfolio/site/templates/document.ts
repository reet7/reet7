import { site } from '../../src/content/index.ts';
import { OG_IMAGE } from '../assets/meta.ts';
import { html, raw, type Markup } from './html.ts';
import type { Page, PageContext } from './page.ts';

/**
 * Runs before first paint: flags JS support, iOS (which scrolls inside #scroll-root)
 * and repeat visits, and arms a failsafe that reveals intro-hidden content if the app never boots.
 */
const bootScript = `(function(c){c.add('js');var n=navigator;if(/iP(hone|ad|od)/.test(n.userAgent)||(n.platform==='MacIntel'&&n.maxTouchPoints>1))c.add('is-ios');try{if(sessionStorage.getItem('visited'))c.add('is-returning')}catch(e){}setTimeout(function(){c.add('is-ready')},6000)})(document.documentElement.classList)`;

function absolute(path: string): string {
  return new URL(path, `${site.url}/`).href;
}

function personSchema(): Markup {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.brand,
    jobTitle: site.role,
    description: site.description,
    url: absolute(''),
    sameAs: [site.github.href],
  };
  return raw(
    `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`,
  );
}

export function renderDocument(page: Page, context: PageContext): string {
  const { root } = context;
  const url = absolute(page.path);
  const image = absolute(OG_IMAGE.path);
  const document = html`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>${page.title}</title>
        <meta name="description" content="${page.description}" />
        <meta name="theme-color" content="#0e0e0e" />
        <meta name="color-scheme" content="dark" />
        <link rel="canonical" href="${url}" />
        <link rel="icon" href="${root}favicon.svg" type="image/svg+xml" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="${site.brand}" />
        <meta property="og:title" content="${page.title}" />
        <meta property="og:description" content="${page.description}" />
        <meta property="og:url" content="${url}" />
        <meta property="og:image" content="${image}" />
        <meta property="og:image:width" content="${OG_IMAGE.width}" />
        <meta property="og:image:height" content="${OG_IMAGE.height}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${page.title}" />
        <meta name="twitter:description" content="${page.description}" />
        <meta name="twitter:image" content="${image}" />
        ${page.kind === 'home' || page.kind === 'about' ? personSchema() : ''}
        <script>
          ${raw(bootScript)};
        </script>
        <script type="module" src="/src/pages/${page.kind}.ts"></script>
      </head>
      <body data-page="${page.kind}">
        <a class="skip-link" href="#main">Skip to content</a>
        <div id="scroll-root">${page.render(context)}</div>
      </body>
    </html> `;
  return document.value;
}
