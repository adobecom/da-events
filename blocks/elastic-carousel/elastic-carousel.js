export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  // ── Build carousel container ─────────────────────────────
  const carousel = document.createElement('div');
  carousel.className = 'elastic-carousel-track';

  /**
   * Build a single card from an authored row.
   * Expected cells:
   *   [0] category cell  — icon (picture/img) + category label text
   *   [1] media cell     — product image / screenshot
   *   [2] content cell   — heading + body paragraph + optional CTA link(s)
   * Optional last cell containing the word "dark" or "featured" marks the card
   * as the featured/expanded dark variant.
   *
   * @param {HTMLElement} row
   * @returns {HTMLElement}
   */
  function buildCard(row) {
    const cells = [...row.querySelectorAll(':scope > div')];
    const card = document.createElement('div');
    card.className = 'elastic-carousel-card';

    // Detect dark/featured variant from trailing marker cell
    const lastCell = cells[cells.length - 1];
    const markerText = lastCell?.textContent?.trim().toLowerCase();
    if (markerText === 'dark' || markerText === 'featured') {
      card.classList.add('elastic-carousel-card--featured');
      cells.pop();
    }

    const [categoryCell, mediaCell, contentCell] = cells;

    // ── Card header: icon + category label + chevron ──────
    if (categoryCell) {
      const header = document.createElement('div');
      header.className = 'elastic-carousel-card-header';

      const icon = categoryCell.querySelector('picture, img');
      if (icon) {
        const iconWrap = document.createElement('span');
        iconWrap.className = 'elastic-carousel-card-icon';
        iconWrap.append(icon.closest('picture') || icon);
        header.append(iconWrap);
      }

      // Collect text nodes that are not part of the icon picture
      const labelNodes = [...categoryCell.childNodes].filter((n) => {
        if (n.nodeType === Node.ELEMENT_NODE) {
          return !n.matches('picture') && !n.matches('img');
        }
        return n.nodeType === Node.TEXT_NODE && n.textContent.trim();
      });

      if (labelNodes.length) {
        const label = document.createElement('span');
        label.className = 'elastic-carousel-card-label';
        labelNodes.forEach((n) => label.append(n));
        header.append(label);
      }

      // Chevron arrow
      const arrow = document.createElement('span');
      arrow.className = 'elastic-carousel-card-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      header.append(arrow);

      card.append(header);
    }

    // ── Card media ────────────────────────────────────────
    if (mediaCell) {
      const media = document.createElement('div');
      media.className = 'elastic-carousel-card-media';
      const picture = mediaCell.querySelector('picture');
      const img = mediaCell.querySelector('img');
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

    // ── Card content: heading + body + optional CTA ───────
    if (contentCell) {
      const content = document.createElement('div');
      content.className = 'elastic-carousel-card-content';

      // Gather CTA links into an actions wrapper
      const links = [...contentCell.querySelectorAll('a')];
      if (links.length) {
        const actions = document.createElement('div');
        actions.className = 'elastic-carousel-card-actions';
        const linkParents = [...new Set(links.map((a) => a.closest('p') || a))];
        linkParents.forEach((node) => actions.append(node));
        contentCell.append(actions);
      }

      [...contentCell.childNodes].forEach((n) => content.append(n));
      card.append(content);
    }

    return card;
  }

  rows.forEach((row) => carousel.append(buildCard(row)));

  // ── Replace block content ────────────────────────────────
  block.innerHTML = '';
  block.append(carousel);
}
