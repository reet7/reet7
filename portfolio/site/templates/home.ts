import { projects, site } from '../../src/content/index.ts';
import { nav } from './chrome.ts';
import { html, type Markup } from './html.ts';
import type { Page } from './page.ts';
import { wordmark } from './wordmark.ts';

function track(name: string, values: readonly string[]): Markup {
  return html`<div class="work__track work__track--${name}" aria-hidden="true">
    <div class="work__track-inner" data-track>
      ${values.map((value) => html`<span class="work__track-item">${value}</span>`)}
    </div>
  </div>`;
}

export const homePage: Page = {
  kind: 'home',
  path: '',
  title: `${site.brand} — ${site.role}`,
  description: site.description,
  render: ({ root, pictures }) =>
    html`<div class="home" data-home>
      <header class="home__top" data-home-top>${wordmark(site.brand)} ${nav(root, 'home')}</header>
      <main id="main" class="home__main" tabindex="-1">
        <h1 class="sr-only">${site.brand} — ${site.role}</h1>
        <section
          class="work"
          aria-roledescription="carousel"
          aria-label="Selected work"
          data-carousel
        >
          <div class="work__stage" data-stage></div>
          <div class="work__line" data-line></div>
          <div class="work__info" data-info>
            ${track(
              'index',
              projects.map((_, index) => String(index + 1)),
            )}
            ${track(
              'tags',
              projects.map((project) => project.tags.join(', ')),
            )}
            <ol class="work__names" data-names>
              ${projects.map((project, index) => {
                const cover = pictures.projects.get(project.slug)?.cover;
                const [large, small] = cover?.sources ?? [];
                return html`<li class="work__name">
                  <a
                    href="${root}work/${project.slug}/"
                    data-slide="${index}"
                    data-cover="${root}${large?.path ?? ''}"
                    data-cover-small="${root}${(small ?? large)?.path ?? ''}"
                    data-label="${project.name}, ${project.category}"
                    >${project.name}</a
                  >
                </li>`;
              })}
            </ol>
            ${track(
              'category',
              projects.map((project) => project.category),
            )}
          </div>
          <p class="sr-only" aria-live="polite" data-status></p>
        </section>
        <p class="home__tagline" data-tagline>${site.tagline}</p>
      </main>
      <footer class="home__foot" data-home-foot>
        <a class="home__mail" href="mailto:${site.email}">${site.email}</a>
        <p class="home__rights">All rights reserved. ©${site.year}</p>
      </footer>
    </div>`,
};
