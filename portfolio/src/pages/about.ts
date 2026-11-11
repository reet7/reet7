import '../styles/global.css';
import '../styles/footer.css';
import { boot } from '../core/app';
import { createScroll } from '../core/scroll';

boot(({ scope }) => {
  scope.add(createScroll());
});
