import '../styles/global.css';
import '../styles/footer.css';
import '../styles/about.css';
import '../styles/popup.css';
import { initFooterLogo } from '../components/footer-logo';
import { initHeroTitle } from '../components/hero-title';
import { initPopups } from '../components/popup';
import { initReveals } from '../components/reveal';
import { initScrollHints } from '../components/scroll-hint';
import { boot } from '../core/app';
import { media, prefersReducedMotion } from '../core/env';
import type { Scope } from '../core/lifecycle';
import { createScroll, type ScrollController } from '../core/scroll';

/** WebGL layers load after the text is interactive; each falls back to its DOM counterpart. */
function loadStages(scope: Scope, scroll: ScrollController): void {
  if (prefersReducedMotion()) return;
  const poster = document.querySelector<HTMLElement>('[data-poster]');
  const drum = document.querySelector<HTMLElement>('[data-drum]');
  const hero = document.querySelector<HTMLElement>('[data-hero-stage]');

  if (drum) {
    void import('../gl/drum').then(({ createDrum }) => createDrum(drum, scope));
  }
  if (poster && drum) {
    void import('../gl/poster-card').then(({ createPosterCard }) =>
      createPosterCard({ poster, burnAt: drum }, scope, scroll),
    );
  }
  if (hero && !media.compact.matches && !media.touch.matches) {
    void import('../gl/hero-scene').then(({ createHeroScene }) =>
      createHeroScene(hero, scope, scroll),
    );
  }
}

boot(({ scope }) => {
  const scroll = createScroll();
  scope.add(scroll);
  initHeroTitle(scope);
  initReveals(scope);
  initFooterLogo(scope);
  initScrollHints(scope);
  initPopups(scope, scroll);
  loadStages(scope, scroll);
});
