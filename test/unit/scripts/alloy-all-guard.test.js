/* eslint-disable no-underscore-dangle */
import { expect } from '@esm-bundle/chai';
import installAlloyAllGuard, { isSpreadCopy } from '../../../events/scripts/alloy-all-guard.js';

// Mirrors Launch: get()/set() are bound to the object they were created for.
function createLaunchAlloyAll() {
  const target = { data: { _adobe_corpnew: { digitalData: { custom: { existing: 'keep' } } } } };
  target.get = (path) => path.split('.').reduce((node, key) => node?.[key], target);
  target.set = (path, value) => {
    const keys = path.split('.');
    keys.reduce((node, key, i) => {
      if (i === keys.length - 1) node[key] = value;
      else node[key] = node[key] || {};
      return node[key];
    }, target);
  };
  return target;
}

// Verbatim shape of federal's universal nav ARP tokenCallback.
function federalTokenCallback(win, token) {
  const existingCustom = win.alloy_all?.data?._adobe_corpnew?.digitalData?.custom;
  win.alloy_all = {
    ...win.alloy_all,
    data: {
      ...win.alloy_all?.data,
      _adobe_corpnew: {
        ...win.alloy_all?.data?._adobe_corpnew,
        digitalData: {
          ...win.alloy_all?.data?._adobe_corpnew?.digitalData,
          custom: { ...existingCustom, arp_token: token },
        },
      },
    },
  };
}

describe('alloy-all-guard', () => {
  let win;

  beforeEach(() => {
    win = {};
  });

  it('keeps the original object when federal spreads a copy, and merges the token into it', () => {
    installAlloyAllGuard(win);
    const launch = createLaunchAlloyAll();
    win.alloy_all = launch;

    federalTokenCallback(win, 'TOKEN');

    expect(win.alloy_all).to.equal(launch);
    expect(win.alloy_all.get('data._adobe_corpnew.digitalData.custom.arp_token')).to.equal('TOKEN');
    expect(win.alloy_all.data._adobe_corpnew.digitalData.custom.existing).to.equal('keep');
  });

  it('keeps Launch writes visible to direct data readers after the token arrives', () => {
    installAlloyAllGuard(win);
    win.alloy_all = createLaunchAlloyAll();
    federalTokenCallback(win, 'TOKEN');

    win.alloy_all.set('data.mediaCollection.sessionDetails.name', 'h1pPWQlYJL');

    expect(win.alloy_all.data.mediaCollection.sessionDetails.name).to.equal('h1pPWQlYJL');
  });

  it('handles repeated token callbacks', () => {
    installAlloyAllGuard(win);
    const launch = createLaunchAlloyAll();
    win.alloy_all = launch;

    federalTokenCallback(win, 'T1');
    federalTokenCallback(win, 'T2');

    expect(win.alloy_all).to.equal(launch);
    expect(launch.get('data._adobe_corpnew.digitalData.custom.arp_token')).to.equal('T2');
  });

  it('passes through first assignment, same-object and genuine replacements', () => {
    installAlloyAllGuard(win);
    const miloStub = { get: () => {}, set: () => {} };
    win.alloy_all = miloStub;
    expect(win.alloy_all).to.equal(miloStub);

    win.alloy_all = miloStub;
    expect(win.alloy_all).to.equal(miloStub);

    const launch = createLaunchAlloyAll();
    win.alloy_all = launch;
    expect(win.alloy_all).to.equal(launch);

    win.alloy_all = undefined;
    expect(win.alloy_all).to.equal(undefined);
  });

  it('preserves a value that existed before install', () => {
    const launch = createLaunchAlloyAll();
    win.alloy_all = launch;
    installAlloyAllGuard(win);
    expect(win.alloy_all).to.equal(launch);
  });

  it('replaces arrays instead of merging them', () => {
    installAlloyAllGuard(win);
    const launch = createLaunchAlloyAll();
    launch.data.list = [1, 2, 3];
    win.alloy_all = launch;

    win.alloy_all = { ...launch, data: { ...launch.data, list: [9] } };

    expect(launch.data.list).to.deep.equal([9]);
  });

  it('ignores prototype-polluting keys when merging', () => {
    installAlloyAllGuard(win);
    const launch = createLaunchAlloyAll();
    win.alloy_all = launch;

    const copy = { ...launch, data: { ...launch.data } };
    Object.defineProperty(copy.data, '__proto__', { value: { polluted: true }, enumerable: true });
    copy.data.constructor = { prototype: { polluted: true } };
    copy.data.prototype = { polluted: true };
    copy.data.safe = 'ok';
    win.alloy_all = copy;

    expect(win.alloy_all).to.equal(launch);
    expect(launch.data.safe).to.equal('ok');
    expect(Object.prototype.hasOwnProperty.call(launch.data, 'prototype')).to.equal(false);
    expect(launch.data.constructor).to.equal(Object);
    expect(({}).polluted).to.equal(undefined);
    expect(launch.data.polluted).to.equal(undefined);
  });

  it('does not install over a non-configurable or accessor property', () => {
    const locked = {};
    Object.defineProperty(locked, 'alloy_all', { value: 1, configurable: false, writable: true });
    expect(installAlloyAllGuard(locked)).to.equal(false);

    const trapped = {};
    Object.defineProperty(trapped, 'alloy_all', { configurable: true, get: () => 2, set: () => {} });
    expect(installAlloyAllGuard(trapped)).to.equal(false);
    expect(trapped.alloy_all).to.equal(2);
  });

  it('is idempotent', () => {
    expect(installAlloyAllGuard(win)).to.equal(true);
    expect(installAlloyAllGuard(win)).to.equal(false);
  });

  it('isSpreadCopy only matches a new object sharing the current set()', () => {
    const set = () => {};
    const current = { set, data: {} };
    expect(isSpreadCopy({ ...current }, current)).to.equal(true);
    expect(isSpreadCopy(current, current)).to.equal(false);
    expect(isSpreadCopy({ set: () => {} }, current)).to.equal(false);
    expect(isSpreadCopy({ data: {} }, { data: {} })).to.equal(false);
    expect(isSpreadCopy(null, current)).to.equal(false);
  });
});
