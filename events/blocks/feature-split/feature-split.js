export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  // First row is the section header (single cell with h2 + body copy)
  const firstRowCells = rows[0].querySelectorAll(':scope > div');
  let headerEl = null;
  let cardRows = rows;

  if (firstRowCells.length === 1) {
    const headerCell = rows[0].querySelector(':scope > div') || rows[0];
    headerEl = document.createElement('div');
    headerEl.className = 'feature-split-header';
    [...headerCell.childNodes].forEach((node) => headerEl.append(node));
    cardRows = rows.slice(1);
  }

  // Build the two-card grid
  const grid = document.createElement('div');
  grid.className = 'feature-split-grid';

  cardRows.forEach((row) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    cells.forEach((cell, idx) => {
      const isPrimary = idx === 0;
      const card = document.createElement('div');
      card.className = `feature-split-card feature-split-card--${isPrimary ? 'primary' : 'secondary'}`;

      // Separate media (picture/img) from text content
      const mediaWrapper = document.createElement('div');
      mediaWrapper.className = 'feature-split-card-media';

      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'feature-split-card-content';

      [...cell.children].forEach((child) => {
        if (child.matches('picture') || child.querySelector('picture, img')) {
          mediaWrapper.append(child);
        } else {
          contentWrapper.append(child);
        }
      });

      // Eager-load the LCP image
      const firstImg = mediaWrapper.querySelector('img');
      if (firstImg) firstImg.loading = 'eager';

      // Gather links into an actions container
      const links = [...contentWrapper.querySelectorAll('a')];
      if (links.length) {
        const actions = document.createElement('div');
        actions.className = 'feature-split-card-actions';
        const linkNodes = [...new Set(links.map((a) => a.closest('p') || a))];
        linkNodes.forEach((n) => actions.append(n));
        contentWrapper.append(actions);
      }

      if (mediaWrapper.children.length) card.append(mediaWrapper);
      card.append(contentWrapper);
      grid.append(card);
    });
  });

  // Rebuild block
  block.innerHTML = '';
  if (headerEl) block.append(headerEl);
  const cardsWrapper = document.createElement('div');
  cardsWrapper.className = 'feature-split-cards';
  cardsWrapper.append(grid);
  block.append(cardsWrapper);
}
