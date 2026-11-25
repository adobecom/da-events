# Source site

Source: AEM Sites, `https://summit.adobe.com`. Page list: `https://summit.adobe.com/sitemap.xml` (30 URLs).
Destination path = `/drafts/ema-poc` + source path without the trailing slash. `https://summit.adobe.com/na/hotels/` → `/drafts/ema-poc/na/hotels`; `https://summit.adobe.com/` → `/drafts/ema-poc/index`.
Never create, upload, or overwrite content outside `/drafts/ema-poc/`.

## Template groups

Pick the first page of a group from the batch that covers it, then reuse its blocks for the rest of the group.

| Template group | Pages | Notes |
|---|---|---|
| Home | `/`, `/na/` | Hero video, register CTA, event dates |
| Agenda / catalog | `/na/agenda/`, `/na/sessions/`, `/na/agendas-by-role/`, `/na/agendas-by-role/email/`, `/na/agendas-by-role/media/` | Session data is loaded dynamically on the source; migrate the static shell and flag the dynamic parts |
| Persona / topic landing | `/na/email/`, `/na/media/`, `/na/nab/`, `/na/summit-online/`, `/na/ai-at-summit/`, `/na/ai-at-summit/email/`, `/na/certifications/`, `/na/certifications/media/`, `/na/preconference/`, `/na/preconference/media/` | The `/email/` and `/media/` children are variants of their parent page |
| Speakers | `/na/speakers/`, `/na/speakers/online/` | Speaker cards open a detail panel on the right side |
| Sponsors | `/na/sponsors/`, `/na/sponsors/online/`, `/na/sponsors/sponsorship/`, `/na/become-a-sponsor/`, `/na/become-a-sponsor/thank-you/` | Logo grids and sponsorship tiers |
| Info / logistics | `/na/attend/`, `/na/pricing/`, `/na/hotels/`, `/na/faq/`, `/na/faq/online/`, `/na/mailing/` | FAQ uses accordions; pricing uses comparison tables |

## Batches

| Batch | Pages | How |
|---|---|---|
| 1 – one per template | `/na/`, `/na/agenda/`, `/na/sessions/`, `/na/speakers/`, `/na/sponsors/`, `/na/ai-at-summit/`, `/na/attend/`, `/na/pricing/`, `/na/hotels/`, `/na/faq/` | Auto mode run |
| 2 – variants | `/na/email/`, `/na/media/`, `/na/nab/`, `/na/summit-online/`, `/na/ai-at-summit/email/`, `/na/certifications/`, `/na/certifications/media/`, `/na/preconference/`, `/na/preconference/media/`, `/na/agendas-by-role/`, `/na/agendas-by-role/email/`, `/na/agendas-by-role/media/` | Guided, reuse Batch 1 blocks |
| 3 – remainder | `/`, `/na/speakers/online/`, `/na/sponsors/online/`, `/na/sponsors/sponsorship/`, `/na/become-a-sponsor/`, `/na/become-a-sponsor/thank-you/`, `/na/faq/online/`, `/na/mailing/` | Guided or a second Auto run |

Shared navigation and footer are not built by page import; build them once from `/na/`.

## Out of scope for the POC

Registration, sign-in, personalized schedules, and live session data (ESP/ESL APIs). Keep links to the source site for these and list them as gaps.
