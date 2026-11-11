import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

/** Splits an element into masked lines; returns the inner line elements. */
export function splitLines(el: HTMLElement): { lines: HTMLElement[]; revert(): void } {
  const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'line-in' });
  return { lines: split.lines as HTMLElement[], revert: () => split.revert() };
}
