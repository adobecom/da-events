/**
 * Hub Quote block decorator.
 *
 * Expected DOM (single row):
 *   Cell 0  → quote text (blockquote or <p> with quotation)
 *   Cell 1  → attribution: name <p>, title/company <p>, optional <img> for avatar
 *
 * Single-cell variant: all content in one cell (quote + attribution merged).
 *
 * Modifier classes:
 *   dark  → dark background variant
 */
export default function decorate(block) {
  const row = block.querySelector(':scope > div');
  if (!row) return;

  const cells = [...row.querySelectorAll(':scope > div')];
  const isTwoCol = cells.length >= 2;

  const quoteCell = cells[0];
  const attrCell = isTwoCol ? cells[1] : null;

  // ── Quote text: wrap in <blockquote> if not already
  let bq = quoteCell.querySelector('blockquote');
  if (!bq) {
    bq = document.createElement('blockquote');
    bq.className = 'hub-quote-text';
    [...quoteCell.childNodes].forEach((n) => bq.append(n));
    quoteCell.append(bq);
  } else {
    bq.classList.add('hub-quote-text');
  }

  // Remove opening curly-quote if author provided plain text
  const firstP = bq.querySelector('p');
  if (firstP) {
    firstP.textContent = firstP.textContent.replace(/^[""“”]/, '').replace(/[""“”]$/, '');
  }

  // ── Attribution column
  if (attrCell) {
    attrCell.className = 'hub-quote-attribution';

    const img = attrCell.querySelector('img');
    if (img) {
      img.classList.add('hub-quote-avatar');
      const wrap = document.createElement('div');
      wrap.className = 'hub-quote-avatar-wrap';
      wrap.append(img.closest('picture') || img);
      attrCell.prepend(wrap);
    }

    // First <p> after any img → name; second <p> → role/company
    const paras = [...attrCell.querySelectorAll('p:not(.hub-quote-avatar)')];
    if (paras[0]) paras[0].classList.add('hub-quote-name');
    if (paras[1]) paras[1].classList.add('hub-quote-role');
  }

  // ── Decorative open-quote mark
  const mark = document.createElement('span');
  mark.className = 'hub-quote-mark';
  mark.setAttribute('aria-hidden', 'true');
  mark.textContent = '“';
  quoteCell.prepend(mark);
}
