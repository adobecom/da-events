export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  block.innerHTML = '';

  // ── Detect hero row ──────────────────────────────────────────
  // Hero: first row with 2+ cells where the first cell has a picture (background image)
  const firstRowCells = [...rows[0].querySelectorAll(':scope > div')];
  const isHeroRow = firstRowCells.length >= 2 && firstRowCells[0]?.querySelector('picture, img');

  let heroRow = null;
  let cardRows = rows;

  if (isHeroRow) {
    [heroRow, ...cardRows] = rows;
  }

  // ── Build hero section ───────────────────────────────────────
  if (heroRow) {
    const heroSection = document.createElement('div');
    heroSection.className = 'product-router-hero';

    const [mediaCell, textCell] = [...heroRow.querySelectorAll(':scope > div')];

    // Background picture — positioned absolutely to fill the hero
    const bgPic = mediaCell?.querySelector('picture');
    if (bgPic) {
      bgPic.classList.add('product-router-hero-bg');
      const img = bgPic.querySelector('img');
      if (img) img.loading = 'eager';
      heroSection.append(bgPic);
    }

    // Hero text content
    const heroContent = document.createElement('div');
    heroContent.className = 'product-router-hero-content';

    if (textCell) {
      [...textCell.childNodes].forEach((n) => heroContent.append(n));
    }

    // Gather CTA links into a dedicated actions wrapper
    const ctaLinks = [...heroContent.querySelectorAll('a')];
    if (ctaLinks.length) {
      const actions = document.createElement('div');
      actions.className = 'product-router-hero-actions';
      const linkParents = [...new Set(ctaLinks.map((a) => a.closest('p') || a))];
      linkParents.forEach((node) => actions.append(node));
      heroContent.append(actions);
    }

    heroSection.append(heroContent);
    block.append(heroSection);
  }

  // ── Build product card grid ──────────────────────────────────
  if (!cardRows.length) return;

  const gridSection = document.createElement('div');
  gridSection.className = 'product-router-grid-section';

  const grid = document.createElement('div');
  grid.className = 'product-router-grid';

  cardRows.forEach((row) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    if (cells.length < 2) return;

    const [iconCell, contentCell] = cells;

    const card = document.createElement('div');
    card.className = 'product-router-card';

    // Icon area (product brand mark + optional badge text)
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'product-router-card-icon';
    [...(iconCell?.childNodes || [])].forEach((n) => iconWrapper.append(n));
    card.append(iconWrapper);

    // Content area (title + description)
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'product-router-card-content';

    // Pull any links out into a dedicated actions wrapper before moving nodes
    const links = [...contentCell.querySelectorAll('a')];
    if (links.length) {
      const actions = document.createElement('div');
      actions.className = 'product-router-card-actions';
      const linkParents = [...new Set(links.map((a) => a.closest('p') || a))];
      linkParents.forEach((node) => actions.append(node));
      contentCell.append(actions);
    }

    [...contentCell.childNodes].forEach((n) => contentWrapper.append(n));
    card.append(contentWrapper);

    // Make the entire card clickable via its first link
    const primaryLink = card.querySelector('a');
    if (primaryLink) {
      card.setAttribute('data-href', primaryLink.href);
      card.addEventListener('click', (e) => {
        if (!e.target.closest('a')) window.location.href = primaryLink.href;
      });
    }

    grid.append(card);
  });

  gridSection.append(grid);
  block.append(gridSection);
}
