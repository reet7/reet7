import { gsap } from 'gsap';
import { disposer, qs, qsa, reducedMotion } from '../core/env';
import { initReveals } from '../components/reveal';
import { initSmoothScroll, destroySmoothScroll } from '../core/scroll';
import { splitLines } from '../components/split';

export function initWork(): { destroy(): void } {
  const d = disposer();
  document.documentElement.classList.remove('is-loading');
  initSmoothScroll();
  d.add(destroySmoothScroll);
  const flew = sessionStorage.getItem('fly-in') === location.pathname;
  sessionStorage.removeItem('fly-in');
  const hero = qs('.media-hero');
  if (hero) hero.removeAttribute('data-media');
  const reveals = initReveals();
  d.add(reveals.destroy);
  if (reducedMotion()) return { destroy: d.run };

  const title = qs('.work-title');
  const split = title ? splitLines(title) : null;
  if (split) d.add(split.revert);
  const metaRows = qsa('.meta > div');
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  if (hero && !flew) tl.fromTo(hero, { opacity: 0, y: innerHeight * 0.08 }, { opacity: 1, y: 0, duration: 1.4 }, 0);
  tl.fromTo(metaRows, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.1, stagger: 0.08 }, flew ? 0 : 0.2);
  if (split) tl.fromTo(split.lines, { yPercent: 110 }, { yPercent: 0, duration: 1.2, ease: 'power4.out', stagger: 0.08 }, 0.35);
  tl.fromTo(qsa('.work-about .label, .scroll-hint, .work-back'), { opacity: 0 }, { opacity: 1, duration: 0.8 }, 0.4);
  d.add(() => tl.kill());
  return { destroy: d.run };
}
