export type ArtStyle = 'lattice' | 'signal' | 'orbit' | 'strata';

/** Background, accent and highlight colours used by the procedural artwork. */
export type Palette = readonly [background: string, accent: string, highlight: string];

export interface ArtDirection {
  readonly style: ArtStyle;
  readonly palette: Palette;
}

export interface ExternalLink {
  readonly label: string;
  readonly href: string;
}

export interface Project {
  readonly slug: string;
  readonly name: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly year: string;
  /** One or two sentences shown under "About" on the case page. */
  readonly summary: string;
  readonly story: readonly string[];
  readonly link: ExternalLink | null;
  /**
   * Path of a real cover image inside `public/` (e.g. `images/sat/cover.webp`).
   * `null` renders procedural artwork from `art` instead.
   */
  readonly cover: string | null;
  /** Paths of real case-study images inside `public/`; `null` renders procedural visuals. */
  readonly gallery: readonly string[] | null;
  readonly art: ArtDirection;
}

export interface SkillGroup {
  readonly label: string;
  readonly items: readonly string[];
}

export interface Discipline {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly bio: string;
  readonly quote: string;
  readonly detail: string;
  readonly skills: readonly SkillGroup[];
  readonly art: ArtDirection;
}

export interface Poster {
  readonly title: readonly string[];
  readonly footnote: readonly string[];
}

export interface LegalSection {
  readonly heading: string;
  readonly body: readonly string[];
}
