import '../styles/global.css';
import '../styles/home.css';
import { createCarousel, type Carousel } from '../components/carousel/carousel';
import { createDomStage } from '../components/carousel/dom-stage';
import { playHomeIntro } from '../components/home-intro';
import { boot } from '../core/app';
import { media, prefersReducedMotion, saveData } from '../core/env';
import { tick } from '../core/feedback';
import type { Scope } from '../core/lifecycle';
import { createCarouselStage } from '../gl/carousel-stage';

const PREFETCH_DELAY_MS = 2500;

const loadFlight = () => import('../components/project-flight');

/** Warms up what the next navigation is likely to need once the page has settled. */
function prefetchNext(scope: Scope, links: readonly HTMLAnchorElement[], flight: boolean): void {
  if (saveData()) return;
  const timer = window.setTimeout(() => {
    if (flight) void loadFlight();
    for (const { href } of links) {
      const hint = document.createElement('link');
      hint.rel = 'prefetch';
      hint.href = href;
      document.head.append(hint);
    }
  }, PREFETCH_DELAY_MS);
  scope.add(() => {
    window.clearTimeout(timer);
  });
}

boot(({ scope, arrival }) => {
  const home = document.querySelector<HTMLElement>('[data-home]');
  const root = home?.querySelector<HTMLElement>('[data-carousel]');
  if (!home || !root) return;

  let usesWebGL = false;
  let flying = false;
  const canFly = (): boolean =>
    usesWebGL && media.desktopPointer.matches && !prefersReducedMotion();

  const carousel: Carousel = createCarousel(root, scope, {
    createStage(container, sources) {
      const stage = createCarouselStage(container, sources, scope);
      usesWebGL = stage !== null;
      return stage ?? createDomStage(container, sources, scope);
    },
    onOpen(project, link, event) {
      if (flying) {
        event.preventDefault();
        return;
      }
      tick(project);
      if (!canFly()) {
        if (event.type !== 'click') window.location.assign(link.href);
        return;
      }
      event.preventDefault();
      flying = true;
      loadFlight()
        .then(({ flyToProject }) =>
          flyToProject({
            link,
            cover: link.dataset.cover ?? '',
            from: carousel.activeRect(),
            onTakeoff: () => carousel.stage.setHidden(project),
            onReturn: () => {
              flying = false;
              carousel.stage.setHidden(null);
            },
          }),
        )
        .catch(() => {
          window.location.assign(link.href);
        });
    },
  });

  playHomeIntro(home, scope, { carousel, arrival, assets: carousel.stage.ready });
  prefetchNext(scope, [...root.querySelectorAll<HTMLAnchorElement>('a[data-slide]')], canFly());
});
