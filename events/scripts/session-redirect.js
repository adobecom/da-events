const SESSION_PARAM = 'session';
const SESSIONS_PATH = '/max/2026/sessions';
const SLUG_PATTERN = /^[a-z0-9-]+$/i;
const HOMEPAGE_PATTERN = /^(\/[a-z_]+)?\/max(\.html)?\/?$/i;
const LOOKUP_TIMEOUT_MS = 3000;

export function getSessionRedirectUrl(href) {
  const url = new URL(href);
  const slug = url.searchParams.get(SESSION_PARAM);
  const match = url.pathname.match(HOMEPAGE_PATTERN);
  if (!match || !slug || !SLUG_PATTERN.test(slug)) return null;
  url.searchParams.delete(SESSION_PARAM);
  const [, locale = '', ext = ''] = match;
  url.pathname = `${locale}${SESSIONS_PATH}/${slug}${ext}`;
  return url;
}

// Resolves true when a redirect was started, so callers can stop loading the page.
export default async function redirectLegacySessionModal(win = window) {
  const current = new URL(win.location.href);
  if (!current.searchParams.has(SESSION_PARAM) || !HOMEPAGE_PATTERN.test(current.pathname)) {
    return false;
  }

  const target = getSessionRedirectUrl(current.href);
  if (target) {
    try {
      const resp = await win.fetch(target.pathname, {
        method: 'HEAD',
        signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
      });
      if (resp.ok) {
        win.location.replace(target.href);
        return true;
      }
    } catch {
      // Lookup failed or timed out: stay on the homepage.
    }
  }

  current.searchParams.delete(SESSION_PARAM);
  win.history.replaceState(win.history.state, '', current.href);
  return false;
}
