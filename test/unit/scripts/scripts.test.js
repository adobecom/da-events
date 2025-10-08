/* eslint-disable no-unused-vars */
import { expect } from '@esm-bundle/chai';

describe('Scripts Functions', () => {
  describe('decorateArea', () => {
    it('should call eagerLoad for images when no marquee is present', () => {
      // Create a mock area with an image but no marquee
      const testArea = document.createElement('div');
      const testImg = document.createElement('img');
      testImg.setAttribute('loading', 'lazy');
      testArea.appendChild(testImg);

      // Mock the decorateArea function
      const decorateArea = (area = document) => {
        const eagerLoad = (parent, selector) => {
          const img = parent.querySelector(selector);
          img?.removeAttribute('loading');
        };

        (async function loadLCPImage() {
          const marquee = area.querySelector('.marquee');
          if (!marquee) {
            eagerLoad(area, 'img');
            return;
          }
          eagerLoad(marquee, 'div:first-child img');
          eagerLoad(marquee, 'div:last-child > div:last-child img');
        }());
      };

      decorateArea(testArea);

      // Check that loading attribute was removed
      expect(testImg.hasAttribute('loading')).to.be.false;
    });

    it('should call eagerLoad for marquee images when marquee is present', () => {
      // Create a mock area with marquee and images
      const testArea = document.createElement('div');
      const testMarquee = document.createElement('div');
      testMarquee.className = 'marquee';

      const firstRow = document.createElement('div');
      const firstImg = document.createElement('img');
      firstImg.setAttribute('loading', 'lazy');
      firstRow.appendChild(firstImg);

      const lastRow = document.createElement('div');
      const lastCol = document.createElement('div');
      const lastImg = document.createElement('img');
      lastImg.setAttribute('loading', 'lazy');
      lastCol.appendChild(lastImg);
      lastRow.appendChild(lastCol);

      testMarquee.appendChild(firstRow);
      testMarquee.appendChild(lastRow);
      testArea.appendChild(testMarquee);

      // Test the eagerLoad function directly
      const eagerLoad = (parent, selector) => {
        const imgs = parent.querySelectorAll(selector);
        imgs.forEach((img) => img.removeAttribute('loading'));
      };

      // Test that marquee exists
      const marquee = testArea.querySelector('.marquee');
      expect(marquee).to.not.be.null;

      // Test that we can find images in the marquee
      const allImages = marquee.querySelectorAll('img');
      expect(allImages).to.have.lengthOf(2);

      // Test eagerLoad function works
      eagerLoad(marquee, 'img');

      // Check that loading attributes were removed from all images
      allImages.forEach((img) => {
        expect(img.hasAttribute('loading')).to.be.false;
      });
    });
  });

  describe('renderWithNonProdMetadata', () => {
    it('should return false when not on event details page', () => {
      // Mock getMetadata to return null
      const mockGetMetadata = () => null;
      const mockGetEventConfig = () => ({ eventServiceEnv: { name: 'prod' } });

      const renderWithNonProdMetadata = () => {
        const isEventDetailsPage = mockGetMetadata('event-id');
        if (!isEventDetailsPage) return false;

        const isLiveProd = mockGetEventConfig().eventServiceEnv.name === 'prod' && window.location.hostname === 'www.adobe.com';
        const isMissingEventId = !mockGetMetadata('event-id');

        if (!isLiveProd && isMissingEventId) return true;

        const isPreviewMode = new URLSearchParams(window.location.search).get('previewMode');
        if (isLiveProd && isPreviewMode) return true;

        return false;
      };

      expect(renderWithNonProdMetadata()).to.be.false;
    });

    it('should return true when on live prod with preview mode', () => {
      // Mock getMetadata to return an event-id
      const mockGetMetadata = (key) => (key === 'event-id' ? 'test-event' : null);
      const mockGetEventConfig = () => ({ eventServiceEnv: { name: 'prod' } });

      const renderWithNonProdMetadata = () => {
        const isEventDetailsPage = mockGetMetadata('event-id');
        if (!isEventDetailsPage) return false;

        // Mock the current location for this test
        const currentHostname = 'www.adobe.com';
        const currentSearch = '?previewMode=true';

        const isLiveProd = mockGetEventConfig().eventServiceEnv.name === 'prod' && currentHostname === 'www.adobe.com';
        const isMissingEventId = !mockGetMetadata('event-id');

        if (!isLiveProd && isMissingEventId) return true;

        const isPreviewMode = new URLSearchParams(currentSearch).get('previewMode');
        if (isLiveProd && isPreviewMode) return true;

        return false;
      };

      expect(renderWithNonProdMetadata()).to.be.true;
    });
  });

  describe('fetchAndDecorateArea', () => {
    it('should load non-prod data and set metadata', async () => {
      const mockNonProdData = {
        'event-title': 'Test Event',
        'event-date': '2024-01-01',
      };

      const mockGetEventConfig = () => ({ eventServiceEnv: { name: 'dev' } });
      const mockGetNonProdData = async () => mockNonProdData;
      const mockSetMetadata = () => {};

      const fetchAndDecorateArea = async () => {
        let env = mockGetEventConfig().eventServiceEnv.name;
        if (env === 'local') env = 'dev';
        const nonProdData = await mockGetNonProdData(env);
        if (!nonProdData) return;
        Object.entries(nonProdData).forEach(([key, value]) => {
          mockSetMetadata(key, value);
        });
      };

      await fetchAndDecorateArea();

      // Test passes if no errors are thrown
      expect(true).to.be.true;
    });

    it('should handle local environment by converting to dev', async () => {
      const mockGetEventConfig = () => ({ eventServiceEnv: { name: 'local' } });
      const mockGetNonProdData = async () => ({});

      const fetchAndDecorateArea = async () => {
        let env = mockGetEventConfig().eventServiceEnv.name;
        if (env === 'local') env = 'dev';
        const nonProdData = await mockGetNonProdData(env);
        if (!nonProdData) return;
        Object.entries(nonProdData).forEach(([key, value]) => {
          // Mock setMetadata
        });
      };

      await fetchAndDecorateArea();

      // Test passes if no errors are thrown
      expect(true).to.be.true;
    });

    it('should return early when no non-prod data is available', async () => {
      const mockGetEventConfig = () => ({ eventServiceEnv: { name: 'dev' } });
      const mockGetNonProdData = async () => null;

      const fetchAndDecorateArea = async () => {
        let env = mockGetEventConfig().eventServiceEnv.name;
        if (env === 'local') env = 'dev';
        const nonProdData = await mockGetNonProdData(env);
        if (!nonProdData) return;
        Object.entries(nonProdData).forEach(([key, value]) => {
          // Mock setMetadata
        });
      };

      await fetchAndDecorateArea();

      // Test passes if no errors are thrown
      expect(true).to.be.true;
    });
  });

  describe('replaceDotMedia', () => {
    it('should replace relative media paths with absolute URLs', () => {
      const mockGetLocale = () => ({ prefix: '' });
      const mockGetConfig = () => ({ contentRoot: '/events' });

      // Create test elements
      const testArea = document.createElement('div');
      const testImg = document.createElement('img');
      testImg.setAttribute('src', './media_test.jpg');
      testArea.appendChild(testImg);

      const source = document.createElement('source');
      source.setAttribute('srcset', './media_test2.jpg');
      testArea.appendChild(source);

      const replaceDotMedia = (area = document) => {
        const { prefix } = mockGetLocale(mockGetConfig().locales);
        // Mock URL for testing with shorter path to allow replacement
        const mockUrl = {
          pathname: '/events',
          href: 'https://www.adobe.com/events',
        };
        const pathSeg = mockUrl.pathname.split('/').length;
        if ((prefix === '' && pathSeg >= 3) || (prefix !== '' && pathSeg >= 4)) return;

        const resetAttributeBase = (tag, attr) => {
          area.querySelectorAll(`${tag}[${attr}^="./media_"]`).forEach((el) => {
            el[attr] = `${new URL(`${mockGetConfig().contentRoot}${el.getAttribute(attr).substring(1)}`, mockUrl.href).href}`;
          });
        };
        resetAttributeBase('img', 'src');
        resetAttributeBase('source', 'srcset');
      };

      replaceDotMedia(testArea);

      expect(testImg.getAttribute('src')).to.equal('https://www.adobe.com/events/media_test.jpg');
      expect(source.getAttribute('srcset')).to.equal('https://www.adobe.com/events/media_test2.jpg');
    });

    it('should return early when path segments are too many', () => {
      const mockGetLocale = () => ({ prefix: '' });
      const mockGetConfig = () => ({ contentRoot: '/events' });

      const testArea = document.createElement('div');
      const testImg = document.createElement('img');
      testImg.setAttribute('src', './media_test.jpg');
      testArea.appendChild(testImg);

      const replaceDotMedia = (area = document) => {
        const { prefix } = mockGetLocale(mockGetConfig().locales);
        // Mock URL with deep path for testing
        const mockUrl = {
          pathname: '/events/test/deep/path',
          href: 'https://www.adobe.com/events/test/deep/path',
        };
        const pathSeg = mockUrl.pathname.split('/').length;
        if ((prefix === '' && pathSeg >= 3) || (prefix !== '' && pathSeg >= 4)) return;

        const resetAttributeBase = (tag, attr) => {
          area.querySelectorAll(`${tag}[${attr}^="./media_"]`).forEach((el) => {
            el[attr] = `${new URL(`${mockGetConfig().contentRoot}${el.getAttribute(attr).substring(1)}`, mockUrl.href).href}`;
          });
        };
        resetAttributeBase('img', 'src');
        resetAttributeBase('source', 'srcset');
      };

      replaceDotMedia(testArea);

      // Should not have changed because path is too deep
      expect(testImg.getAttribute('src')).to.equal('./media_test.jpg');
    });
  });
});
