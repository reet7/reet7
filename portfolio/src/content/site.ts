export interface Palette {
  a: string;
  b: string;
  c: string;
}

export interface Project {
  slug: string;
  name: string;
  category: string;
  tags: string[];
  year: string;
  summary: string;
  body: string[];
  url: string | null;
  repo: string | null;
  cover: string | null;
  palette: Palette;
  placeholder: boolean;
}

export interface SkillGroup {
  label: string;
  items: string[];
}

export const site = {
  brand: 'REET',
  handle: 'reet7',
  role: 'Creative Developer',
  tagline:
    'Building full-stack products, motion and real-time 3D that change the way a brand is seen and felt.',
  // TODO(owner): replace with a real contact address
  email: 'hello@example.com',
  github: 'https://github.com/reet7',
  url: 'https://reet7.github.io/',
  year: new Date().getFullYear(),
  intro:
    'Senior JavaScript engineer with five years of shipping the web. I design and build full-stack products, motion graphics and real-time 3D, from the database schema to the last frame of an easing curve.',
  about: [
    'I work where engineering meets craft. Most of my projects start as a product problem and end as an interface that feels inevitable: fast, legible and a little bit alive.',
    'On the backend I care about clean data models and typed APIs. On the frontend I obsess over timing, type and the space between things. In between, I build the tooling that keeps both honest.',
  ],
  principles: [
    { title: 'Product first', text: 'Motion and 3D serve the product, not the other way around. Every effect earns its frame budget.' },
    { title: 'Full-stack ownership', text: 'From Postgres schema to GLSL shader, one person holding the whole picture keeps the details consistent.' },
    { title: 'Ship, then refine', text: 'Working software early, then relentless iteration on feel, performance and accessibility.' },
  ],
  skills: [
    { label: 'Frontend', items: ['React', 'TypeScript', 'Next.js', 'Vue', 'Svelte', 'Tailwind'] },
    { label: 'Backend', items: ['Node.js', 'NestJS', 'GraphQL', 'WebSockets', 'tRPC'] },
    { label: 'Data', items: ['PostgreSQL', 'MongoDB', 'Redis', 'Prisma'] },
    { label: 'Motion', items: ['GSAP', 'Framer Motion', 'Lottie', 'Remotion', 'Lenis'] },
    { label: '3D', items: ['Three.js', 'R3F', 'WebGL', 'GLSL', 'WebGPU', 'Blender'] },
    { label: 'Infra', items: ['Docker', 'AWS', 'Vercel', 'GitHub Actions'] },
  ] satisfies SkillGroup[],
} as const;

export const projects: Project[] = [
  {
    slug: 'sat-suite-track',
    name: 'SAT Suite Track',
    category: 'EdTech',
    tags: ['Product', 'Full-stack', 'UI'],
    year: '2025',
    summary:
      'A question bank and practice tracker for SAT preparation: filter thousands of questions, log attempts and watch weak spots shrink over time.',
    body: [
      'Students preparing for the SAT juggle official question banks, spreadsheets and notes. SAT Suite Track puts the whole loop in one place: find a question, attempt it, review it, and see progress by domain and skill.',
      'The interface is built around fast filtering and keyboard-first review. Attempts are stored per question so the app can resurface what you missed, and dashboards break performance down by section, difficulty and skill.',
    ],
    url: null,
    repo: 'https://github.com/reet7/sat-suite-track-qbank',
    cover: null,
    palette: { a: '#0b1d3a', b: '#2f6bff', c: '#cfe0ff' },
    placeholder: false,
  },
  {
    // TODO(owner): replace
    slug: 'project-two',
    name: 'Project Two',
    category: 'Fintech',
    tags: ['Real-time', 'Dashboard', 'Motion'],
    year: '2024',
    summary: 'Placeholder: a real-time trading dashboard with streaming charts and sub-frame interaction feedback.',
    body: [
      'Placeholder case study. Describe the problem, the constraints and what you shipped. For example: a WebSocket-driven dashboard rendering thousands of ticks per second without dropping frames.',
      'Describe the stack and the result. For example: NestJS gateway, Redis pub/sub, a canvas renderer and GSAP-driven micro-interactions.',
    ],
    url: null,
    repo: null,
    cover: null,
    palette: { a: '#08140f', b: '#1f8a5b', c: '#d8f5e3' },
    placeholder: true,
  },
  {
    // TODO(owner): replace
    slug: 'project-three',
    name: 'Project Three',
    category: 'Culture',
    tags: ['WebGL', 'Creative Dev', '3D'],
    year: '2024',
    summary: 'Placeholder: an immersive exhibition site with a real-time 3D gallery and scroll-driven storytelling.',
    body: [
      'Placeholder case study. For example: a Three.js gallery of scanned artefacts, streamed as compressed glTF, with custom GLSL lighting and a Lenis-driven scroll narrative.',
      'Describe the result. For example: a site that loads in under two seconds on mobile and holds 60fps on mid-range devices.',
    ],
    url: null,
    repo: null,
    cover: null,
    palette: { a: '#1a0b07', b: '#d2542a', c: '#ffe2cf' },
    placeholder: true,
  },
  {
    // TODO(owner): replace
    slug: 'project-four',
    name: 'Project Four',
    category: 'SaaS',
    tags: ['Product', 'Design System', 'API'],
    year: '2023',
    summary: 'Placeholder: a B2B platform with a typed API, a component library and an onboarding flow that converts.',
    body: [
      'Placeholder case study. For example: a tRPC and Prisma backend, a Svelte component library and a motion system shared across marketing and product.',
      'Describe the result. For example: onboarding completion up, support tickets down, one design language across every surface.',
    ],
    url: null,
    repo: null,
    cover: null,
    palette: { a: '#120c22', b: '#7b5cff', c: '#ece6ff' },
    placeholder: true,
  },
];
