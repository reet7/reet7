import type { Discipline, LegalSection, Poster, SkillGroup } from './types.ts';

const skills = {
  frontend: {
    label: 'Frontend',
    items: ['React', 'TypeScript', 'Next.js', 'Vue', 'Svelte', 'Tailwind'],
  },
  backend: { label: 'Backend', items: ['Node.js', 'NestJS', 'GraphQL', 'WebSockets', 'tRPC'] },
  data: { label: 'Data', items: ['PostgreSQL', 'MongoDB', 'Redis', 'Prisma'] },
  motion: { label: 'Motion', items: ['GSAP', 'Framer Motion', 'Lottie', 'Remotion', 'Lenis'] },
  realtime3d: { label: '3D', items: ['Three.js', 'R3F', 'WebGL', 'GLSL', 'WebGPU', 'Blender'] },
  infra: { label: 'Infra', items: ['Docker', 'AWS', 'Vercel', 'GitHub Actions'] },
} as const satisfies Record<string, SkillGroup>;

export const site = {
  /** Wordmark; every letter needs a letterform in `site/templates/wordmark.ts`. */
  brand: 'REET',
  role: 'Creative Developer',
  tagline:
    'Turning full-stack products, motion and real-time 3D into an engineering edge that changes how a brand is seen and felt.',
  description:
    'Portfolio of REET, a creative developer building full-stack products, motion graphics and real-time 3D for the web.',
  // TODO(owner): replace with a real contact address.
  email: 'hello@example.com',
  github: { label: 'GitHub', href: 'https://github.com/reet7' },
  // TODO(owner): set to the deployed origin; used for canonical URLs, the sitemap and social cards.
  url: 'https://reet7.vercel.app',
  year: 2026,
  /** Synthesised interface ticks. On by default with no mute control, like the design reference. */
  sound: true,
} as const;

export const about = {
  title: 'ABOUT',
  statements: [
    'A senior JavaScript engineer building full-stack products, motion graphics and real-time 3D. Five years of shipping the web, with carefully made decisions that set the tone of an interface and help products grow and stay relevant.',
    'I build digital experiences that go beyond the surface, where data, motion and interaction become one system, by design.',
  ],
  notes: [
    'No magic — just typed contracts, measured frame budgets and attention to the details that actually move the needle.',
    'Every decision has a reason behind it, and together they build products people trust.',
  ],
  services: [
    'Full-stack Products',
    'Frontend Systems',
    'Motion Graphics',
    'Real-time 3D',
    'Backend & APIs',
    'Cloud Delivery',
  ],
  poster: {
    front: { title: ['From', 'Idea to', 'Production'], footnote: ['Code Follows', 'Thought.'] },
    back: { title: ['Always', 'Built to', 'Move'], footnote: ['Full-stack,', 'Motion, 3D.'] },
  } satisfies Record<'front' | 'back', Poster>,
  craft:
    'I am a detail obsessive, a pixel perfectionist, a product builder, a systems architect, a motion storyteller, a shader tinkerer, a problem-solver and a partner in your growth.',
  disciplines: [
    {
      id: 'engineering',
      name: 'Engineering',
      role: 'Full-stack Products:',
      bio: 'Typed end to end: React and Next.js up front, Node, NestJS and GraphQL behind, PostgreSQL and Redis underneath.',
      quote:
        'A strong product begins with a clean data model and an API you never have to apologise for.',
      detail:
        'I design schemas, contracts and components together so the whole stack moves as one: real-time features over WebSockets and tRPC, infrastructure on Docker and AWS, shipped through GitHub Actions.',
      skills: [skills.frontend, skills.backend, skills.data, skills.infra],
      art: { style: 'strata', palette: ['#0c1016', '#3d6df2', '#dfe8ff'] },
    },
    {
      id: 'motion',
      name: 'Motion & 3D',
      role: 'Creative Development:',
      bio: 'GSAP timelines, Lenis scroll and real-time 3D in Three.js with hand-written GLSL, tuned to hold the frame rate.',
      quote:
        'Motion is how an interface explains itself. If it does not help you understand, it does not ship.',
      detail:
        'From micro-interactions to WebGL scenes, I build motion systems that stay consistent across a product: shared easings, measured durations and shaders that degrade gracefully on low-end devices.',
      skills: [skills.motion, skills.realtime3d],
      art: { style: 'orbit', palette: ['#120c0a', '#e2582b', '#ffe6d6'] },
    },
  ] satisfies Discipline[],
} as const;

export const privacy = {
  updated: '2026-11-11',
  intro:
    'This portfolio is a static website. It has no accounts, no forms and no advertising, and it is built to collect as little as possible.',
  sections: [
    {
      heading: 'Data this site collects',
      body: [
        'None directly. The site sets no cookies and runs no analytics or tracking scripts. Fonts, scripts and images are served from the same origin as the pages.',
        'A flag is kept in your browser’s session storage so the intro animation plays only once per visit. It never leaves your device and is cleared when the tab closes.',
      ],
    },
    {
      heading: 'Hosting',
      body: [
        'The hosting provider may process technical data such as your IP address and user agent in server logs in order to deliver the site and keep it secure. That processing is governed by the provider’s own privacy policy.',
      ],
    },
    {
      heading: 'Contact and external links',
      body: [
        'If you write to the address shown on this site, your message and email address are used only to reply to you.',
        'Links to external services such as GitHub lead to sites with their own privacy practices.',
      ],
    },
  ] satisfies LegalSection[],
} as const;
