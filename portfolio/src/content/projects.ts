import type { Project } from './types.ts';

export const projects: readonly Project[] = [
  {
    slug: 'sat-suite-track',
    name: 'SAT Suite Track',
    category: 'EdTech',
    tags: ['Product', 'Full-stack', 'UI'],
    year: '2025',
    summary:
      'A question bank and practice tracker for SAT prep, built to turn thousands of questions into a clear picture of what to study next.',
    story: [
      'Students preparing for the SAT juggle question banks, spreadsheets and notes. SAT Suite Track closes that loop in one place: find a question, attempt it, review it, and see progress by section, domain and skill.',
      'The interface is built around fast filtering and keyboard-first review. Attempts are stored per question, so the app can resurface what was missed and show weak spots shrinking over time.',
    ],
    link: { label: 'Source', href: 'https://github.com/reet7/sat-suite-track-qbank' },
    cover: null,
    gallery: null,
    art: { style: 'lattice', palette: ['#07122b', '#2f6bff', '#d7e4ff'] },
  },
  {
    // TODO(owner): replace this placeholder project with a real one.
    slug: 'ledgerline',
    name: 'Ledgerline',
    category: 'Fintech',
    tags: ['Real-time', 'Dashboard', 'Motion'],
    year: '2025',
    summary:
      'Placeholder case study: a real-time treasury dashboard that streams market data into charts that never drop a frame.',
    story: [
      'Placeholder. A WebSocket gateway on NestJS fans out thousands of ticks per second through Redis pub/sub to a canvas renderer that batches updates into a single frame.',
      'Placeholder. GSAP-driven micro-interactions explain every state change, and the whole dashboard stays readable under load on mid-range laptops.',
    ],
    link: null,
    cover: null,
    gallery: null,
    art: { style: 'signal', palette: ['#06110c', '#22b573', '#dcf7e8'] },
  },
  {
    // TODO(owner): replace this placeholder project with a real one.
    slug: 'atrium',
    name: 'Atrium',
    category: 'Culture',
    tags: ['WebGL', 'Creative Dev', '3D'],
    year: '2024',
    summary:
      'Placeholder case study: an online exhibition where scanned artefacts live in a real-time 3D gallery driven by scroll.',
    story: [
      'Placeholder. Photogrammetry scans are compressed to streamed glTF and lit with custom GLSL, so each object loads progressively and keeps its material character.',
      'Placeholder. A Lenis-driven scroll narrative moves the camera between rooms and holds 60 frames per second on mid-range phones.',
    ],
    link: null,
    cover: null,
    gallery: null,
    art: { style: 'orbit', palette: ['#160b07', '#e2582b', '#ffe3d1'] },
  },
  {
    // TODO(owner): replace this placeholder project with a real one.
    slug: 'northbeam',
    name: 'Northbeam',
    category: 'SaaS',
    tags: ['Product', 'Design System', 'API'],
    year: '2023',
    summary:
      'Placeholder case study: a B2B platform with a typed API, a shared component library and onboarding that converts.',
    story: [
      'Placeholder. A tRPC and Prisma backend shares its types with a Svelte component library, so marketing and product surfaces are built from the same parts.',
      'Placeholder. One motion system across every surface cut design debt and made the onboarding flow measurably faster to complete.',
    ],
    link: null,
    cover: null,
    gallery: null,
    art: { style: 'strata', palette: ['#100b20', '#7b5cff', '#ebe5ff'] },
  },
];
