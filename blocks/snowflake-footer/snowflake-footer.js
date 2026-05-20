export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  // Collect authored rows by cell count / content signals
  let navRow = null;
  let productsRow = null;
  let bottomRow = null;
  let logoRow = null;

  rows.forEach((row) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    if (cells.length > 1) {
      // Multi-cell = navigation columns
      navRow = row;
    } else if (cells.length === 1) {
      const text = cells[0].textContent.trim().toLowerCase();
      if (text.startsWith('featured') || cells[0].querySelector('picture, img')) {
        productsRow = cells[0];
      } else if (
        text.includes('©')
        || text.includes('region')
        || text.includes('privacy')
        || text.includes('copyright')
      ) {
        bottomRow = cells[0];
      } else if (text.includes('adobe') && cells[0].childElementCount <= 1) {
        logoRow = cells[0];
      } else {
        productsRow = productsRow || cells[0];
      }
    }
  });

  // ── Build wrapper ───────────────────────────────────────
  const inner = document.createElement('div');
  inner.className = 'snowflake-footer-inner';

  // ── 1. Navigation columns ───────────────────────────────
  if (navRow) {
    const nav = document.createElement('nav');
    nav.className = 'snowflake-footer-nav';
    nav.setAttribute('aria-label', 'Footer navigation');

    const cells = [...navRow.querySelectorAll(':scope > div')];
    cells.forEach((cell) => {
      const col = document.createElement('div');
      col.className = 'snowflake-footer-col';

      // First strong/heading as column heading
      const headingEl = cell.querySelector('strong, h2, h3, h4, b');
      const headingText = headingEl
        ? headingEl.closest('p')?.textContent.trim() || headingEl.textContent.trim()
        : null;

      if (headingText) {
        const heading = document.createElement('p');
        heading.className = 'snowflake-footer-col-heading';
        heading.textContent = headingText;
        col.append(heading);
      }

      // Links list
      const links = [...cell.querySelectorAll('a')];
      if (links.length) {
        const ul = document.createElement('ul');
        ul.className = 'snowflake-footer-col-list';
        links.forEach((a) => {
          const li = document.createElement('li');
          const link = a.cloneNode(true);
          li.append(link);
          ul.append(li);
        });
        col.append(ul);
      } else {
        // Fall back to plain text items (paragraphs that aren't the heading)
        const paras = [...cell.querySelectorAll('p')];
        const linkParas = paras.filter(
          (p) => !p.querySelector('strong, b') && p.textContent.trim(),
        );
        if (linkParas.length) {
          const ul = document.createElement('ul');
          ul.className = 'snowflake-footer-col-list';
          linkParas.forEach((p) => {
            const li = document.createElement('li');
            li.textContent = p.textContent.trim();
            ul.append(li);
          });
          col.append(ul);
        }
      }

      nav.append(col);
    });

    inner.append(nav);
  }

  // ── 2. Featured products ────────────────────────────────
  if (productsRow) {
    const products = document.createElement('div');
    products.className = 'snowflake-footer-products';
    [...productsRow.childNodes].forEach((node) => products.append(node.cloneNode(true)));
    inner.append(products);
  }

  // ── 3. Bottom bar ───────────────────────────────────────
  if (bottomRow) {
    const bottom = document.createElement('div');
    bottom.className = 'snowflake-footer-bottom';
    [...bottomRow.childNodes].forEach((node) => bottom.append(node.cloneNode(true)));
    inner.append(bottom);
  }

  // ── 4. Logo mark ────────────────────────────────────────
  if (logoRow) {
    const logo = document.createElement('div');
    logo.className = 'snowflake-footer-logo';
    [...logoRow.childNodes].forEach((node) => logo.append(node.cloneNode(true)));
    inner.append(logo);
  } else {
    // Render the decorative wordmark via CSS pseudo-element (no author input needed)
    const logo = document.createElement('div');
    logo.className = 'snowflake-footer-logo';
    logo.setAttribute('aria-hidden', 'true');
    inner.append(logo);
  }

  block.innerHTML = '';
  block.append(inner);
}
