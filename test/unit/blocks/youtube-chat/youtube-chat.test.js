import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { readFile } from '@web/test-runner-commands';

const defaultHtml = await readFile({ path: './mocks/default.html' });

describe('YouTube Chat Module', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('YouTubeChat Class', () => {
    let youtubeChat;

    beforeEach(async () => {
      const { YouTubeChat } = await import('../../../../events/blocks/youtube-chat/youtube-chat.js');
      youtubeChat = new YouTubeChat();
    });

    describe('isAutoplayEnabled', () => {
      it('should return correct autoplay state', () => {
        youtubeChat.config = { autoplay: 'true' };
        expect(youtubeChat.isAutoplayEnabled()).to.be.true;

        youtubeChat.config = { autoplay: 'false' };
        expect(youtubeChat.isAutoplayEnabled()).to.be.false;

        youtubeChat.config = {};
        expect(youtubeChat.isAutoplayEnabled()).to.be.false;
      });
    });

    describe('buildUrlParams', () => {
      beforeEach(() => {
        youtubeChat.videoId = 'dQw4w9WgXcQ';
      });

      it('should build URL parameters correctly', () => {
        youtubeChat.config = {
          'show-controls': 'true',
          'show-player-title-actions': 'true',
          'show-suggestions-after-video-ends': 'true',
        };

        const params = youtubeChat.buildUrlParams();
        expect(params).to.include('controls=1');
        expect(params).to.include('modestbranding=1');
        expect(params).to.include('rel=1');

        youtubeChat.config = {
          'show-controls': 'false',
          'show-player-title-actions': 'false',
          'show-suggestions-after-video-ends': 'false',
        };

        const emptyParams = youtubeChat.buildUrlParams();
        expect(emptyParams).to.equal('');
      });
    });

    describe('buildEmbedUrl', () => {
      beforeEach(() => {
        youtubeChat.videoId = 'dQw4w9WgXcQ';
      });

      it('should build embed URL with correct parameters for browser autoplay', () => {
        youtubeChat.config = {
          'show-controls': 'true',
          'show-player-title-actions': 'true',
          mute: 'true',
        };

        const autoplayUrl = youtubeChat.buildEmbedUrl(true, false);
        expect(autoplayUrl).to.include('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
        expect(autoplayUrl).to.include('autoplay=1');
        expect(autoplayUrl).to.include('mute=1');
        expect(autoplayUrl).to.include('controls=1');
        expect(autoplayUrl).to.include('modestbranding=1');
      });

      it('should build embed URL with correct parameters for user-initiated play', () => {
        youtubeChat.config = {
          'show-controls': 'true',
          'show-player-title-actions': 'true',
          mute: 'true',
        };

        const userInitiatedUrl = youtubeChat.buildEmbedUrl(false, true);
        expect(userInitiatedUrl).to.include('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
        expect(userInitiatedUrl).to.include('autoplay=1');
        expect(userInitiatedUrl).to.include('mute=1');
        expect(userInitiatedUrl).to.include('controls=1');
        expect(userInitiatedUrl).to.include('modestbranding=1');
      });

      it('should build embed URL without autoplay for regular load', () => {
        youtubeChat.config = {
          'show-controls': 'true',
          'show-player-title-actions': 'true',
        };

        const noAutoplayUrl = youtubeChat.buildEmbedUrl(false, false);
        expect(noAutoplayUrl).to.include('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
        expect(noAutoplayUrl).to.not.include('autoplay=1');
        expect(noAutoplayUrl).to.not.include('mute=1');
        expect(noAutoplayUrl).to.include('controls=1');
      });

      it('should respect mute config for user-initiated play when mute is false', () => {
        youtubeChat.config = {
          mute: 'false',
          'show-controls': 'true',
        };

        const userInitiatedUrl = youtubeChat.buildEmbedUrl(false, true);
        expect(userInitiatedUrl).to.include('autoplay=1');
        expect(userInitiatedUrl).to.not.include('mute=1');
        expect(userInitiatedUrl).to.include('controls=1');
      });

      it('should force mute for browser autoplay even when mute config is false', () => {
        youtubeChat.config = {
          mute: 'false',
          'show-controls': 'true',
        };

        const autoplayUrl = youtubeChat.buildEmbedUrl(true, false);
        expect(autoplayUrl).to.include('autoplay=1');
        expect(autoplayUrl).to.include('mute=1'); // Forced for browser autoplay
        expect(autoplayUrl).to.include('controls=1');
      });
    });

    describe('buildChatSection', () => {
      beforeEach(() => {
        youtubeChat.videoId = 'dQw4w9WgXcQ';
      });

      it('should create chat section with correct placeholder', () => {
        youtubeChat.config = { autoplay: 'true' };
        const chatSection = youtubeChat.buildChatSection();

        expect(chatSection.classList.contains('youtube-chat-container')).to.be.true;

        const placeholder = chatSection.querySelector('.youtube-chat-placeholder');
        expect(placeholder.textContent).to.equal('Loading chat...');

        youtubeChat.config = { autoplay: 'false' };
        const chatSection2 = youtubeChat.buildChatSection();
        const placeholder2 = chatSection2.querySelector('.youtube-chat-placeholder');
        expect(placeholder2.textContent).to.equal('Chat will load when video is played');
      });
    });

    describe('loadChat', () => {
      beforeEach(() => {
        youtubeChat.videoId = 'dQw4w9WgXcQ';
        youtubeChat.chatContainer = document.createElement('div');
        youtubeChat.chatContainer.innerHTML = '<div class="placeholder">Loading...</div>';
      });

      it('should load chat iframe when container exists', () => {
        youtubeChat.loadChat();

        const iframe = youtubeChat.chatContainer.querySelector('iframe.youtube-chat');
        expect(iframe).to.not.be.null;
        expect(iframe.src).to.include('youtube.com/live_chat');
        expect(iframe.title).to.equal('YouTube live chat');
      });

      it('should not load chat when container is null', () => {
        youtubeChat.chatContainer = null;
        expect(() => youtubeChat.loadChat()).to.not.throw();
      });
    });

    describe('buildStream', () => {
      beforeEach(() => {
        youtubeChat.videoId = 'dQw4w9WgXcQ';
        youtubeChat.config = { videotitle: 'Test Video' };
      });

      it('should build stream with correct layout based on configuration', () => {
        // Chat enabled + autoplay enabled
        youtubeChat.chatEnabled = true;
        youtubeChat.config.autoplay = 'true';
        const stream1 = youtubeChat.buildStream();
        expect(stream1.classList.contains('youtube-stream')).to.be.true;
        expect(stream1.classList.contains('has-chat')).to.be.true;
        expect(stream1.classList.contains('single-column')).to.be.false;
        expect(stream1.querySelector('.youtube-chat-container')).to.not.be.null;

        // Chat disabled
        youtubeChat.chatEnabled = false;
        const stream2 = youtubeChat.buildStream();
        expect(stream2.classList.contains('single-column')).to.be.true;
        expect(stream2.querySelector('.youtube-chat-container')).to.be.null;

        // Chat enabled + autoplay disabled
        youtubeChat.chatEnabled = true;
        youtubeChat.config.autoplay = 'false';
        const stream3 = youtubeChat.buildStream();
        expect(stream3.classList.contains('single-column')).to.be.true;
        expect(stream3.querySelector('.youtube-chat-container')).to.be.null;
        expect(youtubeChat.pendingChatSection).to.not.be.null;
      });
    });

    describe('preconnect', () => {
      it('should add preconnect links for YouTube domains', async () => {
        const originalHead = document.head.innerHTML;

        const { YouTubeChat } = await import('../../../../events/blocks/youtube-chat/youtube-chat.js');
        YouTubeChat.preconnect();

        const links = document.querySelectorAll('link[rel="preconnect"]');
        expect(links.length).to.be.greaterThan(0);

        const hrefs = Array.from(links).map((link) => link.href);
        expect(hrefs).to.include('https://www.youtube-nocookie.com/');
        expect(hrefs).to.include('https://www.youtube.com/');

        document.head.innerHTML = originalHead;
      });

      it('should only add preconnect links once', async () => {
        const originalHead = document.head.innerHTML;

        const { YouTubeChat } = await import('../../../../events/blocks/youtube-chat/youtube-chat.js');
        YouTubeChat.preconnect();
        const firstCount = document.querySelectorAll('link[rel="preconnect"]').length;

        YouTubeChat.preconnect();
        const secondCount = document.querySelectorAll('link[rel="preconnect"]').length;

        expect(firstCount).to.equal(secondCount);

        document.head.innerHTML = originalHead;
      });
    });

    describe('getVideoTitle', () => {
      it('should return correct video title', () => {
        youtubeChat.config = { videotitle: 'Custom Video Title' };
        expect(youtubeChat.getVideoTitle()).to.equal('Custom Video Title');

        youtubeChat.config = {};
        expect(youtubeChat.getVideoTitle()).to.equal('YouTube video player');
      });
    });

    describe('createVideoIframe', () => {
      it('should create iframe with correct attributes', () => {
        youtubeChat.config = { videotitle: 'Test Video' };
        const src = 'https://www.youtube-nocookie.com/embed/test';
        const iframe = youtubeChat.createVideoIframe(src);

        expect(iframe.classList.contains('youtube-video')).to.be.true;
        expect(iframe.src).to.equal(src);
        expect(iframe.title).to.equal('Test Video');
        expect(iframe.loading).to.equal('lazy');
        expect(iframe.hasAttribute('allowfullscreen')).to.be.true;
        expect(iframe.getAttribute('allow')).to.equal('accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture');
      });
    });

    describe('activateLitePlayer', () => {
      beforeEach(() => {
        youtubeChat.videoId = 'dQw4w9WgXcQ';
        youtubeChat.config = { videotitle: 'Test Video' };
        youtubeChat.chatEnabled = true;
      });

      it('should activate lite player with chat enabled', () => {
        const liteYT = document.createElement('lite-youtube');
        const container = document.createElement('div');
        container.className = 'youtube-stream single-column';
        container.appendChild(liteYT);
        document.body.appendChild(container);

        // Test with pending chat section
        youtubeChat.pendingChatSection = youtubeChat.buildChatSection();
        const loadChatSpy = sandbox.spy(youtubeChat, 'loadChat');

        youtubeChat.activateLitePlayer(liteYT);

        expect(youtubeChat.videoLoaded).to.be.true;
        expect(liteYT.classList.contains('lyt-activated')).to.be.true;
        expect(liteYT.parentNode).to.be.null; // Should be removed
        expect(container.classList.contains('single-column')).to.be.false;
        expect(container.querySelector('.youtube-chat-container')).to.not.be.null;
        expect(loadChatSpy.called).to.be.true;
      });

      it('should activate lite player without chat enabled', () => {
        youtubeChat.chatEnabled = false;
        const liteYT = document.createElement('lite-youtube');
        const container = document.createElement('div');
        container.appendChild(liteYT);
        document.body.appendChild(container);

        const loadChatSpy = sandbox.spy(youtubeChat, 'loadChat');
        youtubeChat.activateLitePlayer(liteYT);

        expect(loadChatSpy.called).to.be.false;
      });

      it('should not activate if already loaded', () => {
        youtubeChat.videoLoaded = true;
        const liteYT = document.createElement('lite-youtube');
        const container = document.createElement('div');
        container.appendChild(liteYT);
        document.body.appendChild(container);

        const originalIframeCount = container.querySelectorAll('iframe').length;
        youtubeChat.activateLitePlayer(liteYT);

        expect(container.querySelectorAll('iframe').length).to.equal(originalIframeCount);
      });
    });
  });

  describe('Default Export Function', () => {
    let block;

    beforeEach(() => {
      block = document.createElement('div');
      block.innerHTML = defaultHtml;
      document.body.appendChild(block);
    });

    afterEach(() => {
      if (block.parentNode) {
        document.body.removeChild(block);
      }
    });

    it('should export init function and handle initialization', async () => {
      const { default: init, YouTubeChat } = await import('../../../../events/blocks/youtube-chat/youtube-chat.js');

      expect(typeof init).to.equal('function');
      expect(typeof YouTubeChat).to.equal('function');

      const youtubeChat = new YouTubeChat();
      expect(youtubeChat).to.be.instanceOf(YouTubeChat);

      const result = init(block);
      expect(result).to.be.instanceOf(Promise);

      try {
        await result;
      } catch (error) {
        // Expected to fail due to missing video ID in test HTML
        expect(error).to.be.instanceOf(Error);
      }
    });
  });
});
