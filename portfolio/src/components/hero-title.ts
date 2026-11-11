import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../core/env';
import type { Scope } from '../core/lifecycle';
import { isViewTransitionActive } from '../core/transitions';

const TRANSITION_DELAY = 0.5;

/**
 * About hero header: the wordmark letters unfold, the nav strip wipes in, and the whole
 * block drifts up as the statements slide over the hero.
 */
export function initHeroTitle(scope: Scope): void {
  const top = document.querySelector<HTMLElement>('[data-hero-top]');
  const statements = document.querySelector<HTMLElement>('[data-statements]');
  if (!top || prefersReducedMotion()) return;

  gsap.registerPlugin(ScrollTrigger);
  const context = gsap.context(() => {
    const delay = isViewTransitionActive() ? TRANSITION_DELAY : 0;
    gsap.from(top.querySelectorAll('.wordmark__letter'), {
      yPercent: 100,
      rotationX: 60,
      duration: 1.4,
      ease: 'expo.out',
      stagger: 0.035,
      delay,
    });
    gsap.from(top.querySelector('[data-nav]'), {
      clipPath: 'inset(0 0 100% 0)',
      duration: 1,
      ease: 'expo.out',
      delay,
      clearProps: 'clipPath',
    });
    gsap.to(top, {
      yPercent: -75,
      ease: 'none',
      scrollTrigger: { trigger: statements, start: 'clamp(top bottom)', end: 'top top', scrub: 1 },
    });
  });
  scope.add(() => {
    context.revert();
  });
}
