export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  let startIndex = 0;

  // First row with a single cell and no heading becomes the section header
  const firstCells = [...rows[0].querySelectorAll(':scope > div')];
  if (firstCells.length === 1 && !firstCells[0].querySelector('h2, h3, h4')) {
    rows[0].classList.add('news-header');
    startIndex = 1;
  }

  // Build news grid from remaining rows
  const grid = document.createElement('div');
  grid.className = 'news-grid';

  rows.slice(startIndex).forEach((row) => {
    [...row.querySelectorAll(':scope > div')].forEach((cell) => {
      const item = document.createElement('div');
      item.className = 'news-item';

      const content = document.createElement('div');
      content.className = 'news-item-content';

      const actions = document.createElement('div');
      actions.className = 'news-item-actions';

      // Move each child: link-only paragraphs go to actions, rest to content
      [...cell.children].forEach((child) => {
        const links = child.querySelectorAll('a');
        const hasHeading = child.querySelector('h2, h3, h4') || /^H[1-6]$/.test(child.tagName);
        if (links.length && !hasHeading) {
          actions.append(child);
        } else {
          content.append(child);
        }
      });

      item.append(content);
      if (actions.children.length) item.append(actions);
      grid.append(item);
    });
  });

  // Rebuild block: keep header rows then append grid
  block.innerHTML = '';
  for (let i = 0; i < startIndex; i += 1) {
    block.append(rows[i]);
  }
  block.append(grid);
}
