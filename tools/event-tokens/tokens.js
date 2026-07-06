/**
 * Event Tokens catalog.
 *
 * Source of truth for the `[[placeholder]]` tokens available on event detail pages,
 * curated from two upstream repos (not generated — keep in sync manually when either
 * side changes):
 *
 * - EMC (`web-src/src/utils/daPage/dom.js` `appendEventMetadata`/`createMetaTag`) emits
 *   one `<meta>` row per key of the populated event object, kebab-casing camelCase keys
 *   (`eventTitle` -> `event-title`). The populated object is built from `EventApiResponse`
 *   (`web-src/src/types/domain.ts`) plus enrichment in `daPageService.js`
 *   (`populateEventObject`, localization flattening, custom attributes, publishing
 *   profile metadata). So: the available token *keys* are the kebab-cased field names of
 *   that object.
 * - event-libs (`event-libs/v1/utils/decorate.js` + `utils.js` + `date-time-helper.js`)
 *   defines how `[[...]]` is *resolved and rendered* on the page — this is where the
 *   special-handling grammar below (arrays, nested paths, date massaging, conditionals,
 *   live state, icons) comes from.
 *
 * Each entry:
 *   category - grouping shown in the UI
 *   token    - the literal copy/insert string (or a representative pattern for grammar
 *              entries that aren't a single fixed key)
 *   label    - plain-English name
 *   example  - a static example of the rendered/resolved value
 *   note     - special-handling caveats an author needs to know
 */

