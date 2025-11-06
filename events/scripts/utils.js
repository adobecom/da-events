export const LIBS = (() => {
  const { hostname, search } = window.location;
  if (!(hostname.includes('.hlx.') || hostname.includes('.aem.') || hostname.includes('local'))) return '/libs';
  const branch = new URLSearchParams(search).get('milolibs') || 'main';
  if (branch === 'local') return 'http://localhost:6456/libs';
  return branch.includes('--') ? `https://${branch}.aem.live/libs` : `https://${branch}--milo--adobecom.aem.live/libs`;
})();

export const EVENT_LIBS = (() => {
  const version = 'v1';
  const { hostname, search } = window.location;

  if (!(hostname.includes('.hlx.') || hostname.includes('.aem.') || hostname.includes('local'))) {
    return `/event-libs/${version}`;
  }

  const branch = new URLSearchParams(search).get('eventlibs') || 'main';
  if (branch === 'local') {
    return `http://localhost:3868/event-libs/${version}`;
  }

  if (branch.includes('--')) {
    return `https://${branch}.aem.live/event-libs/${version}`;
  }

  return `https://${branch}--event-libs--adobecom.aem.live/event-libs/${version}`;
})();
