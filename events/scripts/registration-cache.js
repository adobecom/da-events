/*
 * Preloads and caches event registration status as early as possible,
 * independent of Milo's MEP - MEP only checks registration once its own
 * addon loading gets around to it, and the RainFocus call it depends on
 * takes >=1s minimum. For a high-traffic page we want the DOM to render
 * without waiting on that.
 *
 * This intentionally does NOT import or call MEP's own addon
 * (libs/features/mep/addons/event.js) - it mimics the same logic
 * independently, using the SAME localStorage cache key scheme MEP's addon
 * uses (mep-event:<eventCode>:<userId>, same TTLs). That way, when MEP's own
 * addon runs later as part of its normal flow, it reads the cache entry this
 * module already wrote and gets a cache hit instead of firing its own
 * RainFocus call - the two never call each other, but they still cooperate
 * through the shared cache.
 *
 * Kept as its own module (rather than inline in scripts.js) so the pure
 * cache-key/TTL logic is unit-testable without a live scripts.js bootstrap.
 */

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
    window.localStorage.setItem(cacheKey(eventCode, userId), JSON.stringify({
      isRegistered: !!data.isRegistered,
      inPersonAttendee: !!data.inPersonAttendee,
      exp: Date.now() + ttl,
    }));
  } catch {
    // storage unavailable (quota, private mode, sandboxed context) - non-fatal
  }
}

// Mirrors MEP's own redirect-cookie fast path: VEAL sets this cookie right
// after a successful registration redirect, so we can trust "registered"
// for the pre-render paint instead of waiting on a fresh RainFocus call.
const REDIRECT_COOKIE = (eventCode) => `feds_${eventCode}_registeredByRedirect`;

function justRegistered(eventCode) {
  return document.cookie
    .split('; ')
    .some((entry) => entry === `${REDIRECT_COOKIE(eventCode)}=true`);
}

function clearRegisteredFlag(eventCode) {
  // VEAL sets this cookie Domain=.adobe.com; a host-only delete won't clear it.
  document.cookie = `${REDIRECT_COOKIE(eventCode)}=; Max-Age=0; path=/; domain=.adobe.com`;
}

async function getUserId(isSignedOut) {
  // isSignedOut() reads a `sis` Server-Timing header set by the prod edge -
  // it's unconditionally "signed out" on preview/draft domains (.aem.page,
  // .aem.live) where that header is never set. Fall back to IMS's own
  // signed-in check so this is testable on preview domains too.
  // TEMPORARY for testing - revisit once isSignedInUser()'s readiness/race
  // behavior at this point in the load sequence is understood.
  if (isSignedOut() && !window.adobeIMS?.isSignedInUser()) return false;
  try {
    const { userId } = await window.adobeIMS.getProfile();
    return userId;
  } catch {
    return false;
  }
}

/**
 * Resolves registration status for `eventCode`, preferring the redirect-flag
 * signal, then the cache, then a live RainFocus fetch - writing through to
 * the cache on every path that determines a real result. loadIms() must
 * already have been kicked off (and ideally resolved) by the caller; this
 * assumes window.adobeIMS is ready by the time it needs a profile/token.
 */
export async function fetchRegistrationStatus(eventCode, { isSignedOut, getConfig }) {
  const userId = await getUserId(isSignedOut);
  if (!userId) return DEFAULT_RESULT;

  if (justRegistered(eventCode)) {
    clearRegisteredFlag(eventCode);
    const data = { isRegistered: true };
    writeCache(eventCode, userId, data);
    return data;
  }

  const cached = readCache(eventCode, userId);
  if (cached) return cached;

  const accessToken = window.adobeIMS.getAccessToken()?.token;
  if (!accessToken) return DEFAULT_RESULT;

  const domainSuffix = getConfig()?.env?.name === 'prod' ? '' : '.stage';
  const url = `https://www${domainSuffix}.adobe.com/events/api/rf-auth-seq-generic/${eventCode}?user_id=${encodeURIComponent(userId)}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'same-origin',
    });
    if (response.ok) {
      // RainFocus returns {} (not { isRegistered: false }) when not registered.
      const data = { isRegistered: false, ...(await response.json()) };
      writeCache(eventCode, userId, data);
      return data;
    }
    window.lana?.log(`Unable to fetch registration status: ${response.statusText}`, {
      tags: 'registration-cache-preload',
      severity: 'error',
    });
    return DEFAULT_RESULT;
  } catch (e) {
    window.lana?.log(`Unable to fetch registration status: ${e.toString()}`, {
      tags: 'registration-cache-preload',
      severity: 'error',
    });
    return DEFAULT_RESULT;
  }
}

/**
 * Fire-and-forget entry point for scripts.js: resolves registration status
 * for `eventCode` and dispatches 'registration:resolved' on window with the
 * result, so anything else on the page that wants it can listen rather than
 * reading the cache directly. Never throws - all failure paths already
 * resolve to DEFAULT_RESULT inside fetchRegistrationStatus.
 */
export async function preloadRegistrationStatus(eventCode, deps) {
  const result = await fetchRegistrationStatus(eventCode, deps);
  window.dispatchEvent(new CustomEvent('registration:resolved', { detail: result }));
  return result;
}
