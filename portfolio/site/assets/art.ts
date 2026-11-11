import type { ArtDirection, ArtStyle, Palette } from '../../src/content/index.ts';
import { createRandom, type Random } from './random.ts';

export interface ArtRequest {
  readonly art: ArtDirection;
  readonly width: number;
  readonly height: number;
  readonly seed: number;
}

interface Canvas {
  readonly width: number;
  readonly height: number;
  readonly palette: Palette;
  readonly random: Random;
}

type Painter = (canvas: Canvas) => string;

const n = (value: number): string => value.toFixed(1);
const between = (random: Random, min: number, max: number): number => min + random() * (max - min);

function frame({ width, height, palette }: Canvas, defs: string, body: string): string {
  const [background, accent] = palette;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs>
<radialGradient id="bg" cx="0.3" cy="0.2" r="1.1"><stop offset="0" stop-color="${accent}" stop-opacity="0.38"/><stop offset="0.55" stop-color="${background}" stop-opacity="0"/></radialGradient>
<filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${n(width / 48)}"/></filter>
<filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${n(width / 180)}"/></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.09 0"/></filter>
${defs}
</defs>
<rect width="${width}" height="${height}" fill="${background}"/>
<rect width="${width}" height="${height}" fill="url(#bg)"/>
${body}
<rect width="${width}" height="${height}" filter="url(#grain)"/>
</svg>`;
}

/** A tilted field of cells, some answered, crossed by a progress ring. */
const lattice: Painter = (canvas) => {
  const { width, height, palette, random } = canvas;
  const [, accent, highlight] = palette;
  const cell = width / 14;
  const gap = cell * 0.12;
  const columns = 26;
  const rows = 20;
  const wave = between(random, 0.5, 1.4);
  const offset = between(random, 6, 10);
  let cells = '';
  let lit = '';
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const ridge = Math.abs(column - offset - Math.sin(row * 0.45 * wave) * 3 - row * 0.55);
      const heat = Math.max(0, 1 - ridge / 5) * between(random, 0.35, 1);
      const x = column * cell - width * 0.4;
      const y = row * cell - height * 0.4;
      const size = cell - gap;
      const rect = `x="${n(x)}" y="${n(y)}" width="${n(size)}" height="${n(size)}"`;
      if (heat > 0.62) lit += `<rect ${rect} fill="${highlight}" opacity="${n(heat)}"/>`;
      else if (heat > 0.12) cells += `<rect ${rect} fill="${accent}" opacity="${n(heat * 1.2)}"/>`;
      else
        cells += `<rect ${rect} fill="none" stroke="${accent}" stroke-opacity="0.28" stroke-width="1"/>`;
    }
  }
  const radius = height * between(random, 0.3, 0.42);
  const cx = width * between(random, 0.45, 0.6);
  const cy = height * between(random, 0.45, 0.55);
  const arc = 2 * Math.PI * radius;
  const ring = `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(radius)}" fill="none" stroke="${highlight}" stroke-opacity="0.18" stroke-width="${n(width / 90)}"/>
<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(radius)}" fill="none" stroke="${highlight}" stroke-width="${n(width / 90)}" stroke-dasharray="${n(arc * 0.68)} ${n(arc)}" transform="rotate(-90 ${n(cx)} ${n(cy)})"/>`;
  const tilt = `transform="translate(${n(width / 2)} ${n(height / 2)}) rotate(${n(between(random, -24, -12))}) skewX(-14) translate(${n(-width / 2)} ${n(-height / 2)})"`;
  return frame(
    canvas,
    '',
    `<g ${tilt}><g filter="url(#glow)" opacity="0.9">${lit}</g>${cells}${lit}</g>${ring}`,
  );
};

