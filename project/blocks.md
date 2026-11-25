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

When no block fits, don't build one here. Add a row below with the source URL, what's missing, and the closest block used instead.

| Source page | Missing capability | Closest block used |
|---|---|---|