export const TOKEN_CATALOG = [
  // --- Core / Identity ---------------------------------------------------
  {
    category: 'Core',
    token: '[[event-title]]',
    label: 'Event title',
    example: 'Adobe Summit 2026',
    note: 'Also used to build the page <title> ("<title> | Adobe Events").',
  },
  {
    category: 'Core',
    token: '[[description]]',
    label: 'Event description',
    example: '<p>Join us for three days of...</p>',
    note: 'Preserves rich-text formatting — the containing element keeps its authored HTML instead of being flattened to plain text.',
  },
  {
    category: 'Core',
    token: '[[event-id]]',
    label: 'Event ID',
    example: '36678',
    note: 'Internal identifier — useful for QA/debugging, not typically shown to visitors.',
  },
  {
    category: 'Core',
    token: '[[event-type]]',
    label: 'Event type',
    example: 'InPerson',
    note: 'One of InPerson / Virtual / Hybrid. Drives whether dates render in the event timezone or the viewer’s local timezone.',
  },

  // --- Dates & Times -------------------------------------------------------
  {
    category: 'Dates & Times',
    token: '[[user-event-date-time-range]]',
    label: 'Full date/time range (smart)',
    example: 'January 15, 2026 2:30 PM - 3:30 PM PST',
    note: 'Computed, not a raw meta field. Same-day events collapse to one date + time range; multi-day events show a full start-end range. Format can be overridden per page with a `custom-date-time-format` meta value using tokens like {YYYY} {LLLL} {dddd} {timeRange} {timeZone}.',
  },
  {
    category: 'Dates & Times',
    token: '[[user-start-date-time]]',
    label: 'Start date/time (localized)',
    example: 'January 15, 2026 2:30 PM PST',
  },
  {
    category: 'Dates & Times',
    token: '[[user-end-date-time]]',
    label: 'End date/time (localized)',
    example: 'January 15, 2026 3:30 PM PST',
  },
  {
    category: 'Dates & Times',
    token: '[[timezone]]',
    label: 'Event timezone',
    example: 'America/Los_Angeles',
    note: 'Only applied for InPerson events. Virtual/Hybrid events render dates in each viewer’s own local timezone instead.',
  },

  // --- Speakers --------------------------------------------------------
  {
    category: 'Speakers',
    token: '[[@array(speakers.name),]]',
    label: 'All speaker names (joined)',
    example: 'Ada Lovelace, Grace Hopper',
    note: 'Array-iteration syntax: [[@array(path.attr)separator]] pulls `attr` off every item in the `path` array and joins with `separator` (defaults to a single space if omitted).',
  },
  {
    category: 'Speakers',
    token: '[[speakers:0.name]]',
    label: 'First speaker’s name',
    example: 'Ada Lovelace',
    note: 'Nested-path syntax: "." walks into an object property, ":" indexes into an array. speakers:0.name = first item in the speakers array, its name field.',
  },
  {
    category: 'Speakers',
    token: '[[speakers:0.title]]',
    label: 'First speaker’s title',
    example: 'VP of Engineering',
  },
  {
    category: 'Speakers',
    token: '(profile-cards block)',
    label: 'Speaker layout note',
    example: 'n/a',
    note: 'A profile-cards block reads the speakers array directly (filtered by speakerType) and lays cards out in an alternating Z-pattern — no token needed for the cards themselves, only for referencing individual speaker fields elsewhere on the page.',
  },

  // --- Sponsors ----------------------------------------------------------
  {
    category: 'Sponsors',
    token: '[[@array(sponsors.name),]]',
    label: 'All sponsor names (joined)',
    example: 'Acme Corp, Globex',
  },

  // --- Venue / Location ----------------------------------------------------
  {
    category: 'Venue',
    token: '[[venue.name]]',
    label: 'Venue name',
    example: 'Moscone Center',
    note: 'Only populated for InPerson/Hybrid events.',
  },
  {
    category: 'Venue',
    token: '[[venue.address]]',
    label: 'Venue address',
    example: '747 Howard St, San Francisco, CA 94103',
  },

  // --- Photos / Images -----------------------------------------------------
  {
    category: 'Photos',
    token: 'alt="[[event-card-image]]"',
    label: 'Card image (by kind)',
    example: '<picture><img alt="[[event-card-image]]"></picture>',
    note: 'Image tokens go in the <img alt> attribute of a <picture> element, not in text. The token is the photo’s imageKind, not a path — decoration replaces the surrounding src/srcset. Unresolved image tokens outside a metadata block are removed entirely, so only use kinds that exist on the event’s photos.',
  },
  {
    category: 'Photos',
    token: 'alt="[[event-hero-image]]"',
    label: 'Hero image (by kind)',
    example: '<picture><img alt="[[event-hero-image]]"></picture>',
  },

  // --- Series --------------------------------------------------------------
  {
    category: 'Series',
    token: '[[series.templateId]]',
    label: 'Series template ID',
    example: 'tmpl-12345',
  },

  // --- Links & CTAs ----------------------------------------------------------
  {
    category: 'Links & CTAs',
    token: '<a href="[[registration-link]]">Register</a>',
    label: 'Templated link href',
    example: '<a href="https://.../register">Register</a>',
    note: 'Any [[...]] token can appear inside an href, not just text. If the token resolves to nothing, decoration removes the whole link rather than leaving a broken href.',
  },
  {
    category: 'Links & CTAs',
    token: '<a href="#host-email">Contact host</a>',
    label: 'Host email link',
    example: '<a href="mailto:host@adobe.com?subject=...">Contact host</a>',
    note: 'The literal hash link "#host-email" is replaced with a localized mailto: link built from the event’s host-email field.',
  },

  // --- Conditional & live state (advanced) --------------------------------
  {
    category: 'Conditional & Live State',
    token: 'allow-wait-listing=true?(Join Waitlist):(Register Now)',
    label: 'Conditional text',
    example: 'Join Waitlist',
    note: 'Grammar: condition?(shown-if-true):(shown-if-false). Supports =, !=, null checks, & (AND), | (OR) against metadata/live-state values. Evaluated once at decoration time unless the referenced value is reactive (see @BM below).',
  },
  {
    category: 'Conditional & Live State',
    token: '@BM.rsvpData.registrationStatus',
    label: 'Live RSVP status (advanced)',
    example: 'registered',
    note: 'Reads live in-page application state (BlockMediator store), not static page metadata — re-renders automatically as the value changes (e.g. after a visitor RSVPs). Intended for block authors/developers; most page authors won’t need this directly.',
  },

  // --- Icons -------------------------------------------------------------
  {
    category: 'Icons',
    token: '@@events-calendar@@',
    label: 'Add-to-calendar icon',
    example: '(inline calendar SVG icon)',
    note: 'Different syntax from placeholders (@@name@@, not [[name]]). Currently only the events-calendar icon is wired up — other names will not render.',
  },
];

export const TOKEN_CATEGORIES = [...new Set(TOKEN_CATALOG.map((entry) => entry.category))];
