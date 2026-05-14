export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  let cardStartIdx = 0;
  let headingEl = null;

  // Heading row: single cell containing an h2 or h3 (no card image)
  const firstRowCells = rows[0].querySelectorAll(':scope > div');
  if (firstRowCells.length === 1 && firstRowCells[0].querySelector('h2, h3')) {
    const cell = firstRowCells[0];

    // Mark eyebrow: <p> immediately before h2/h3 with no link inside
    const heading = cell.querySelector('h2, h3');
    if (heading) {
      const prev = heading.previousElementSibling;
      if (prev && prev.tagName === 'P' && !prev.querySelector('a')) {
        prev.classList.add('feature-cards-eyebrow');
      }
    }

    headingEl = document.createElement('div');
    headingEl.className = 'feature-cards-heading';
    [...cell.childNodes].forEach((n) => headingEl.append(n));
    cardStartIdx = 1;
  }

  // Build card grid — each row may contain 1 or more card cells
  const grid = document.createElement('div');
  grid.className = 'feature-cards-grid';

  let cardIdx = 0;
  rows.slice(cardStartIdx).forEach((row) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    cells.forEach((cell) => {
      const card = document.createElement('div');
      card.className = 'feature-cards-card';
      grid.append(card);

      // Media area: extract picture/img into its own wrapper
      const picture = cell.querySelector('picture');
      const img = cell.querySelector('img');
      if (picture || img) {
        const mediaEl = picture || img;
        const mediaWrap = document.createElement('div');
        mediaWrap.className = 'feature-cards-card-media';
        // Eager-load first row of cards (likely LCP)
        const imgEl = mediaEl.querySelector ? mediaEl.querySelector('img') : mediaEl;
        if (imgEl) imgEl.loading = cardIdx < 3 ? 'eager' : 'lazy';
        // Lift the picture (or its <p> wrapper) into the media div
        const mediaContainer = mediaEl.closest('p') || mediaEl;
        mediaWrap.append(mediaContainer);
        card.append(mediaWrap);
      }

      // Content area: all remaining children
      const content = document.createElement('div');
      content.className = 'feature-cards-card-content';
      [...cell.children].forEach((el) => content.append(el));
      // Remove empty paragraphs left after picture extraction
      content.querySelectorAll('p:empty').forEach((p) => p.remove());

      // Gather CTA links into an actions wrapper
      const links = [...content.querySelectorAll('a')];
      if (links.length) {
        const actions = document.createElement('div');
        actions.className = 'feature-cards-card-actions';
        [...new Set(links.map((a) => a.closest('p') || a))].forEach((node) => {
          node.remove();
          actions.append(node);
        });
        content.append(actions);
      }

      card.append(content);
      cardIdx += 1;
    });
  });

  // Rebuild block DOM
  block.innerHTML = '';
  const inner = document.createElement('div');
  inner.className = 'feature-cards-inner';
  if (headingEl) inner.append(headingEl);
  inner.append(grid);
  block.append(inner);
}
