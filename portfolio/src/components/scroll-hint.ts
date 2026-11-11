import { gsap } from 'gsap';
import { media, prefersReducedMotion } from '../core/env';
import type { Scope } from '../core/lifecycle';

/** Loops the "Scroll Down" arrow: one arrow drops out of its mask while a copy drops in. */
export function initScrollHints(scope: Scope): void {
  if (prefersReducedMotion() || media.touch.matches) return;
  const arrows = document.querySelectorAll('.scroll-hint__arrow');
  if (arrows.length === 0) return;

  const tween = gsap.fromTo(
    arrows,
    { yPercent: 0 },
    { yPercent: 200, duration: 1, ease: 'expo.out', repeat: -1, repeatDelay: 1, delay: 1 },
  );
  scope.add(() => {
    tween.kill();
  });
}
