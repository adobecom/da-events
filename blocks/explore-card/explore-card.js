export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  block.innerHTML = '';

  // Build the card grid wrapper
  const grid = document.createElement('div');
  grid.className = 'explore-card-grid';

  rows.forEach((row) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    if (!cells.length) return;

    const [iconCell, contentCell] = cells;

    const card = document.createElement('div');
    card.className = 'explore-card-item';

    // ── Icon area (product brand mark + optional badge row) ──────────
    if (iconCell) {
      const iconWrapper = document.createElement('div');
      iconWrapper.className = 'explore-card-icon';
      [...iconCell.childNodes].forEach((n) => iconWrapper.append(n));

      // Eager-load the first icon image for LCP
      const img = iconWrapper.querySelector('img');
      if (img) img.loading = 'eager';

      card.append(iconWrapper);
    }

    // ── Content area (heading + description + optional CTA) ──────────
    if (contentCell) {
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'explore-card-content';

      // Gather CTA links into a dedicated actions wrapper before reparenting
      const links = [...contentCell.querySelectorAll('a')];
      if (links.length) {
        const actions = document.createElement('div');
        actions.className = 'explore-card-actions';
        const linkParents = [...new Set(links.map((a) => a.closest('p') || a))];
        linkParents.forEach((node) => actions.append(node));
        contentCell.append(actions);
      }

      [...contentCell.childNodes].forEach((n) => contentWrapper.append(n));
      card.append(contentWrapper);
    }

    // ── Make the whole card clickable via its first link ─────────────
    const primaryLink = card.querySelector('a');
    if (primaryLink) {
      card.setAttribute('data-href', primaryLink.href);
      card.setAttribute('role', 'link');
      card.setAttribute('tabindex', '0');
      card.addEventListener('click', (e) => {
        if (!e.target.closest('a')) window.location.href = primaryLink.href;
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.location.href = primaryLink.href;
        }
      });
    }

    grid.append(card);
  });

  block.append(grid);
}
