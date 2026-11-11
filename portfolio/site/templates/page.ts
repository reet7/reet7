import type { PictureSet } from '../assets/pictures.ts';
import type { Markup } from './html.ts';

export type PageKind = 'home' | 'about' | 'work' | 'legal';

export interface PageContext {
  /** Relative prefix from this page back to the site root, e.g. `../../`. */
  readonly root: string;
  readonly pictures: PictureSet;
}

export interface Page {
  readonly kind: PageKind;
  /** Site-relative directory, e.g. `` for home or `work/atrium/`. */
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly render: (context: PageContext) => Markup;
}
