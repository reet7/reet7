import { html, type Markup } from './html.ts';

/**
 * Original block letterforms drawn on a 100×100 grid: heavy blocks with chamfered corners and slit counters.
 * They are stretched to fill their slot, so only proportions inside the box matter.
 */
const letterforms: Record<string, string> = {
  A: 'M12 0H88L100 14V100H58V72H42V100H0V14ZM42 30V42H58V30Z',
  B: 'M0 0H90L100 12V44L94 50L100 56V88L90 100H0ZM42 24V34H64V24ZM42 66V76H64V66Z',
  E: 'M10 0H100V30H40V39H88V61H40V70H100V100H10L0 88V12Z',
  O: 'M12 0H88L100 14V86L88 100H12L0 86V14ZM30 44V56H70V44Z',
  R: 'M0 0H90L100 14V44L94 50L100 56V100H58V64H42V100H0ZM42 26V36H64V26Z',
  T: 'M0 0H100V32H68V100H32V32H0Z',
  U: 'M0 0H42V70H58V0H100V86L88 100H12L0 86Z',
};

export const letterformViewBox = 100;

export function letterformPath(letter: string): string {
  const path = letterforms[letter.toUpperCase()];
  if (!path) {
    throw new Error(`No letterform for "${letter}". Add one to site/templates/wordmark.ts.`);
  }
  return path;
}

function letter(char: string): Markup {
  return html`<span class="wordmark__letter"
    ><svg viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
      <path fill-rule="evenodd" d="${letterformPath(char)}" /></svg
  ></span>`;
}

/** Decorative wordmark; pair it with a visually hidden heading for assistive tech. */
export function wordmark(word: string, modifier = ''): Markup {
  return html`<div class="wordmark ${modifier}" aria-hidden="true" data-wordmark>
    ${[...word].map(letter)}
  </div>`;
}

export function faviconSvg(letterChar: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#0e0e0e"/><path transform="translate(16 20) scale(0.68 0.6)" fill="#fff" fill-rule="evenodd" d="${letterformPath(letterChar)}"/></svg>`;
}
