import { gsap } from 'gsap';
import { prefersReducedMotion } from '../core/env';
import type { Scope } from '../core/lifecycle';

const DURATION = 0.6;
const EASE = 'power3.out';

/**
 * Hover treatment for `[data-fill-link]`: a light block rises from the bottom while the
 * arrow leaves to the top-right and a copy arrives from the bottom-left. Leaving wipes
 * the block out through the top.
 */
export function initFillLinks(scope: Scope): void {
  if (prefersReducedMotion()) return;

  for (const link of document.querySelectorAll<HTMLElement>('[data-fill-link]')) {
    const [outgoing, incoming] = link.querySelectorAll('.arrow');
    if (!outgoing || !incoming) continue;

    const enter = (): void => {
      gsap.killTweensOf([link, outgoing, incoming]);
      gsap.fromTo(
        link,
        { '--fill-top': '100%', '--fill-bottom': '0%' },
        { '--fill-top': '0%', duration: DURATION, ease: EASE },
      );
      gsap.to(link, { color: '#000', duration: 0.35, ease: 'power2.out' });
      gsap.fromTo(
        outgoing,
        { xPercent: 0, yPercent: 0 },
        { xPercent: 100, yPercent: -100, duration: DURATION, ease: EASE },
      );
      gsap.fromTo(
        incoming,
        { xPercent: -100, yPercent: 100 },
        { xPercent: 0, yPercent: 0, duration: DURATION, ease: EASE },
      );
    };

    const leave = (): void => {
      gsap.killTweensOf([link, outgoing, incoming]);
      gsap.to(link, { '--fill-bottom': '100%', duration: DURATION, ease: EASE });
      gsap.to(link, { color: '#fff', duration: 0.35, ease: 'power2.out' });
      gsap.to(outgoing, { xPercent: 0, yPercent: 0, duration: DURATION, ease: EASE });
      gsap.to(incoming, { xPercent: -100, yPercent: 100, duration: DURATION, ease: EASE });
    };

    scope.listen(link, 'pointerenter', enter);
    scope.listen(link, 'pointerleave', leave);
    scope.listen(link, 'focus', enter);
    scope.listen(link, 'blur', leave);
    scope.add(() => {
      gsap.killTweensOf([link, outgoing, incoming]);
    });
  }
}
