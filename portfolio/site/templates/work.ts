import { projects, site, type Project } from '../../src/content/index.ts';
import { arrow, footer, nav, picture, scrollHint } from './chrome.ts';
import { html, type Markup } from './html.ts';
import type { Page } from './page.ts';

const MEDIA_SIZES = '(max-width: 767px) 100vw, (max-width: 991px) 60vw, 50vw';

function fact(label: string, value: Markup | string): Markup {
  return html`<div class="case__fact">
    <dt class="label" data-reveal="lines">${label}:</dt>
    <dd data-reveal="lines">${value}</dd>
  </div>`;
}

function linkFact(project: Project): Markup | '' {
  if (!project.link) return '';
  const link = html`<a
    class="fill-link"
    href="${project.link.href}"
    target="_blank"
    rel="noopener"
    data-fill-link
  >
    <span class="sr-only">${project.link.label}: ${project.name}</span>
    <span class="fill-link__arrows" aria-hidden="true">${arrow()}${arrow()}</span>
  </a>`;
  return html`<div class="case__fact">
    <dt class="label" data-reveal="lines">${project.link.label}:</dt>
    <dd data-reveal="fade">${link}</dd>
  </div>`;
}

function workPage(project: Project): Page {
  return {
    kind: 'work',
    path: `work/${project.slug}/`,
    title: `${project.name} — ${site.brand}`,
    description: project.summary,
    render: ({ root, pictures }) => {
      const images = pictures.projects.get(project.slug);
      return html`<header class="page-top">${nav(root, 'work')}</header>
        <main id="main" class="case" tabindex="-1" data-case>
          <div class="case__info">
            <h1 class="sr-only">${project.name}</h1>
            <dl class="case__facts">
              ${fact('Project', project.name)} ${fact('Industry', project.category)}
              ${fact('Services', project.tags.join(', '))} ${fact('Year', project.year)}
              ${linkFact(project)}
            </dl>
            <div class="case__about">
              <div class="case__summary">
                <h2 class="label" data-reveal="lines">About:</h2>
                <p data-reveal="lines">${project.summary}</p>
              </div>
              ${scrollHint()}
            </div>
          </div>
          <div class="case__media" data-media>
            ${
              images
                ? html`<figure
                    class="case__figure case__figure--cover"
                    data-cover
                    data-reveal="media"
                  >
                    ${picture(images.cover, root, { eager: true, sizes: MEDIA_SIZES })}
                  </figure>`
                : ''
            }
            ${(images?.gallery ?? []).map(
              (image) =>
                html`<figure
                  class="case__figure"
                  style="aspect-ratio: ${image.width} / ${image.height}"
                  data-reveal="media"
                >
                  ${picture(image, root, { sizes: MEDIA_SIZES })}
                </figure>`,
            )}
            <div class="case__story">
              ${project.story.map((paragraph) => html`<p data-reveal="lines">${paragraph}</p>`)}
            </div>
          </div>
        </main>
        ${footer(root)}`;
    },
  };
}

export const workPages: readonly Page[] = projects.map(workPage);
