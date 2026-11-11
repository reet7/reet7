import { html, type Markup } from './html.ts';

/**
 * Original block letterforms drawn on a 100×100 grid with stepped corners and slit counters.
 * They are stretched to fill their slot, so only proportions inside the box matter.
 */
const letterforms: Record<string, string> = {
  A: 'M10 0H90V10H100V100H62V70H38V100H0V10H10ZM38 26V46H62V26Z',
  B: 'M0 0H90V10H100V42H92V58H100V90H90V100H0ZM38 22V38H64V22ZM38 62V78H64V62Z',
  E: 'M10 0H100V30H38V39H86V61H38V70H100V100H10V90H0V10H10Z',
  O: 'M10 0H90V10H100V90H90V100H10V90H0V10H10ZM43 22V78H57V22Z',
  R: 'M0 0H90V10H100V46H90V56H100V100H62V64H38V100H0ZM38 22V40H64V22Z',
  T: 'M0 0H100V34H69V100H31V34H0Z',
  U: 'M0 0H38V74H62V0H100V90H90V100H10V90H0Z',
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
