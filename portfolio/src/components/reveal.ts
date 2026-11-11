import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { media, prefersReducedMotion } from '../core/env';
import type { Scope } from '../core/lifecycle';

const START = 'top 90%';
const BATCH_STAGGER = 0.08;

export interface RevealOptions {
  readonly root?: ParentNode;
  /** Seconds to wait before the first batch, e.g. while a page transition finishes. */
  readonly delay?: number;
}

interface LineReveal {
  tween: gsap.core.Tween | null;
  delay: number;
  entered: boolean;
}

/** Splits text into masked lines that rise into place; re-splits itself when fonts load or the width changes. */
function splitLines(element: HTMLElement, reveal: LineReveal): SplitText {
  return SplitText.create(element, {
    type: 'lines',
    mask: 'lines',
    linesClass: 'line',
    autoSplit: true,
    // Returning the tween lets SplitText carry its progress over to the re-split lines.
    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- tweens are thenable
    onSplit: (split) => {
      const tween = gsap.from(split.lines, {
        yPercent: 110,
        opacity: 0,
        duration: 1.2,
        stagger: 0.08,
        ease: 'power4.out',
        paused: true,
      });
      if (reveal.entered) tween.delay(reveal.delay).play();
      reveal.tween = tween;
      return tween;
    },
  });
}

/**
 * Scroll-triggered entrances for `[data-reveal="lines" | "fade" | "media"]`.
 * Elements entering together are staggered as one batch.
 */
export function initReveals(
  scope: Scope,
  { root = document, delay = 0 }: RevealOptions = {},
): void {
  const lines = [...root.querySelectorAll<HTMLElement>('[data-reveal="lines"]')];
  const fades = [...root.querySelectorAll<HTMLElement>('[data-reveal="fade"]')];
  const mediaItems = [...root.querySelectorAll<HTMLElement>('[data-reveal="media"]')];
  if (prefersReducedMotion()) return;

  gsap.registerPlugin(ScrollTrigger, SplitText);
  const context = gsap.context(() => {
    const reveals = new Map<Element, LineReveal>();
    for (const element of lines) {
      const reveal: LineReveal = { tween: null, delay: 0, entered: false };
      reveals.set(element, reveal);
      splitLines(element, reveal);
    }

    ScrollTrigger.batch(lines, {
      start: START,
      once: true,
      onEnter: (batch) => {
        batch.forEach((element, index) => {
          const reveal = reveals.get(element);
          if (!reveal) return;
          reveal.entered = true;
          reveal.delay = delay + index * BATCH_STAGGER;
          reveal.tween?.delay(reveal.delay).play();
        });
      },
    });

    gsap.set(fades, { opacity: 0 });
    ScrollTrigger.batch(fades, {
      start: START,
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, { opacity: 1, duration: 0.8, ease: 'power2.out', delay: delay + 0.2 });
      },
    });

    const phone = media.phone.matches;
    const shift = window.innerHeight * (phone ? 0.02 : 0.08);
    gsap.set(mediaItems, { opacity: 0, y: shift });
    ScrollTrigger.batch(mediaItems, {
      start: phone ? 'top 80%' : 'top 100%',
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: phone ? 1.2 : 1.4,
          ease: phone ? 'power2.out' : 'expo.out',
          stagger: 0.1,
          delay,
        });
      },
    });
  });

  scope.add(() => {
    context.revert();
  });
}
