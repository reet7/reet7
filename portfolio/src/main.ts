import '@fontsource-variable/inter-tight';
import './styles/tokens.css';
import './styles/base.css';
import './styles/top.css';
import './styles/home.css';
import './styles/work.css';
import './styles/about.css';
import './styles/overlay.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initTransitions } from './core/transitions';
import { initContact } from './components/contact';
import { initHome } from './pages/home';
import { initWork } from './pages/work';
import { initAbout } from './pages/about';

gsap.registerPlugin(ScrollTrigger);

const pages: Record<string, () => { destroy(): void }> = {
  home: initHome,
  work: initWork,
  about: initAbout,
  privacy: initAbout,
};

initTransitions();
initContact();
(pages[document.body.dataset.page ?? ''] ?? initAbout)();
