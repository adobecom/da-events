export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  // Detect optional heading row: single cell containing h2 or h3
  let headerEl = null;
  let imageRows = rows;

  const firstCells = rows[0].querySelectorAll(':scope > div');
  if (firstCells.length === 1) {
    const cell = firstCells[0];
    const heading = cell.querySelector('h2, h3');
    if (heading) {
      headerEl = document.createElement('div');
      headerEl.className = 'doc-collage-header';

      // Eyebrow: <p> immediately before the heading with no link
      const prev = heading.previousElementSibling;
      if (prev && prev.tagName === 'P' && !prev.querySelector('a')) {
        prev.classList.add('doc-collage-eyebrow');
      }

      // Gather CTA links into an actions container
      const links = [...cell.querySelectorAll('a')];
      if (links.length) {
        const actions = document.createElement('div');
        actions.className = 'doc-collage-actions';
        [...new Set(links.map((a) => a.closest('p') || a))].forEach((node) => {
          node.remove();
          actions.append(node);
        });
        cell.append(actions);
      }

      [...cell.childNodes].forEach((n) => headerEl.append(n));
      imageRows = rows.slice(1);
    }
  }

  // Build the collage of document cards
  const collage = document.createElement('div');
  collage.className = 'doc-collage-collage';

  imageRows.forEach((row, idx) => {
    const cell = row.querySelector(':scope > div') || row;
    const card = document.createElement('div');
    card.className = 'doc-collage-card';
    card.dataset.idx = idx;

    // Eager-load first image as potential LCP candidate
    const img = cell.querySelector('img');
    if (img) img.loading = idx === 0 ? 'eager' : 'lazy';

    // Wrap picture or img in a media container
    const pic = cell.querySelector('picture');
    const mediaEl = pic || img;
    if (mediaEl) {
      const mediaWrap = document.createElement('div');
      mediaWrap.className = 'doc-collage-card-media';
      const container = mediaEl.closest('p') || mediaEl;
      mediaWrap.append(container);
      card.append(mediaWrap);
    }

    // Any remaining text (caption / alt label)
    const remaining = [...cell.children];
    if (remaining.length) {
      const caption = document.createElement('div');
      caption.className = 'doc-collage-card-caption';
      remaining.forEach((el) => caption.append(el));
      card.append(caption);
    }

    collage.append(card);
  });

  // Rebuild block
  block.innerHTML = '';

  if (headerEl) {
    const headerWrap = document.createElement('div');
    headerWrap.className = 'doc-collage-header-wrap';
    headerWrap.append(headerEl);
    block.append(headerWrap);
  }

  const stage = document.createElement('div');
  stage.className = 'doc-collage-stage';
  stage.append(collage);
  block.append(stage);
}
