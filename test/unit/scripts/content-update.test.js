import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { LIBS, setMetadata } from '../../../events/scripts/utils.js';
import BlockMediator from '../../../events/scripts/deps/block-mediator.min.js';

const {
  default: decorateEvent,
  updateAnalyticTag,
  signIn,
  validatePageAndRedirect,
  updatePictureElement,
  getNonProdData,
} = await import('../../../events/scripts/content-update.js');
const { getConfig } = await import(`${LIBS}/utils/utils.js`);
const head = await readFile({ path: './mocks/head.html' });
const body = await readFile({ path: './mocks/full-event.html' });
const defaultDoc = await readFile({ path: './mocks/event-default-doc.html' });

function checkForDoubleSquareBrackets() {
  const bodyContent = document.body.innerHTML;
  const regex = /\[\[.*?\]\]/g;
  const matches = bodyContent.match(regex);
  return !!matches;
}

describe('Content Update Script', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = head;
    window.isTestEnv = true;
  });

  it('leaves no placeholders behind', () => {
    document.body.innerHTML = body;
    const miloDeps = {
      getConfig,
      miloLibs: LIBS,
    };

    decorateEvent(document, miloDeps);
    expect(checkForDoubleSquareBrackets()).to.be.false;
  });

  it('handles #event-template special case', () => {
    document.body.innerHTML = defaultDoc;
    const miloDeps = {
      getConfig,
      miloLibs: LIBS,
    };

    decorateEvent(document, miloDeps);
    expect(checkForDoubleSquareBrackets()).to.be.false;
  });

  it('handles RSVP buttons correctly', async () => {
    document.body.innerHTML = body;
    const miloDeps = {
      getConfig,
      miloLibs: LIBS,
    };

    const profile = {
      account_type: 'type3',
      utcOffset: 'null',
      preferred_languages: null,
      displayName: 'Qiyun Dai',
      last_name: 'Dai',
      userId: 'B90719A765B288680A494219@c62f24cc5b5b7e0e0a494004',
      authId: 'B90719A765B288680A494219@c62f24cc5b5b7e0e0a494004',
      tags: [
        'agegroup_unknown',
        'edu',
        'edu_k12',
      ],
      emailVerified: 'true',
      phoneNumber: null,
      countryCode: 'US',
      name: 'Qiyun Dai',
      mrktPerm: 'EMAIL:false,MAIL:false,PHONE:false,PHONE_RENT:false,FAX:false,MAIL_RENT:false,EMAIL_RENT:false',
      mrktPermEmail: 'false',
      first_name: 'Qiyun',
      email: 'cod87753@adobe.com',
    };

    BlockMediator.set('imsProfile', profile);

    const buttonOriginalText = document.querySelector('a[href$="#rsvp-form-1"]').textContent;
    decorateEvent(document, miloDeps);
    BlockMediator.set('rsvpData', null);

    expect(document.querySelector('a[href$="#rsvp-form-1"]').textContent).to.be.equal(buttonOriginalText);
  });
});

describe('updateAnalyticTag', () => {
  it('updates the text content of an element', () => {
    const element = document.createElement('div');
    updateAnalyticTag(element, 'new text');
    expect(element.getAttribute('daa-ll')).to.equal('new text|Create Now Chicago 2024 Test');
  });
});

describe('signIn', () => {
  it('calls the signIn method', () => {
    window.adobeIMS = { signIn: () => {} };
    const signInSpy = sinon.spy(window.adobeIMS, 'signIn');
    signIn();
    expect(signInSpy.calledOnce).to.be.true;
  });

  it('should log a warning if the signIn method is not available', () => {
    window.lana = { log: () => {} };
    const logSpy = sinon.spy(window.lana, 'log');
    window.adobeIMS = {};
    signIn();
    expect(logSpy.calledOnce).to.be.true;
  });
});

describe('validatePageAndRedirect', () => {
  it('should do nothing if no redirection condition is met', async () => {
    const currentLocation = window.location.href;
    await validatePageAndRedirect(LIBS);
    expect(window.location.href).to.equal(currentLocation);
  });
});

