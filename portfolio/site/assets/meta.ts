import sharp from 'sharp';
import { projects, site } from '../../src/content/index.ts';
import { letterformPath } from '../templates/wordmark.ts';
import { renderArt } from './art.ts';
import { hashString } from './random.ts';

export const OG_IMAGE = { path: 'generated/og.png', width: 1200, height: 630 } as const;

/** Social card: the wordmark and nav strip over the first project's artwork. */
export async function renderOgImage(): Promise<Buffer> {
  const { width, height } = OG_IMAGE;
  const margin = 32;
  const letters = [...site.brand];
  const gap = 6;
  const letterWidth = (width - margin * 2 - gap * (letters.length - 1)) / letters.length;
  const letterHeight = 200;
  const wordmark = letters
    .map(
      (char, index) =>
        `<path transform="translate(${margin + index * (letterWidth + gap)} ${margin}) scale(${letterWidth / 100} ${letterHeight / 100})" fill="#fff" fill-rule="evenodd" d="${letterformPath(char)}"/>`,
    )
    .join('');
  const card = { width: 420, height: 280 };
  const first = projects[0];
  const art = first
    ? renderArt({
        art: first.art,
        width: card.width * 2,
        height: card.height * 2,
        seed: hashString(first.slug),
      })
    : '';
  const artwork = art
    ? `<image x="${(width - card.width) / 2}" y="${margin + letterHeight + 70}" width="${card.width}" height="${card.height}" href="data:image/svg+xml;base64,${Buffer.from(art).toString('base64')}"/>`
    : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
<rect width="${width}" height="${height}" fill="#0e0e0e"/>
${wordmark}
<rect x="${margin}" y="${margin + letterHeight + 16}" width="${width - margin * 2}" height="30" fill="#fff"/>
<rect x="${margin}" y="${margin + letterHeight + 70 + card.height / 2}" width="${width - margin * 2}" height="1" fill="#fff" opacity="0.25"/>
${artwork}
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export function sitemap(paths: readonly string[]): string {
  const urls = paths
    .map((path) => `  <url><loc>${new URL(path, `${site.url}/`).href}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robots(): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap.xml', `${site.url}/`).href}\n`;
}
