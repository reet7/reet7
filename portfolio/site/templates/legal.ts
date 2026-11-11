import { privacy, site } from '../../src/content/index.ts';
import { footer, nav } from './chrome.ts';
import { html } from './html.ts';
import type { Page } from './page.ts';

export const privacyPage: Page = {
  kind: 'legal',
  path: 'privacy-policy/',
  title: `Privacy Policy — ${site.brand}`,
  description: privacy.intro,
  render: ({ root }) =>
    html`<header class="page-top">${nav(root, 'legal')}</header>
      <main id="main" class="legal" tabindex="-1">
        <h1 class="legal__title" data-reveal="lines">Privacy Policy</h1>
        <div class="legal__body">
          <p class="label">
            Last updated: <time datetime="${privacy.updated}">${privacy.updated}</time>
          </p>
          <p>${privacy.intro}</p>
          ${privacy.sections.map(
            (section) =>
              html`<section class="legal__section">
                <h2 class="label">${section.heading}</h2>
                ${section.body.map((paragraph) => html`<p>${paragraph}</p>`)}
              </section>`,
          )}
          <p>Questions: <a class="underline-link" href="mailto:${site.email}">${site.email}</a></p>
        </div>
      </main>
      ${footer(root)}`,
};
