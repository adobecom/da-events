# Registration Status Consumer Guide

This guide explains how any block, script, or repo (GNAV, `sessionGuide`, or
anything else on the page) can consume a user's event registration status
and RainFocus (RF) auth details, without needing to make its own RF call or
wait for Milo's MEP to get around to checking registration.

Source: [`events/scripts/registration-cache.js`](../events/scripts/registration-cache.js),
kicked off from [`events/scripts/scripts.js`](../events/scripts/scripts.js).

## Why this exists

MEP only checks registration once its own addon loading gets around to it,
and the RainFocus call it depends on takes >=1s minimum - on a high-traffic
page we don't want the DOM to wait on that. `scripts.js` kicks off this
resolution itself, as early as possible, independently of MEP, and exposes
the result on `window` so any consumer can read it - whether it loads before
or after the resolution finishes.

## Quick start

```js
// Just need to know if the user is registered (e.g. to show/hide a GNAV item)?
const { isRegistered, inPersonAttendee } = await window.events.getRegistrationStatus();

// Need to make your own RF-authenticated call (e.g. checking session favorites)?
const {
  isRegistered, inPersonAttendee, authToken, userKey,
} = await window.events.getRegistrationDetails();
```

Both are safe to call from anywhere on the page, at any time:
- If you call before resolution finishes, you get the same in-flight promise
  everyone else is waiting on.
- If you call after it's already resolved (e.g. your block loaded late), you
  get an already-resolved promise back instantly.
- No matter how many consumers call either one, there is only ever **one**
  underlying RF call - both getters share the same promise.

Always guard the call, since these globals only exist on pages with an
`event-code` metadata value:

```js
const details = await (window.events?.getRegistrationDetails?.()
  ?? Promise.resolve({ isRegistered: false }));
```

## API reference

### `window.events.getRegistrationStatus()`

Returns a `Promise` resolving to:

```js
{ isRegistered: boolean, inPersonAttendee: boolean }
```

Use this if you only need to gate rendering/visibility (e.g. GNAV deciding
whether to show a "My Events" link). This is the same shape broadcast on the
`registration:resolved` window event (see below).

### `window.events.getRegistrationDetails()`

Returns a `Promise` resolving to:

```js
{
  isRegistered: boolean,
  inPersonAttendee: boolean,
  authToken: string,  // live RF auth token
  userKey: string,    // RF user key
}
```

Use this if you need to make your own authenticated call to an RF endpoint
(e.g. checking whether a specific session is favorited). `authToken`/
`userKey` are real credentials - only request this if you actually need them.

**One landing-page nuance:** right after a user completes registration and
gets redirected back (the `feds_<eventCode>_registeredByRedirect` fast
path), `isRegistered` is `true` immediately, but `inPersonAttendee` may be
`undefined` (the redirect cookie only confirms registration, not attendee
type) and `authToken`/`userKey` may briefly be missing too (a background
call fills them in moments later, without delaying the fast path above).
Both self-correct on the next reload or in a new tab. If your code runs on
that exact landing page and needs those fields, treat their absence as "not
yet known" rather than "false"/"not registered".

### `registration:resolved` window event

```js
window.addEventListener('registration:resolved', (e) => {
  const { isRegistered, inPersonAttendee } = e.detail;
});
```

Only fires once, at the moment resolution completes, with the same shape as
`getRegistrationStatus()` (never includes `authToken`/`userKey`). **Prefer
the getters over this event** unless you have a specific reason to listen
for the transition - if your code loads after resolution already happened,
you'll miss the event entirely and hang forever waiting for it. The getters
don't have that race.

## Important: latency is not hidden from you

Neither getter magically returns "whatever's cached so far" - they resolve
only when the underlying resolution actually completes:

- **Fast path:** if a valid, unexpired cache entry already exists (see
  below), the promise resolves almost immediately, no network call.
- **Slow path:** if there's any gap in the cache (first visit on this
  device, a brand-new tab, an expired TTL), the getters block on a live
  fetch to RainFocus - which currently has **no timeout**. If that backend
  is cold-starting or slow, your `await` will hang for however long that
  takes.

Design accordingly - don't assume this call is instant, and don't block
critical rendering on it without your own fallback/timeout if that matters
for your use case.

## How the data is cached (for context, not required reading)

| Data | Storage | Scope | Why |
|---|---|---|---|
| `isRegistered`, `inPersonAttendee` | `localStorage` | Shared across tabs, TTL up to 24h | Non-sensitive gating flags - sharing across tabs avoids a redundant RF call every time the user opens a new tab. |
| `authToken`, `userKey` | `sessionStorage` | Current tab only | Live RF credentials - deliberately kept out of anything that persists on disk past the browser session. |

One consequence: a brand-new tab inherits the `localStorage` entry (so
`isRegistered`/`inPersonAttendee` are known instantly) but not the
`sessionStorage` one - so opening a new tab still triggers exactly one RF
call to obtain a fresh `authToken`/`userKey` for that tab, even though the
registration status itself was already known.

## Cross-repo consumption (e.g. from `event-libs`)

If your block lives in a separate repo/deployment (like `event-libs`), you
**cannot** `import` `registration-cache.js` directly - it's a different
origin/build. Only consume the data through `window.events.*`. Do not
attempt to read `localStorage`/`sessionStorage` cache keys directly from
another repo - the getters above are the supported contract; the storage
key format is an implementation detail and may change.

## Example: gating a GNAV item

```js
const { isRegistered } = await (window.events?.getRegistrationStatus?.()
  ?? Promise.resolve({ isRegistered: false }));

myGnavEventsLink.hidden = !isRegistered;
```

## Example: `sessionGuide` checking if a session is favorited

```js
export default async function decorateSessionGuide(el, { getMetadata, getConfig }) {
  const eventCode = getMetadata('event-code');
  const sessionId = el.dataset.sessionId;
  if (!eventCode || !sessionId) return;

  const { isRegistered, authToken, userKey } = await (
    window.events?.getRegistrationDetails?.() ?? Promise.resolve({ isRegistered: false })
  );
  if (!isRegistered || !authToken) return;

  const domainSuffix = getConfig()?.env?.name === 'prod' ? '' : '.stage';
  const response = await fetch(
    `https://www${domainSuffix}.adobe.com/events/api/rf-favorites/${eventCode}/${sessionId}`
      + `?user_key=${encodeURIComponent(userKey)}`,
    { headers: { Authorization: `Bearer ${authToken}` }, credentials: 'same-origin' },
  );
  const { isFavorite } = await response.json();
  el.classList.toggle('is-favorite', isFavorite);
}
```
