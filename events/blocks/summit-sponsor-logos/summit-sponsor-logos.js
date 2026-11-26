import { LIBS } from '../../scripts/utils.js';

/*
 * Summit Sponsor Logos: an uncropped, linked logo grid (one block per sponsor tier).
 *
 * Authoring:
 *   | Summit Sponsor Logos (large | medium | small | ticker) |
 *   | ## Tier name (optional title row: heading, optional text)   |
 *   | [logo](https://sponsor) | [logo](https://sponsor) | ...     |
 * Each logo cell holds an image, inside a link or next to one. The image alt text is the sponsor
 * name and names the link. Variants set the tile size; `ticker` scrolls the logos in one row.
 */

const SIZES = ['large', 'medium', 'small'];

function getLogo(cell) {
  const img = cell.querySelector('img');
  if (!img) return null;
  const picture = img.closest('picture') || img;
  const link = cell.querySelector('a[href]');
  const name = img.getAttribute('alt')?.trim() || link?.textContent.trim() || '';
  return { picture, href: link?.getAttribute('href'), name };
}

function buildItem(createTag, { picture, href, name }) {
  const img = picture.tagName === 'IMG' ? picture : picture.querySelector('img');
  if (img && !img.getAttribute('alt')) img.setAttribute('alt', name);
  const tile = href
    ? createTag('a', { class: 'summit-sponsor-logos-tile', href }, picture)
    : createTag('span', { class: 'summit-sponsor-logos-tile' }, picture);
  return createTag('li', { class: 'summit-sponsor-logos-item' }, tile);
}

function decorateTicker(createTag, el, list) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const track = createTag('div', { class: 'summit-sponsor-logos-track' }, list);
  // A hidden copy of the list makes the loop seamless; assistive tech reads the first copy only.
  const copy = list.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  copy.querySelectorAll('a').forEach((a) => a.setAttribute('tabindex', '-1'));
  track.append(copy);
  const viewport = createTag('div', { class: 'summit-sponsor-logos-viewport' }, track);

  const button = createTag('button', { class: 'summit-sponsor-logos-toggle', type: 'button', 'aria-pressed': 'false' }, 'Pause logo animation');
  const setPaused = (paused) => {
    el.classList.toggle('is-paused', paused);
    button.setAttribute('aria-pressed', String(paused));
    button.textContent = paused ? 'Play logo animation' : 'Pause logo animation';
  };
  button.addEventListener('click', () => setPaused(!el.classList.contains('is-paused')));
  const applyMotion = () => {
    button.hidden = reduceMotion.matches;
    if (reduceMotion.matches) setPaused(true);
  };
  reduceMotion.addEventListener('change', applyMotion);
  applyMotion();
  return [viewport, button];
}

export default async function init(el) {
  const { createTag } = await import(`${LIBS}/utils/utils.js`);
  const rows = [...el.querySelectorAll(':scope > div')];
  if (!SIZES.some((size) => el.classList.contains(size))) el.classList.add('medium');

  let header = null;
  const logos = [];
  rows.forEach((row, i) => {
    const cells = [...row.children];
    const rowLogos = cells.map(getLogo).filter(Boolean);
    if (i === 0 && !rowLogos.length && row.textContent.trim()) {
      header = createTag('div', { class: 'summit-sponsor-logos-header' });
      cells.forEach((cell) => header.append(...cell.childNodes));
      return;
    }
    logos.push(...rowLogos);
  });

  const list = createTag('ul', { class: 'summit-sponsor-logos-list' });
  logos.forEach((logo) => list.append(buildItem(createTag, logo)));

  const content = el.classList.contains('ticker') ? decorateTicker(createTag, el, list) : [list];
  el.replaceChildren(...(header ? [header] : []), ...content);
  if (!logos.length) el.classList.add('is-empty');
}
