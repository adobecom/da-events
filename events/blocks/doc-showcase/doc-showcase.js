/**
 * doc-showcase block
 *
 * Authoring structure (SharePoint table):
 *   Optional first row — single cell — section intro (eyebrow, h2, body, CTAs)
 *   Subsequent rows   — one or two cells per card:
 *     Cell 1: document preview image (img) OR card visual content
 *     Cell 2 (optional): category label (em/first-p), title (h3/strong), body (p), CTA links
 *
 * Renders as a fan/mosaic of document-preview cards with staggered rotation.
 */
export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  // ── Optional intro row (single-cell heading section) ──────────────────────
  let introRow = null;
  let cardRows = rows;

  const firstRowCells = rows[0].querySelectorAll(':scope > div');
  if (firstRowCells.length === 1) {
    introRow = rows[0];
    introRow.className = 'doc-showcase-intro';
    cardRows = rows.slice(1);

    const introCell = introRow.querySelector(':scope > div');
    introCell.className = 'doc-showcase-intro-content';

    // Eyebrow: first <p> before heading, no link inside
    const firstP = introCell.querySelector('p:first-child');
    const heading = introCell.querySelector('h2, h3');
    if (firstP && heading && firstP !== heading && !firstP.querySelector('a')) {
      firstP.classList.add('doc-showcase-eyebrow');
    }

    // Collect CTA links into an actions container
    const links = [...introCell.querySelectorAll('a')];
    if (links.length) {
      const actions = document.createElement('div');
      actions.className = 'doc-showcase-actions';
      [...new Set(links.map((a) => a.closest('p') || a))].forEach((p) => actions.append(p));
      introCell.append(actions);
    }
  }

  // ── Document cards ────────────────────────────────────────────────────────
  const mosaic = document.createElement('div');
  mosaic.className = 'doc-showcase-mosaic';

  cardRows.forEach((row, idx) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    const card = document.createElement('article');
    card.className = `doc-showcase-card doc-showcase-card--${idx + 1}`;

    const [visualCell, contentCell] = cells;

    // ── Visual cell (image or decorative content) ──────────────────────────
    if (visualCell) {
      const visual = document.createElement('div');
      visual.className = 'doc-showcase-card-visual';

      const img = visualCell.querySelector('img');
      // Mark first image as LCP candidate
      if (img && idx === 0) img.loading = 'eager';

      [...visualCell.childNodes].forEach((n) => visual.append(n));
      card.append(visual);
    }

    // ── Content cell (category tag, title, body, CTAs) ────────────────────
    if (contentCell) {
      const content = document.createElement('div');
      content.className = 'doc-showcase-card-content';

      // Category tag: first <p> before heading, no link
      const firstP = contentCell.querySelector('p:first-child');
      const cardHeading = contentCell.querySelector('h2, h3, h4');
      if (firstP && cardHeading && firstP !== cardHeading && !firstP.querySelector('a')) {
        firstP.classList.add('doc-showcase-card-tag');
      }

      // Move CTAs into an actions wrapper before reparenting children
      const links = [...contentCell.querySelectorAll('a')];
      if (links.length) {
        const actions = document.createElement('div');
        actions.className = 'doc-showcase-card-actions';
        [...new Set(links.map((a) => a.closest('p') || a))].forEach((p) => actions.append(p));
        contentCell.append(actions);
      }

      [...contentCell.childNodes].forEach((n) => content.append(n));
      card.append(content);
    }

    // Single-cell cards: treat entire cell as card body
    if (!contentCell && visualCell) {
      const visual = card.querySelector('.doc-showcase-card-visual');
      if (visual && !visual.querySelector('img')) {
        visual.className = 'doc-showcase-card-content';

        // Category tag detection for single-cell cards
        const firstP = visual.querySelector('p:first-child');
        const cardHeading = visual.querySelector('h2, h3, h4, strong');
        if (firstP && cardHeading && firstP !== cardHeading && !firstP.querySelector('a')) {
          firstP.classList.add('doc-showcase-card-tag');
        }

        // CTAs
        const links = [...visual.querySelectorAll('a')];
        if (links.length) {
          const actions = document.createElement('div');
          actions.className = 'doc-showcase-card-actions';
          [...new Set(links.map((a) => a.closest('p') || a))].forEach((p) => actions.append(p));
          visual.append(actions);
        }
      }
    }

    mosaic.append(card);
  });

  // ── Rebuild block DOM ──────────────────────────────────────────────────────
  block.innerHTML = '';
  const inner = document.createElement('div');
  inner.className = 'doc-showcase-inner';
  if (introRow) inner.append(introRow);
  inner.append(mosaic);
  block.append(inner);
}
