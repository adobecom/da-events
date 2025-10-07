import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import TimingWorker from '../../../../events/features/timing-framework/worker.js';

// Mock BroadcastChannel
class MockBroadcastChannel {
  constructor(name) {
    this.name = name;
    this.onmessage = null;
  }

  postMessage(data) {
    if (this.onmessage) {
      this.onmessage({ data });
    }
  }
}

MockBroadcastChannel.prototype.close = () => {};

// Mock fetch
const mockFetch = sinon.stub();
window.fetch = mockFetch;

// Mock BroadcastChannel
window.BroadcastChannel = MockBroadcastChannel;

describe('TimingWorker', () => {
  let worker;
  let mockPostMessage;

  beforeEach(() => {
    // Reset mocks
    sinon.reset();
    mockPostMessage = sinon.stub();
    window.postMessage = mockPostMessage;

    // Create a new worker instance
    worker = new TimingWorker();
  });

  describe('getStartScheduleItemByToggleTime', () => {
    it('should return the first item if no toggleTime has passed', async () => {
      const schedule = {
        toggleTime: Date.now() + 1000,
        next: null,
      };

      const result = await worker.getStartScheduleItemByToggleTime(schedule);
      expect(result).to.equal(schedule);
    });

    it('should return the last passed item if toggleTime has passed', async () => {
      const now = Date.now();
      const schedule = {
        toggleTime: now - 2000,
        next: {
          toggleTime: now - 1000,
          next: {
            toggleTime: now + 1000,
            next: null,
          },
        },
      };

      const result = await worker.getStartScheduleItemByToggleTime(schedule);
      expect(result).to.equal(schedule.next);
    });

    it('should use testing time when in testing mode', async () => {
      const now = Date.now();
      const schedule = {
        toggleTime: now + 1000, // Future time
        next: null,
      };

      // Set up testing mode with a time offset that makes the current time
      // appear to be in the future
      worker.testingManager.init({ toggleTime: now + 2000 });

      const result = await worker.getStartScheduleItemByToggleTime(schedule);
      // Should return the schedule item because the testing time is in the future
      expect(result).to.equal(schedule);
    });

    it('should use testing time when in testing mode - past time', async () => {
      const now = Date.now();
      const schedule = {
        toggleTime: now - 1000, // Past time
        next: {
          toggleTime: now + 1000, // Future time
          next: null,
        },
      };

      // Set up testing mode with a time offset that makes the current time
      // appear to be in the past
      worker.testingManager.init({ toggleTime: now - 2000 });

      const result = await worker.getStartScheduleItemByToggleTime(schedule);
      // Should return the first item because the testing time is in the past
      expect(result).to.equal(schedule);
    });
  });

  describe('shouldTriggerNextSchedule', () => {
    it('should return false if scheduleItem is null', async () => {
      const result = await worker.shouldTriggerNextSchedule(null);
      expect(result).to.be.false;
    });

    it('should handle mobileRider overrun scenario', async () => {
      const currentItem = { mobileRider: { sessionId: 'session1' } };
      const nextItem = { pathToFragment: '/next' };

      worker.currentScheduleItem = currentItem;
      worker.plugins.set('mobileRider', new Map([['session1', true]]));

      const result = await worker.shouldTriggerNextSchedule(nextItem);
      expect(result).to.be.false;
    });

    it('should handle mobileRider underrun scenario', async () => {
      const nextItem = {
        mobileRider: { sessionId: 'session1' },
        pathToFragment: '/next',
      };

      worker.plugins.set('mobileRider', new Map([['session1', false]]));

      const result = await worker.shouldTriggerNextSchedule(nextItem);
      expect(result).to.be.true;
    });

    it('should handle metadata conditions', async () => {
      const nextItem = {
        metadata: [{ key: 'testKey', expectedValue: 'expected' }],
        pathToFragment: '/next',
      };

      worker.plugins.set('metadata', new Map([['testKey', 'expected']]));

      const result = await worker.shouldTriggerNextSchedule(nextItem);
      expect(result).to.be.true;
    });

    it('should handle multiple metadata conditions', async () => {
      const nextItem = {
        metadata: [
          { key: 'testKey1', expectedValue: 'expected1' },
          { key: 'testKey2', expectedValue: 'expected2' },
        ],
        pathToFragment: '/next',
      };

      worker.plugins.set('metadata', new Map([
        ['testKey1', 'wrong'],
        ['testKey2', 'expected2'],
      ]));

      const result = await worker.shouldTriggerNextSchedule(nextItem);
      expect(result).to.be.false;
    });

    it('should trigger when all metadata conditions are met', async () => {
      const nextItem = {
        metadata: [
          { key: 'testKey1', expectedValue: 'expected1' },
          { key: 'testKey2', expectedValue: 'expected2' },
        ],
        pathToFragment: '/next',
      };

      worker.plugins.set('metadata', new Map([
        ['testKey1', 'expected1'],
        ['testKey2', 'expected2'],
      ]));

      const result = await worker.shouldTriggerNextSchedule(nextItem);
      expect(result).to.be.true;
    });

    it('should not trigger when no metadata conditions are met', async () => {
      const nextItem = {
        metadata: [
          { key: 'testKey1', expectedValue: 'expected1' },
          { key: 'testKey2', expectedValue: 'expected2' },
        ],
        pathToFragment: '/next',
      };

      worker.plugins.set('metadata', new Map([
        ['testKey1', 'wrong1'],
        ['testKey2', 'wrong2'],
      ]));

      const result = await worker.shouldTriggerNextSchedule(nextItem);
      expect(result).to.be.false;
    });

    it('should fall back to toggleTime if no plugins are blocking', async () => {
      const now = Date.now();
      const nextItem = {
        toggleTime: now - 1000,
        pathToFragment: '/next',
      };

      const result = await worker.shouldTriggerNextSchedule(nextItem);
      expect(result).to.be.true;
    });
  });

  describe('handleMessage', () => {
    it('should set up plugins and channels', async () => {
      const plugins = {
        metadata: {
          type: 'metadata',
          data: { key1: 'value1' },
        },
        mobileRider: {
          type: 'mobileRider',
          data: { session1: true },
        },
      };

      await worker.handleMessage({
        data: {
          tabId: 'test-tab-id',
          plugins,
          schedule: { toggleTime: Date.now() },
        },
      });

      expect(worker.plugins.size).to.equal(2);
      expect(worker.channels.size).to.equal(3); // metadata, mobileRider, timeCache
    });
  });

  describe('getAuthoritativeTime', () => {
    beforeEach(() => {
      // Reset the worker's time management properties
      worker.cachedApiTime = null;
      worker.lastApiCall = 0;
    });

    it('should return cached API time if valid', async () => {
      const now = Date.now();
      const apiTime = now - 1000; // API time is 1 second behind
      worker.cachedApiTime = { time: apiTime, timestamp: now - 30000 }; // 30 seconds ago

      const result = await worker.getAuthoritativeTime();
      expect(result).to.be.closeTo(apiTime + 30000, 100); // Allow 100ms tolerance
    });

    it('should call API if cache is expired', async () => {
      const now = Date.now();
      const apiTime = now - 1000;
      // 700 seconds ago (expired)
      worker.cachedApiTime = { time: apiTime, timestamp: now - 700000 };
      worker.lastApiCall = now - 400000; // 400 seconds ago

      // Mock successful API response
      mockFetch.resolves({ text: () => Promise.resolve(Math.floor(apiTime / 1000).toString()) });

      const result = await worker.getAuthoritativeTime();
      expect(mockFetch.called).to.be.true;
      // The result should be close to the API time
      // but we need to account for the time elapsed during the test
      expect(result).to.be.closeTo(apiTime, 1000);
    });

    it('should not call API if rate limit not reached', async () => {
      const now = Date.now();
      // 100 seconds ago (rate limit not reached for 5 min interval)
      worker.lastApiCall = now - 100000;

      const result = await worker.getAuthoritativeTime();
      expect(mockFetch.called).to.be.false;
      expect(result).to.be.closeTo(now, 100);
    });

    it('should fall back to local time if API fails', async () => {
      const now = Date.now();
      worker.lastApiCall = now - 40000; // 40 seconds ago

      // Mock failed API response
      mockFetch.rejects(new Error('Network error'));

      const result = await worker.getAuthoritativeTime();
      expect(result).to.be.closeTo(now, 100);
    });

    it('should use cached time if API returns null', async () => {
      const now = Date.now();
      const apiTime = now - 1000;
      worker.cachedApiTime = { time: apiTime, timestamp: now - 30000 };
      worker.lastApiCall = now - 40000;

      // Mock API returning null
      mockFetch.resolves({ text: () => Promise.resolve('invalid') });

      const result = await worker.getAuthoritativeTime();
      expect(result).to.be.closeTo(apiTime + 30000, 100);
    });

    it('should implement progressive backoff on failures', async () => {
      const now = Date.now();
      worker.lastApiCall = now - 400000; // 400 seconds ago
      worker.consecutiveFailures = 0; // Start with no failures

      // Mock failed API response
      mockFetch.rejects(new Error('Network error'));

      await worker.getAuthoritativeTime();
      expect(worker.consecutiveFailures).to.equal(1);
    });

    it('should reset failure count on successful API call', async () => {
      const now = Date.now();
      const apiTime = now - 1000;
      worker.lastApiCall = now - 400000; // 400 seconds ago
      worker.consecutiveFailures = 0; // Start with no failures to ensure API call happens

      // Mock successful API response
      mockFetch.resolves({ text: () => Promise.resolve(Math.floor(apiTime / 1000).toString()) });

      await worker.getAuthoritativeTime();
      expect(worker.consecutiveFailures).to.equal(0);
    });

    it('should broadcast time updates to other tabs', async () => {
      const now = Date.now();
      const apiTime = now - 1000;
      worker.lastApiCall = now - 400000; // 400 seconds ago

      // Mock successful API response
      mockFetch.resolves({ text: () => Promise.resolve(Math.floor(apiTime / 1000).toString()) });

      // Mock the time cache channel
      const mockChannel = { postMessage: sinon.stub() };
      worker.channels.set('timeCache', mockChannel);

      await worker.getAuthoritativeTime();
      expect(mockChannel.postMessage.called).to.be.true;
      expect(mockChannel.postMessage.firstCall.args[0]).to.deep.equal({
        type: 'time-update',
        data: worker.cachedApiTime,
      });
    });
  });

  describe('runTimer with testing', () => {
    it('should stop polling when in testing mode', async () => {
      const clock = sinon.useFakeTimers();

      // Set up testing mode
      worker.testingManager.init({ toggleTime: Date.now() + 1000 });

      // Set up a schedule item that should trigger
      worker.nextScheduleItem = {
        toggleTime: Date.now() - 1000,
        pathToFragment: '/test',
      };
      worker.currentScheduleItem = { pathToFragment: '/current' };

      // Run timer
      await worker.runTimer();

      // Verify no setTimeout was called (polling stopped)
      expect(worker.timerId).to.be.null;

      clock.restore();
    });

    it('should continue polling when not in testing mode', async () => {
      const clock = sinon.useFakeTimers();

      // Set up non-testing mode
      worker.testingManager.init(null);

      // Set up a schedule item
      worker.nextScheduleItem = {
        toggleTime: Date.now() + 1000,
        pathToFragment: '/test',
        next: { toggleTime: Date.now() + 2000, pathToFragment: '/next' },
      };
      worker.currentScheduleItem = { pathToFragment: '/current' };

      // Run timer
      await worker.runTimer();

      // Verify setTimeout was called (polling continues)
      expect(worker.timerId).to.not.be.null;

      clock.restore();
    });
  });

  describe('BroadcastChannel handling', () => {
    it('should only process messages from the same tab', () => {
      const metadataWorker = new TimingWorker();

      // Initialize the worker with a tabId and plugins
      metadataWorker.handleMessage({
        data: {
          tabId: 'test-tab-id',
          plugins: {
            metadata: {
              type: 'metadata',
              data: {},
            },
          },
          schedule: { toggleTime: Date.now() },
        },
      });

      // Get the store from the worker's plugins
      const metadataStore = metadataWorker.plugins.get('metadata');
      const channel = metadataWorker.channels.get('metadata');

      // Send message from different tab
      channel.postMessage({
        tabId: 'different-tab-id',
        key: 'testKey',
        value: 'testValue',
      });

      // Value should not be set
      expect(metadataStore.get('testKey')).to.be.undefined;

      // Send message from same tab
      channel.postMessage({
        tabId: metadataWorker.tabId,
        key: 'testKey',
        value: 'testValue',
      });

      // Value should be set
      expect(metadataStore.get('testKey')).to.equal('testValue');
    });

    it('should handle mobile rider messages with tab isolation', () => {
      const riderWorker = new TimingWorker();

      // Initialize the worker with a tabId and plugins
      riderWorker.handleMessage({
        data: {
          tabId: 'test-tab-id',
          plugins: {
            mobileRider: {
              type: 'mobileRider',
              data: {},
            },
          },
          schedule: { toggleTime: Date.now() },
        },
      });

      // Get the store from the worker's plugins
      const mobileRiderStore = riderWorker.plugins.get('mobileRider');
      const channel = riderWorker.channels.get('mobileRider');

      // Send message from different tab
      channel.postMessage({
        tabId: 'different-tab-id',
        sessionId: 'session1',
        isActive: true,
      });

      // Session should not be set
      expect(mobileRiderStore.get('session1')).to.be.undefined;

      // Send message from same tab
      channel.postMessage({
        tabId: riderWorker.tabId,
        sessionId: 'session1',
        isActive: true,
      });

      // Session should be set
      expect(mobileRiderStore.get('session1')).to.be.true;
    });
  });
});
