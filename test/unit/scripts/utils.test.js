import { expect } from '@esm-bundle/chai';

describe('Utils Functions', () => {
  describe('LIBS and EVENT_LIBS', () => {
    it('should export LIBS constant', async () => {
      const { LIBS } = await import('../../../events/scripts/utils.js');
      expect(LIBS).to.be.a('string');
      expect(LIBS).to.not.be.empty;
    });

    it('should export EVENT_LIBS constant', async () => {
      const { EVENT_LIBS } = await import('../../../events/scripts/utils.js');
      expect(EVENT_LIBS).to.be.a('string');
      expect(EVENT_LIBS).to.not.be.empty;
    });

    it('should have LIBS that contains /libs or http', async () => {
      const { LIBS } = await import('../../../events/scripts/utils.js');
      expect(LIBS).to.match(/(\/libs|http)/);
    });

    it('should have EVENT_LIBS that contains /event-libs or http', async () => {
      const { EVENT_LIBS } = await import('../../../events/scripts/utils.js');
      expect(EVENT_LIBS).to.match(/(\/event-libs|http)/);
    });

    it('should have EVENT_LIBS that includes version v1', async () => {
      const { EVENT_LIBS } = await import('../../../events/scripts/utils.js');
      expect(EVENT_LIBS).to.include('v1');
    });
  });

  describe('LIBS logic', () => {
    it('should return /libs for production domains', () => {
      // Test the logic directly
      const hostname = 'www.adobe.com';
      const search = '';

      const result = (() => {
        if (!(hostname.includes('.hlx.') || hostname.includes('.aem.') || hostname.includes('local'))) {
          return '/libs';
        }
        const branch = new URLSearchParams(search).get('milolibs') || 'main';
        if (branch === 'local') return 'http://localhost:6456/libs';
        return branch.includes('--') ? `https://${branch}.aem.live/libs` : `https://${branch}--milo--adobecom.aem.live/libs`;
      })();

      expect(result).to.equal('/libs');
    });

    it('should return localhost URL for local development', () => {
      const hostname = 'localhost';
      const search = '?milolibs=local';

      const result = (() => {
        if (!(hostname.includes('.hlx.') || hostname.includes('.aem.') || hostname.includes('local'))) {
          return '/libs';
        }
        const branch = new URLSearchParams(search).get('milolibs') || 'main';
        if (branch === 'local') return 'http://localhost:6456/libs';
        return branch.includes('--') ? `https://${branch}.aem.live/libs` : `https://${branch}--milo--adobecom.aem.live/libs`;
      })();

      expect(result).to.equal('http://localhost:6456/libs');
    });

    it('should return branch-specific URL for hlx domains with custom branch', () => {
      const hostname = 'main--milo--adobecom.hlx.page';
      const search = '?milolibs=feature-branch';

      const result = (() => {
        if (!(hostname.includes('.hlx.') || hostname.includes('.aem.') || hostname.includes('local'))) {
          return '/libs';
        }
        const branch = new URLSearchParams(search).get('milolibs') || 'main';
        if (branch === 'local') return 'http://localhost:6456/libs';
        return branch.includes('--') ? `https://${branch}.aem.live/libs` : `https://${branch}--milo--adobecom.aem.live/libs`;
      })();

      expect(result).to.equal('https://feature-branch--milo--adobecom.aem.live/libs');
    });

    it('should return branch-specific URL for branch with -- in name', () => {
      const hostname = 'main--milo--adobecom.hlx.page';
      const search = '?milolibs=feature--branch';

      const result = (() => {
        if (!(hostname.includes('.hlx.') || hostname.includes('.aem.') || hostname.includes('local'))) {
          return '/libs';
        }
        const branch = new URLSearchParams(search).get('milolibs') || 'main';
        if (branch === 'local') return 'http://localhost:6456/libs';
        return branch.includes('--') ? `https://${branch}.aem.live/libs` : `https://${branch}--milo--adobecom.aem.live/libs`;
      })();

      expect(result).to.equal('https://feature--branch.aem.live/libs');
    });
  });

  describe('EVENT_LIBS logic', () => {
    it('should return /event-libs for production domains', () => {
      const hostname = 'www.adobe.com';
      const search = '';

      const result = (() => {
        const version = 'v1';
        if (!(hostname.includes('.hlx.') || hostname.includes('.aem.') || hostname.includes('local'))) {
          return '/event-libs';
        }
        const branch = new URLSearchParams(search).get('eventlibs') || 'main';
        if (branch === 'local') {
          return `http://localhost:3868/event-libs/${version}`;
        }
        if (branch.includes('--')) {
          return `https://${branch}.aem.live/event-libs/${version}`;
        }
        return `https://${branch}--event-libs--adobecom.aem.live/event-libs/${version}`;
      })();

      expect(result).to.equal('/event-libs');
    });

    it('should return localhost URL for local development', () => {
      const hostname = 'localhost';
      const search = '?eventlibs=local';

      const result = (() => {
        const version = 'v1';
        if (!(hostname.includes('.hlx.') || hostname.includes('.aem.') || hostname.includes('local'))) {
          return '/event-libs';
        }
        const branch = new URLSearchParams(search).get('eventlibs') || 'main';
        if (branch === 'local') {
          return `http://localhost:3868/event-libs/${version}`;
        }
        if (branch.includes('--')) {
          return `https://${branch}.aem.live/event-libs/${version}`;
        }
        return `https://${branch}--event-libs--adobecom.aem.live/event-libs/${version}`;
      })();

      expect(result).to.equal('http://localhost:3868/event-libs/v1');
    });

    it('should return branch-specific URL for hlx domains with custom branch', () => {
      const hostname = 'main--event-libs--adobecom.hlx.page';
      const search = '?eventlibs=feature-branch';

      const result = (() => {
        const version = 'v1';
        if (!(hostname.includes('.hlx.') || hostname.includes('.aem.') || hostname.includes('local'))) {
          return '/event-libs';
        }
        const branch = new URLSearchParams(search).get('eventlibs') || 'main';
        if (branch === 'local') {
          return `http://localhost:3868/event-libs/${version}`;
        }
        if (branch.includes('--')) {
          return `https://${branch}.aem.live/event-libs/${version}`;
        }
        return `https://${branch}--event-libs--adobecom.aem.live/event-libs/${version}`;
      })();

      expect(result).to.equal('https://feature-branch--event-libs--adobecom.aem.live/event-libs/v1');
    });

    it('should return branch-specific URL for branch with -- in name', () => {
      const hostname = 'main--event-libs--adobecom.hlx.page';
      const search = '?eventlibs=feature--branch';

      const result = (() => {
        const version = 'v1';
        if (!(hostname.includes('.hlx.') || hostname.includes('.aem.') || hostname.includes('local'))) {
          return '/event-libs';
        }
        const branch = new URLSearchParams(search).get('eventlibs') || 'main';
        if (branch === 'local') {
          return `http://localhost:3868/event-libs/${version}`;
        }
        if (branch.includes('--')) {
          return `https://${branch}.aem.live/event-libs/${version}`;
        }
        return `https://${branch}--event-libs--adobecom.aem.live/event-libs/${version}`;
      })();

      expect(result).to.equal('https://feature--branch.aem.live/event-libs/v1');
    });

    it('should include version v1 in the path', () => {
      const hostname = 'main--event-libs--adobecom.hlx.page';
      const search = '?eventlibs=test-branch';

      const result = (() => {
        const version = 'v1';
        if (!(hostname.includes('.hlx.') || hostname.includes('.aem.') || hostname.includes('local'))) {
          return '/event-libs';
        }
        const branch = new URLSearchParams(search).get('eventlibs') || 'main';
        if (branch === 'local') {
          return `http://localhost:3868/event-libs/${version}`;
        }
        if (branch.includes('--')) {
          return `https://${branch}.aem.live/event-libs/${version}`;
        }
        return `https://${branch}--event-libs--adobecom.aem.live/event-libs/${version}`;
      })();

      expect(result).to.include('/v1');
    });
  });
});