/** Stacked ridgelines, like a stream of ticks seen from the side. */
const signal: Painter = (canvas) => {
  const { width, height, palette, random } = canvas;
  const [background, accent, highlight] = palette;
  const lines = 30;
  const step = width / 90;
  const peak = between(random, 0.3, 0.7);
  const phase = (): number => between(random, 0, Math.PI * 2);
  const [fine, finer, broad] = [phase(), phase(), phase()];
  let ridges = '';
  let glow = '';
  for (let line = 0; line < lines; line++) {
    const t = line / (lines - 1);
    const base = height * (0.22 + t * 0.78);
    const amplitude = height * (0.05 + 0.2 * Math.sin(t * Math.PI));
    let path = `M${n(-step)} ${n(height + 4)} L${n(-step)} ${n(base)}`;
    for (let x = -step; x <= width + step; x += step) {
      const u = x / width;
      const envelope = Math.exp(-(((u - peak - (t - 0.5) * 0.3) / 0.22) ** 2));
      const ripple =
        Math.sin(u * 22 + fine + line * 0.6) * 0.5 +
        Math.sin(u * 47 + finer + line * 1.3) * 0.3 +
        Math.sin(u * 9 + broad + line * 0.2) * 0.6 +
        between(random, -0.25, 0.25);
      path += ` L${n(x)} ${n(base - Math.abs(ripple) * envelope * amplitude)}`;
    }
    path += ` L${n(width + step)} ${n(height + 4)} Z`;
    const stroke = t > 0.45 && t < 0.75 ? highlight : accent;
    ridges += `<path d="${path}" fill="${background}" stroke="${stroke}" stroke-opacity="${n(0.35 + t * 0.65)}" stroke-width="${n(width / 700)}"/>`;
    if (line % 5 === 2)
      glow += `<path d="${path}" fill="none" stroke="${accent}" stroke-width="${n(width / 160)}"/>`;
  }
  return frame(canvas, '', `<g filter="url(#glow)" opacity="0.7">${glow}</g>${ridges}`);
};

/** Lit spheres resting on their orbits. */
const orbit: Painter = (canvas) => {
  const { width, height, palette, random } = canvas;
  const [background, accent, highlight] = palette;
  const cx = width * between(random, 0.42, 0.58);
  const cy = height * between(random, 0.5, 0.62);
  const defs = `<radialGradient id="ball" cx="0.34" cy="0.28" r="0.8"><stop offset="0" stop-color="${highlight}"/><stop offset="0.38" stop-color="${accent}"/><stop offset="1" stop-color="${background}"/></radialGradient>`;
  let rings = '';
  let balls = '';
  let shadows = '';
  const count = 5;
  for (let index = 0; index < count; index++) {
    const rx = width * (0.14 + index * 0.11);
    const ry = rx * 0.34;
    rings += `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="none" stroke="${highlight}" stroke-opacity="${n(0.5 - index * 0.07)}" stroke-width="${n(width / 1000)}"/>`;
    const angle = between(random, 0, Math.PI * 2);
    const depth = (Math.sin(angle) + 1) / 2;
    const radius = height * (0.035 + depth * 0.07) * (index === 2 ? 1.6 : 1);
    const x = cx + Math.cos(angle) * rx;
    const y = cy + Math.sin(angle) * ry;
    shadows += `<ellipse cx="${n(x + radius * 0.5)}" cy="${n(y + radius * 1.1)}" rx="${n(radius * 1.2)}" ry="${n(radius * 0.35)}" fill="#000" opacity="0.55"/>`;
    balls += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(radius)}" fill="url(#ball)"/>`;
  }
  const core = height * 0.2;
  const sun = `<circle cx="${n(cx)}" cy="${n(cy - core * 0.2)}" r="${n(core * 1.5)}" fill="${accent}" opacity="0.5" filter="url(#glow)"/><circle cx="${n(cx)}" cy="${n(cy - core * 0.2)}" r="${n(core)}" fill="url(#ball)"/>`;
  const tilt = `transform="rotate(${n(between(random, -16, 16))} ${n(cx)} ${n(cy)})"`;
  return frame(
    canvas,
    defs,
    `<g ${tilt}>${rings}<g filter="url(#soft)">${shadows}</g>${sun}${balls}</g>`,
  );
};

