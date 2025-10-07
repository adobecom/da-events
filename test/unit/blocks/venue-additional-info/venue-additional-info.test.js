import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { setMetadata } from '../../../../events/scripts/utils.js';

const { default: init } = await import('../../../../events/blocks/venue-additional-info/venue-additional-info.js');
const body = await readFile({ path: './mocks/default.html' });

describe('Venue Additional Info', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    delete document.body.dataset.eventState;
    document.head.innerHTML = '';
    window.isTestEnv = true;
  });

  it('venue additional info exists', async () => {
    document.body.innerHTML = body;
    const block = document.querySelector('.venue-additional-info');
    await init(block);
    expect(block).to.exist;
  });

  it('venue additional image does not exists if there is no additional image', async () => {
    document.body.innerHTML = body;
    const block = document.querySelector('.venue-additional-info');
    await init(block);
    expect(document.querySelector('.venue-additional-info .venue-additional-info-wrapper #additional-image-container > img')).to.not.exist;
  });

  it('venue additional image exists if there is additional image', async () => {
    setMetadata('photos', JSON.stringify([
      {
        imageKind: 'venue-additional-image',
        sharepointUrl: 'https://via.placeholder.com/150',
        altText: 'Venue Additional Image',
      },
    ]));
    document.body.innerHTML = body;
    const block = document.querySelector('.venue-additional-info');
    await init(block);
    expect(document.querySelector('.venue-additional-info .venue-additional-info-wrapper #additional-image-container > img')).to.exist;
  });

  it('venue additional information does not exists if there is no additional information', async () => {
    document.body.innerHTML = body;
    const block = document.querySelector('.venue-additional-info');
    await init(block);
    expect(document.querySelector('.venue-additional-info .venue-additional-info-wrapper .text-wrapper').textContent).to.not.include('Additional information');
  });

  it('venue additional information exists if there is additional information', async () => {
    setMetadata('venue', JSON.stringify({
      venueName: 'Morgan MF',
      additionalInformation: 'Additional information',
    }));
    document.body.innerHTML = body;
    const block = document.querySelector('.venue-additional-info');
    await init(block);
    expect(document.querySelector('.venue-additional-info .venue-additional-info-wrapper .text-wrapper').textContent).to.include('Additional information');
  });

  it('triggers error handling for malformatted sharepoint URL', async () => {
    setMetadata('photos', JSON.stringify([
      {
        imageKind: 'venue-additional-image',
        sharepointUrl: 'https/via.placeholder.com/150',
      },
    ]));
    document.body.innerHTML = body;
    const block = document.querySelector('.venue-additional-info');
    await init(block);
    expect(document.querySelector('.venue-additional-info .venue-additional-info-wrapper #additional-image-container > img[src="https/via.placeholder.com/150"]')).to.exist;
  });

  it('fallback from sharepoint URL to image URL', async () => {
    setMetadata('photos', JSON.stringify([
      {
        imageKind: 'venue-additional-image',
        imageUrl: 'https://via.placeholder.com/150',
      },
    ]));
    document.body.innerHTML = body;
    const block = document.querySelector('.venue-additional-info');
    await init(block);
    expect(document.querySelector('.venue-additional-info .venue-additional-info-wrapper #additional-image-container > img[src="https://via.placeholder.com/150"]')).to.exist;
  });
});
