// Preloads registration status independently of Milo's MEP, so the page
// doesn't block render on the RainFocus (RF) call. See
// docs/registration-status-consumer-guide.md for consumer-facing behavior.

const DEFAULT_RESULT = { isRegistered: false };
const TTL_REGISTERED_MS = 24 * 60 * 60 * 1000;
const TTL_UNREGISTERED_MS = 3 * 60 * 1000;

export const cacheKey = (eventCode, userId) => `mep-event:${eventCode}:${userId}`;

export function readCache(eventCode, userId) {
  try {
    const raw = window.localStorage.getItem(cacheKey(eventCode, userId));
    if (!raw) return null;
    const { isRegistered, inPersonAttendee, exp } = JSON.parse(raw);
    if (!exp || Date.now() > exp) return null;
    return { isRegistered, inPersonAttendee };
  } catch {
    return null;
  }
}

export function writeCache(eventCode, userId, data) {
  try {
    const ttl = data.isRegistered ? TTL_REGISTERED_MS : TTL_UNREGISTERED_MS;
    // inPersonAttendee stays unset (not defaulted false) when unknown, so we
    // never cache a guessed value.
    window.localStorage.setItem(cacheKey(eventCode, userId), JSON.stringify({
      isRegistered: !!data.isRegistered,
      inPersonAttendee: data.inPersonAttendee === undefined ? undefined : !!data.inPersonAttendee,
      exp: Date.now() + ttl,
    }));
  } catch {
    // storage unavailable - non-fatal
  }
}

// authToken/userKey are live RF credentials - kept in sessionStorage (tab
// lifetime only), not localStorage, so they never persist to disk.
export const authCacheKey = (eventCode, userId) => `mep-event-auth:${eventCode}:${userId}`;

export function readAuthCache(eventCode, userId) {
  try {
    const raw = window.sessionStorage.getItem(authCacheKey(eventCode, userId));
    if (!raw) return null;
    const { authToken, userKey, exp } = JSON.parse(raw);
    if (!exp || Date.now() > exp) return null;
    return { authToken, userKey };
  } catch {
    return null;
  }
}

export function writeAuthCache(eventCode, userId, data) {
  try {
    window.sessionStorage.setItem(authCacheKey(eventCode, userId), JSON.stringify({
      authToken: data.authToken,
      userKey: data.userKey,
      exp: Date.now() + TTL_REGISTERED_MS,
    }));
  } catch {
    // storage unavailable - non-fatal
  }
}

// VEAL sets this right after a successful registration redirect.
const REDIRECT_COOKIE = (eventCode) => `feds_${eventCode}_registeredByRedirect`;

function justRegistered(eventCode) {
  return document.cookie
    .split('; ')
    .some((entry) => entry === `${REDIRECT_COOKIE(eventCode)}=true`);
}

function clearRegisteredFlag(eventCode) {
  // Domain=.adobe.com matches how VEAL set it; a host-only delete won't clear it.
  document.cookie = `${REDIRECT_COOKIE(eventCode)}=; Max-Age=0; path=/; domain=.adobe.com`;
}

// Tells VEAL's post-reg-redirector-generic action which page to send the
// user back to after registering on RainFocus.
const ORIGIN_COOKIE_NAME = 'event-origin';
const ORIGIN_COOKIE_TTL_DAYS = 7;

export function setEventOriginCookie() {
  const expires = new Date();
  expires.setDate(expires.getDate() + ORIGIN_COOKIE_TTL_DAYS);
  document.cookie = [
    `${ORIGIN_COOKIE_NAME}=${encodeURIComponent(window.location.href)}`,
    `expires=${expires.toUTCString()}`,
    'domain=.adobe.com',
    'path=/',
    'secure',
  ].join('; ');
}

