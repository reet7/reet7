type Strength = 'light' | 'medium';

const patterns: Record<Strength, number[]> = { light: [8], medium: [14] };
let iosSwitch: HTMLLabelElement | null = null;

function isIOS(): boolean {
  return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// iOS Safari 17.4+ plays a system haptic when a native switch toggles; clicking its label triggers it programmatically.
function ensureIosSwitch(): HTMLLabelElement {
  if (iosSwitch) return iosSwitch;
  const label = document.createElement('label');
  label.setAttribute('aria-hidden', 'true');
  label.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden;left:-9px;top:-9px';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  input.tabIndex = -1;
  label.append(input);
  document.body.append(label);
  iosSwitch = label;
  return label;
}

export function haptic(strength: Strength = 'light'): void {
  if (!window.matchMedia('(pointer: coarse)').matches) return;
  if (typeof navigator.vibrate === 'function' && !isIOS()) {
    navigator.vibrate(patterns[strength]);
    return;
  }
  if (isIOS()) ensureIosSwitch().click();
}
