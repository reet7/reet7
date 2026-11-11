import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { about, projects, type ArtDirection, type Project } from '../../src/content/index.ts';
import { renderArt, renderInterface } from './art.ts';
import { hashString } from './random.ts';

export const GENERATED_DIR = 'generated';
const WIDTHS = [1600, 800] as const;

export interface PictureSource {
  /** Path relative to the site root. */
  readonly path: string;
  readonly width: number;
}

export interface Picture {
  readonly sources: readonly PictureSource[];
  readonly width: number;
  readonly height: number;
  readonly alt: string;
}

export interface ProjectPictures {
  readonly cover: Picture;
  readonly gallery: readonly Picture[];
}

/** A picture rendered at build time, with the SVG that produces it. */
interface GeneratedPicture extends Picture {
  readonly name: string;
  readonly svg: () => string;
}

function generated(
  name: string,
  width: number,
  height: number,
  alt: string,
  svg: () => string,
): GeneratedPicture {
  return {
    name,
    svg,
    width,
    height,
    alt,
    sources: WIDTHS.map((w) => ({ path: `${GENERATED_DIR}/${name}-${w}.webp`, width: w })),
  };
}

function projectArtwork(project: Project): GeneratedPicture[] {
  const { art, slug, name } = project;
  const seed = hashString(slug);
  const request = (width: number, height: number, offset: number) => ({
    art,
    width,
    height,
    seed: seed + offset,
  });
  return [
    generated(`${slug}-cover`, 1600, 1067, `${name} cover artwork`, () =>
      renderArt(request(1600, 1067, 0)),
    ),
    generated(`${slug}-screen-a`, 1600, 1200, `${name} interface study`, () =>
      renderInterface(request(1600, 1200, 1), 'light'),
    ),
    generated(`${slug}-detail`, 1600, 1067, `${name} artwork detail`, () =>
      renderArt(request(1600, 1067, 2)),
    ),
    generated(`${slug}-screen-b`, 1600, 1000, `${name} interface study, dark theme`, () =>
      renderInterface(request(1600, 1000, 3), 'dark'),
    ),
  ];
}

function portraitArtwork(id: string, name: string, art: ArtDirection): GeneratedPicture {
  return generated(`${id}-portrait`, 800, 1200, `Abstract artwork for ${name}`, () =>
    renderArt({ art, width: 800, height: 1200, seed: hashString(id) }),
  );
}

async function ownerPicture(publicDir: string, path: string, alt: string): Promise<Picture> {
  const file = resolve(publicDir, path);
  if (!existsSync(file)) throw new Error(`Image "${path}" not found in public/.`);
  const { width, height } = await sharp(file).metadata();
  return { sources: [{ path, width }], width, height, alt };
}

export interface PictureSet {
  readonly projects: ReadonlyMap<string, ProjectPictures>;
  readonly portraits: ReadonlyMap<string, Picture>;
  readonly generated: readonly GeneratedPicture[];
}

/** Resolves every picture the site uses: owner-supplied files where set, procedural artwork otherwise. */
export async function resolvePictures(publicDir: string): Promise<PictureSet> {
  const toRender: GeneratedPicture[] = [];
  const projectPictures = new Map<string, ProjectPictures>();

  for (const project of projects) {
    const [artCover, ...artGallery] = projectArtwork(project);
    if (!artCover) continue;
    let cover: Picture = artCover;
    if (project.cover)
      cover = await ownerPicture(publicDir, project.cover, `${project.name} cover`);
    else toRender.push(artCover);

    let gallery: readonly Picture[] = artGallery;
    if (project.gallery) {
      gallery = await Promise.all(
        project.gallery.map((path, index) =>
          ownerPicture(publicDir, path, `${project.name}, image ${index + 1}`),
        ),
      );
    } else toRender.push(...artGallery);

    projectPictures.set(project.slug, { cover, gallery });
  }

  const portraits = new Map<string, Picture>();
  for (const { id, name, art } of about.disciplines) {
    const portrait = portraitArtwork(id, name, art);
    portraits.set(id, portrait);
    toRender.push(portrait);
  }

  return { projects: projectPictures, portraits, generated: toRender };
}

export async function renderPicture(
  picture: GeneratedPicture,
): Promise<{ path: string; data: Buffer }[]> {
  const base = sharp(Buffer.from(picture.svg()));
  return Promise.all(
    picture.sources.map(async ({ path, width }) => ({
      path,
      data: await base.clone().resize({ width }).webp({ quality: 76 }).toBuffer(),
    })),
  );
}
