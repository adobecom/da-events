# Decisions

| Date | Decision | Reason |
|---|---|---|
| 2026-11-24 | POC runs on branch `ema-poc` of `adobecom/da-events`; content only under `/drafts/ema-poc/`. | `drafts` is the team's play area; nothing reaches `stage`/`main` unless merged. |
| 2026-11-24 | Destination paths = `/drafts/ema-poc` + source path. | Keeps the source URL structure and isolates POC content. |
| 2026-11-24 | Reuse Milo, then event-libs blocks. | Matches how `da-events` loads blocks; gaps become event-libs work items. |
| 2026-11-25 | New blocks allowed only in `events/blocks/<name>/`, named `summit-*`, pushed only to `ema-poc`. | Milo loads non-Milo/non-event-libs names from `codeRoot` (`/events`); the prefix avoids shadowing library blocks. |
| 2026-11-24 | Registration, sign-in, and live session data are out of scope. | They depend on ESP/ESL APIs and auth not needed to prove migration. |
