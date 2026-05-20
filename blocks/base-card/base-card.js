export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  const isFeatured = block.classList.contains('featured');

  // Expect: row 0 = media, row 1 = copy
  // Graceful fallback: single row treated as copy-only
  let mediaRow = null;
  let copyRow = null;

  if (rows.length >= 2) {
    [mediaRow, copyRow] = rows;
  } else {
    [copyRow] = rows;
  }

  // ── Build inner wrapper ────────────────────────────────────
  const inner = document.createElement('div');
  inner.className = 'base-card-inner';

  // ── Media section ──────────────────────────────────────────
  if (mediaRow) {
    const mediaWrapper = document.createElement('div');
    mediaWrapper.className = 'base-card-media';
    const cell = mediaRow.querySelector(':scope > div') || mediaRow;
    [...cell.childNodes].forEach((n) => mediaWrapper.append(n));

    // Eager-load the LCP image on featured cards
    const img = mediaWrapper.querySelector('img');
    if (img && isFeatured) img.loading = 'eager';

    inner.append(mediaWrapper);
  }

  // ── Copy section ───────────────────────────────────────────
  if (copyRow) {
    const copyWrapper = document.createElement('div');
    copyWrapper.className = 'base-card-copy';
    const cell = copyRow.querySelector(':scope > div') || copyRow;

    // Mark eyebrow: first <p> before the heading that has no link
    const heading = cell.querySelector('h2, h3');
    if (heading) {
      const allPs = [...cell.querySelectorAll('p')];
      const eyebrow = allPs.find(
        (p) => p.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING
          && !p.querySelector('a'),
      );
      if (eyebrow) eyebrow.classList.add('base-card-eyebrow');
    }

    // Gather links into a CTA actions container
    const links = [...cell.querySelectorAll('a')];
    if (links.length) {
      const actions = document.createElement('div');
      actions.className = 'base-card-actions';
      const parents = [...new Set(links.map((a) => a.closest('p') || a))];
      parents.forEach((node) => actions.append(node));
      cell.append(actions);
    }

    [...cell.childNodes].forEach((n) => copyWrapper.append(n));
    inner.append(copyWrapper);
  }

  // ── Replace block content ──────────────────────────────────
  block.innerHTML = '';
  block.append(inner);
}
