import '../styles/global.css';
import '../styles/footer.css';
import '../styles/work.css';
import { initFillLinks } from '../components/fill-link';
import { initFooterLogo } from '../components/footer-logo';
import { initReveals } from '../components/reveal';
import { initScrollHints } from '../components/scroll-hint';
import { boot } from '../core/app';
import { createScroll } from '../core/scroll';
import { isViewTransitionActive } from '../core/transitions';

/** Lets the incoming page slide settle before text starts to move. */
const TRANSITION_DELAY = 0.5;

boot(({ scope, arrival }) => {
  scope.add(createScroll());
  if (arrival !== 'flight') {
    initReveals(scope, { delay: isViewTransitionActive() ? TRANSITION_DELAY : 0.25 });
  }
  initFooterLogo(scope);
  initScrollHints(scope);
  initFillLinks(scope);
});
