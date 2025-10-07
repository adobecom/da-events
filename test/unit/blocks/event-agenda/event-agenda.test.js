import { expect } from '@esm-bundle/chai';
import { readFile } from '@web/test-runner-commands';
import init, { convertToLocaleTimeFormat } from '../../../../events/blocks/event-agenda/event-agenda.js';
import { setMetadata } from '../../../../events/scripts/utils.js';

const body = await readFile({ path: './mocks/default.html' });

describe('Agenda Module', () => {
  describe('convertToLocaleTimeFormat', () => {
    it('should convert time to locale format', () => {
      const time = '13:45:00';
      const locale = 'en-US';
      const formattedTime = convertToLocaleTimeFormat(time, locale);
      expect(formattedTime).to.equal('1:45 PM');
    });
  });

  describe('init', () => {
    beforeEach(() => {
      document.body.innerHTML = body;
      document.head.innerHTML = '';
    });

    it('should create agenda container and items based on metadata', async () => {
      setMetadata('agenda', JSON.stringify([{ startTime: '09:00:00', title: 'Title', description: 'Opening' }]));
      setMetadata('photos', JSON.stringify([{ imageKind: 'venue-image', sharepointUrl: 'https://example.com/image.jpg', imageUrl: 'http://example.com/image.jpg', altText: 'Venue Image' }]));

      const el = document.querySelector('.event-agenda');
      await init(el);

      const container = el.querySelector('.agenda-container');
      expect(container).to.not.be.null;

      const itemsCol = container.querySelector('.agenda-items');
      expect(itemsCol).to.not.be.null;

      const agendaItem = itemsCol.querySelector('.agenda-list-item');
      expect(agendaItem).to.not.be.null;
      expect(agendaItem.querySelector('.agenda-time').textContent).to.equal('9:00 AM');
      expect(agendaItem.querySelector('.agenda-details').textContent).to.equal('Opening');
      expect(agendaItem.querySelector('.agenda-title').textContent).to.equal('Title');
    });

    it('should use relative sharepoint URL directly', async () => {
      setMetadata('agenda', JSON.stringify([{ startTime: '09:00:00', title: 'Title', description: 'Opening' }]));
      setMetadata('photos', JSON.stringify([{ imageKind: 'venue-image', sharepointUrl: '/example.com/image.jpg', imageUrl: 'http://example.com/image.jpg' }]));

      const el = document.querySelector('.event-agenda');
      await init(el);

      const container = el.querySelector('.agenda-container');
      expect(container).to.not.be.null;

      const itemsCol = container.querySelector('.agenda-items');
      expect(itemsCol).to.not.be.null;

      const agendaItem = itemsCol.querySelector('.agenda-list-item');
      expect(agendaItem).to.not.be.null;
      expect(agendaItem.querySelector('.agenda-time').textContent).to.equal('9:00 AM');
      expect(agendaItem.querySelector('.agenda-details').textContent).to.equal('Opening');
      expect(agendaItem.querySelector('.agenda-title').textContent).to.equal('Title');
    });

    it('should fallback on imageUrl when given invalid absolute sharepoint URL', async () => {
      setMetadata('agenda', JSON.stringify([{ startTime: '09:00:00', title: 'Title', description: 'Opening' }]));
      setMetadata('photos', JSON.stringify([{ imageKind: 'venue-image', sharepointUrl: 'https://////sdawd3123%O*&$/example.com/image.jpg', imageUrl: 'http://example.com/image.jpg' }]));

      const el = document.querySelector('.event-agenda');
      await init(el);

      const container = el.querySelector('.agenda-container');
      expect(container).to.not.be.null;

      const itemsCol = container.querySelector('.agenda-items');
      expect(itemsCol).to.not.be.null;

      const agendaItem = itemsCol.querySelector('.agenda-list-item');
      expect(agendaItem).to.not.be.null;
      expect(agendaItem.querySelector('.agenda-time').textContent).to.equal('9:00 AM');
      expect(agendaItem.querySelector('.agenda-title').textContent).to.equal('Title');
      expect(agendaItem.querySelector('.agenda-details').textContent).to.equal('Opening');
    });

    it('should use fallback values when metadata is incomplete', async () => {
      setMetadata('agenda', JSON.stringify([{ startTime: '09:00:00', title: 'Title', description: 'Opening' }]));
      setMetadata('photos', JSON.stringify([{ imageKind: 'venue-image', imageUrl: 'http://example.com/image.jpg' }]));

      const el = document.querySelector('.event-agenda');
      await init(el);

      const container = el.querySelector('.agenda-container');
      expect(container).to.not.be.null;

      const itemsCol = container.querySelector('.agenda-items');
      expect(itemsCol).to.not.be.null;

      const agendaItem = itemsCol.querySelector('.agenda-list-item');
      expect(agendaItem).to.not.be.null;
      expect(agendaItem.querySelector('.agenda-time').textContent).to.equal('9:00 AM');
      expect(agendaItem.querySelector('.agenda-title').textContent).to.equal('Title');
      expect(agendaItem.querySelector('.agenda-details').textContent).to.equal('Opening');
    });

    it('should not show title when title is empty', async () => {
      setMetadata('agenda', JSON.stringify([{ startTime: '09:00:00', title: '', description: 'Opening' }]));
      setMetadata('photos', JSON.stringify([{ imageKind: 'venue-image', imageUrl: 'http://example.com/image.jpg' }]));

      const el = document.querySelector('.event-agenda');
      await init(el);

      const container = el.querySelector('.agenda-container');
      expect(container).to.not.be.null;

      const itemsCol = container.querySelector('.agenda-items');
      expect(itemsCol).to.not.be.null;

      const agendaItem = itemsCol.querySelector('.agenda-list-item');
      expect(agendaItem).to.not.be.null;
      expect(agendaItem.querySelector('.agenda-time').textContent).to.equal('9:00 AM');
      expect(agendaItem.querySelector('.agenda-details').textContent).to.equal('Opening');
      expect(agendaItem.querySelector('.agenda-title')).to.be.null;
    });

    it('should not show description when description is empty', async () => {
      setMetadata('agenda', JSON.stringify([{ startTime: '09:00:00', title: 'Title' }]));
      setMetadata('photos', JSON.stringify([{ imageKind: 'venue-image', imageUrl: 'http://example.com/image.jpg' }]));

      const el = document.querySelector('.event-agenda');
      await init(el);

      const container = el.querySelector('.agenda-container');
      expect(container).to.not.be.null;

      const itemsCol = container.querySelector('.agenda-items');
      expect(itemsCol).to.not.be.null;

      const agendaItem = itemsCol.querySelector('.agenda-list-item');
      expect(agendaItem).to.not.be.null;
      expect(agendaItem.querySelector('.agenda-time').textContent).to.equal('9:00 AM');
      expect(agendaItem.querySelector('.agenda-title').textContent).to.equal('Title');
      expect(agendaItem.querySelector('.agenda-details')).to.be.null;
    });

    it('should show multiple agenda items', async () => {
      setMetadata('agenda', JSON.stringify([{ startTime: '09:00:00', title: 'Title', description: 'Opening' }, { startTime: '10:00:00', title: 'Title', description: 'Opening' }]));
      setMetadata('photos', JSON.stringify([{ imageKind: 'venue-image', imageUrl: 'http://example.com/image.jpg' }]));

      const el = document.querySelector('.event-agenda');
      await init(el);

      const container = el.querySelector('.agenda-container');
      expect(container).to.not.be.null;

      const itemsCol = container.querySelector('.agenda-items');
      expect(itemsCol).to.not.be.null;

      const agendaItem = itemsCol.querySelectorAll('.agenda-list-item');
      expect(agendaItem).to.not.be.null;
      expect(agendaItem.length).to.equal(2);
    });

    it('should handle invalid agenda metadata gracefully', async () => {
      setMetadata('agenda', 'invalid JSON');

      const el = document.querySelector('.event-agenda');
      await init(el);

      expect(el.parentNode).to.be.null;
    });

    it('should handle no agenda metadata gracefully', async () => {
      const el = document.querySelector('.event-agenda');
      await init(el);

      expect(el.parentNode).to.be.null;
    });

    it('should handle empty agenda metadata gracefully', async () => {
      setMetadata('agenda', JSON.stringify([]));
      const el = document.querySelector('.event-agenda');
      await init(el);

      expect(el.parentNode).to.be.null;
    });

    it('should remove element if metadata "show-agenda-post-event" is not "true" and body has eventState "post-event"', async () => {
      document.body.dataset.eventState = 'post-event';
      setMetadata('show-agenda-post-event', 'false');

      const el = document.querySelector('.event-agenda');
      await init(el);

      expect(el.parentNode).to.be.null;
    });
  });
});
