export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  let headingRow = null;
  let cardRows = [...rows];

  // Detect heading row: single cell containing a heading element (h2/h3)
  // or eyebrow + heading structure (no image, no link)
  const firstCells = rows[0].querySelectorAll(':scope > div');
  if (firstCells.length === 1) {
    const cell = firstCells[0];
    const hasHeading = cell.querySelector('h2, h3');
    const hasImage = cell.querySelector('picture, img');
    if (hasHeading && !hasImage) {
      headingRow = rows[0];
      cardRows = rows.slice(1);
    }
  }

  // ── Build heading section ────────────────────────────────
  if (headingRow) {
    headingRow.classList.add('whats-new-editorial-heading');
    const cell = headingRow.querySelector(':scope > div') || headingRow;

    // Mark eyebrow: first <p> before the heading that has no link
    const heading = cell.querySelector('h2, h3');
    if (heading) {
      const allPs = [...cell.querySelectorAll('p')];
      const eyebrowP = allPs.find(
        (p) => p.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING
          && !p.querySelector('a'),
      );
      if (eyebrowP) eyebrowP.classList.add('whats-new-editorial-eyebrow');
    }
  }

  if (!cardRows.length) return;

  // ── Build cards container ────────────────────────────────
  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'whats-new-editorial-cards';

  /**
   * Build a single card element from an authored row.
   * Expects cells: [media cell, copy cell]
   * @param {HTMLElement} row
   * @param {boolean} isFeatured
   * @returns {HTMLElement}
   */
  function buildCard(row, isFeatured) {
    const card = document.createElement('div');
    card.className = isFeatured
      ? 'whats-new-editorial-card whats-new-editorial-card--featured'
      : 'whats-new-editorial-card';

    const cells = [...row.querySelectorAll(':scope > div')];

    if (cells.length >= 2) {
      const [mediaCell, copyCell] = cells;

      // Media wrapper
      const mediaWrapper = document.createElement('div');
      mediaWrapper.className = 'whats-new-editorial-media';
      [...mediaCell.childNodes].forEach((n) => mediaWrapper.append(n));

      // Mark LCP image for eager loading on featured card
      const img = mediaWrapper.querySelector('img');
      if (img && isFeatured) img.loading = 'eager';

      // Copy wrapper
      const copyWrapper = document.createElement('div');
      copyWrapper.className = 'whats-new-editorial-copy';

      // Gather links into a CTA actions container
      const links = [...copyCell.querySelectorAll('a')];
      if (links.length) {
        const actions = document.createElement('div');
        actions.className = 'whats-new-editorial-actions';
        const parents = [...new Set(links.map((a) => a.closest('p') || a))];
        parents.forEach((node) => actions.append(node));
        copyCell.append(actions);
      }

      [...copyCell.childNodes].forEach((n) => copyWrapper.append(n));
      card.append(mediaWrapper, copyWrapper);
    } else if (cells.length === 1) {
      // Single-cell fallback: treat entire cell as copy
      const copyWrapper = document.createElement('div');
      copyWrapper.className = 'whats-new-editorial-copy';
      [...cells[0].childNodes].forEach((n) => copyWrapper.append(n));
      card.append(copyWrapper);
    }

    return card;
  }

  // First card row → featured (full-width)
  const [featuredRow, ...gridRows] = cardRows;
  const featuredCard = buildCard(featuredRow, true);
  cardsContainer.append(featuredCard);

  // Remaining rows → 3-column grid
  if (gridRows.length) {
    const grid = document.createElement('div');
    grid.className = 'whats-new-editorial-grid';

    gridRows.forEach((row) => {
      grid.append(buildCard(row, false));
    });

    cardsContainer.append(grid);
  }

  // ── Replace block content ────────────────────────────────
  block.innerHTML = '';
  if (headingRow) block.append(headingRow);
  block.append(cardsContainer);
}
