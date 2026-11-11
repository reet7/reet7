import { isIOS, media } from './env';

const TICK_MS = 8;

let switchLabel: HTMLLabelElement | null = null;

/**
 * iOS has no vibration API, but Safari 17.4+ plays a system haptic when a native
 * `<input type="checkbox" switch>` toggles. Clicking its label toggles it from script.
 */
function iosSwitch(): HTMLLabelElement {
  if (switchLabel) return switchLabel;
  const label = document.createElement('label');
  label.setAttribute('aria-hidden', 'true');
  label.style.cssText =
    'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  input.tabIndex = -1;
  label.append(input);
  document.body.append(label);
  switchLabel = label;
  return label;
}

/** A single light tap on touch devices: vibration on Android, the switch trick on iOS, nothing elsewhere. */
export function pulse(): void {
  if (!media.touch.matches) return;
  if (isIOS()) {
    iosSwitch().click();
  } else if (typeof navigator.vibrate === 'function' && navigator.userActivation.hasBeenActive) {
    navigator.vibrate(TICK_MS);
  }
}

export function destroyHaptics(): void {
  switchLabel?.remove();
  switchLabel = null;
}
