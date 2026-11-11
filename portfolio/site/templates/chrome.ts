import { site } from '../../src/content/index.ts';
import type { Picture } from '../assets/pictures.ts';
import { html, type Markup } from './html.ts';
import type { PageKind } from './page.ts';
import { wordmark } from './wordmark.ts';

/** Two stacked labels; the second rolls into view when the parent gets `.is-rolled`. */
export function rollLabel(first: string, second: string): Markup {
  return html`<span class="roll"
    ><span class="roll__item">${first}</span
    ><span class="roll__item roll__item--next" aria-hidden="true">${second}</span></span
  >`;
}

export function copyEmailButton(className: string): Markup {
  return html`<button type="button" class="${className}" data-copy-email="${site.email}">
    ${rollLabel('Contact', 'Email Copied')}
  </button>`;
}

export function nav(root: string, active: PageKind): Markup {
  const current = (kinds: readonly PageKind[]): Markup | '' =>
    kinds.includes(active) ? html` aria-current="page"` : '';
  return html`<nav class="nav" aria-label="Primary" data-nav>
    <p class="nav__role" data-nav-item>${site.role}</p>
    <ul class="nav__links">
      <li>
        <a class="nav__link" href="${root}" data-nav-item${current(['home', 'work'])}>Work,</a>
      </li>
      <li>
        <a class="nav__link" href="${root}about/" data-nav-item${current(['about'])}>About</a>
      </li>
    </ul>
    ${copyEmailButton('nav__link nav__contact')}
  </nav>`;
}

export function arrow(): Markup {
  return html`<svg class="arrow" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
    <path d="M1.5 8.5 8.5 1.5M3 1.5h5.5V7" fill="none" stroke="currentColor" stroke-width="1.2" />
  </svg>`;
}

export function scrollHint(): Markup {
  return html`<p class="scroll-hint" data-scroll-hint>
    Scroll Down
    <span class="scroll-hint__mask" aria-hidden="true"
      ><span class="scroll-hint__arrow">↓</span><span class="scroll-hint__arrow">↓</span></span
    >
  </p>`;
}

export function picture(
  image: Picture,
  root: string,
  options: { eager?: boolean; sizes: string },
): Markup {
  const [largest] = image.sources;
  if (!largest) return html``;
  const srcset = image.sources.map(({ path, width }) => `${root}${path} ${width}w`).join(', ');
  return html`<img
    src="${root}${largest.path}"
    srcset="${srcset}"
    sizes="${options.sizes}"
    width="${image.width}"
    height="${image.height}"
    alt="${image.alt}"
    ${options.eager ? html`decoding="sync" fetchpriority="high"` : html`decoding="async" loading="lazy"`}
  />`;
}

export function footer(root: string): Markup {
  const row = wordmark(site.brand, 'wordmark--footer');
  return html`<footer class="footer">
    <div class="footer__row">
      <ul class="footer__links">
        <li>
          <a class="footer__link" href="${site.github.href}" target="_blank" rel="noopener"
            >${site.github.label}</a
          >
        </li>
        <li><a class="footer__link" href="${root}">Work</a></li>
      </ul>
      <ul class="footer__links footer__links--center">
        <li><a class="footer__link" href="mailto:${site.email}">${site.email}</a></li>
        <li>${copyEmailButton('footer__link')}</li>
      </ul>
      <ul class="footer__links footer__links--end">
        <li>©${site.year}</li>
        <li><a class="footer__link" href="${root}privacy-policy/">Privacy Policy</a></li>
      </ul>
    </div>
    <div class="footer__logo" aria-hidden="true" data-footer-logo>
      <div class="footer__logo-clip footer__logo-clip--far" data-footer-logo-row>${row}</div>
      <div class="footer__logo-clip footer__logo-clip--near" data-footer-logo-row>${row}</div>
      <div class="footer__logo-clip" data-footer-logo-row>${row}</div>
    </div>
  </footer>`;
}
