import { LIBS } from '../../scripts/utils.js';

/*
 * Summit Feature Grid: a tight bento of feature tiles (photo on top, text below, grey card).
 *
 * Authoring, one row per tile:
 *   | Summit Feature Grid (wide-3)                                    |              |
 *   | ### Title, text, optional topic list, optional link paragraph   | picture      |
 * The image cell is whichever cell holds a picture. `wide-N` (one or more, e.g. `wide-1, wide-3`)
 * makes tile N span the full row; on wide tiles a topic list flows into columns. Photos keep their
 * own aspect ratio (never cropped).
 */

function isLinkOnly(el) {
  const link = el.querySelector(':scope > a, :scope > strong > a, :scope > em > a');
  return el.tagName === 'P' && link && el.textContent.trim() === link.textContent.trim();
}

function buildTile(createTag, row, index, wide) {
  const cells = [...row.children];
  const mediaCell = cells.find((cell) => cell.querySelector('picture, img'));
  const contentCell = cells.find((cell) => cell !== mediaCell);

  const tile = createTag('li', { class: 'summit-feature-grid-tile' });
  if (wide.includes(index + 1)) tile.classList.add('wide');

  if (mediaCell) {
    const picture = mediaCell.querySelector('picture') || mediaCell.querySelector('img');
    tile.append(createTag('div', { class: 'summit-feature-grid-media' }, picture));
  }

  const body = createTag('div', { class: 'summit-feature-grid-body' });
  const text = createTag('div', { class: 'summit-feature-grid-text' });
  [...(contentCell?.children || [])].forEach((child) => {
    if (child.matches('ul, ol')) {
      child.classList.add('summit-feature-grid-topics');
      body.append(child);
    } else if (isLinkOnly(child)) {
      child.classList.add('summit-feature-grid-cta');
      text.append(child);
    } else {
      text.append(child);
    }
  });
  body.prepend(text);
  if (body.querySelector('.summit-feature-grid-topics')) tile.classList.add('has-topics');
  tile.append(body);
  return tile;
}

export default async function init(el) {
  const { createTag } = await import(`${LIBS}/utils/utils.js`);
  const wide = [...el.classList]
    .map((cls) => /^wide-(\d+)$/.exec(cls))
    .filter(Boolean)
    .map((match) => Number(match[1]));
  const rows = [...el.querySelectorAll(':scope > div')];
  const list = createTag('ul', { class: 'summit-feature-grid-list' });
  rows.forEach((row, i) => list.append(buildTile(createTag, row, i, wide)));
  el.replaceChildren(list);
}