/** Isometric slabs stacked like the layers of a system. */
const strata: Painter = (canvas) => {
  const { width, height, palette, random } = canvas;
  const [background, accent, highlight] = palette;
  const defs = `<linearGradient id="top" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${highlight}"/><stop offset="1" stop-color="${accent}"/></linearGradient>
<linearGradient id="side" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="${background}"/></linearGradient>`;
  const layers = 6;
  const slabWidth = width * 0.34;
  const slabDepth = slabWidth * 0.5;
  const thickness = height * 0.035;
  const spacing = height * between(random, 0.1, 0.13);
  const cx = width * between(random, 0.44, 0.56);
  const top = height * 0.2;
  let slabs = '';
  let glow = '';
  for (let layer = layers - 1; layer >= 0; layer--) {
    const y = top + layer * spacing;
    const shift = Math.sin(layer * 1.3 + random() * 2) * width * 0.05;
    const x = cx + shift;
    const face = `M${n(x)} ${n(y)} L${n(x + slabWidth)} ${n(y + slabDepth / 2)} L${n(x)} ${n(y + slabDepth)} L${n(x - slabWidth)} ${n(y + slabDepth / 2)} Z`;
    const left = `M${n(x - slabWidth)} ${n(y + slabDepth / 2)} L${n(x)} ${n(y + slabDepth)} l0 ${n(thickness)} L${n(x - slabWidth)} ${n(y + slabDepth / 2 + thickness)} Z`;
    const right = `M${n(x + slabWidth)} ${n(y + slabDepth / 2)} L${n(x)} ${n(y + slabDepth)} l0 ${n(thickness)} L${n(x + slabWidth)} ${n(y + slabDepth / 2 + thickness)} Z`;
    const solid = layer % 2 === 0;
    const opacity = n(0.25 + (1 - layer / layers) * 0.75);
    slabs += `<g opacity="${opacity}"><path d="${left}" fill="url(#side)"/><path d="${right}" fill="${background}" stroke="${accent}" stroke-width="1"/><path d="${face}" fill="${solid ? 'url(#top)' : background}" stroke="${highlight}" stroke-width="${n(width / 900)}"/></g>`;
    if (solid) glow += `<path d="${face}" fill="${accent}"/>`;
  }
  return frame(canvas, defs, `<g filter="url(#glow)" opacity="0.55">${glow}</g>${slabs}`);
};

const painters: Record<ArtStyle, Painter> = { lattice, signal, orbit, strata };

export function renderArt({ art, width, height, seed }: ArtRequest): string {
  return painters[art.style]({ width, height, palette: art.palette, random: createRandom(seed) });
}

