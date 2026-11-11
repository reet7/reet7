import { gsap } from 'gsap';
import { disposer, qs, reducedMotion } from './env';
import { haptic } from './haptics';

type LeaveHandler = (link: HTMLAnchorElement) => Promise<void> | null;

const handlers: LeaveHandler[] = [];
let leaving = false;

export function onLeave(fn: LeaveHandler): () => void {
  handlers.unshift(fn);
  return () => handlers.splice(handlers.indexOf(fn), 1);
}

function veilOut(): Promise<void> {
  const veil = qs('[data-veil]');
  if (!veil || reducedMotion()) return Promise.resolve();
  return new Promise((resolve) => {
    gsap.to(veil, { opacity: 1, duration: 0.5, ease: 'power2.inOut', onComplete: resolve });
  });
}

export function navigate(link: HTMLAnchorElement): void {
  if (leaving) return;
  leaving = true;
  haptic();
  const custom = handlers.map((h) => h(link)).find((p) => p !== null);
  (custom ?? veilOut()).then(() => {
    window.location.href = link.href;
  });
}

function isInternal(a: HTMLAnchorElement, e: MouseEvent): boolean {
  return (
    a.origin === window.location.origin &&
    !a.target &&
    !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0 &&
    a.pathname !== window.location.pathname
  );
}

export function initTransitions(): { destroy(): void } {
  const d = disposer();
  const veil = qs('[data-veil]');
  d.on(document, 'click', ((e: MouseEvent) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-link]');
    if (!a || !isInternal(a, e)) return;
    e.preventDefault();
    navigate(a);
  }) as EventListener);
  // Restore the page when it comes back from the back/forward cache mid-transition.
  d.on(window, 'pageshow', ((e: PageTransitionEvent) => {
    if (!e.persisted) return;
    leaving = false;
    if (veil) gsap.set(veil, { opacity: 0 });
    window.location.reload();
  }) as EventListener);
  return { destroy: d.run };
}
