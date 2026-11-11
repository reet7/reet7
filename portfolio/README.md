# REET — portfolio

Personal developer portfolio: a static, multi-page site built with Vite + TypeScript (vanilla), GSAP (ScrollTrigger, SplitText), Lenis and WebGL.

## Scripts

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + static build into dist/
npm run preview  # serve dist/
```

## Editing content

All copy, projects, skills and contact details live in `src/content/site.ts`.

- Projects: each entry has `slug`, `name`, `category`, `tags`, `summary`, `body`, links and a `palette`. Set `cover` to an image URL (e.g. a file in `public/`) to replace the generated abstract cover.
- Placeholder projects and the contact email are marked `TODO(owner)`.
- Pages (`index.html`, `about/`, `work/<slug>/`, `privacy/`) are generated from this module at build time by the plugin in `vite.config.ts`; do not edit the generated HTML files.

## Deploy (Vercel)

1. Import the repository in Vercel.
2. Select the branch `claude/osply-website-recreation-zxweb4` (or merge it first).
3. Root directory: `portfolio`. Framework preset: Vite. Build command `npm run build`, output `dist`.

The build uses a relative `base`, so `dist/` also works on Netlify or a GitHub Pages subpath.

## Fonts and licences

- UI text: Inter Tight (SIL Open Font License), self-hosted via Fontsource. It stands in for the commercial grotesk used by the design reference.
- The wordmark letters are original geometric SVG shapes drawn for this site.
