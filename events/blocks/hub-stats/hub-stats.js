/**
 * Hub Stats block decorator.
 *
 * Animates numeric stat values counting up from 0 when the section
 * scrolls into view (IntersectionObserver).
 *
 * Expected DOM (one row per stat):
 *   Row N  → single cell with:
 *     <p> containing the big number (e.g. "200M+")
 *     <p> containing the label     (e.g. "Creative Cloud members")
 *     <p> optional footnote        (e.g. "as of FY2024")
 *
 * Section heading row (optional): if first row has an h2 it is treated as a header.
 */

/**
 * Parse a stat string into a numeric base and a suffix.
 * "200M+" → { base: 200, suffix: 'M+' }
 * "99.9%" → { base: 99.9, suffix: '%' }
 * "$3B"   → { prefix: '$', base: 3, suffix: 'B' }
 */
function parseStat(raw) {
  const str = raw.trim();
  const match = str.match(/^([^0-9]*)([0-9]+(?:\.[0-9]+)?)([^0-9]*)$/);
  if (!match) return { raw: str, animated: false };
  return {
    prefix: match[1] || '',
    base: parseFloat(match[2]),
    suffix: match[3] || '',
    animated: true,
  };
}

function animateStat(el, parsed, duration = 1600) {
  if (!parsed.animated) return;
  const start = performance.now();
  const isFloat = String(parsed.base).includes('.');
  const decimals = isFloat ? (String(parsed.base).split('.')[1] || '').length : 0;

  function tick(now) {
    const elapsed = Math.min(now - start, duration);
    const progress = elapsed / duration;
    // Ease-out cubic
    const eased = 1 - (1 - progress) ** 3;
    const current = parsed.base * eased;
    el.textContent = `${parsed.prefix}${current.toFixed(decimals)}${parsed.suffix}`;
    if (elapsed < duration) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  // Detect optional heading row
  let headingRow = null;
  const firstCells = rows[0].querySelectorAll(':scope > div');
  if (firstCells.length === 1 && firstCells[0].querySelector('h2')) {
    headingRow = rows.shift();
    headingRow.className = 'hub-stats-heading';
  }

  // Build stat items
  const grid = document.createElement('div');
  grid.className = 'hub-stats-grid';

  rows.forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;
    const paras = [...cell.querySelectorAll('p')];
    if (!paras.length) return;

    const item = document.createElement('div');
    item.className = 'hub-stats-item';

    const rawValue = paras[0].textContent.trim();
    const parsed = parseStat(rawValue);

    const valueEl = document.createElement('p');
    valueEl.className = 'hub-stats-value';
    valueEl.textContent = rawValue; // will be updated by animation
    item.dataset.parsedBase = parsed.base;
    item.dataset.parsedPrefix = parsed.prefix || '';
    item.dataset.parsedSuffix = parsed.suffix || '';
    item.dataset.animated = parsed.animated;

    item.append(valueEl);

    if (paras[1]) {
      const label = document.createElement('p');
      label.className = 'hub-stats-label';
      label.textContent = paras[1].textContent.trim();
      item.append(label);
    }

    if (paras[2]) {
      const note = document.createElement('p');
      note.className = 'hub-stats-note';
      note.textContent = paras[2].textContent.trim();
      item.append(note);
    }

    grid.append(item);
  });

  // Replace block
  block.innerHTML = '';
  if (headingRow) block.append(headingRow);
  const wrapper = document.createElement('div');
  wrapper.append(grid);
  block.append(wrapper);

  // Animate on intersection
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      entry.target.querySelectorAll('.hub-stats-item').forEach((item) => {
        if (item.dataset.animated !== 'true') return;
        const valueEl = item.querySelector('.hub-stats-value');
        animateStat(valueEl, {
          prefix: item.dataset.parsedPrefix,
          base: parseFloat(item.dataset.parsedBase),
          suffix: item.dataset.parsedSuffix,
          animated: true,
        });
      });
    });
  }, { threshold: 0.25 });

  observer.observe(block);
}