describe('updatePictureElement', () => {
  it('updates the srcset attribute of a picture element', () => {
    const picture = document.querySelector('picture');
    const img = document.createElement('img');
    img.setAttribute('src', '/mock-image-url.jpg');

    picture.append(img);
    updatePictureElement(img.src, picture, 'alt-text');
    const sources = picture.querySelectorAll('source');
    sources.forEach((source) => {
      expect(source.srcset.startsWith('http://localhost:2000/mock-image-url.jpg?')).to.be.true;
    });
  });

  it('should try to parse https://www.adobe.com/ image URLs', () => {
    const picture = document.querySelector('picture');

    updatePictureElement('https://www.adobe.com/mock-image-url.jpg', picture, 'alt-text');
    const sources = picture.querySelectorAll('source');
    sources.forEach((source) => {
      expect(source.srcset.startsWith('/mock-image-url.jpg?')).to.be.true;
    });
  });
});

describe('getNonProdData', () => {
  it('should return the correct data for non-prod environments', async () => {
    const fetchStub = sinon.stub(window, 'fetch').resolves({
      json: () => ({
        data: [
          { url: '/' },
        ],
      }),
      ok: true,
    });

    const data = await getNonProdData('stage');
    expect(data).to.not.be.null;
    expect(data).to.have.property('url', '/');
    fetchStub.restore();
  });
});

