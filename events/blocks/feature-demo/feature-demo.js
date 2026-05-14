/**
 * Feature Demo block — decorate(block)
 *
 * Authored table shape (two-column rows):
 *   Row A: [grid of document images]  | [heading + body + "Learn more" CTA]
 *   Row B: [heading + body + "Try the demo" CTA] | [product UI screenshot]
 *
 * Single-cell rows render full-width (eyebrow / section intro).
 * Cells containing more than two images are treated as card grids.
 * Cells with one image are treated as media panels.
 * Cells with no images are treated as text content.
 */

/**
 * Move all links in a cell into a shared actions container appended
 * at the bottom of the cell.
 *
 * @param {HTMLElement} cell
 */
function gatherCtas(cell) {
  const links = [...cell.querySelectorAll('a')];
  if (!links.length) return;
  const actions = document.createElement('div');
  actions.className = 'feature-demo-actions';
  [...new Set(links.map((a) => a.closest('p') || a))].forEach((node) => actions.append(node));
  cell.append(actions);
}

/**
 * Convert a flat list of image paragraphs + label paragraphs into a
 * card grid: each image element is paired with its immediately following
 * text sibling and wrapped in a .feature-demo-card div.
 *
 * @param {HTMLElement} cell
 */
function buildCardGrid(cell) {
  const cardGrid = document.createElement('div');
  cardGrid.className = 'feature-demo-card-grid';

  // Snapshot the children before we start moving them
  const children = [...cell.children];
  let i = 0;
  while (i < children.length) {
    const el = children[i];
    if (el.querySelector('img')) {
      const card = document.createElement('div');
      card.className = 'feature-demo-card';
      card.append(el);

      // Pair with the next sibling if it is a text-only label
      const next = children[i + 1];
      if (next && !next.querySelector('img') && next.textContent.trim()) {
        next.classList.add('feature-demo-card-label');
        card.append(next);
        i += 1;
      }
      cardGrid.append(card);
    } else {
      // Non-image element (heading, body, etc.) passes through directly
      cardGrid.append(el);
    }
    i += 1;
  }

  cell.append(cardGrid);
}

export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  let eagerSet = false; // only the very first image gets loading="eager"

  rows.forEach((row) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    row.classList.add('feature-demo-section');

    /* ── Single-cell row: full-width intro / heading ── */
    if (cells.length === 1) {
      const [cell] = cells;
      cell.classList.add('feature-demo-full');
      row.classList.add('feature-demo-single');

      // Eyebrow: a <p> that appears before the first heading with no links
      const heading = cell.querySelector('h2, h3');
      if (heading) {
        const firstP = cell.querySelector('p');
        if (
          firstP
          && firstP !== heading
          && !firstP.querySelector('a')
          // firstP must come before the heading in the DOM
          && firstP.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING
        ) {
          firstP.classList.add('feature-demo-eyebrow');
        }
      }

      gatherCtas(cell);

      // Eager LCP
      const img = cell.querySelector('img');
      if (img && !eagerSet) { img.loading = 'eager'; eagerSet = true; }
      return;
    }

    /* ── Two-column row ── */
    const [leftCell, rightCell] = cells;

    [leftCell, rightCell].forEach((cell) => {
      const imgs = [...cell.querySelectorAll('img')];

      if (imgs.length > 2) {
        // Multiple images → card grid showcase
        cell.classList.add('feature-demo-grid');
        buildCardGrid(cell);
      } else if (imgs.length >= 1) {
        // Single image → media / product screenshot panel
        cell.classList.add('feature-demo-media');
        if (!eagerSet) { imgs[0].loading = 'eager'; eagerSet = true; }
      } else {
        // No images → text + CTA content
        cell.classList.add('feature-demo-content');
        gatherCtas(cell);
      }
    });
  });
}
