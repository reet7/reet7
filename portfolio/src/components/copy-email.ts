import { tick } from '../core/feedback';
import type { Scope } from '../core/lifecycle';

const CONFIRM_MS = 2000;

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** "Contact" buttons copy the email address and roll their label to a confirmation. */
export function initCopyEmail(scope: Scope): void {
  const status = document.createElement('p');
  status.className = 'sr-only';
  status.setAttribute('role', 'status');
  document.body.append(status);
  scope.add(() => {
    status.remove();
  });

  const timers = new Map<HTMLElement, number>();
  scope.add(() => {
    for (const timer of timers.values()) window.clearTimeout(timer);
  });

  scope.listen<MouseEvent>(document, 'click', (event) => {
    const button =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>('[data-copy-email]')
        : null;
    const email = button?.dataset.copyEmail;
    if (!button || !email) return;

    void copy(email).then((copied) => {
      if (!copied) {
        window.location.href = `mailto:${email}`;
        return;
      }
      tick();
      button.classList.add('is-rolled');
      status.textContent = 'Email address copied to clipboard.';
      window.clearTimeout(timers.get(button));
      timers.set(
        button,
        window.setTimeout(() => {
          button.classList.remove('is-rolled');
          status.textContent = '';
        }, CONFIRM_MS),
      );
    });
  });
}
