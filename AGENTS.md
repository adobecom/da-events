# AGENTS.md

`da-events`: Adobe events pages on Edge Delivery Services with Document Authoring (DA). Code is served under `/events/`; pages load Milo (`LIBS`) and event-libs (`EVENT_LIBS`) at runtime from `events/scripts/scripts.js`. There is no local `blocks/` folder: blocks come from Milo and event-libs.

## Code rules
- Entry points: `head.html`, `events/scripts/scripts.js`, `events/scripts/utils.js`, `events/styles/styles.css`. Read them before changing loading behavior.
- Resolve Milo through `LIBS` and event-libs through `EVENT_LIBS`; never hard-code their URLs.
- New or changed blocks belong in [adobecom/event-libs](https://github.com/adobecom/event-libs) (`event-libs/v1/blocks/`) or Milo, not here. For this POC, if a block is missing, describe the gap and propose it; don't add block code to this repo.
- `.hlxignore` excludes markdown; all other committed files are served.

## EMA POC (branch `ema-poc` only)

Migrating AEM Sites pages from `https://summit.adobe.com` (page list: `https://summit.adobe.com/sitemap.xml`, 30 URLs) into DA at `https://da.live/#/adobecom/da-events/drafts/ema-poc/`, to prove the migration can be done through the Experience Modernization Agent without hand-authoring.

Rules for every task:
- **All content goes under `/drafts/ema-poc/`.** Destination = `/drafts/ema-poc` + source path, e.g. `https://summit.adobe.com/na/hotels/` → `/drafts/ema-poc/na/hotels`. Never create, upload, or overwrite content anywhere else.
- **Reuse blocks in this order:** Milo (`adobecom/milo`, `libs/blocks/`) → event-libs (`adobecom/event-libs`, `event-libs/v1/blocks/`, catalog in `docs/architecture/blocks.md`). Author content in the structure those blocks expect. See `project/blocks.md`.
- Prefer default content (headings, text, images, links) over blocks.
- Never type secrets in chat or files.

Read these files when the task needs them:

| File | Read when |
|---|---|
| `project/source-site.md` | Choosing pages, paths, batches, or template groups |
| `project/blocks.md` | Choosing a block or authoring its content |
| `project/content.md` | Importing, writing, or restructuring content |
| `project/design.md` | Changing colors, typography, spacing, or other styles |
| `project/decisions.md` | Before changing an agreed convention |

## After each request
- Commit with a message that summarizes the request and push to `ema-poc`. Never push to `main`, `stage`, or `dev`.
- If pages changed, list them and ask whether to upload them to Experience Workspace.
- Keep answers short: what changed, where, and anything that needs a decision.