describe('decorateEvent - Array Iteration', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('@array syntax', () => {
    it('should debug META_REG pattern', () => {
      // Test what META_REG captures
      const META_REG = /\[\[(.*?)\]\]/g;
      const testText = 'Contact us: [[@array(contacts),]]';
      const matches = [];
      let match;
      // eslint-disable-next-line no-cond-assign
      while ((match = META_REG.exec(testText)) !== null) {
        matches.push(match);
      }

      console.log('META_REG matches:', matches);
      expect(matches.length).to.be.greaterThan(0);
      expect(matches[0][1]).to.equal('@array(contacts),');
    });

    it('should process @array(contacts) with English commas', () => {
      // Set up test metadata
      setMetadata('contacts', JSON.stringify(['John Doe', 'Jane Smith', 'Bob Johnson']));
      setMetadata('event-id', 'test-event'); // Required for decorateEvent to run

      // Create test HTML with @array syntax
      container.innerHTML = '<p>Contact us: [[@array(contacts),]]</p>';

      // Mock miloDeps
      const miloDeps = {
        getConfig: () => ({ locale: { ietf: 'en-US' } }),
        miloLibs: '/libs',
      };

      // Call decorateEvent
      decorateEvent(container, miloDeps, {});

      // Debug: log the actual content
      console.log('Actual content:', container.textContent);
      console.log('Expected content:', 'Contact us: John Doe,Jane Smith,Bob Johnson');

      // Verify the result - comma is used exactly as provided
      expect(container.textContent).to.equal('Contact us: John Doe,Jane Smith,Bob Johnson');
    });

    it('should process @array(contacts) with custom separator', () => {
      // Set up test metadata
      setMetadata('contacts', JSON.stringify(['John Doe', 'Jane Smith', 'Bob Johnson']));
      setMetadata('event-id', 'test-event');

      // Create test HTML with custom separator
      container.innerHTML = '<p>Contact us: [[@array(contacts) | ]]</p>';

      // Mock miloDeps
      const miloDeps = {
        getConfig: () => ({ locale: { ietf: 'en-US' } }),
        miloLibs: '/libs',
      };

      // Call decorateEvent
      decorateEvent(container, miloDeps, {});

      // Verify the result uses custom separator
      expect(container.textContent).to.equal('Contact us: John Doe | Jane Smith | Bob Johnson');
    });

    it('should process @array(contacts) with no separator (defaults to space)', () => {
      // Set up test metadata
      setMetadata('contacts', JSON.stringify(['John Doe', 'Jane Smith', 'Bob Johnson']));
      setMetadata('event-id', 'test-event');

      // Create test HTML with no separator
      container.innerHTML = '<p>Contact us: [[@array(contacts)]]</p>';

      // Mock miloDeps
      const miloDeps = {
        getConfig: () => ({ locale: { ietf: 'en-US' } }),
        miloLibs: '/libs',
      };

      // Call decorateEvent
      decorateEvent(container, miloDeps, {});

      // Verify the result uses space as default separator
      expect(container.textContent).to.equal('Contact us: John Doe Jane Smith Bob Johnson');
    });

    it('should process @array(contacts) with Japanese separators for comma', () => {
      // Set up test metadata
      setMetadata('contacts', JSON.stringify(['田中太郎', '佐藤花子', '鈴木一郎']));
      setMetadata('event-id', 'test-event');

      // Create test HTML with @array syntax
      container.innerHTML = '<p>連絡先: [[@array(contacts),]]</p>';

      // Mock miloDeps with Japanese locale
      const miloDeps = {
        getConfig: () => ({ locale: { ietf: 'ja-JP' } }),
        miloLibs: '/libs',
      };

      // Call decorateEvent
      decorateEvent(container, miloDeps, {});

      // Verify the result uses the comma as provided (no locale-specific handling)
      expect(container.textContent).to.equal('連絡先: 田中太郎,佐藤花子,鈴木一郎');
    });

    it('should process @array(contacts) with Chinese separators for comma', () => {
      // Set up test metadata
      setMetadata('contacts', JSON.stringify(['张三', '李四', '王五']));
      setMetadata('event-id', 'test-event');

      // Create test HTML with @array syntax
      container.innerHTML = '<p>联系人: [[@array(contacts),]]</p>';

      // Mock miloDeps with Chinese locale
      const miloDeps = {
        getConfig: () => ({ locale: { ietf: 'zh-CN' } }),
        miloLibs: '/libs',
      };

      // Call decorateEvent
      decorateEvent(container, miloDeps, {});

      // Verify the result uses the comma as provided (no locale-specific handling)
      expect(container.textContent).to.equal('联系人: 张三,李四,王五');
    });

    it('should handle empty arrays gracefully', () => {
      // Set up test metadata with empty array
      setMetadata('contacts', JSON.stringify([]));
      setMetadata('event-id', 'test-event');

      // Create test HTML with @array syntax
      container.innerHTML = '<p>Contact us: [[@array(contacts),]]</p>';

      // Mock miloDeps
      const miloDeps = {
        getConfig: () => ({ locale: { ietf: 'en-US' } }),
        miloLibs: '/libs',
      };

      // Call decorateEvent
      decorateEvent(container, miloDeps, {});

      // Verify the result is empty
      expect(container.textContent).to.equal('Contact us: ');
    });

    it('should handle non-array metadata gracefully', () => {
      // Set up test metadata with non-array
      setMetadata('contacts', 'John Doe');
      setMetadata('event-id', 'test-event');

      // Create test HTML with @array syntax
      container.innerHTML = '<p>Contact us: [[@array(contacts),]]</p>';

      // Mock miloDeps
      const miloDeps = {
        getConfig: () => ({ locale: { ietf: 'en-US' } }),
        miloLibs: '/libs',
      };

      // Call decorateEvent
      decorateEvent(container, miloDeps, {});

      // Verify the result is empty (non-array returns empty string)
      expect(container.textContent).to.equal('Contact us: ');
    });

    it('should fallback to English commas for unsupported locales', () => {
      // Set up test metadata
      setMetadata('contacts', JSON.stringify(['John Doe', 'Jane Smith']));
      setMetadata('event-id', 'test-event');

      // Create test HTML with @array syntax
      container.innerHTML = '<p>Contact us: [[@array(contacts),]]</p>';

      // Mock miloDeps with unsupported locale
      const miloDeps = {
        getConfig: () => ({ locale: { ietf: 'xx-XX' } }),
        miloLibs: '/libs',
      };

      // Call decorateEvent
      decorateEvent(container, miloDeps, {});

      // Verify the result uses the comma as provided (no locale-specific handling)
      expect(container.textContent).to.equal('Contact us: John Doe,Jane Smith');
    });

    it('should work with nested metadata paths', () => {
      // Set up test metadata with nested structure
      setMetadata('event-data', JSON.stringify({
        contacts: ['John Doe', 'Jane Smith'],
        other: 'data',
      }));
      setMetadata('event-id', 'test-event');

      // Create test HTML with nested @array syntax
      container.innerHTML = '<p>Contact us: [[@array(event-data.contacts),]]</p>';

      // Mock miloDeps
      const miloDeps = {
        getConfig: () => ({ locale: { ietf: 'en-US' } }),
        miloLibs: '/libs',
      };

      // Call decorateEvent
      decorateEvent(container, miloDeps, {});

      // Verify the result
      expect(container.textContent).to.equal('Contact us: John Doe,Jane Smith');
    });

    it('should extract object attributes from array', () => {
      // Set up test metadata with array of objects
      setMetadata('speakers', JSON.stringify([
        { name: 'Dr. Alice Brown', title: 'Senior Researcher' },
        { name: 'Prof. Charlie Wilson', title: 'Professor' },
        { name: 'Jane Smith', title: 'Engineer' },
      ]));
      setMetadata('event-id', 'test-event');

      // Create test HTML with attribute extraction
      container.innerHTML = '<p>Speakers: [[@array(speakers.name),]]</p>';

      // Mock miloDeps
      const miloDeps = {
        getConfig: () => ({ locale: { ietf: 'en-US' } }),
        miloLibs: '/libs',
      };

      // Call decorateEvent
      decorateEvent(container, miloDeps, {});

      // Debug: log the actual content
      console.log('Actual content:', container.textContent);
      console.log('Expected content:', 'Speakers: Dr. Alice Brown,Prof. Charlie Wilson,Jane Smith');

      // Verify the result extracts the 'name' attribute
      expect(container.textContent).to.equal('Speakers: Dr. Alice Brown,Prof. Charlie Wilson,Jane Smith');
    });

    it('should extract object attributes with custom separator', () => {
      // Set up test metadata with array of objects
      setMetadata('speakers', JSON.stringify([
        { name: 'Dr. Alice Brown', title: 'Senior Researcher' },
        { name: 'Prof. Charlie Wilson', title: 'Professor' },
      ]));
      setMetadata('event-id', 'test-event');

      // Create test HTML with attribute extraction and custom separator
      container.innerHTML = '<p>Speakers: [[@array(speakers.name) | ]]</p>';

      // Mock miloDeps
      const miloDeps = {
        getConfig: () => ({ locale: { ietf: 'en-US' } }),
        miloLibs: '/libs',
      };

      // Call decorateEvent
      decorateEvent(container, miloDeps, {});

      // Verify the result uses custom separator
      expect(container.textContent).to.equal('Speakers: Dr. Alice Brown | Prof. Charlie Wilson');
    });

    it('should handle nested arrays with object attributes', () => {
      // Set up test metadata with nested structure containing objects
      setMetadata('event-data', JSON.stringify({
        speakers: [
          { name: 'Dr. Alice Brown', title: 'Senior Researcher' },
          { name: 'Prof. Charlie Wilson', title: 'Professor' },
        ],
        other: 'data',
      }));
      setMetadata('event-id', 'test-event');

      // Create test HTML with nested array and attribute extraction
      container.innerHTML = '<p>Speakers: [[@array(event-data.speakers.name),]]</p>';

      // Mock miloDeps
      const miloDeps = {
        getConfig: () => ({ locale: { ietf: 'en-US' } }),
        miloLibs: '/libs',
      };

      // Call decorateEvent
      decorateEvent(container, miloDeps, {});

      // Verify the result
      expect(container.textContent).to.equal('Speakers: Dr. Alice Brown,Prof. Charlie Wilson');
    });

    it('should handle objects without attribute specification', () => {
      // Set up test metadata with array of objects
      setMetadata('speakers', JSON.stringify([
        { name: 'Dr. Alice Brown', title: 'Senior Researcher' },
        { name: 'Prof. Charlie Wilson', title: 'Professor' },
      ]));
      setMetadata('event-id', 'test-event');

      // Create test HTML without attribute specification
      container.innerHTML = '<p>Speakers: [[@array(speakers),]]</p>';

      // Mock miloDeps
      const miloDeps = {
        getConfig: () => ({ locale: { ietf: 'en-US' } }),
        miloLibs: '/libs',
      };

      // Call decorateEvent
      decorateEvent(container, miloDeps, {});

      // Verify the result converts objects to JSON strings
      expect(container.textContent).to.include('Speakers: {"name":"Dr. Alice Brown","title":"Senior Researcher"},{"name":"Prof. Charlie Wilson","title":"Professor"}');
    });

    it('should handle missing attributes gracefully', () => {
      // Set up test metadata with array of objects
      setMetadata('speakers', JSON.stringify([
        { name: 'Dr. Alice Brown', title: 'Senior Researcher' },
        { name: 'Prof. Charlie Wilson' }, // Missing title
        { title: 'Engineer' }, // Missing name
      ]));
      setMetadata('event-id', 'test-event');

      // Create test HTML with attribute extraction
      container.innerHTML = '<p>Speakers: [[@array(speakers.name),]]</p>';

      // Mock miloDeps
      const miloDeps = {
        getConfig: () => ({ locale: { ietf: 'en-US' } }),
        miloLibs: '/libs',
      };

      // Call decorateEvent
      decorateEvent(container, miloDeps, {});

      // Verify the result handles missing attributes
      expect(container.textContent).to.equal('Speakers: Dr. Alice Brown,Prof. Charlie Wilson,');
    });
  });
});
