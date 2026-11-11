import type { Palette } from '../content/site.ts';

function rand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hash(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Procedural abstract cover: layered blurred blobs over a gradient, film grain and a centered wordmark. */
export function coverSvg(id: string, palette: Palette, label: string, variant = 0): string {
  const r = rand(hash(id) + variant * 7919);
  const uid = `${id}-${variant}`;
  const blobs = Array.from({ length: 5 }, (_, i) => {
    const fill = [palette.b, palette.c, palette.b, palette.a, palette.c][i];
    const cx = Math.round(r() * 1600);
    const cy = Math.round(r() * 1000);
    const rx = Math.round(200 + r() * 520);
    const ry = Math.round(120 + r() * 360);
    const rot = Math.round(r() * 180);
    const op = (0.35 + r() * 0.55).toFixed(2);
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="${fill}" opacity="${op}"/>`;
  }).join('');
  const angle = Math.round(r() * 360);
  const text = label
    ? `<text x="800" y="500" text-anchor="middle" dominant-baseline="central" font-family="Archivo Variable, sans-serif" font-weight="800" font-size="120" letter-spacing="-4" fill="#fafafa" style="font-stretch:125%">${label}</text>`
    : '';
  return `<svg class="cover-svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
<defs>
<linearGradient id="g-${uid}" gradientTransform="rotate(${angle} .5 .5)"><stop offset="0" stop-color="${palette.a}"/><stop offset="1" stop-color="${palette.b}"/></linearGradient>
<filter id="b-${uid}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="90"/></filter>
<filter id="n-${uid}"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${Math.round(r() * 99)}"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .14 0"/></filter>
</defs>
<rect width="1600" height="1000" fill="url(#g-${uid})"/>
<g filter="url(#b-${uid})">${blobs}</g>
<rect width="1600" height="1000" filter="url(#n-${uid})"/>
${text}
</svg>`;
}
