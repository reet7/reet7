import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { disposer, qsa, reducedMotion } from '../core/env';
import { splitLines } from './split';

gsap.registerPlugin(ScrollTrigger);

/** Line-mask reveals for [data-split] text and slide-up reveals for [data-reveal] / [data-media] blocks. */
export function initReveals(root: ParentNode = document): { destroy(): void } {
  const d = disposer();
  if (reducedMotion()) return { destroy: d.run };
  const ctx = gsap.context(() => {
    qsa<HTMLElement>('[data-split]', root).forEach((el) => {
      if (el.closest('.intro-text')) return;
      const { lines, revert } = splitLines(el);
      d.add(revert);
      gsap.fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: 1.2, ease: 'power4.out', stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    qsa<HTMLElement>('[data-reveal], [data-media]', root).forEach((el) => {
      gsap.fromTo(el, { opacity: 0, y: innerHeight * 0.08 }, { opacity: 1, y: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 95%', once: true } });
    });
  });
  d.add(() => ctx.revert());
  return { destroy: d.run };
}
