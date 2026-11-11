import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { isIOS, prefersReducedMotion } from './env';
import type { Disposable } from './lifecycle';
import { onFrame } from './ticker';

export interface ScrollController extends Disposable {
  /** The element that actually scrolls: `#scroll-root` on iOS, the window elsewhere. */
  readonly scroller: HTMLElement | Window;
  position(): number;
  lock(): void;
  unlock(): void;
}

/**
 * Page scrolling. iOS scrolls natively inside `#scroll-root` (see base.css) so the document
 * never rubber-bands; other browsers get Lenis smoothing unless reduced motion is requested.
 */
export function createScroll(): ScrollController {
  gsap.registerPlugin(ScrollTrigger);
  const root = document.getElementById('scroll-root');

  if (isIOS() && root) {
    ScrollTrigger.defaults({ scroller: root });
    return {
      scroller: root,
      position: () => root.scrollTop,
      lock: () => {
        root.style.overflowY = 'hidden';
      },
      unlock: () => {
        root.style.overflowY = '';
      },
      destroy: () => {
        ScrollTrigger.defaults({ scroller: window });
      },
    };
  }

  const native: ScrollController = {
    scroller: window,
    position: () => window.scrollY,
    lock: () => {
      document.documentElement.style.overflow = 'hidden';
    },
    unlock: () => {
      document.documentElement.style.overflow = '';
    },
    destroy: () => undefined,
  };
  if (prefersReducedMotion()) return native;

  const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1.1, autoRaf: false });
  lenis.on('scroll', () => ScrollTrigger.update());
  const stopFrames = onFrame((_delta, elapsed) => {
    lenis.raf(elapsed * 1000);
  });

  return {
    ...native,
    lock: () => {
      lenis.stop();
    },
    unlock: () => {
      lenis.start();
    },
    destroy: () => {
      stopFrames();
      lenis.destroy();
    },
  };
}
