import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

describe('Promotional Content Block', () => {
  let el;
  let fetchStub;

  beforeEach(async () => {
    el = document.createElement('div');
    el.className = 'promotional-content';
    document.body.appendChild(el);

    // Mock LIBS
    window.LIBS = '/libs';

    // Mock the promotional content JSON response
    const mockPromotionalData = {
      data: [
        {
          name: 'Acrobat',
          'fragment-path': 'https://main--events-milo--adobecom.aem.page/events/fragments/product-blades/acrobat',
          thumbnail: 'https://www.adobe.com/events/assets/logos/acrobat-icon.svg',
        },
        {
          name: 'Explore Creative Cloud',
          'fragment-path': 'https://main--events-milo--adobecom.aem.page/events/fragments/product-blades/explore-creative-cloud',
          thumbnail: 'https://www.adobe.com/events/assets/logos/cc-icon.svg',
        },
      ],
    };

    fetchStub = sinon.stub(window, 'fetch').resolves({ json: () => Promise.resolve(mockPromotionalData) });
  });

  afterEach(() => {
    document.body.removeChild(el);
    fetchStub.restore();
    sinon.restore();
    delete window.LIBS;
  });

  describe('init', () => {
    it('should handle empty promotional items gracefully', async () => {
      // This test verifies that the function doesn't crash when there are no promotional items
      const init = (await import('../../../../events/blocks/promotional-content/promotional-content.js')).default;

      // Should not throw an error
      await init(el);

      // Fetch should be called even with empty promotional items
      expect(fetchStub.called).to.be.true;
    });
  });

  describe('addMediaReversedClass', () => {
    it('should remove media-reverse-mobile class from all media blocks', async () => {
      // Add media blocks with media-reverse-mobile class
      const media1 = document.createElement('div');
      media1.className = 'media media-reverse-mobile';
      el.appendChild(media1);

      const media2 = document.createElement('div');
      media2.className = 'media media-reverse-mobile';
      el.appendChild(media2);

      // Set up mock metadata to ensure the function runs
      const meta = document.createElement('meta');
      meta.name = 'promotional-items';
      meta.content = '["Acrobat"]';
      document.head.appendChild(meta);

      const { addMediaReversedClass } = (await import('../../../../events/blocks/promotional-content/promotional-content.js'));
      addMediaReversedClass(el);

      const mediaBlocks = el.querySelectorAll('.media');
      mediaBlocks.forEach((block) => {
        expect(block.classList.contains('media-reverse-mobile')).to.be.false;
      });
    });

    it('should add media-reversed class to odd-indexed media blocks', async () => {
      // Add media blocks
      const media1 = document.createElement('div');
      media1.className = 'media';
      el.appendChild(media1);

      const media2 = document.createElement('div');
      media2.className = 'media';
      el.appendChild(media2);

      const media3 = document.createElement('div');
      media3.className = 'media';
      el.appendChild(media3);

      // Set up mock metadata to ensure the function runs
      const meta = document.createElement('meta');
      meta.name = 'promotional-items';
      meta.content = '["Acrobat"]';
      document.head.appendChild(meta);

      const { addMediaReversedClass } = (await import('../../../../events/blocks/promotional-content/promotional-content.js'));
      addMediaReversedClass(el);

      const mediaBlocks = el.querySelectorAll('.media');

      expect(mediaBlocks[0].classList.contains('media-reversed')).to.be.false;
      expect(mediaBlocks[1].classList.contains('media-reversed')).to.be.true;
      expect(mediaBlocks[2].classList.contains('media-reversed')).to.be.false;
    });
  });

  describe('getPromotionalContent', () => {
    it('should handle invalid JSON in promotional items metadata', async () => {
      // Set up invalid metadata
      const meta = document.createElement('meta');
      meta.name = 'promotional-items';
      meta.content = 'invalid json';
      document.head.appendChild(meta);

      const init = (await import('../../../../events/blocks/promotional-content/promotional-content.js')).default;

      // Should not throw an error
      await init(el);

      // Fetch should still be called even with invalid metadata
      expect(fetchStub.called).to.be.true;
    });
  });
});
