import { initCopyEmail } from '../components/copy-email';
import { initFeedback } from './feedback';
import { Scope } from './lifecycle';
import { resolveArrival, type Arrival } from './transitions';

export interface PageContext {
  /** Lives as long as the page; add every listener, trigger and GL resource to it. */
  readonly scope: Scope;
  readonly arrival: Arrival;
}

export type PageModule = (context: PageContext) => void;

/**
 * Boots a page: shared behaviour first, then the page module, which must set its initial
 * animation states synchronously so content can be un-hidden without a flash.
 */
export function boot(page: PageModule): void {
  const scope = new Scope();
  const context: PageContext = { scope, arrival: resolveArrival() };

  initFeedback(scope);
  initCopyEmail(scope);
  page(context);
  document.documentElement.classList.add('is-ready');

  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) scope.destroy();
  });
}
