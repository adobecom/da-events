# Content

Follow [David's Model](https://www.aem.live/docs/davidsmodel): lean structures, mostly default content.

- **Text, links, and images:** preserve the source text exactly. Keep links relative when the target page is in this migration (see `project/source-site.md`); keep absolute `https://summit.adobe.com/...` links for pages that are not migrated or out of scope.
- **Images:** import into the page's content so they're stored in DA. Keep meaningful alt text from the source; add descriptive alt text where the source has none.
- **Metadata:** every page gets a `metadata` block with `title`, `description`, and `og:image` from the source page head.
- **Sections:** use `section-metadata` with a `style` for background or layout variants (for example `dark`, `centered`). Document new styles in `project/design.md`.
- **Variants of the same page** (`/email/`, `/media/`, `/online/` children): reuse the parent page's structure; only the text and images change.
- **Dynamic content** (live sessions, speaker data from APIs, registration): don't fake data. Import what's in the rendered HTML, and list the dynamic parts as gaps in the import report.
- **Fragments:** content repeated across pages (for example the register banner) goes in `/drafts/ema-poc/fragments/` and is included with the Milo `fragment` block.
