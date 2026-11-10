import { expect } from '@esm-bundle/chai';
import redirectLegacySessionModal, { getSessionRedirectUrl } from '../../../events/scripts/session-redirect.js';

const SLUG = 'design-leadership-three-ways-to-increase-your-impa-os704';

function createWin(href, { ok = true, reject = false } = {}) {
  const calls = { replace: [], replaceState: [], fetch: [] };
  const win = {
    location: { href, replace: (url) => calls.replace.push(url) },
    history: { state: null, replaceState: (state, title, url) => calls.replaceState.push(url) },
    fetch: async (url, opts) => {
      calls.fetch.push({ url, opts });
      if (reject) throw new Error('network');
      return { ok };
    },
  };
  return { win, calls };
}

describe('session-redirect', () => {
  describe('getSessionRedirectUrl', () => {
    it('maps the homepage modal URL to the session page', () => {
      const url = getSessionRedirectUrl(`https://www.adobe.com/max.html?session=${SLUG}`);
      expect(url.href).to.equal(`https://www.adobe.com/max/2026/sessions/${SLUG}.html`);
    });

    it('preserves locale and other params', () => {
      const url = getSessionRedirectUrl(`https://www.adobe.com/de/max.html?utm_source=x&session=${SLUG}&utm_medium=y#top`);
      expect(url.href).to.equal(`https://www.adobe.com/de/max/2026/sessions/${SLUG}.html?utm_source=x&utm_medium=y#top`);
    });

    it('returns null for non-homepage paths', () => {
      expect(getSessionRedirectUrl(`https://www.adobe.com/max/2026/agenda.html?session=${SLUG}`)).to.be.null;
    });

    it('returns null for missing or malformed slugs', () => {
      expect(getSessionRedirectUrl('https://www.adobe.com/max.html')).to.be.null;
      expect(getSessionRedirectUrl('https://www.adobe.com/max.html?session=../evil')).to.be.null;
      expect(getSessionRedirectUrl('https://www.adobe.com/max.html?session=')).to.be.null;
    });
  });

  describe('redirectLegacySessionModal', () => {
    it('replaces location when the session page exists', async () => {
      const { win, calls } = createWin(`https://www.adobe.com/max.html?session=${SLUG}&utm_campaign=c`);
      const result = await redirectLegacySessionModal(win);
      expect(result).to.be.true;
      expect(calls.fetch[0]).to.deep.equal({ url: `/max/2026/sessions/${SLUG}.html`, opts: { method: 'HEAD' } });
      expect(calls.replace).to.deep.equal([`https://www.adobe.com/max/2026/sessions/${SLUG}.html?utm_campaign=c`]);
    });

    it('strips the param and stays on the homepage for an unknown session', async () => {
      const { win, calls } = createWin(`https://www.adobe.com/max.html?session=${SLUG}&utm_campaign=c`, { ok: false });
      const result = await redirectLegacySessionModal(win);
      expect(result).to.be.false;
      expect(calls.replace).to.be.empty;
      expect(calls.replaceState).to.deep.equal(['https://www.adobe.com/max.html?utm_campaign=c']);
    });

    it('strips the param when the lookup fails', async () => {
      const { win, calls } = createWin(`https://www.adobe.com/max.html?session=${SLUG}`, { reject: true });
      expect(await redirectLegacySessionModal(win)).to.be.false;
      expect(calls.replaceState).to.deep.equal(['https://www.adobe.com/max.html']);
    });

    it('strips a malformed param without fetching', async () => {
      const { win, calls } = createWin('https://www.adobe.com/max.html?session=%3Cscript%3E');
      expect(await redirectLegacySessionModal(win)).to.be.false;
      expect(calls.fetch).to.be.empty;
      expect(calls.replaceState).to.deep.equal(['https://www.adobe.com/max.html']);
    });

    it('does nothing without the param or off the homepage', async () => {
      const a = createWin('https://www.adobe.com/max.html?utm_source=x');
      const b = createWin(`https://www.adobe.com/events/other.html?session=${SLUG}`);
      expect(await redirectLegacySessionModal(a.win)).to.be.false;
      expect(await redirectLegacySessionModal(b.win)).to.be.false;
      expect(a.calls.replaceState).to.be.empty;
      expect(b.calls.replaceState).to.be.empty;
      expect(b.calls.fetch).to.be.empty;
    });
  });
});
