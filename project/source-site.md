# Source site

Source: AEM Sites, `https://summit.adobe.com`. Page list: `https://summit.adobe.com/sitemap.xml` (30 URLs: 15 pages, 15 redirects).
Destination path = `/drafts/ema-poc` + source path without the trailing slash, e.g. `https://summit.adobe.com/na/hotels/` → `/drafts/ema-poc/na/hotels`.
Never create, upload, or overwrite content outside `/drafts/ema-poc/`.

## Migrated pages (2026-11-25)

All 15 are in DA under `/drafts/ema-poc/` and previewed; none are published. Template names come from the console's site scope.

| Template | Pages |
|---|---|
| info-page | `/na/agenda/`, `/na/hotels/`, `/na/pricing/`, `/na/sponsors/`, `/na/summit-online/` |
| landing-page | `/na/`, `/na/attend/`, `/na/certifications/`, `/na/preconference/`, `/na/speakers/online/`, `/na/faq/online/` |
| logo-directory | `/na/sponsors/online/` |
| form-page | `/na/become-a-sponsor/`, `/na/become-a-sponsor/thank-you/` |
| faq-page | `/na/faq/` |

Supporting content: `/drafts/ema-poc/fragments/speakers-online-1..3`, `/drafts/ema-poc/media/sponsors-online/`.

Shared navigation and footer are not built by page import and were not migrated.

## Redirecting sitemap URLs

Not migrated. Links to them stay absolute `https://summit.adobe.com/...` (except `/`, which points to `/drafts/ema-poc/na`). Details: `migration-work/scope/redirects.json` in the console workspace.

| Type | URLs | Target |
|---|---|---|
| Server 301 | `/na/agendas-by-role/`, `/na/agendas-by-role/email/`, `/na/agendas-by-role/media/`, `/na/email/`, `/na/nab/` | `https://business.adobe.com/summit/adobe-summit.html` |
| Client-side (meta refresh, canonical `/na/`) | `/`, `/na/ai-at-summit/`, `/na/ai-at-summit/email/`, `/na/certifications/media/`, `/na/mailing/`, `/na/media/`, `/na/preconference/media/`, `/na/sessions/`, `/na/speakers/`, `/na/sponsors/sponsorship/` | `/na/` |

## Out of scope for the POC

Registration, sign-in, personalized schedules, and live session data (ESP/ESL APIs). Keep links to the source site for these and list them as gaps in `project/blocks.md`.
