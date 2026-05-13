/**
 * Hub Cards block decorator.
 *
 * Expected DOM (one row per card after the optional heading row):
 *   Row 0 (single cell)  → eyebrow + h2 + desc  (section heading)
 *   Row 1..N (two cells) → [icon/img | h3 + desc + link]
 *                       OR (single cell) → h3 + desc + link  (auto-icon)
 *
 * Each card row gets a colour cycled from CARD_COLORS.
 */

const CARD_COLORS = [
  '#eb1000', // Adobe red
  '#1473e6', // Creative Cloud blue
  '#e34850', // coral
  '#2d9d78', // acrobat green
  '#9256d9', // fuchsia
  '#d4380d', // orange-red
  '#0073e6', // blue
  '#12805c', // dark green
];

const ABBREVS = {
  'photoshop': 'Ps',
  'illustrator': 'Ai',
  'indesign': 'Id',
  'premiere': 'Pr',
  'after effects': 'Ae',
  'lightroom': 'Lr',
  'acrobat': 'Ac',
  'xd': 'Xd',
  'animate': 'An',
  'substance': 'Sb',
  'fresco': 'Fr',
  'dimension': 'Dn',
};

function getAbbrev(name) {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(ABBREVS)) {
    if (lower.includes(key)) return val;
  }
  return name.slice(0, 2).toUpperCase();
}

export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  // Detect heading row: single cell with h2 or strong text only
  let headingRow = null;
  const firstCells = rows[0].querySelectorAll(':scope > div');
  if (firstCells.length === 1 && firstCells[0].querySelector('h2, h3, strong')) {
    headingRow = rows.shift();
    headingRow.className = ''; // keep it as-is, CSS targets first-child
  }

  // Build card grid
  const grid = document.createElement('div');
  grid.className = 'hub-cards-grid';

  rows.forEach((row, i) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    const color = CARD_COLORS[i % CARD_COLORS.length];

    const card = document.createElement('div');
    card.className = 'hub-cards-item';
    card.style.setProperty('--hub-card-color', color);

    // Determine text cell (last cell or only cell)
    const textCell = cells.length > 1 ? cells[cells.length - 1] : cells[0];
    const mediaCell = cells.length > 1 ? cells[0] : null;

    // Build icon
    const iconWrap = document.createElement('div');
    const img = mediaCell ? mediaCell.querySelector('img') : null;

    if (img) {
      iconWrap.className = 'hub-cards-item-icon';
      iconWrap.append(img.closest('picture') || img);
    } else {
      iconWrap.className = 'hub-cards-item-icon-placeholder';
      const heading = textCell.querySelector('h2, h3, strong');
      iconWrap.textContent = heading ? getAbbrev(heading.textContent.trim()) : '?';
    }

    card.append(iconWrap, ...textCell.childNodes);
    grid.append(card);
  });

  // Replace block content
  block.innerHTML = '';
  if (headingRow) block.append(headingRow);
  const wrapper = document.createElement('div');
  wrapper.append(grid);
  block.append(wrapper);
}
