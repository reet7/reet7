import { site, projects } from '../content/site.ts';
import { letterSvg } from './letters.ts';

export type PageKind = 'home' | 'about' | 'work' | 'privacy';

export interface PageMeta {
  kind: PageKind;
  title: string;
  description: string;
  /** Relative prefix back to the site root, e.g. '../../'. */
  root: string;
  path: string;
  body: string;
  slug?: string;
}

export const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function lines(text: string, cls = ''): string {
  return `<span class="split ${cls}" data-split>${esc(text)}</span>`;
}

export function wordmark(word: string, label: string): string {
  const letters = [...word].map((ch) => `<span class="wm-letter"><span class="wm-inner">${letterSvg(ch)}</span></span>`).join('');
  return `<div class="wordmark" aria-hidden="true" data-wordmark>${letters}</div><span class="sr-only">${esc(label)}</span>`;
}

export function nav(root: string, active: PageKind): string {
  const cur = (k: PageKind) => (active === k || (k === 'home' && active === 'work') ? ' aria-current="page"' : '');
  return `<nav class="nav" aria-label="Primary" data-nav>
  <div class="nav-w">
    <div class="nav-role"><span class="mask"><span class="mask-in">${esc(site.role)}</span></span></div>
    <div class="nav-links">
      <a class="nav-link" href="${root}" data-link${cur('home')}><span class="mask"><span class="mask-in">Work,</span></span></a>
      <a class="nav-link" href="${root}about/" data-link${cur('about')}><span class="mask"><span class="mask-in">About</span></span></a>
    </div>
    <span class="nav-count" data-count aria-hidden="true"></span>
    <button class="nav-link nav-contact" type="button" data-contact-open aria-haspopup="dialog" aria-controls="contact"><span class="mask"><span class="mask-in">Contact</span></span></button>
  </div>
</nav>`;
}

export function contactPopup(): string {
  return `<div class="contact" id="contact" role="dialog" aria-modal="true" aria-label="Contact" hidden data-contact>
  <div class="contact-bg" data-contact-close></div>
  <div class="contact-panel" data-contact-panel>
    <div class="contact-head"><span class="label">Contact</span><button type="button" class="contact-x" data-contact-close aria-label="Close contact">Close</button></div>
    <p class="contact-title">Have a product, a launch or an idea that should move? Let's talk.</p>
    <ul class="contact-list">
      <li><span class="label">Email</span><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></li>
      <li><span class="label">GitHub</span><a href="${esc(site.github)}" target="_blank" rel="noopener">github.com/${esc(site.handle)}</a></li>
    </ul>
  </div>
</div>`;
}

export function footer(root: string): string {
  return `<footer class="foot">
  <a class="foot-mail" href="mailto:${esc(site.email)}">${esc(site.email)}</a>
  <span class="foot-copy"><a href="${root}privacy/">Privacy</a> · All rights reserved. &copy;${site.year}</span>
</footer>`;
}

export function htmlDocument(meta: PageMeta): string {
  const fullTitle = meta.kind === 'home' ? `${site.brand} — ${site.role}` : `${meta.title} — ${site.brand}`;
  const favicon = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#0e0e0e"/><rect x="5" y="5" width="22" height="22" fill="#fafafa"/><rect x="12" y="5" width="4" height="13" fill="#0e0e0e"/><path d="M16 18h5l6 9h-6z" fill="#0e0e0e"/></svg>',
  )}`;
  return `<!doctype html>
<html lang="en" class="is-loading">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(meta.description)}">
<meta name="theme-color" content="#0e0e0e">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(meta.description)}">
<meta property="og:url" content="${esc(site.url + meta.path)}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="${favicon}">
<script>document.documentElement.classList.add('js');if(sessionStorage.getItem('intro-seen'))document.documentElement.classList.add('intro-seen')</script>
</head>
<body data-page="${meta.kind}"${meta.slug ? ` data-slug="${meta.slug}"` : ''}>
<a class="skip" href="#main">Skip to content</a>
${meta.body}
${contactPopup()}
<div class="cursor" aria-hidden="true" data-cursor><span class="cursor-label" data-cursor-label>Open</span></div>
<div class="veil" aria-hidden="true" data-veil></div>
<script type="module" src="/src/main.ts"></script>
</body>
</html>`;
}

export const projectHref = (root: string, slug: string): string => `${root}work/${slug}/`;
export { site, projects };
