import { expect } from '@esm-bundle/chai';
import {
  cacheKey,
  readCache,
  writeCache,
  fetchRegistrationStatus,
  preloadRegistrationStatus,
} from '../../../events/scripts/registration-cache.js';

const EVENT_CODE = 'max2025';
const USER_ID = 'user-123';

const setCookie = (str) => { document.cookie = str; };
const clearCookie = (name) => { document.cookie = `${name}=; Max-Age=0; path=/;`; };

describe('registration-cache', () => {
  beforeEach(() => {
    localStorage.clear();
    delete window.adobeIMS;
  });
  afterEach(() => {
    clearCookie(`feds_${EVENT_CODE}_registeredByRedirect`);
  });

  describe('cache key + TTL', () => {
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

    it('serves a cached result without calling the API', async () => {
      window.adobeIMS = {
        getProfile: async () => ({ userId: USER_ID }),
        getAccessToken: () => ({ token: 'abc' }),
      };
      writeCache(EVENT_CODE, USER_ID, { isRegistered: true, inPersonAttendee: true });
      window.fetch = () => { throw new Error('fetch should not be called'); };

      const result = await fetchRegistrationStatus(EVENT_CODE, deps);
      expect(result).to.deep.equal({ isRegistered: true, inPersonAttendee: true });
    });

    it('fetches from RainFocus on a cache miss and caches the response', async () => {
      window.adobeIMS = {
        getProfile: async () => ({ userId: USER_ID }),
        getAccessToken: () => ({ token: 'abc' }),
      };
      const apiResponse = { isRegistered: true, inPersonAttendee: false };
      window.fetch = async () => ({ ok: true, json: async () => apiResponse });

      const result = await fetchRegistrationStatus(EVENT_CODE, deps);
      expect(result).to.deep.equal({ isRegistered: true, inPersonAttendee: false });
      expect(readCache(EVENT_CODE, USER_ID)).to.deep.equal({
        isRegistered: true,
        inPersonAttendee: false,
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
    it('dispatches registration:resolved with the result', async () => {
      window.adobeIMS = {
        getProfile: async () => ({ userId: USER_ID }),
        getAccessToken: () => ({ token: 'abc' }),
      };
      window.fetch = async () => ({ ok: true, json: async () => ({ isRegistered: true }) });

      const received = new Promise((resolve) => {
        window.addEventListener('registration:resolved', (e) => resolve(e.detail), { once: true });
      });

      const deps = {
        isSignedOut: () => false,
        getConfig: () => ({ env: { name: 'stage' } }),
      };
      const [result, eventDetail] = await Promise.all([
        preloadRegistrationStatus(EVENT_CODE, deps),
        received,
      ]);
      expect(eventDetail).to.deep.equal(result);
      expect(result.isRegistered).to.equal(true);
    });
  });
});
