/* eslint-disable no-underscore-dangle */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import init from '../../../../events/blocks/mobile-rider/mobile-rider.js';

/* global globalThis */

const defaultHtml = `
<div class="mobile-rider">
  <div>
    <div>video-id</div>
    <div>test-video-123</div>
  </div>
  <div>
    <div>skin-id</div>
    <div>default-skin</div>
  </div>
  <div>
    <div>autoplay</div>
    <div>true</div>
  </div>
  <div>
    <div>controls</div>
    <div>true</div>
  </div>
  <div>
    <div>muted</div>
    <div>true</div>
  </div>
  <div>
    <div>asl-id</div>
    <div>test-asl-456</div>
  </div>
  <div>
    <div>concurrentenabled</div>
    <div>false</div>
  </div>
</div>
`;

describe('Mobile Rider Module', () => {
  let mockFetch;
  let mockLana;
  let riderInstance = null;

  beforeEach(() => {
    // Mock fetch
    mockFetch = sinon.stub(globalThis, 'fetch');
    mockFetch.resolves({
      ok: true,
      json: () => Promise.resolve({ active: ['test-video-123'] }),
    });

    // Mock lana
    mockLana = { log: sinon.stub() };
    globalThis.lana = mockLana;

    // Mock mobilerider
    globalThis.mobilerider = { embed: sinon.stub() };

    // Mock window.__mr_player
    globalThis.__mr_player = {
      dispose: sinon.stub(),
      off: sinon.stub(),
      on: sinon.stub(),
    };
  });

  afterEach(() => {
    sinon.restore();
    document.body.innerHTML = '';
    delete globalThis.lana;
    delete globalThis.mobilerider;
    delete globalThis.__mr_player;
    riderInstance = null;
  });

  describe('init', () => {
    it('should initialize MobileRider with valid element', async () => {
      document.body.innerHTML = defaultHtml;
      const el = document.querySelector('.mobile-rider');
      expect(el).to.not.be.null;

      riderInstance = init(el);
      expect(riderInstance).to.not.be.null;
      expect(riderInstance.el).to.equal(el);

      // Wait for async operations
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const player = el.querySelector('.mobile-rider-player');
      expect(player).to.not.be.null;
      const wrapper = player.querySelector('.video-wrapper');
      expect(wrapper).to.not.be.null;
    });

    it('should handle initialization errors gracefully', async () => {
      // Mock createTag to throw an error
      const originalCreateTag = globalThis.createTag;
      globalThis.createTag = () => { throw new Error('Test error'); };

      document.body.innerHTML = defaultHtml;
      const el = document.querySelector('.mobile-rider');
      const result = init(el);

      globalThis.createTag = originalCreateTag;
      expect(result).to.not.be.undefined;
    });
  });

  describe('MobileRider class methods', () => {
    let el;

    beforeEach(async () => {
      document.body.innerHTML = defaultHtml;
      el = document.querySelector('.mobile-rider');

      // Initialize and capture the instance
      riderInstance = init(el);
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      // Ensure we have a valid instance
      expect(riderInstance).to.not.be.null;
    });

    describe('loadPlayer', () => {
      it('should load player successfully', async () => {
        riderInstance.cfg = { skinid: 'default-skin' };

        const originalInjectPlayer = riderInstance.injectPlayer;
        const injectPlayerStub = sinon.stub();
        riderInstance.injectPlayer = injectPlayerStub;

        await riderInstance.loadPlayer('test-video', 'test-asl');

        expect(injectPlayerStub.calledWith('test-video', 'default-skin', 'test-asl')).to.be.true;

        riderInstance.injectPlayer = originalInjectPlayer;
      });

      it('should handle player loading errors', async () => {
        riderInstance.cfg = { skinid: 'default-skin' };

        const originalInjectPlayer = riderInstance.injectPlayer;
        riderInstance.injectPlayer = sinon.stub().throws(new Error('Player creation failed'));

        await riderInstance.loadPlayer('test-video', 'test-asl');

        expect(mockLana.log.calledWith('Failed to initialize the player: Player creation failed')).to.be.true;

        riderInstance.injectPlayer = originalInjectPlayer;
      });
    });

    describe('extractPlayerOverrides', () => {
      it('should extract player overrides correctly', () => {
        riderInstance.cfg = { autoplay: 'true', controls: 'false', muted: 'true' };

        const overrides = riderInstance.extractPlayerOverrides();

        expect(overrides.autoplay).to.be.true;
        expect(overrides.controls).to.be.false;
        expect(overrides.muted).to.be.true;
      });

      it('should handle missing overrides', () => {
        riderInstance.cfg = {};

        const overrides = riderInstance.extractPlayerOverrides();

        expect(overrides).to.deep.equal({});
      });
    });

    describe('getPlayerOptions', () => {
      it('should return merged player options', () => {
        riderInstance.cfg = { autoplay: 'false' };

        const options = riderInstance.getPlayerOptions();

        expect(options.autoplay).to.be.false;
        expect(options.controls).to.be.true; // default
        expect(options.muted).to.be.true; // default
      });
    });

    describe('injectPlayer', () => {
      beforeEach(() => {
        const videoWrapper = document.createElement('div');
        videoWrapper.className = 'video-wrapper';
        el.appendChild(videoWrapper);
        riderInstance.wrap = videoWrapper;
      });

      it('should inject player with correct attributes', () => {
        riderInstance.injectPlayer('test-video', 'test-skin', 'test-asl');

        const container = riderInstance.wrap.querySelector('.mobile-rider-container');
        expect(container).to.not.be.null;
        expect(container.getAttribute('data-videoid')).to.equal('test-video');
        expect(container.getAttribute('data-skinid')).to.equal('test-skin');
        expect(container.getAttribute('data-aslid')).to.equal('test-asl');
      });

      it('should create video element', () => {
        riderInstance.injectPlayer('test-video', 'test-skin', 'test-asl');

        const video = riderInstance.wrap.querySelector('#idPlayer');
        expect(video).to.not.be.null;
        expect(video.classList.contains('mobileRider_viewport')).to.be.true;
      });

      it('should embed mobilerider player', () => {
        riderInstance.injectPlayer('test-video', 'test-skin', 'test-asl');

        expect(globalThis.mobilerider.embed.called).to.be.true;
      });

      it('should call onStreamEnd when mainID exists in store', () => {
        riderInstance.mainID = 'main-video';
        riderInstance.store = { get: sinon.stub().returns(true) };
        riderInstance.onStreamEnd = sinon.stub();

        riderInstance.injectPlayer('test-video', 'test-skin');

        expect(riderInstance.onStreamEnd.calledWith('test-video')).to.be.true;
      });

      it('should call onStreamEnd when mainID is undefined but vid exists in store', () => {
        riderInstance.mainID = 'main-video';
        riderInstance.store = {
          get: sinon.stub().callsFake((key) => {
            // mainID returns undefined, but vid returns true
            if (key === 'main-video') return undefined;
            if (key === 'test-video') return true;
            return undefined;
          }),
        };
        riderInstance.onStreamEnd = sinon.stub();

        riderInstance.injectPlayer('test-video', 'test-skin');

        expect(riderInstance.onStreamEnd.calledWith('test-video')).to.be.true;
      });

      it('should not call onStreamEnd when neither mainID nor vid exists in store', () => {
        riderInstance.mainID = 'main-video';
        riderInstance.store = { get: sinon.stub().returns(undefined) };
        riderInstance.onStreamEnd = sinon.stub();

        riderInstance.injectPlayer('test-video', 'test-skin');

        expect(riderInstance.onStreamEnd.called).to.be.false;
      });

      it('should not call onStreamEnd when store is null', () => {
        riderInstance.mainID = 'main-video';
        riderInstance.store = null;
        riderInstance.onStreamEnd = sinon.stub();

        riderInstance.injectPlayer('test-video', 'test-skin');

        expect(riderInstance.onStreamEnd.called).to.be.false;
      });

      it('should prioritize mainID over vid when both exist in store', () => {
        riderInstance.mainID = 'main-video';
        riderInstance.store = {
          get: sinon.stub().callsFake((key) => {
            // Both mainID and vid return true, but mainID should be prioritized
            if (key === 'main-video') return true;
            if (key === 'test-video') return true;
            return undefined;
          }),
        };
        riderInstance.onStreamEnd = sinon.stub();

        riderInstance.injectPlayer('test-video', 'test-skin');

        // Should still call onStreamEnd since mainID exists
        expect(riderInstance.onStreamEnd.calledWith('test-video')).to.be.true;
      });
    });

    describe('onStreamEnd', () => {
      it('should set up stream end handler', () => {
        riderInstance.onStreamEnd('test-video');

        expect(globalThis.__mr_player.off.calledWith('streamend')).to.be.true;
        expect(globalThis.__mr_player.on.calledWith('streamend')).to.be.true;
      });
    });

    describe('dispose', () => {
      it('should dispose player and reset globals', async () => {
        // Ensure __mr_player exists before calling dispose
        const disposeStub = sinon.stub();
        globalThis.__mr_player = {
          dispose: disposeStub,
          off: sinon.stub(),
          on: sinon.stub(),
        };

        // Access MobileRider class through the instance constructor
        const MobileRider = riderInstance.constructor;
        MobileRider.dispose();

        expect(disposeStub.called).to.be.true;
        expect(globalThis.__mr_player).to.be.null;
        expect(globalThis.__mr_stream_published).to.be.null;
      });

      it('should handle dispose when player is null', async () => {
        globalThis.__mr_player = null;

        // Access MobileRider class through the instance constructor
        const MobileRider = riderInstance.constructor;
        expect(() => MobileRider.dispose()).to.not.throw();
      });
    });

    describe('drawerHeading', () => {
      it('should create drawer heading with correct content', () => {
        const header = riderInstance.drawerHeading();

        expect(header.classList.contains('now-playing-header')).to.be.true;
        expect(header.innerHTML).to.include('Now Playing');
        expect(header.innerHTML).to.include('Select a live session');
      });
    });

    describe('initDrawer', () => {
      it('should handle drawer initialization', async () => {
        const videos = [
          { videoid: 'video1', title: 'Video 1', description: 'Desc 1', thumbnail: 'thumb1.jpg' },
          { videoid: 'video2', title: 'Video 2', description: 'Desc 2', thumbnail: 'thumb2.jpg' },
        ];

        // Just verify the method executes without throwing
        expect(() => riderInstance.initDrawer(videos)).to.not.throw();
      });

      it('should handle drawer initialization errors', async () => {
        const videos = [{ videoid: 'video1' }];

        // Mock the createTag to throw an error
        const originalCreateTag = globalThis.createTag;
        globalThis.createTag = () => { throw new Error('Import failed'); };

        // Just verify the method doesn't throw (it should catch the error)
        expect(() => riderInstance.initDrawer(videos)).to.not.throw();

        globalThis.createTag = originalCreateTag;
      });
    });

    describe('onDrawerClick', () => {
      it('should handle drawer item click successfully', async () => {
        riderInstance.store = { get: sinon.stub() };
        riderInstance.checkLive = sinon.stub().resolves(true);
        riderInstance.injectPlayer = sinon.stub();

        const video = { videoid: 'test-video', aslid: 'test-asl' };
        await riderInstance.onDrawerClick(video);

        expect(riderInstance.injectPlayer.calledWith('test-video', undefined, 'test-asl')).to.be.true;
      });

      it('should handle non-live stream click', async () => {
        riderInstance.store = { get: sinon.stub() };
        riderInstance.checkLive = sinon.stub().resolves(false);
        riderInstance.injectPlayer = sinon.stub();

        const video = { videoid: 'test-video' };
        await riderInstance.onDrawerClick(video);

        expect(mockLana.log.calledWith('This stream is not currently live: test-video')).to.be.true;
        expect(riderInstance.injectPlayer.calledWith('test-video', undefined, undefined)).to.be.true;
      });

      it('should handle click errors', async () => {
        riderInstance.store = { get: sinon.stub() };
        riderInstance.checkLive = sinon.stub().rejects(new Error('Click failed'));
        riderInstance.injectPlayer = sinon.stub();

        const video = { videoid: 'test-video' };
        await riderInstance.onDrawerClick(video);

        expect(mockLana.log.calledWith('Drawer item click error: Click failed')).to.be.true;
      });

      it('should handle click when store is not available', async () => {
        riderInstance.store = null;
        riderInstance.injectPlayer = sinon.stub();

        const video = { videoid: 'test-video', aslid: 'test-asl' };
        await riderInstance.onDrawerClick(video);

        // Should still call injectPlayer even without store
        expect(riderInstance.injectPlayer.calledWith('test-video', undefined, 'test-asl')).to.be.true;
      });
    });

    describe('getMediaStatus', () => {
      let MobileRider;

      beforeEach(async () => {
        // Access MobileRider class through the instance constructor
        MobileRider = riderInstance.constructor;
      });

      it('should fetch media status successfully', async () => {
        const result = await MobileRider.getMediaStatus('test-video');

        expect(mockFetch.called).to.be.true;
        expect(result).to.deep.equal({ active: ['test-video-123'] });
      });

      it('should handle API errors', async () => {
        mockFetch.resolves({
          ok: false,
          json: () => Promise.resolve({ message: 'API Error' }),
        });

        try {
          await MobileRider.getMediaStatus('test-video');
        } catch (e) {
          expect(e.message).to.include('API Error');
        }
      });

      it('should handle network errors', async () => {
        mockFetch.rejects(new Error('Network error'));

        try {
          await MobileRider.getMediaStatus('test-video');
        } catch (e) {
          expect(e.message).to.equal('Network error');
        }
      });
    });

    describe('checkLive', () => {
      let MobileRider;

      beforeEach(async () => {
        // Access MobileRider class through the instance constructor
        MobileRider = riderInstance.constructor;
      });

      it('should check live status successfully', async () => {
        sinon.stub(MobileRider, 'getMediaStatus').resolves({ active: ['test-video'] });
        riderInstance.setStatus = sinon.stub();
        const video = { videoid: 'test-video' };

        const result = await riderInstance.checkLive(video);

        expect(result).to.be.true;
        expect(riderInstance.setStatus.calledWith('test-video', true)).to.be.true;
      });

      it('should handle missing videoid', async () => {
        const result = await riderInstance.checkLive({});

        expect(result).to.be.false;
      });

      it('should handle check errors', async () => {
        sinon.stub(MobileRider, 'getMediaStatus').rejects(new Error('Check failed'));
        const video = { videoid: 'test-video' };

        const result = await riderInstance.checkLive(video);

        expect(result).to.be.false;
      });
    });

    describe('setStatus', () => {
      it('should use mainID when it exists in store', () => {
        riderInstance.mainID = 'main-video';
        const mockStore = {
          get: sinon.stub().returns(false), // Current status is false
          set: sinon.stub(),
        };
        riderInstance.store = mockStore;

        riderInstance.setStatus('test-video', true);

        expect(mockStore.set.calledWith('main-video', true)).to.be.true;
      });

      it('should use videoID when mainID does not exist in store', () => {
        riderInstance.mainID = 'main-video';
        const mockStore = {
          get: sinon.stub().callsFake((key) => {
            // mainID doesn't exist, but videoID does
            if (key === 'main-video') return undefined;
            if (key === 'test-video') return false;
            return undefined;
          }),
          set: sinon.stub(),
        };
        riderInstance.store = mockStore;

        riderInstance.setStatus('test-video', true);

        expect(mockStore.set.calledWith('test-video', true)).to.be.true;
      });

      it('should return early when neither mainID nor videoID exists in store', () => {
        riderInstance.mainID = 'main-video';
        const mockStore = {
          get: sinon.stub().returns(undefined), // Neither exists
          set: sinon.stub(),
        };
        riderInstance.store = mockStore;

        riderInstance.setStatus('test-video', true);

        // Should not call set because no valid key was found
        expect(mockStore.set.called).to.be.false;
      });

      it('should use videoID when mainID is null and videoID exists in store', () => {
        riderInstance.mainID = null;
        const mockStore = {
          get: sinon.stub().returns(false), // videoID exists
          set: sinon.stub(),
        };
        riderInstance.store = mockStore;

        riderInstance.setStatus('test-video', true);

        expect(mockStore.set.calledWith('test-video', true)).to.be.true;
      });

      it('should return early when mainID is null and videoID does not exist in store', () => {
        riderInstance.mainID = null;
        const mockStore = {
          get: sinon.stub().returns(undefined), // videoID doesn't exist
          set: sinon.stub(),
        };
        riderInstance.store = mockStore;

        riderInstance.setStatus('test-video', true);

        // Should not call set because no valid key was found
        expect(mockStore.set.called).to.be.false;
      });

      it('should not update store when status is the same', () => {
        riderInstance.mainID = 'main-video';
        const mockStore = {
          get: sinon.stub().returns(true), // Current status is true
          set: sinon.stub(),
        };
        riderInstance.store = mockStore;

        riderInstance.setStatus('test-video', true);

        expect(mockStore.set.called).to.be.false;
      });

      it('should handle missing store', () => {
        expect(() => riderInstance.setStatus('test-video', true)).to.not.throw();
      });

      it('should handle missing id parameter', () => {
        riderInstance.store = { get: sinon.stub(), set: sinon.stub() };

        riderInstance.setStatus(null, true);

        expect(riderInstance.store.set.called).to.be.false;
      });
    });

    describe('initASL', () => {
      it('should initialize ASL button', () => {
        const container = document.createElement('div');
        const button = document.createElement('button');
        button.id = 'asl-button';
        container.appendChild(button);
        riderInstance.wrap = { querySelector: sinon.stub().returns(container) };
        riderInstance.setupASL = sinon.stub();

        riderInstance.initASL();

        expect(riderInstance.setupASL.calledWith(button, container)).to.be.true;
      });

      it('should handle missing container', () => {
        riderInstance.wrap = null;

        expect(() => riderInstance.initASL()).to.not.throw();
      });
    });

    describe('setupASL', () => {
      it('should setup ASL button click handler', () => {
        const btn = document.createElement('button');
        const con = document.createElement('div');
        riderInstance.initASL = sinon.stub();

        riderInstance.setupASL(btn, con);

        btn.click();

        expect(con.classList.contains('isASL')).to.be.true;
        expect(riderInstance.initASL.called).to.be.true;
      });

      it('should not add class if already present', () => {
        const btn = document.createElement('button');
        const con = document.createElement('div');
        con.classList.add('isASL');
        riderInstance.initASL = sinon.stub();

        riderInstance.setupASL(btn, con);

        btn.click();

        expect(riderInstance.initASL.called).to.be.false;
      });
    });
  });

  describe('Configuration parsing', () => {
    it('should parse basic configuration correctly', () => {
      document.body.innerHTML = defaultHtml;
      const el = document.querySelector('.mobile-rider');
      const meta = Object.fromEntries(
        [...el.querySelectorAll(':scope > div > div:first-child')].map((div) => [
          div.textContent.trim().toLowerCase().replace(/ /g, '-'),
          div.nextElementSibling?.textContent?.trim() || '',
        ]),
      );
      expect(meta['video-id']).to.equal('test-video-123');
      expect(meta['skin-id']).to.equal('default-skin');
      expect(meta.autoplay).to.equal('true');
    });

    it('should parse concurrent configuration correctly', async () => {
      const concurrentHtml = `
        <div class="mobile-rider">
          <div>
            <div>concurrentenabled</div>
            <div>true</div>
          </div>
          <div>
            <div>concurrentvideoid1</div>
            <div>video1</div>
          </div>
          <div>
            <div>concurrentvideoid2</div>
            <div>video2</div>
          </div>
          <div>
            <div>concurrenttitle1</div>
            <div>Title 1</div>
          </div>
          <div>
            <div>concurrenttitle2</div>
            <div>Title 2</div>
          </div>
        </div>
      `;

      document.body.innerHTML = concurrentHtml;
      const el = document.querySelector('.mobile-rider');
      const instance = init(el);

      // Wait for async initialization
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      expect(instance.cfg.concurrentenabled).to.be.true;
      expect(instance.cfg.concurrentVideos).to.have.lengthOf(2);
      expect(instance.cfg.concurrentVideos[0].videoid).to.equal('video1');
      expect(instance.cfg.concurrentVideos[1].videoid).to.equal('video2');
    });
  });

  describe('Concurrent Live Stream Management', () => {
    let concurrentInstance;
    let MobileRider;

    beforeEach(async () => {
      const concurrentHtml = `
        <div class="mobile-rider">
          <div>
            <div>video-id</div>
            <div>main-video</div>
          </div>
          <div>
            <div>skin-id</div>
            <div>default-skin</div>
          </div>
          <div>
            <div>concurrentenabled</div>
            <div>true</div>
          </div>
          <div>
            <div>concurrentvideoid1</div>
            <div>video1</div>
          </div>
          <div>
            <div>concurrentvideoid2</div>
            <div>video2</div>
          </div>
        </div>
      `;

      document.body.innerHTML = concurrentHtml;
      const el = document.querySelector('.mobile-rider');
      concurrentInstance = init(el);
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      // Access MobileRider class through the instance constructor
      MobileRider = concurrentInstance.constructor;
    });

    it('should maintain mainID reference and use it for status checks', async () => {
      // Set up store and mainID manually since they're set during async init
      concurrentInstance.store = { get: sinon.stub(), set: sinon.stub() };
      concurrentInstance.mainID = 'video1';

      sinon.stub(MobileRider, 'getMediaStatus').resolves({ active: ['video1'] });

      const video = { videoid: 'video2' };
      await concurrentInstance.checkLive(video);

      // Should use mainID for API call
      expect(MobileRider.getMediaStatus.calledWith('video1')).to.be.true;
    });

    it('should only update store when status actually changes', async () => {
      concurrentInstance.mainID = 'video1';
      const mockStore = {
        get: sinon.stub().returns(true), // Current status is true
        set: sinon.stub(),
      };
      concurrentInstance.store = mockStore;

      sinon.stub(MobileRider, 'getMediaStatus').resolves({ active: ['video1'] });

      const video = { videoid: 'video1' };
      await concurrentInstance.checkLive(video);

      // Should not update store since status hasn't changed
      expect(mockStore.set.called).to.be.false;
    });

    it('should update store when status changes', async () => {
      concurrentInstance.mainID = 'video1';
      const mockStore = {
        get: sinon.stub().returns(true), // Current status is true
        set: sinon.stub(),
      };
      concurrentInstance.store = mockStore;

      // Status changed to false
      sinon.stub(MobileRider, 'getMediaStatus').resolves({ active: [] });

      const video = { videoid: 'video1' };
      await concurrentInstance.checkLive(video);

      // Should update store since status changed
      expect(mockStore.set.calledWith('video1', false)).to.be.true;
    });

    it('should handle API errors gracefully', async () => {
      concurrentInstance.mainID = 'video1';
      const mockStore = {
        get: sinon.stub().returns(true),
        set: sinon.stub(),
      };
      concurrentInstance.store = mockStore;

      sinon.stub(MobileRider, 'getMediaStatus').rejects(new Error('API Error'));

      const video = { videoid: 'video1' };
      const result = await concurrentInstance.checkLive(video);

      expect(result).to.be.false;
      expect(mockStore.set.called).to.be.false;
    });
  });
});
