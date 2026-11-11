import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../core/env';
import type { Scope } from '../core/lifecycle';

/** The footer wordmark's three stacked rows grow from nothing as the footer scrolls into view. */
export function initFooterLogo(scope: Scope): void {
  const logo = document.querySelector<HTMLElement>('[data-footer-logo]');
  if (!logo || prefersReducedMotion()) return;

  gsap.registerPlugin(ScrollTrigger);
  const rows = logo.querySelectorAll<HTMLElement>('[data-footer-logo-row]');
  const context = gsap.context(() => {
    gsap.from(rows, {
      height: 0,
      ease: 'none',
      scrollTrigger: { trigger: logo, start: 'top bottom', end: 'bottom bottom', scrub: true },
    });
  });
  scope.add(() => {
    context.revert();
  });
}