/** An abstract product screen in the project's palette: window chrome, navigation, cards and charts. */
export function renderInterface(
  { art, width, height, seed }: ArtRequest,
  tone: 'light' | 'dark',
): string {
  const random = createRandom(seed);
  const [background, accent, highlight] = art.palette;
  const light = tone === 'light';
  const page = light ? '#e9e9e4' : background;
  const surface = light ? '#ffffff' : '#ffffff14';
  const ink = light ? '#0e0e0e' : '#ffffff';
  const margin = width * 0.07;
  const windowWidth = width - margin * 2;
  const windowHeight = height - margin * 2;
  const unit = windowWidth / 48;
  const sidebar = unit * 9;
  const bar = (x: number, y: number, w: number, h: number, fill: string, opacity = 1): string =>
    `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${fill}" opacity="${n(opacity)}"/>`;

  let body = bar(margin, margin, windowWidth, windowHeight, surface);
  body += bar(margin, margin, sidebar, windowHeight, ink, light ? 0.04 : 0.06);
  body += bar(margin + unit, margin + unit, unit * 1.4, unit * 1.4, accent);
  for (let item = 0; item < 7; item++) {
    const y = margin + unit * (4.5 + item * 1.9);
    body += bar(
      margin + unit,
      y,
      unit * between(random, 3.5, 6.5),
      unit * 0.55,
      ink,
      item === 1 ? 0.9 : 0.22,
    );
  }

  const contentX = margin + sidebar + unit * 1.5;
  const contentWidth = windowWidth - sidebar - unit * 3;
  body += bar(contentX, margin + unit * 1.2, unit * 12, unit * 1.3, ink, 0.9);
  body += bar(contentX + contentWidth - unit * 5, margin + unit, unit * 5, unit * 1.7, accent);

  const cardY = margin + unit * 4.5;
  const cardWidth = (contentWidth - unit * 2) / 3;
  const cardHeight = unit * 6;
  for (let card = 0; card < 3; card++) {
    const x = contentX + card * (cardWidth + unit);
    body += bar(x, cardY, cardWidth, cardHeight, card === 0 ? accent : ink, card === 0 ? 1 : 0.06);
    const text = card === 0 ? highlight : ink;
    body += bar(x + unit, cardY + unit, unit * 4, unit * 0.5, text, 0.6);
    body += bar(x + unit, cardY + unit * 2.6, unit * between(random, 4, 7), unit * 2, text, 0.95);
  }

  const chartY = cardY + cardHeight + unit;
  const chartHeight = margin + windowHeight - chartY - unit * 1.5;
  const chartWidth = contentWidth * 0.62;
  body += bar(contentX, chartY, chartWidth, chartHeight, ink, 0.06);
  const columns = 18;
  const columnWidth = (chartWidth - unit * 2) / columns;
  let line = '';
  for (let column = 0; column < columns; column++) {
    const value = 0.25 + 0.6 * Math.abs(Math.sin(column * 0.55 + seed)) * between(random, 0.6, 1);
    const h = (chartHeight - unit * 3) * value;
    const x = contentX + unit + column * columnWidth;
    const y = chartY + chartHeight - unit - h;
    body += bar(
      x,
      y,
      columnWidth * 0.62,
      h,
      column % 6 === 4 ? accent : ink,
      column % 6 === 4 ? 1 : 0.2,
    );
    line += `${column === 0 ? 'M' : 'L'}${n(x + columnWidth * 0.31)} ${n(y - unit * between(random, 0.6, 1.6))} `;
  }
  body += `<path d="${line}" fill="none" stroke="${accent}" stroke-width="${n(unit * 0.16)}"/>`;

  const listX = contentX + chartWidth + unit;
  const listWidth = contentWidth - chartWidth - unit;
  body += bar(listX, chartY, listWidth, chartHeight, ink, 0.06);
  const rows = Math.floor((chartHeight - unit) / (unit * 2.1));
  for (let row = 0; row < rows; row++) {
    const y = chartY + unit + row * unit * 2.1;
    body += bar(
      listX + unit,
      y,
      unit * 1.1,
      unit * 1.1,
      row % 3 === 0 ? accent : ink,
      row % 3 === 0 ? 1 : 0.18,
    );
    body += bar(
      listX + unit * 2.8,
      y + unit * 0.3,
      (listWidth - unit * 4.5) * between(random, 0.45, 1),
      unit * 0.5,
      ink,
      0.5,
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="130%"><feGaussianBlur stdDeviation="${n(width / 60)}"/></filter></defs>
<rect width="${width}" height="${height}" fill="${page}"/>
${light ? '' : `<rect width="${width}" height="${height}" fill="${accent}" opacity="0.12"/>`}
<rect x="${n(margin)}" y="${n(margin + unit)}" width="${n(windowWidth)}" height="${n(windowHeight)}" fill="#000" opacity="${light ? 0.18 : 0.5}" filter="url(#shadow)"/>
${body}
</svg>`;
}
