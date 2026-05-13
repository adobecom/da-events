/**
 * Hub Marquee block decorator.
 *
 * Expected DOM (one row per marquee item):
 *   Row 0..N  → single cell with text (and optionally an img)
 *
 * The decorator pulls every row into an infinitely-scrolling track.
 * Items are duplicated so the loop is seamless.
 *
 * Variant modifier: add class "dark" to the block for a dark background.
 */
export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  // Collect raw items from authored rows
  const items = rows.map((row) => {
    const cell = row.querySelector(':scope > div') || row;
    return cell.innerHTML.trim();
  });

  // Build track (items duplicated for seamless loop)
  const trackWrap = document.createElement('div');
  trackWrap.className = 'hub-marquee-track-wrap';
  trackWrap.setAttribute('aria-hidden', 'true');

  const track = document.createElement('div');
  track.className = 'hub-marquee-track';

  // Double the items so the animation loop is seamless
  [...items, ...items].forEach((html) => {
    const item = document.createElement('div');
    item.className = 'hub-marquee-item';
    item.innerHTML = html;
    track.append(item);
  });

  trackWrap.append(track);

  // Replace block content
  block.innerHTML = '';
  block.append(trackWrap);
}
