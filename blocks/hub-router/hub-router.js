export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  let headingRow = null;
  let cardRows = [...rows];

  // Detect heading row: single cell with a heading element, no image
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

  // ── Build section heading ────────────────────────────────
  if (headingRow) {
    headingRow.classList.add('hub-router-heading');
    const cell = headingRow.querySelector(':scope > div') || headingRow;

    // Mark eyebrow: first <p> before the heading that contains no link
    const heading = cell.querySelector('h2, h3');
    if (heading) {
      const allPs = [...cell.querySelectorAll('p')];
      const eyebrowP = allPs.find(
        (p) => p.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING
          && !p.querySelector('a'),
      );
      if (eyebrowP) eyebrowP.classList.add('hub-router-eyebrow');
    }
  }

  if (!cardRows.length) return;

  // ── Build cards carousel ─────────────────────────────────
  const carousel = document.createElement('div');
  carousel.className = 'hub-router-carousel';

  /**
   * Build a single routing card from an authored row.
   * Expected cells: [category label (+ optional icon)] [image] [heading + body]
   * Optional 4th cell containing "dark" or "featured" marks the card as dark-themed.
   * @param {HTMLElement} row
   * @returns {HTMLElement}
   */
  function buildCard(row) {
    const cells = [...row.querySelectorAll(':scope > div')];
    const card = document.createElement('div');
    card.className = 'hub-router-card';

    // Check last cell for dark/featured variant marker
    const lastCell = cells[cells.length - 1];
    const markerText = lastCell?.textContent?.trim().toLowerCase();
    if (markerText === 'dark' || markerText === 'featured') {
      card.classList.add('hub-router-card--dark');
      cells.pop();
    }

    const [categoryCell, imageCell, contentCell] = cells;

    // Card header: icon (optional) + category label + arrow
    if (categoryCell) {
      const header = document.createElement('div');
      header.className = 'hub-router-card-header';

      const icon = categoryCell.querySelector('picture, img');
      if (icon) {
        const iconWrapper = document.createElement('span');
        iconWrapper.className = 'hub-router-card-icon';
        iconWrapper.append(icon.closest('picture') || icon);
        header.append(iconWrapper);
      }

      // Category label text
      const labelNodes = [...categoryCell.childNodes].filter(
        (n) => !(n.nodeType === Node.ELEMENT_NODE && (n.matches('picture') || n.matches('img'))),
      );
      if (labelNodes.length) {
        const label = document.createElement('span');
        label.className = 'hub-router-card-label';
        labelNodes.forEach((n) => label.append(n));
        header.append(label);
      }

      // Arrow indicator
      const arrow = document.createElement('span');
      arrow.className = 'hub-router-card-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      header.append(arrow);

      card.append(header);
    }

    // Card media
    if (imageCell) {
      const media = document.createElement('div');
      media.className = 'hub-router-card-media';
      const picture = imageCell.querySelector('picture');
      const img = imageCell.querySelector('img');
      if (picture) {
        media.append(picture);
        const picImg = picture.querySelector('img');
        if (picImg) picImg.loading = 'eager';
      } else if (img) {
        img.loading = 'eager';
        media.append(img);
      }
      card.append(media);
    }

    // Card content: heading + body
    if (contentCell) {
      const content = document.createElement('div');
      content.className = 'hub-router-card-content';

      // Gather any links into an actions wrapper
      const links = [...contentCell.querySelectorAll('a')];
      if (links.length) {
        const actions = document.createElement('div');
        actions.className = 'hub-router-card-actions';
        const parents = [...new Set(links.map((a) => a.closest('p') || a))];
        parents.forEach((node) => actions.append(node));
        contentCell.append(actions);
      }

      [...contentCell.childNodes].forEach((n) => content.append(n));
      card.append(content);
    }

    return card;
  }

  cardRows.forEach((row) => carousel.append(buildCard(row)));

  // ── Replace block content ────────────────────────────────
  block.innerHTML = '';
  if (headingRow) block.append(headingRow);
  block.append(carousel);
}
