import { about, site, type Discipline, type Poster } from '../../src/content/index.ts';
import { arrow, footer, nav, picture, rollLabel, scrollHint } from './chrome.ts';
import { html, type Markup } from './html.ts';
import type { Page, PageContext } from './page.ts';
import { wordmark } from './wordmark.ts';

function posterFace(side: 'front' | 'back', poster: Poster): Markup {
  return html`<div class="poster__face poster__face--${side}" data-poster-face="${side}">
    <p class="poster__title">${poster.title.map((line) => html`<span>${line}</span>`)}</p>
    <svg class="poster__drawing" viewBox="0 0 300 417" aria-hidden="true" focusable="false">
      <g fill="none" stroke="#0e0e0e" stroke-width="0.5">
        <path d="M150 140V417M225 140V417M75 250H300M75 334H300" opacity="0.25" />
        <circle cx="225" cy="334" r="84" opacity="0.25" />
        <path d="M75 417 225 250" />
        <path d="M225 250A84 84 0 0 1 300 334" stroke-width="1" />
        <path d="M150 417V334H225" stroke-width="1" />
      </g>
      <g fill="#0e0e0e">
        <rect x="222" y="247" width="6" height="6" />
        <rect x="147" y="331" width="6" height="6" />
      </g>
    </svg>
    <p class="poster__footnote">${poster.footnote.map((line) => html`<span>${line}</span>`)}</p>
  </div>`;
}

function statement(index: number, text: string, modifier: string): Markup {
  return html`<div class="statement statement--${modifier}">
    <span class="statement__index" data-reveal="fade">(${index})</span>
    <p data-reveal="lines">${text}</p>
  </div>`;
}

function disciplineEntry(discipline: Discipline): Markup {
  return html`<li class="team__entry">
    <a
      class="team__name underline-link"
      href="#${discipline.id}"
      aria-haspopup="dialog"
      aria-controls="${discipline.id}"
      data-popup-open="${discipline.id}"
      >${discipline.name}<span class="team__arrow">${arrow()}</span></a
    >
    <div class="team__body">
      <p class="team__role">${discipline.role}</p>
      <p class="team__bio">${discipline.bio}</p>
    </div>
  </li>`;
}

function disciplinePopup(discipline: Discipline, { root, pictures }: PageContext): Markup {
  const portrait = pictures.portraits.get(discipline.id);
  return html`<dialog
    class="popup"
    id="${discipline.id}"
    aria-labelledby="${discipline.id}-title"
    data-popup
  >
    <div class="popup__layout">
      <div class="popup__aside">
        <figure class="popup__portrait" data-popup-image>
          ${portrait ? picture(portrait, root, { sizes: '(max-width: 767px) 60vw, 35vw' }) : ''}
        </figure>
        <div class="popup__caption" data-popup-text>
          <h2 class="popup__name" id="${discipline.id}-title">${discipline.name}</h2>
          <p class="popup__role">${discipline.role.replace(/:$/, '')}</p>
        </div>
      </div>
      <div class="popup__main">
        <a
          class="popup__button"
          href="${site.github.href}"
          target="_blank"
          rel="noopener"
          data-popup-button
        >
          ${rollLabel(site.github.label, site.github.label)}
          <span class="popup__button-arrows" aria-hidden="true">${arrow()}${arrow()}</span>
        </a>
        <blockquote class="popup__quote" data-popup-text>“${discipline.quote}”</blockquote>
        <div class="popup__detail">
          <p data-popup-text>${discipline.detail}</p>
          <dl class="popup__skills" data-popup-text>
            ${discipline.skills.map(
              (group) =>
                html`<div class="popup__skill">
                  <dt class="label">${group.label}:</dt>
                  <dd>${group.items.join(', ')}</dd>
                </div>`,
            )}
          </dl>
        </div>
      </div>
    </div>
    <button type="button" class="popup__close" data-popup-close>Close</button>
    <span class="popup__cursor" aria-hidden="true" data-popup-cursor>X</span>
  </dialog>`;
}

export const aboutPage: Page = {
  kind: 'about',
  path: 'about/',
  title: `About — ${site.brand}`,
  description: about.statements[1],
  render: (context) => {
    const [first, second] = about.statements;
    return html`<main id="main" class="about" tabindex="-1">
        <h1 class="sr-only">About ${site.brand}</h1>
        <div class="about__track" data-poster-track>
          <section class="hero" aria-label="Introduction" data-hero>
            <div class="hero__stage" aria-hidden="true" data-hero-stage></div>
            <svg class="hero__round" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
              <circle
                cx="50"
                cy="50"
                r="49.9"
                fill="none"
                stroke="currentColor"
                stroke-width="0.05"
              />
            </svg>
            <header class="hero__top" data-hero-top>
              ${wordmark(about.title)} ${nav(context.root, 'about')}
            </header>
            ${scrollHint()}
          </section>
          <section class="statements" aria-label="Profile" data-statements>
            <div class="poster" data-poster>
              ${posterFace('front', about.poster.front)} ${posterFace('back', about.poster.back)}
            </div>
            ${statement(1, first, 'lead')}
            <div class="statements__second">
              ${statement(2, second, 'narrow')}
              <div class="statements__notes">
                ${about.notes.map((note) => html`<p data-reveal="lines">${note}</p>`)}
              </div>
            </div>
          </section>
        </div>
        <section class="drum" aria-label="Services" data-drum>
          <div class="drum__stage" aria-hidden="true" data-drum-stage></div>
          <ul class="drum__list" data-drum-list>
            ${about.services.map((service) => html`<li>${service}</li>`)}
          </ul>
        </section>
        <section class="team" aria-label="Capabilities">
          ${statement(3, about.craft, 'craft')}
          <ul class="team__list">
            ${about.disciplines.map(disciplineEntry)}
          </ul>
        </section>
      </main>
      ${about.disciplines.map((discipline) => disciplinePopup(discipline, context))}
      ${footer(context.root)}`;
  },
};
