import { gsap } from 'gsap';
import { disposer, qs, qsa, reducedMotion } from '../core/env';
import { haptic } from '../core/haptics';
import { lockScroll } from '../core/scroll';

export function initContact(): { destroy(): void } {
  const d = disposer();
  const root = qs('[data-contact]');
  const panel = qs('[data-contact-panel]');
  const bg = qs('.contact-bg');
  if (!root || !panel || !bg) return { destroy: d.run };
  let opener: HTMLElement | null = null;
  let tl: gsap.core.Timeline | null = null;
  const instant = reducedMotion();

  const open = (from: HTMLElement): void => {
    if (!root.hidden) return;
    opener = from;
    haptic();
    root.hidden = false;
    lockScroll(true);
    tl?.kill();
    const items = qsa(':scope > *', panel);
    tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      .fromTo(bg, { opacity: 0 }, { opacity: 1, duration: instant ? 0 : 0.6 })
      .fromTo(panel, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: instant ? 0 : 1 }, 0)
      .fromTo(items, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: instant ? 0 : 0.8, stagger: 0.06 }, 0.15);
    qs<HTMLButtonElement>('.contact-x', panel)?.focus({ preventScroll: true });
  };

  const close = (): void => {
    if (root.hidden) return;
    haptic();
    tl?.kill();
    tl = gsap.timeline({
      defaults: { ease: 'power3.in' },
      onComplete: () => {
        root.hidden = true;
        lockScroll(false);
        opener?.focus({ preventScroll: true });
      },
    })
      .to(panel, { clipPath: 'inset(0 0 100% 0)', duration: instant ? 0 : 0.5 })
      .to(bg, { opacity: 0, duration: instant ? 0 : 0.4 }, 0.1);
  };

  qsa('[data-contact-open]').forEach((b) => d.on(b, 'click', () => open(b)));
  qsa('[data-contact-close]', root).forEach((b) => d.on(b, 'click', close));
  d.on(document, 'keydown', ((e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab' && !root.hidden) {
      const f = qsa<HTMLElement>('a, button', panel);
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }) as EventListener);
  d.add(() => tl?.kill());
  return { destroy: d.run };
}
