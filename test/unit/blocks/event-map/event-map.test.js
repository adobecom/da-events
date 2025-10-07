import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { setMetadata } from '../../../../events/scripts/utils.js';

const { default: init } = await import('../../../../events/blocks/event-map/event-map.js');
const body = await readFile({ path: './mocks/default.html' });
const faulty = await readFile({ path: './mocks/faulty.html' });

describe('Event Map', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    delete document.body.dataset.eventState;
    document.head.innerHTML = '';
    window.isTestEnv = true;
    setMetadata('venue', JSON.stringify({
      venueName: 'Morgan MF',
      address: '401 North Morgan Street',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60642',
      additionalInformation: 'Additional information',
    }));
  });

  it('event map exists', async () => {
    setMetadata('venue', JSON.stringify({
      venueName: 'Morgan MF',
      formattedAddress: '401 North Morgan Street, Chicago, IL 60642',
    }));
    setMetadata('photos', JSON.stringify([
      {
        imageKind: 'venue-map-image',
        sharepointUrl: 'https://via.placeholder.com/150',
        altText: 'Venue Map Image',
      },
      {
        imageKind: 'venue-additional-image',
        sharepointUrl: 'https://via.placeholder.com/150',
        altText: 'Venue Additional Image',
      },
    ]));
    document.body.innerHTML = body;
    const block = document.querySelector('.event-map');
    await init(block);
    expect(block).to.exist;
  });

  it('event map does not exist when toggled off for post event', async () => {
    setMetadata('show-venue-post-event', 'false');
    document.body.innerHTML = body;
    document.body.dataset.eventState = 'post-event';
    const block = document.querySelector('.event-map');
    await init(block);
    expect(document.querySelector('.event-map')).to.not.exist;
  });

  it('event additional info button does not exist when toggled off for post event', async () => {
    setMetadata('show-venue-post-event', 'true');
    setMetadata('show-venue-additional-info-post-event', 'false');
    document.body.innerHTML = body;
    document.body.dataset.eventState = 'post-event';
    const block = document.querySelector('.event-map');
    await init(block);
    expect(document.querySelector('.event-map .event-map-wrapper > div > p:last-of-type:has(a)')).to.not.exist;
  });

  it('event additional info button does exist when toggled on for post event', async () => {
    setMetadata('show-venue-post-event', 'true');
    setMetadata('show-venue-additional-info-post-event', 'true');
    document.body.innerHTML = body;
    document.body.dataset.eventState = 'post-event';
    const block = document.querySelector('.event-map');
    await init(block);
    expect(document.querySelector('.event-map .event-map-wrapper > div > p:last-of-type:has(a)')).to.exist;
  });

  it('fails early with faulty block authored', async () => {
    setMetadata('show-venue-post-event', 'true');
    document.body.innerHTML = faulty;
    const block = document.querySelector('.event-map');
    await init(block);
    expect(document.querySelector('.event-map > .event-map-wrapper > div')).to.not.exist;
  });

  it('triggers error handling for faulty data / DOM', async () => {
    setMetadata('photos', 'faulty data');
    document.body.innerHTML = body;
    const block = document.querySelector('.event-map');
    await init(block);
    expect(document.querySelector('.event-map .event-map-wrapper #map-container')).to.not.exist;
  });

  it('triggers error handling for malformatted sharepoint URL', async () => {
    setMetadata('photos', JSON.stringify([
      {
        imageKind: 'venue-map-image',
        sharepointUrl: 'https/via.placeholder.com/150',
      },
    ]));
    document.body.innerHTML = body;
    const block = document.querySelector('.event-map');
    await init(block);
    expect(document.querySelector('.event-map .event-map-wrapper #map-container > img[src="https/via.placeholder.com/150"]')).to.exist;
  });

  it('fallback from sharepoint URL to image URL', async () => {
    setMetadata('photos', JSON.stringify([
      {
        imageKind: 'venue-map-image',
        imageUrl: 'https://via.placeholder.com/150',
      },
    ]));
    document.body.innerHTML = body;
    const block = document.querySelector('.event-map');
    await init(block);
    expect(document.querySelector('.event-map .event-map-wrapper #map-container > img[src="https://via.placeholder.com/150"]')).to.exist;
  });
});
