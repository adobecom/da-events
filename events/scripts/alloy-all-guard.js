// TEMPORARY (MWPW-210049): remove once adobecom/federal stops replacing window.alloy_all.
//
// The universal nav ARP `tokenCallback` in federal's global navigation does
// `window.alloy_all = { ...window.alloy_all, data: { ... arp_token } }`. The spread copy keeps
// Launch's get()/set(), which still target the original object, so after the swap Launch writes
// (e.g. MobileRider media sessionDetails) land in an orphaned object while code that reads
// `alloy_all.data` directly (Launch's media tracker) sees the copy. Media tracking never starts.
//
// This guard detects exactly that pattern (a new object carrying the current object's own set()
// function) and merges it into the original object instead of replacing it, which is what Milo's
// global-navigation does. Every other assignment passes through untouched.

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function mergeInto(target, source, seen = new WeakSet()) {
  if (seen.has(source)) return;
  seen.add(source);
  Object.keys(source).forEach((key) => {
    const next = source[key];
    const current = target[key];
    if (next === current) return;
    if (isPlainObject(next) && isPlainObject(current)) mergeInto(current, next, seen);
    else target[key] = next;
  });
}

export function isSpreadCopy(next, current) {
  return isPlainObject(next)
    && isPlainObject(current)
    && next !== current
    && typeof current.set === 'function'
    && next.set === current.set;
}

export default function installAlloyAllGuard(win = window) {
  const descriptor = Object.getOwnPropertyDescriptor(win, 'alloy_all');
  // Leave non-configurable globals and any existing accessor (another guard/debugger) alone.
  if (descriptor && (!descriptor.configurable || descriptor.get || descriptor.set)) return false;

  let current = win.alloy_all;
  try {
    Object.defineProperty(win, 'alloy_all', {
      configurable: true,
      enumerable: true,
      get: () => current,
      set: (next) => {
        if (isSpreadCopy(next, current)) {
          mergeInto(current, next);
          return;
        }
        current = next;
      },
    });
  } catch (e) {
    return false;
  }
  return true;
}
