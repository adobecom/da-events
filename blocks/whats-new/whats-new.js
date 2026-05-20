export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  let headingRow = null;
  let cardRows = [...rows];

  // Detect heading row: single cell with a heading and no image
  const firstCells = rows[0].querySelectorAll(':scope > div');
  if (firstCells.length === 1) {
    const cell = firstCells[0];
    if (cell.querySelector('h2, h3') && !cell.querySelector('picture, img')) {
      headingRow = rows[0];
      cardRows = rows.slice(1);
    }
  }

  // ── Build heading section ──────────────────────────────────
  if (headingRow) {
    headingRow.classList.add('whats-new-heading');
    const cell = headingRow.querySelector(':scope > div') || headingRow;
    const heading = cell.querySelector('h2, h3');
    if (heading) {
      const allPs = [...cell.querySelectorAll('p')];
      const eyebrowP = allPs.find(
        (p) => (p.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING)
          && !p.querySelector('a'),
      );
      if (eyebrowP) eyebrowP.classList.add('whats-new-eyebrow');
    }
  }

  if (!cardRows.length) return;

  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'whats-new-cards';

  /**
   * Build a single card element.
   * Expects cells: [media cell, copy cell]
   * @param {HTMLElement} row
   * @param {boolean} isFeatured - true for the full-width featured card
   * @returns {HTMLElement}
   */
  function buildCard(row, isFeatured) {
    const card = document.createElement('div');
    card.className = isFeatured
      ? 'whats-new-card whats-new-card--featured'
      : 'whats-new-card';

    const cells = [...row.querySelectorAll(':scope > div')];

    if (cells.length >= 2) {
      const [mediaCell, copyCell] = cells;

      // Media wrapper
      const mediaWrapper = document.createElement('div');
      mediaWrapper.className = 'whats-new-media';
      [...mediaCell.childNodes].forEach((n) => mediaWrapper.append(n));

      // Eager-load LCP image on the featured card
      const img = mediaWrapper.querySelector('img');
      if (img && isFeatured) img.loading = 'eager';

      // Copy wrapper
      const copyWrapper = document.createElement('div');
      copyWrapper.className = 'whats-new-copy';

      // Move link parents into a dedicated actions container first
      const links = [...copyCell.querySelectorAll('a')];
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'whats-new-actions';
      if (links.length) {
        const parents = [...new Set(links.map((a) => a.closest('p') || a))];
        parents.forEach((node) => actionsDiv.append(node));
      }

      if (isFeatured) {
        // Wrap remaining (non-link) content in a text div so the
        // featured copy can use a side-by-side layout on wide viewports.
        const textDiv = document.createElement('div');
        textDiv.className = 'whats-new-copy-text';
        [...copyCell.childNodes].forEach((n) => textDiv.append(n));
        copyWrapper.append(textDiv);
      } else {
        [...copyCell.childNodes].forEach((n) => copyWrapper.append(n));
      }

      if (actionsDiv.childElementCount) copyWrapper.append(actionsDiv);
      card.append(mediaWrapper, copyWrapper);
    } else if (cells.length === 1) {
      const copyWrapper = document.createElement('div');
      copyWrapper.className = 'whats-new-copy';
      [...cells[0].childNodes].forEach((n) => copyWrapper.append(n));
      card.append(copyWrapper);
    }

    return card;
  }

  // ── Featured card (first row, full-width) ─────────────────
  const [featuredRow, ...gridRows] = cardRows;
  cardsContainer.append(buildCard(featuredRow, true));

  // ── 3-column grid (remaining rows) ────────────────────────
  if (gridRows.length) {
    const grid = document.createElement('div');
    grid.className = 'whats-new-grid';
    gridRows.forEach((row) => grid.append(buildCard(row, false)));
    cardsContainer.append(grid);
  }

  // ── Replace block content ──────────────────────────────────
  block.innerHTML = '';
  if (headingRow) block.append(headingRow);
  block.append(cardsContainer);
}
