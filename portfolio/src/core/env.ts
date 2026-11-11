const query = (media: string): MediaQueryList => window.matchMedia(media);

/** Media conditions the layout and motion switch on; they mirror the stylesheet's breakpoints. */
export const media = {
  reducedMotion: query('(prefers-reduced-motion: reduce)'),
  /** Touch-first devices: no hover affordances, no custom cursors. */
  touch: query('(hover: none) and (pointer: coarse)'),
  /** Large landscape screens driven by a mouse; enables cursor effects and the project flight. */
  desktopPointer: query(
    '(min-width: 992px) and (orientation: landscape) and (hover: hover) and (pointer: fine)',
  ),
  /** Phone and portrait-tablet layout of the home carousel. */
  portraitStack: query('(orientation: portrait) and (max-width: 1024px), (max-width: 767px)'),
  /** Layouts without the desktop-only About hero scene. */
  compact: query('(max-width: 991px), (orientation: portrait)'),
  phone: query('(max-width: 767px)'),
} as const;

export const prefersReducedMotion = (): boolean => media.reducedMotion.matches;

export const isIOS = (): boolean => document.documentElement.classList.contains('is-ios');

export const saveData = (): boolean =>
  (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
