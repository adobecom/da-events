const SESSION_PARAM = 'session';
const SESSIONS_PATH = '/max/2026/sessions';
const SLUG_PATTERN = /^[a-z0-9-]+$/i;
const HOMEPAGE_PATTERN = /^(\/[a-z_]+)?\/max(?:\.html)?\/?$/i;

// EDS hosts serve extensionless paths; only the Akamai domains (adobe.com) use .html.
const isEdsHost = (hostname) => /\.(aem|hlx)\.(page|live)$|^localhost$/.test(hostname);

export function getSessionRedirectUrl(href) {
  const url = new URL(href);
  const slug = url.searchParams.get(SESSION_PARAM);
  const match = url.pathname.match(HOMEPAGE_PATTERN);
  if (!match || !slug || !SLUG_PATTERN.test(slug)) return null;
  url.searchParams.delete(SESSION_PARAM);
  const ext = isEdsHost(url.hostname) ? '' : '.html';
  url.pathname = `${match[1] || ''}${SESSIONS_PATH}/${slug}${ext}`;
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
      const resp = await win.fetch(target.pathname, { method: 'HEAD' });
      if (resp.ok) {
        win.location.replace(target.href);
        return true;
      }
    } catch {
      // Unknown session: fall through to the homepage.
    }
  }

  current.searchParams.delete(SESSION_PARAM);
  win.history.replaceState(win.history.state, '', current.href);
  return false;
}
