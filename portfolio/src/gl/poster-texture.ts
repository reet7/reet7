import { CanvasTexture, LinearFilter, type Texture } from 'three';

const ASPECT = 417 / 300;
const INSET = 0.06;
const TITLE_SIZE = 0.11;
const FOOTNOTE_SIZE = 0.04;

const lines = (root: Element, selector: string): string[] =>
  [...root.querySelectorAll(`${selector} span`)].map((line) => line.textContent);

function loadSvg(svg: SVGElement, width: number, height: number): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(clone.outerHTML)}`;
  return image.decode().then(() => image);
}

/**
 * Rasterises one poster face from its DOM (the markup is the single source for the card's
 * text and drawing) so the WebGL card matches the CSS fallback. Mirrors the rules in about.css.
 */
export async function createPosterTexture(face: HTMLElement, width: number): Promise<Texture> {
  const height = Math.round(width * ASPECT);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  const drawing = face.querySelector<SVGElement>('svg');

  if (context) {
    const inset = width * INSET;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
    if (drawing) context.drawImage(await loadSvg(drawing, width, height), 0, 0, width, height);

    context.fillStyle = '#0e0e0e';
    context.textBaseline = 'alphabetic';
    const titleSize = width * TITLE_SIZE;
    context.font = `500 ${titleSize}px "Inter Tight", Arial, sans-serif`;
    context.letterSpacing = `${-0.02 * titleSize}px`;
    lines(face, '.poster__title').forEach((line, index) => {
      context.fillText(line, inset, inset + titleSize * (0.78 + index * 0.9));
    });

    const noteSize = width * FOOTNOTE_SIZE;
    const notes = lines(face, '.poster__footnote');
    context.font = `500 ${noteSize}px "Inter Tight", Arial, sans-serif`;
    context.letterSpacing = '0px';
    notes.forEach((line, index) => {
      context.fillText(line, inset, height - inset - noteSize * (notes.length - 1 - index + 0.15));
    });
  }

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}
