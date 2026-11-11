import '../styles/global.css';
import '../styles/footer.css';
import '../styles/legal.css';
import { initFooterLogo } from '../components/footer-logo';
import { initReveals } from '../components/reveal';
import { boot } from '../core/app';
import { createScroll } from '../core/scroll';

boot(({ scope }) => {
  scope.add(createScroll());
  initReveals(scope);
  initFooterLogo(scope);
});
