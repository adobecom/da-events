import { expect } from '@esm-bundle/chai';
import {
  cacheKey,
  readCache,
  writeCache,
  authCacheKey,
  readAuthCache,
  writeAuthCache,
  fetchRegistrationStatus,
  preloadRegistrationStatus,
  exposeRegistrationStatus,
} from '../../../events/scripts/registration-cache.js';

const EVENT_CODE = 'max2025';
const USER_ID = 'user-123';

const setCookie = (str) => { document.cookie = str; };
const clearCookie = (name) => { document.cookie = `${name}=; Max-Age=0; path=/;`; };

describe('registration-cache', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    delete window.adobeIMS;
    delete window.events;
  });
  afterEach(() => {
    clearCookie(`feds_${EVENT_CODE}_registeredByRedirect`);
  });

  describe('cache key + TTL (localStorage: isRegistered/inPersonAttendee)', () => {
    it('keys the cache by event code and user id', () => {
      expect(cacheKey(EVENT_CODE, USER_ID)).to.equal(`mep-event:${EVENT_CODE}:${USER_ID}`);
    });

    it('round-trips a registered result', () => {
      writeCache(EVENT_CODE, USER_ID, { isRegistered: true, inPersonAttendee: true });
      expect(readCache(EVENT_CODE, USER_ID)).to.deep.equal({
        isRegistered: true,
        inPersonAttendee: true,
      });
    });

    it('returns null when nothing is cached', () => {
      expect(readCache(EVENT_CODE, USER_ID)).to.equal(null);
    });

    it('returns null once the cached entry has expired', () => {
      const key = cacheKey(EVENT_CODE, USER_ID);
      localStorage.setItem(key, JSON.stringify({
        isRegistered: true,
        inPersonAttendee: false,
        exp: Date.now() - 1000,
      }));
      expect(readCache(EVENT_CODE, USER_ID)).to.equal(null);
    });

    it('does not throw when localStorage is unavailable', () => {
      const original = window.localStorage.setItem;
      window.localStorage.setItem = () => { throw new Error('quota exceeded'); };
      expect(() => writeCache(EVENT_CODE, USER_ID, { isRegistered: true })).to.not.throw();
      window.localStorage.setItem = original;
    });
  });

  describe('auth cache (sessionStorage: authToken/userKey)', () => {
    it('keys the auth cache separately from the status cache', () => {
      expect(authCacheKey(EVENT_CODE, USER_ID)).to.equal(`mep-event-auth:${EVENT_CODE}:${USER_ID}`);
      expect(authCacheKey(EVENT_CODE, USER_ID)).to.not.equal(cacheKey(EVENT_CODE, USER_ID));
    });

    it('round-trips authToken/userKey via sessionStorage, not localStorage', () => {
      writeAuthCache(EVENT_CODE, USER_ID, { authToken: 'tok-1', userKey: 'key-1' });
      expect(readAuthCache(EVENT_CODE, USER_ID)).to.deep.equal({
        authToken: 'tok-1',
        userKey: 'key-1',
      });
      expect(localStorage.getItem(authCacheKey(EVENT_CODE, USER_ID))).to.equal(null);
    });

    it('returns null once the auth cache entry has expired', () => {
      sessionStorage.setItem(authCacheKey(EVENT_CODE, USER_ID), JSON.stringify({
        authToken: 'tok-1',
        userKey: 'key-1',
        exp: Date.now() - 1000,
      }));
      expect(readAuthCache(EVENT_CODE, USER_ID)).to.equal(null);
    });

    it('does not throw when sessionStorage is unavailable', () => {
      const original = window.sessionStorage.setItem;
      window.sessionStorage.setItem = () => { throw new Error('quota exceeded'); };
      expect(() => writeAuthCache(EVENT_CODE, USER_ID, { authToken: 'x', userKey: 'y' }))
        .to.not.throw();
      window.sessionStorage.setItem = original;
    });
  });

  describe('fetchRegistrationStatus', () => {
    const deps = {
      isSignedOut: () => false,
      getConfig: () => ({ env: { name: 'stage' } }),
      loadIms: async () => {},
    };

    it('returns not-registered without calling the API when signed out', async () => {
      window.fetch = () => { throw new Error('fetch should not be called'); };
      const signedOutDeps = { ...deps, isSignedOut: () => true };
      const result = await fetchRegistrationStatus(EVENT_CODE, signedOutDeps);
      expect(result).to.deep.equal({ isRegistered: false });
    });

    it('waits for loadIms() then trusts isSignedInUser() when the sis header says signed out (preview domains)', async () => {
      window.adobeIMS = {
        getProfile: async () => ({ userId: USER_ID }),
        getAccessToken: () => ({ token: 'abc' }),
        isSignedInUser: () => true,
      };
      window.fetch = async () => ({ ok: true, json: async () => ({ isRegistered: true }) });

      let loadImsCalled = false;
      const previewDeps = {
        ...deps,
        isSignedOut: () => true,
        loadIms: async () => { loadImsCalled = true; },
      };
      const result = await fetchRegistrationStatus(EVENT_CODE, previewDeps);
      expect(loadImsCalled).to.equal(true);
      expect(result.isRegistered).to.equal(true);
    });

    it('trusts the redirect cookie without calling the API, and caches it', async () => {
      window.adobeIMS = { getProfile: async () => ({ userId: USER_ID }) };
      setCookie(`feds_${EVENT_CODE}_registeredByRedirect=true`);
      window.fetch = () => { throw new Error('fetch should not be called'); };

      const result = await fetchRegistrationStatus(EVENT_CODE, deps);
      expect(result.isRegistered).to.equal(true);
      expect(readCache(EVENT_CODE, USER_ID).isRegistered).to.equal(true);
    });

    // clearRegisteredFlag sets Domain=.adobe.com, matching VEAL's own cookie -
    // browsers reject setting that domain from a non-adobe.com host (like the
    // localhost this test runs on), so the actual clear can't be verified
    // here. Real-domain verification needs a live .adobe.com page.

    it('serves a cached result without calling the API when both status and auth are cached', async () => {
      window.adobeIMS = {
        getProfile: async () => ({ userId: USER_ID }),
        getAccessToken: () => ({ token: 'abc' }),
      };
      writeCache(EVENT_CODE, USER_ID, { isRegistered: true, inPersonAttendee: true });
      writeAuthCache(EVENT_CODE, USER_ID, { authToken: 'tok-1', userKey: 'key-1' });
      window.fetch = () => { throw new Error('fetch should not be called'); };

      const result = await fetchRegistrationStatus(EVENT_CODE, deps);
      expect(result).to.deep.equal({
        isRegistered: true,
        inPersonAttendee: true,
        authToken: 'tok-1',
        userKey: 'key-1',
      });
    });

    it('a new tab (status cached, auth not cached) still fetches for authToken/userKey without rewriting the localStorage entry', async () => {
      window.adobeIMS = {
        getProfile: async () => ({ userId: USER_ID }),
        getAccessToken: () => ({ token: 'abc' }),
      };
      writeCache(EVENT_CODE, USER_ID, { isRegistered: true, inPersonAttendee: true });

      let fetchCalled = false;
      window.fetch = async () => {
        fetchCalled = true;
        return {
          ok: true,
          json: async () => ({ isRegistered: true, inPersonAttendee: true, authToken: 'tok-2', userKey: 'key-2' }),
        };
      };

      const setItemCalls = [];
      const originalSetItem = window.localStorage.setItem.bind(window.localStorage);
      window.localStorage.setItem = (...args) => { setItemCalls.push(args); return originalSetItem(...args); };

      const result = await fetchRegistrationStatus(EVENT_CODE, deps);

      window.localStorage.setItem = originalSetItem;

      expect(fetchCalled).to.equal(true);
      expect(setItemCalls.length).to.equal(0);
      expect(result).to.deep.equal({
        isRegistered: true,
        inPersonAttendee: true,
        authToken: 'tok-2',
        userKey: 'key-2',
      });
      expect(readAuthCache(EVENT_CODE, USER_ID)).to.deep.equal({
        authToken: 'tok-2',
        userKey: 'key-2',
      });
    });

    it('fetches from RainFocus on a cache miss and caches the status and auth data separately', async () => {
      window.adobeIMS = {
        getProfile: async () => ({ userId: USER_ID }),
        getAccessToken: () => ({ token: 'abc' }),
      };
      const apiResponse = {
        isRegistered: true, inPersonAttendee: false, authToken: 'tok-3', userKey: 'key-3',
      };
      window.fetch = async () => ({ ok: true, json: async () => apiResponse });

      const result = await fetchRegistrationStatus(EVENT_CODE, deps);
      expect(result).to.deep.equal({
        isRegistered: true, inPersonAttendee: false, authToken: 'tok-3', userKey: 'key-3',
      });
      expect(readCache(EVENT_CODE, USER_ID)).to.deep.equal({
        isRegistered: true,
        inPersonAttendee: false,
      });
      expect(readAuthCache(EVENT_CODE, USER_ID)).to.deep.equal({
        authToken: 'tok-3',
        userKey: 'key-3',
      });
    });

    it('normalizes an empty RainFocus response to not-registered', async () => {
      window.adobeIMS = {
        getProfile: async () => ({ userId: USER_ID }),
        getAccessToken: () => ({ token: 'abc' }),
      };
      window.fetch = async () => ({ ok: true, json: async () => ({}) });

      const result = await fetchRegistrationStatus(EVENT_CODE, deps);
      expect(result.isRegistered).to.equal(false);
    });

    it('returns not-registered without calling the API when there is no access token', async () => {
      window.adobeIMS = {
        getProfile: async () => ({ userId: USER_ID }),
        getAccessToken: () => undefined,
      };
      window.fetch = () => { throw new Error('fetch should not be called'); };

      const result = await fetchRegistrationStatus(EVENT_CODE, deps);
      expect(result).to.deep.equal({ isRegistered: false });
    });
  });

  describe('preloadRegistrationStatus', () => {
    it('dispatches registration:resolved with only the gating flags, excluding authToken/userKey', async () => {
      window.adobeIMS = {
        getProfile: async () => ({ userId: USER_ID }),
        getAccessToken: () => ({ token: 'abc' }),
      };
      window.fetch = async () => ({
        ok: true,
        json: async () => ({ isRegistered: true, authToken: 'tok-4', userKey: 'key-4' }),
      });

      const received = new Promise((resolve) => {
        window.addEventListener('registration:resolved', (e) => resolve(e.detail), { once: true });
      });

      const deps = {
        isSignedOut: () => false,
        getConfig: () => ({ env: { name: 'stage' } }),
        loadIms: async () => {},
      };
      const [result, eventDetail] = await Promise.all([
        preloadRegistrationStatus(EVENT_CODE, deps),
        received,
      ]);
      expect(result.isRegistered).to.equal(true);
      expect(result.authToken).to.equal('tok-4');
      expect(eventDetail).to.deep.equal({ isRegistered: true, inPersonAttendee: undefined });
    });
  });

  describe('exposeRegistrationStatus', () => {
    const deps = {
      isSignedOut: () => false,
      getConfig: () => ({ env: { name: 'stage' } }),
      loadIms: async () => {},
    };

    it('exposes window.events.getRegistrationStatus, resolving to the gating flags only', async () => {
      window.adobeIMS = {
        getProfile: async () => ({ userId: USER_ID }),
        getAccessToken: () => ({ token: 'abc' }),
      };
      window.fetch = async () => ({
        ok: true,
        json: async () => ({ isRegistered: true, authToken: 'tok-5', userKey: 'key-5' }),
      });

      exposeRegistrationStatus(EVENT_CODE, deps);
      expect(window.events.getRegistrationStatus).to.be.a('function');

      const result = await window.events.getRegistrationStatus();
      expect(result).to.deep.equal({ isRegistered: true, inPersonAttendee: undefined });
    });

    it('exposes window.events.getRegistrationDetails, resolving to the full data including authToken/userKey', async () => {
      window.adobeIMS = {
        getProfile: async () => ({ userId: USER_ID }),
        getAccessToken: () => ({ token: 'abc' }),
      };
      window.fetch = async () => ({
        ok: true,
        json: async () => ({
          isRegistered: true, inPersonAttendee: true, authToken: 'tok-5', userKey: 'key-5',
        }),
      });

      exposeRegistrationStatus(EVENT_CODE, deps);
      expect(window.events.getRegistrationDetails).to.be.a('function');

      const details = await window.events.getRegistrationDetails();
      expect(details).to.deep.equal({
        isRegistered: true, inPersonAttendee: true, authToken: 'tok-5', userKey: 'key-5',
      });
    });

    it('memoizes: a late caller after resolution gets the same promise without triggering another fetch', async () => {
      window.adobeIMS = {
        getProfile: async () => ({ userId: USER_ID }),
        getAccessToken: () => ({ token: 'abc' }),
      };
      let fetchCount = 0;
      window.fetch = async () => {
        fetchCount += 1;
        return { ok: true, json: async () => ({ isRegistered: true }) };
      };

      exposeRegistrationStatus(EVENT_CODE, deps);
      await window.events.getRegistrationStatus();

      // Simulate a consumer (e.g. GNAV) loading late, after resolution.
      const lateResult = await window.events.getRegistrationStatus();
      expect(lateResult).to.deep.equal({ isRegistered: true, inPersonAttendee: undefined });
      expect(fetchCount).to.equal(1);
    });

    it('getRegistrationStatus and getRegistrationDetails share the same underlying fetch', async () => {
      window.adobeIMS = {
        getProfile: async () => ({ userId: USER_ID }),
        getAccessToken: () => ({ token: 'abc' }),
      };
      let fetchCount = 0;
      window.fetch = async () => {
        fetchCount += 1;
        return {
          ok: true,
          json: async () => ({
            isRegistered: true, inPersonAttendee: true, authToken: 'tok-6', userKey: 'key-6',
          }),
        };
      };

      exposeRegistrationStatus(EVENT_CODE, deps);
      const [status, details] = await Promise.all([
        window.events.getRegistrationStatus(),
        window.events.getRegistrationDetails(),
      ]);
      expect(fetchCount).to.equal(1);
      expect(status).to.deep.equal({ isRegistered: true, inPersonAttendee: true });
      expect(details).to.deep.equal({
        isRegistered: true, inPersonAttendee: true, authToken: 'tok-6', userKey: 'key-6',
      });
    });
  });
});
