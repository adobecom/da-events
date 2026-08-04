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

// authToken/userKey are live RF credentials, not gating flags - unlike
// isRegistered/inPersonAttendee they deliberately do NOT go in localStorage,
// which would leave them sitting on disk for up to TTL_REGISTERED_MS (24h).
// sessionStorage scopes them to the current tab's lifetime instead. Same key
// scheme as cacheKey, but a separate storage area, so no collision.
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

async function getUserId(isSignedOut, loadIms) {
  // isSignedOut() reads a `sis` Server-Timing header set by the prod edge -
  // it's unconditionally "signed out" on preview/draft domains (.aem.page,
  // .aem.live) where that header is never set. Fall back to IMS's own
  // signed-in check so this is testable on preview domains too - but IMS
  // may not have loaded yet at this point, so wait for it (loadIms()
  // memoizes, so this reuses whatever load scripts.js already kicked off
  // rather than starting a second one) before trusting isSignedInUser().
  // TEMPORARY for testing - revisit once isSignedInUser()'s readiness/race
  // behavior at this point in the load sequence is understood.
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

/**
 * Resolves registration status for `eventCode`, preferring the redirect-flag
 * signal, then the cache, then a live RainFocus fetch - writing through to
 * the cache on every path that determines a real result. loadIms() must
 * already have been kicked off (and ideally resolved) by the caller; this
 * assumes window.adobeIMS is ready by the time it needs a profile/token.
 *
 * isRegistered/inPersonAttendee (the gating flags MEP/GNAV need) live in
 * localStorage and are shared across tabs. authToken/userKey (live RF
 * credentials) live in sessionStorage, scoped to the current tab. A new tab
 * inherits the localStorage entry but not the sessionStorage one, so it
 * still has to make one RF call to pick up its own authToken/userKey - but
 * that call intentionally does NOT rewrite the existing localStorage
 * entry/TTL, only sessionStorage.
 */
export async function fetchRegistrationStatus(eventCode, { isSignedOut, getConfig, loadIms }) {
  const userId = await getUserId(isSignedOut, loadIms);
  if (!userId) return DEFAULT_RESULT;

  if (justRegistered(eventCode)) {
    clearRegisteredFlag(eventCode);
    const data = { isRegistered: true };
    writeCache(eventCode, userId, data);
    return data;
  }

  const cachedStatus = readCache(eventCode, userId);
  const cachedAuth = readAuthCache(eventCode, userId);
  if (cachedStatus && cachedAuth) return { ...cachedStatus, ...cachedAuth };

  const accessToken = window.adobeIMS.getAccessToken()?.token;
  if (!accessToken) return cachedStatus || DEFAULT_RESULT;

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
      const {
        authToken, userKey, ...status
      } = { isRegistered: false, ...(await response.json()) };

      // A new tab arriving here already has a valid cachedStatus and only
      // needs authToken/userKey - don't reset the existing entry's TTL.
      if (!cachedStatus) writeCache(eventCode, userId, status);
      writeAuthCache(eventCode, userId, { authToken, userKey });

      return { ...status, authToken, userKey };
    }
    window.lana?.log(`Unable to fetch registration status: ${response.statusText}`, {
      tags: 'registration-cache-preload',
      severity: 'error',
    });
    return cachedStatus || DEFAULT_RESULT;
  } catch (e) {
    window.lana?.log(`Unable to fetch registration status: ${e.toString()}`, {
      tags: 'registration-cache-preload',
      severity: 'error',
    });
    return cachedStatus || DEFAULT_RESULT;
  }
}

/**
 * Fire-and-forget entry point for scripts.js: resolves registration status
 * for `eventCode` and dispatches 'registration:resolved' on window with the
 * result, so anything else on the page that wants it can listen rather than
 * reading the cache directly. Never throws - all failure paths already
 * resolve to DEFAULT_RESULT inside fetchRegistrationStatus.
 *
 * Only the gating flags (isRegistered/inPersonAttendee) go out on the event -
 * it's a page-wide broadcast any script can listen to, so authToken/userKey
 * are deliberately left out. Code that legitimately needs the live RF
 * credentials should read them directly via readAuthCache instead.
 */
export async function preloadRegistrationStatus(eventCode, deps) {
  const result = await fetchRegistrationStatus(eventCode, deps);
  const { isRegistered, inPersonAttendee } = result;
  window.dispatchEvent(new CustomEvent('registration:resolved', {
    detail: { isRegistered, inPersonAttendee },
  }));
  return result;
}

/**
 * Exposes registration status/details on window.events, for consumers (e.g.
 * GNAV, sessionGuide) that may not have loaded yet by the time
 * 'registration:resolved' fires and so can't rely on the event alone. Both
 * getters share the SAME memoized promise underneath - only one RF call
 * happens no matter how many consumers call either one, and callers that
 * arrive after resolution get an already-resolved promise instantly.
 *
 * Neither getter resolves any faster than fetchRegistrationStatus itself: if
 * the cache wasn't already fully warm, awaiting either one blocks on the live
 * RF fetch (no timeout there today), not just "whatever's cached so far".
 *
 * - getRegistrationStatus(): isRegistered/inPersonAttendee only. This is the
 *   same shape broadcast on 'registration:resolved', for passive/broad
 *   consumption.
 * - getRegistrationDetails(): full result including authToken/userKey, for
 *   consumers that explicitly need to make their own RF-authenticated calls
 *   (e.g. sessionGuide checking favorite status). Deliberately a separate,
 *   explicit pull rather than folded into the broadcast event/getter above -
 *   an event pushes data to every listener on the page whether they asked
 *   for it or not, while this requires an explicit call.
 */
export function exposeRegistrationStatus(eventCode, deps) {
  const detailsPromise = preloadRegistrationStatus(eventCode, deps)
    .catch(() => DEFAULT_RESULT);
  const statusPromise = detailsPromise
    .then(({ isRegistered, inPersonAttendee }) => ({ isRegistered, inPersonAttendee }));

  window.events = window.events || {};
  window.events.getRegistrationStatus = () => statusPromise;
  window.events.getRegistrationDetails = () => detailsPromise;
  return detailsPromise;
}
