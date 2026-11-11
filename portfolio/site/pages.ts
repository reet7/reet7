import { aboutPage } from './templates/about.ts';
import { homePage } from './templates/home.ts';
import { privacyPage } from './templates/legal.ts';
import type { Page } from './templates/page.ts';
import { workPages } from './templates/work.ts';

export const pages: readonly Page[] = [homePage, aboutPage, ...workPages, privacyPage];
