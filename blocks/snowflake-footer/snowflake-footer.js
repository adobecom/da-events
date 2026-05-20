export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  // Classify authored rows by structure / content signals
  let navRow = null;
  let productsRow = null;
  let bottomRow = null;

  rows.forEach((row) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    if (cells.length > 1) {
      // Multi-cell row → navigation columns
      navRow = row;
    } else if (cells.length === 1) {
      const cell = cells[0];
      const text = cell.textContent.trim().toLowerCase();
      if (
        text.includes('©')
        || text.includes('region')
        || text.includes('do not sell')
        || text.includes('copyright')
        || text.includes('adchoice')
      ) {
        bottomRow = cell;
      } else {
        productsRow = productsRow || cell;
      }
    }
  });

  // ── Build inner wrapper ──────────────────────────────────
  const inner = document.createElement('div');
  inner.className = 'snowflake-footer-inner';

  // ── 1. Navigation columns ────────────────────────────────
  if (navRow) {
    const nav = document.createElement('nav');
    nav.className = 'snowflake-footer-nav';
    nav.setAttribute('aria-label', 'Footer navigation');

    const cells = [...navRow.querySelectorAll(':scope > div')];
    cells.forEach((cell) => {
      const col = document.createElement('div');
      col.className = 'snowflake-footer-col';

      // First bold/strong/heading element as the column heading
      const headingEl = cell.querySelector('strong, b, h2, h3, h4');
      const headingText = headingEl
        ? (headingEl.closest('p')?.textContent ?? headingEl.textContent).trim()
        : null;

      if (headingText) {
        const heading = document.createElement('p');
        heading.className = 'snowflake-footer-col-heading';
        heading.textContent = headingText;
        col.append(heading);
      }

      // Gather links into a <ul>
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
        // Fallback: plain-text paragraphs that aren't the heading paragraph
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

  // ── 2. Featured products row ─────────────────────────────
  if (productsRow) {
    const products = document.createElement('div');
    products.className = 'snowflake-footer-products';
    [...productsRow.childNodes].forEach((node) => products.append(node.cloneNode(true)));
    inner.append(products);
  }

  // ── 3. Bottom bar (copyright + socials) ──────────────────
  if (bottomRow) {
    const bottom = document.createElement('div');
    bottom.className = 'snowflake-footer-bottom';
    [...bottomRow.childNodes].forEach((node) => bottom.append(node.cloneNode(true)));
    inner.append(bottom);
  }

  // ── 4. Decorative logo wordmark ──────────────────────────
  const logo = document.createElement('div');
  logo.className = 'snowflake-footer-logo';
  logo.setAttribute('aria-hidden', 'true');
  inner.append(logo);

  block.innerHTML = '';
  block.append(inner);
}
