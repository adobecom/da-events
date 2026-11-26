# Blocks

Pages load blocks from Milo and event-libs at runtime. Use their names and authoring structures; read the block's JS to see which rows, cells, and variants it expects.

| Library | Blocks | Docs |
|---|---|---|
| [adobecom/milo](https://github.com/adobecom/milo) (`stage`) | `libs/blocks/` | Each block folder; Milo docs at milo.adobe.com |
| [adobecom/event-libs](https://github.com/adobecom/event-libs) (`dev`) | `event-libs/v1/blocks/` (C1), `event-libs/v1/c2/blocks/` (C2) | `AGENTS.md`, `docs/architecture/blocks.md` |

## Mapping from Summit page patterns

| Summit pattern | Block | Library |
|---|---|---|
| Hero with video background and register CTA | `marquee` | milo |
| Text + image side by side | `media`, `z-pattern` | milo |
| Card grids (topics, persona tiles) | `card`, `editorial-card`, `bento-cards` | milo / event-libs |
| Speaker grid with detail panel | `profile-cards` | event-libs |
| Agenda / session list | `event-agenda`, `sessions-hub` | event-libs |
| Sponsor logo grid | `event-partners` | event-libs |
| Venue, hotels, maps | `venue-map`, `venue-additional-info`, `event-map` | event-libs |
| FAQ | `accordion` | milo |
| Pricing / pass comparison | `table`, `comparison-table` | milo |
| Tabs (in person vs. online) | `tabs` | milo |
| Promotional banners | `promotional-content`, `notification` | event-libs / milo |
| Modal / side panel | `modal` | milo |
| Icons with text | `icon-block` | milo |
| Section layout and backgrounds | `section-metadata` | milo |

## Gaps

When no Milo or event-libs block fits, add a row below with the source URL, what's missing, and the closest block used (or the new `summit-*` block created in `events/blocks/`).

| Source page | Missing capability | Closest block used |
|---|---|---|
| `https://summit.adobe.com/na/hotels/` | Author-typed list of several hotels (image, name, address, nightly rate, optional link). event-libs `venue-additional-info` and `event-map` render one venue from event metadata/API data; `venue-map` only lays out image columns. | Milo `card` (one per hotel) in a `two-up` section |
| `https://summit.adobe.com/na/hotels/` | Room booking happens in registration (out of scope); no booking widget on the page. | Plain "Register" link to `/drafts/ema-poc/na/pricing` |
| `https://summit.adobe.com/na/sponsors/` | Author-typed sponsor logo grid by tier. event-libs `event-partners` renders only from the event's `sponsors` metadata (API), so authored logos can't use it; the sponsor detail side panel (description, socials) has no block. | event-libs `image-links` (one per tier, tier name in the title row); logos link to the sponsor site |
| `https://summit.adobe.com/na/agenda/`, `/na/summit-online/` | "View in-person / online agenda" toggle (JS, `href="#"`) switching two agenda views. | Two buttons kept as-is; Milo `tabs` could replace them in a later pass |
| `https://summit.adobe.com/na/agenda/` | Agenda day cards with expand/hover reveal of the schedule. | Milo `editorial-card` (one per day), schedule always visible |
| `https://summit.adobe.com/na/agenda/`, `/na/summit-online/` | Animated quote + photo mosaic. | Milo `columns` (quote \| unique photos), no animation |
| `https://summit.adobe.com/na/pricing/` | Quote carousel (slick) with autoplay/paging; "Terms" side panels on passes; intro text personalised by query string (`-tapa`, `-mailing`). | Milo `marquee (large)` for the one real slide; Milo `table` without the Terms panels; only the default intro kept |
| `https://summit.adobe.com/na/summit-online/` | Two-column benefit list inside the dark promo band. | Milo `marquee (dark)` with one merged list |
| `https://summit.adobe.com/na/` | Background video hero with tablet/mobile video sources and pause control; personalised offer text (`-tapa`, `-mailing`). | Milo `marquee (large)` with the desktop mp4 link; default offer only |
| `https://summit.adobe.com/na/` | Experience pods: photo above text. | event-libs `bento-cards` (photo becomes the card background) |
| `https://summit.adobe.com/na/` | Auto-scrolling sponsor logo ribbon with pause button. | event-libs `image-links` (9 unique logos, static) |
| `https://summit.adobe.com/na/speakers/online/` | Searchable, filterable speaker lineup with bio panel. event-libs `profile-cards` renders only from the event's `speakers` metadata (API). | Milo `card` per speaker: 36 headliners on the page, 569 speakers in 3 fragments (`/drafts/ema-poc/fragments/speakers-online-1..3`, max 200 images per document); filters and bios dropped |
| `https://summit.adobe.com/na/certifications/` | Nested exam accordions inside each category. | Milo `accordion`, nested items flattened into each panel |
| `https://summit.adobe.com/na/become-a-sponsor/` | Sponsorship interest form (Salesforce web-to-lead). event-libs `events-form` is the event RSVP form; Milo `marketo`/`faas` need a configured form. | Default content (form heading and intro); fields dropped |
| `https://summit.adobe.com/na/become-a-sponsor/` | Adobe TV video beside text. | Milo `media` with a `video.tv.adobe.com` link (Milo adobetv embed) |
| `https://summit.adobe.com/na/sponsors/online/` | 2026 sponsor tiers with detail side panel. | event-libs `image-links` per tier; logos link to the sponsor site. 11 SVG logos over Edge Delivery's SVG limit were rendered to PNG and stored at `/drafts/ema-poc/media/sponsors-online/` (`summit-logo-overrides.js`) |

## New blocks in this repo

Blocks under `events/blocks/` created for this POC. Keep each entry short: name, purpose, authoring structure, pages that use it.

| Block | Purpose | Authoring | Used on |
|---|---|---|---|
