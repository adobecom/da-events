# AGENTS.md

`da-events`: Adobe events pages on Edge Delivery Services with Document Authoring (DA). Code is served under `/events/` (`codeRoot: '/events'`); pages load Milo (`LIBS`) and event-libs (`EVENT_LIBS`) at runtime from `events/scripts/scripts.js`. Milo resolves each block by name: Milo blocks from `LIBS`, event-libs blocks from `EVENT_LIBS`, and any other name from `/events/blocks/<name>/<name>.js` and `.css`.

## Code rules
- Entry points: `head.html`, `events/scripts/scripts.js`, `events/scripts/utils.js`, `events/styles/styles.css`. Read them before changing loading behavior.
- Resolve Milo through `LIBS` and event-libs through `EVENT_LIBS`; never hard-code their URLs.
- **New blocks go only in `events/blocks/<name>/`** (`<name>.js` with `export default async function init(el)`, plus `<name>.css`). Don't change any other code file (`head.html`, `events/scripts/`, `events/styles/`, `events/create-now/`, config) without asking first.
- A new block name must not match any Milo (`libs/blocks/`) or event-libs (`event-libs/v1/blocks/`, `event-libs/v1/c2/blocks/`) block name; those load first and would shadow it. Prefix POC blocks with `summit-` (for example `summit-hotel-list`).
- Create a new block only when no Milo or event-libs block fits, and record it in `project/blocks.md` (Gaps and "New blocks in this repo"). Scope CSS to the block's class; follow Milo patterns (`createTag` from `${LIBS}/utils/utils.js`, ES modules, no build step).
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
- Commit only `events/blocks/**` and `project/*.md` changes, with a message that summarizes the request. Push **only to `ema-poc`** (current branch, or a PR into `ema-poc`). Never push to `main`, `stage`, `dev`, or any other branch.
- Never commit migration scaffolding: import scripts, `catalog/`, `migration-work/`, `.hlxignore` edits. They stay in the console workspace.
- If pages changed, list them and ask whether to upload them to Experience Workspace (only under `/drafts/ema-poc/`).
- Keep answers short: what changed, where, and anything that needs a decision.
