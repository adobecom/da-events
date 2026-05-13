/**
 * Hub Featured block decorator.
 *
 * Expected DOM (two cells per row):
 *   Cell 0  → media column (picture / img / svg / video)
 *   Cell 1  → text column  (eyebrow p, h2, body p, CTA links p, tags p)
 *
 * Modifiers (added as extra classes on the block div):
 *   media-right  → flips layout so media is on the right
 *   dark         → dark colour scheme
 */
export default function decorate(block) {
  const row = block.querySelector(':scope > div');
  if (!row) return;

  const [mediaCell, textCell] = [...row.querySelectorAll(':scope > div')];

  // ── Media column: eager-load LCP image
  if (mediaCell) {
    const img = mediaCell.querySelector('img');
    if (img) img.loading = 'eager';
  }

  // ── Text column: wire up eyebrow, headings, body, links, tags
  if (textCell) {
    // First <p> before the heading → eyebrow
    const firstP = textCell.querySelector('p:first-child');
    const heading = textCell.querySelector('h2, h3');
    if (firstP && heading && firstP !== heading && !firstP.querySelector('a')) {
      firstP.classList.add('hub-featured-eyebrow');
    }

    // Gather CTA links
    const links = [...textCell.querySelectorAll('a')];
    if (links.length) {
      const actions = document.createElement('div');
      actions.className = 'hub-featured-actions';
      const linkContainers = [...new Set(links.map((l) => l.closest('p') || l))];
      linkContainers.forEach((node) => actions.append(node));
      textCell.append(actions);
    }

    // Last <p> with only pipe-separated text → feature tags
    const lastP = textCell.querySelector('p:last-of-type');
    if (lastP && lastP.textContent.includes('|') && !lastP.querySelector('a')) {
      const tags = lastP.textContent.split('|').map((t) => t.trim()).filter(Boolean);
      const tagRow = document.createElement('div');
      tagRow.className = 'hub-featured-tags';
      tags.forEach((label) => {
        const tag = document.createElement('span');
        tag.className = 'hub-featured-tag';
        tag.textContent = label;
        tagRow.append(tag);
      });
      lastP.replaceWith(tagRow);
    }
  }
}
