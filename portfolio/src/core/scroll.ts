import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion } from './env';

let lenis: Lenis | null = null;
const tick = (time: number): void => lenis?.raf(time * 1000);

export function initSmoothScroll(): void {
  if (lenis || reducedMotion()) return;
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
}

export function destroySmoothScroll(): void {
  gsap.ticker.remove(tick);
  lenis?.destroy();
  lenis = null;
}

export function lockScroll(locked: boolean): void {
  if (lenis) locked ? lenis.stop() : lenis.start();
  document.documentElement.style.overflow = locked ? 'hidden' : '';
}
