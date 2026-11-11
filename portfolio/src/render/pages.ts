import { coverSvg } from './cover.ts';
import { htmlDocument, esc, footer, lines, nav, projectHref, projects, site, wordmark, type PageMeta } from './layout.ts';
import type { Project } from '../content/site.ts';

function cover(p: Project, variant = 0, label = true): string {
  if (p.cover && variant === 0) return `<img class="cover-img" src="${esc(p.cover)}" alt="" loading="lazy" decoding="async">`;
  return coverSvg(p.slug, p.palette, label ? p.name.toUpperCase() : '', variant);
}

export function homePage(): string {
  const root = './';
  const cards = projects
    .map(
      (p, i) => `<li class="card" data-card data-index="${i}">
  <a class="card-link" href="${projectHref(root, p.slug)}" data-link data-card-link aria-label="${esc(`${p.name} — ${p.category}`)}">${cover(p)}</a>
</li>`,
    )
    .join('');
  const names = projects
    .map((p, i) => `<li><button type="button" class="name" data-name data-index="${i}"${i === 0 ? ' aria-current="true"' : ''}>${esc(p.name)}</button></li>`)
    .join('');
  const body = `<main id="main" class="home" data-home>
  <header class="top">
    <h1 class="sr-only">${esc(`${site.brand} — ${site.role}`)}</h1>
    ${wordmark(site.brand, site.brand)}
    ${nav(root, 'home')}
  </header>
  <div class="work-line" aria-hidden="true" data-work-line></div>
  <ul class="stage" data-stage aria-label="Selected projects">${cards}</ul>
  <div class="row" data-row>
    <span class="row-num" data-row-num aria-live="polite">1</span>
    <span class="row-tags" data-row-tags>${esc(projects[0].tags.join(', '))}</span>
    <ol class="names" data-names aria-label="Project list">${names}</ol>
    <span class="row-cat" data-row-cat>${esc(projects[0].category)}</span>
  </div>
  <p class="intro-text">${lines(site.tagline, 'caps')}</p>
  ${footer(root)}
</main>
<script type="application/json" id="projects-data">${JSON.stringify(projects.map((p) => ({ slug: p.slug, name: p.name, category: p.category, tags: p.tags })))}</script>`;
  const meta: PageMeta = { kind: 'home', title: 'Work', description: site.tagline, root, path: '', body };
  return htmlDocument(meta);
}

export function workPage(p: Project, index: number): string {
  const root = '../../';
  const next = projects[(index + 1) % projects.length];
  const link = p.url ?? p.repo;
  const linkLabel = p.url ? 'Visit site' : p.repo ? 'View repository' : 'Coming soon';
  const media = [
    `<figure class="media media-hero" data-media>${cover(p)}</figure>`,
    `<figure class="media" data-media>${cover(p, 1, false)}<figcaption class="media-cap">${esc(p.summary)}</figcaption></figure>`,
    ...p.body.map((t, i) => `<section class="media media-text" data-media><span class="label">${i === 0 ? 'Challenge' : 'Approach'}</span><p>${esc(t)}</p></section>`),
    `<figure class="media" data-media>${cover(p, 2, false)}</figure>`,
  ].join('');
  const body = `<main id="main" class="work" data-work>
  <div class="work-bg" aria-hidden="true">${wordmark(site.brand, '')}</div>
  <aside class="work-side">
    <a class="work-back" href="${root}" data-link data-back>Close</a>
    <dl class="meta" data-meta>
      <div><dt>Client:</dt><dd>${esc(p.name)}${p.placeholder ? ' <span class="ph">(placeholder)</span>' : ''}</dd></div>
      <div><dt>Industry:</dt><dd>${esc(p.category)}</dd></div>
      <div><dt>Services:</dt><dd>${esc(p.tags.join(', '))}</dd></div>
      <div><dt>Year:</dt><dd>${esc(p.year)}</dd></div>
      <div><dt>Website:</dt><dd>${link ? `<a href="${esc(link)}" target="_blank" rel="noopener" aria-label="${linkLabel}">&#8599;</a>` : '&mdash;'}</dd></div>
    </dl>
    <div class="work-about" data-about>
      <span class="label">About:</span>
      <h1 class="work-title">${esc(p.summary)}</h1>
    </div>
    <span class="scroll-hint" aria-hidden="true">Scroll down <span class="arrow">&darr;</span></span>
  </aside>
  <div class="work-media">${media}
    <a class="next" href="${projectHref(root, next.slug)}" data-link>
      <span class="label">Next project</span>
      <span class="next-name">${esc(next.name)}</span>
    </a>
  </div>
</main>`;
  return htmlDocument({ kind: 'work', title: p.name, description: p.summary, root, path: `work/${p.slug}/`, body, slug: p.slug });
}

export function aboutPage(): string {
  const root = '../';
  const skills = site.skills
    .map(
      (g) => `<div class="skill" data-reveal><span class="label">${esc(g.label)}</span><ul>${g.items.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>`,
    )
    .join('');
  const principles = site.principles
    .map(
      (pr, i) => `<li class="principle" data-reveal><span class="principle-num">0${i + 1}</span><h3>${esc(pr.title)}</h3><p>${esc(pr.text)}</p></li>`,
    )
    .join('');
  const body = `<main id="main" class="about" data-about-page>
  <header class="top">
    <h1 class="sr-only">About ${esc(site.brand)}</h1>
    ${wordmark('ABOUT', 'About')}
    ${nav(root, 'about')}
  </header>
  <div class="about-visual" aria-hidden="true">${coverSvg('about', { a: '#050505', b: '#3a3a3a', c: '#bdbdbd' }, '', 3)}</div>
  <div class="about-arc" aria-hidden="true"></div>
  <section class="about-hero">
    <p class="about-lead">${lines(site.intro)}</p>
    <span class="scroll-hint" aria-hidden="true">Scroll down <span class="arrow">&darr;</span></span>
  </section>
  <section class="about-body">
    ${site.about.map((t) => `<p class="about-p" data-reveal>${esc(t)}</p>`).join('')}
  </section>
  <section class="about-principles"><h2 class="label">Principles</h2><ol>${principles}</ol></section>
  <section class="about-skills"><h2 class="label">Capabilities</h2><div class="skills">${skills}</div></section>
  <section class="about-cta" data-reveal>
    <p class="about-cta-text">Let's build something that moves.</p>
    <button type="button" class="about-cta-btn" data-contact-open>Get in touch</button>
  </section>
  ${footer(root)}
</main>`;
  return htmlDocument({ kind: 'about', title: 'About', description: site.intro, root, path: 'about/', body });
}

export function privacyPage(): string {
  const root = '../';
  const body = `<main id="main" class="privacy">
  <header class="top">${wordmark(site.brand, site.brand)}${nav(root, 'privacy')}</header>
  <article class="privacy-body">
    <h1>Privacy</h1>
    <p>This is a static portfolio. It sets no cookies, runs no analytics and stores nothing about you on a server.</p>
    <p>The only thing kept is a session flag in your browser so the intro animation plays once per visit. Closing the tab clears it.</p>
    <p>Questions: <a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p>
  </article>
  ${footer(root)}
</main>`;
  return htmlDocument({ kind: 'privacy', title: 'Privacy', description: 'Privacy notice.', root, path: 'privacy/', body });
}

export function allPages(): Record<string, string> {
  const out: Record<string, string> = {
    'index.html': homePage(),
    'about/index.html': aboutPage(),
    'privacy/index.html': privacyPage(),
  };
  projects.forEach((p, i) => (out[`work/${p.slug}/index.html`] = workPage(p, i)));
  return out;
}
