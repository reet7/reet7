import { gsap } from 'gsap';
import { disposer, qsa, reducedMotion } from '../core/env';
import { initReveals } from '../components/reveal';
import { destroySmoothScroll, initSmoothScroll } from '../core/scroll';

export function initAbout(): { destroy(): void } {
  const d = disposer();
  document.documentElement.classList.remove('is-loading');
  initSmoothScroll();
  d.add(destroySmoothScroll);
  const reveals = initReveals();
  d.add(reveals.destroy);
  if (!reducedMotion()) {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      .fromTo(qsa('.wm-inner'), { yPercent: 105, rotateX: 60 }, { yPercent: 0, rotateX: 0, duration: 1.4, stagger: 0.035 })
      .fromTo(qsa('.nav .mask-in'), { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.035 }, 0.3);
    d.add(() => tl.kill());
  }
  return { destroy: d.run };
}