async function getUserId(isSignedOut, loadIms) {
  // isSignedOut() is unconditionally true on preview domains (no `sis`
  // Server-Timing header there) - fall back to IMS once it's loaded.
  if (isSignedOut()) {
    await loadIms().catch(() => {});
    if (!window.adobeIMS?.isSignedInUser()) return false;
  }
  try {
    const { userId } = await window.adobeIMS.getProfile();
    return userId;
  } catch {
    return false;
  }
}

// Fetches live status + auth from RF and writes authToken/userKey to
// sessionStorage. Never touches the localStorage status cache - callers
// decide whether/how to write that themselves.
async function fetchAndCacheAuth(eventCode, userId, getConfig) {
  const accessToken = window.adobeIMS.getAccessToken()?.token;
  if (!accessToken) return null;

  const domainSuffix = getConfig()?.env?.name === 'prod' ? '' : '.stage';
  const url = `https://www${domainSuffix}.adobe.com/events/api/rf-auth-seq-generic/${eventCode}?user_id=${encodeURIComponent(userId)}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'same-origin',
    });
    if (!response.ok) {
      window.lana?.log(`Unable to fetch registration status: ${response.statusText}`, {
        tags: 'registration-cache-preload',
        severity: 'error',
      });
      return null;
    }
    // RainFocus returns {} (not { isRegistered: false }) when not registered.
    const {
      authToken, userKey, ...status
    } = { isRegistered: false, ...(await response.json()) };
    writeAuthCache(eventCode, userId, { authToken, userKey });
    return { status, authToken, userKey };
  } catch (e) {
    window.lana?.log(`Unable to fetch registration status: ${e.toString()}`, {
      tags: 'registration-cache-preload',
      severity: 'error',
    });
    return null;
  }
}

export async function fetchRegistrationStatus(eventCode, { isSignedOut, getConfig, loadIms }) {
  const userId = await getUserId(isSignedOut, loadIms);
  if (!userId) return DEFAULT_RESULT;

  if (justRegistered(eventCode)) {
    clearRegisteredFlag(eventCode);
    const data = { isRegistered: true };
    writeCache(eventCode, userId, data);
    // Fire-and-forget: warm auth + patch in the real status once known,
    // without delaying this fast isRegistered:true return.
    fetchAndCacheAuth(eventCode, userId, getConfig)
      .then((auth) => { if (auth) writeCache(eventCode, userId, auth.status); })
      .catch(() => {});
    return data;
  }

  const cachedStatus = readCache(eventCode, userId);
  const cachedAuth = readAuthCache(eventCode, userId);
  if (cachedStatus && cachedAuth) return { ...cachedStatus, ...cachedAuth };

  const auth = await fetchAndCacheAuth(eventCode, userId, getConfig);
  if (!auth) return cachedStatus || DEFAULT_RESULT;

  writeCache(eventCode, userId, auth.status);

  return { ...auth.status, authToken: auth.authToken, userKey: auth.userKey };
}

export async function preloadRegistrationStatus(eventCode, deps) {
  const result = await fetchRegistrationStatus(eventCode, deps);
  const { isRegistered, inPersonAttendee } = result;
  // authToken/userKey deliberately excluded - this is a page-wide broadcast.
  window.dispatchEvent(new CustomEvent('registration:resolved', {
    detail: { isRegistered, inPersonAttendee },
  }));
  return result;
}

// Exposes resolved status/details on window.events for consumers (GNAV,
// sessionGuide, etc.) that may load after 'registration:resolved' already
// fired. Both getters share one memoized promise - only one RF call total.
export function exposeRegistrationStatus(eventCode, deps) {
  const detailsPromise = preloadRegistrationStatus(eventCode, deps)
    .catch(() => DEFAULT_RESULT);
  const statusPromise = detailsPromise
    .then(({ isRegistered, inPersonAttendee }) => ({ isRegistered, inPersonAttendee }));

  window.events = window.events || {};
  window.events.getRegistrationStatus = () => statusPromise; // gating flags only
  window.events.getRegistrationDetails = () => detailsPromise; // includes authToken/userKey
  return detailsPromise;
}
