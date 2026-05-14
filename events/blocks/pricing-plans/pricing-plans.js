/**
 * Pricing Plans block
 *
 * Authored table structure (SharePoint rows → divs):
 *   Row 0  – 1 cell  : Section header (eyebrow p, h2, body p)
 *   Row 1  – N cells : Tab labels ("Individuals" | "Businesses" | "Students & Teachers")
 *   Row 2… – 2 cells : Plan card top (tagline h3, name, desc, price, CTAs) | features list
 *   Last   – 1 cell  : Footer CTA ("Compare Plans" link, optional)
 */
export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (rows.length < 3) return;

  const headerRow = rows[0];
  const tabsRow = rows[1];

  // Detect optional footer: last row with a single cell
  const lastRow = rows[rows.length - 1];
  const lastRowCells = [...lastRow.querySelectorAll(':scope > div')];
  const hasFooter = lastRowCells.length === 1;
  const planRows = hasFooter ? rows.slice(2, -1) : rows.slice(2);
  const footerRow = hasFooter ? lastRow : null;

  // ── Section header ─────────────────────────────────────────────
  const header = document.createElement('div');
  header.className = 'pricing-plans-header';
  const headerCell = headerRow.querySelector(':scope > div') || headerRow;

  // Mark eyebrow: first <p> appearing before the <h2>
  const heading = headerCell.querySelector('h2, h3');
  if (heading) {
    const prev = heading.previousElementSibling;
    if (prev && prev.tagName === 'P' && !prev.querySelector('a')) {
      prev.classList.add('pricing-plans-eyebrow');
    }
  }
  [...headerCell.childNodes].forEach((n) => header.append(n));

  // ── Tab switcher ───────────────────────────────────────────────
  const tabsCells = [...tabsRow.querySelectorAll(':scope > div')];
  const tabsNav = document.createElement('div');
  tabsNav.className = 'pricing-plans-tabs';
  tabsNav.setAttribute('role', 'tablist');

  tabsCells.forEach((cell, i) => {
    const btn = document.createElement('button');
    btn.className = 'pricing-plans-tab';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    btn.type = 'button';
    btn.textContent = cell.textContent.trim();
    btn.addEventListener('click', () => {
      tabsNav.querySelectorAll('[role="tab"]').forEach((t) => {
        t.setAttribute('aria-selected', 'false');
      });
      btn.setAttribute('aria-selected', 'true');
    });
    tabsNav.append(btn);
  });

  // ── Plan cards grid ────────────────────────────────────────────
  const grid = document.createElement('div');
  grid.className = 'pricing-plans-grid';

  planRows.forEach((row) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    if (!cells.length) return;

    const infoCell = cells[0];
    const featuresCell = cells[1] || null;

    const card = document.createElement('article');
    card.className = 'pricing-plans-card';

    // ── Classify info cell paragraphs ──────────────────────────
    // Tagline is the h3 (authored as Heading 3 in SharePoint)
    const tagline = infoCell.querySelector('h3');
    if (tagline) tagline.classList.add('pricing-plans-tagline');

    let priceSeen = false;
    const paras = [...infoCell.querySelectorAll(':scope > p')];
    paras.forEach((p) => {
      const strongAnchor = p.querySelector('strong a, strong > a');
      const emAnchor = p.querySelector('em a, em > a');
      const onlyStrong = p.querySelector('strong') && !p.querySelector('a');
      const onlyEm = p.querySelector('em') && !p.querySelector('a');
      const text = p.textContent.trim();

      if (strongAnchor) {
        // Primary CTA: **[link text](href)**
        p.classList.add('pricing-plans-cta-primary');
      } else if (emAnchor) {
        // Secondary CTA: *[link text](href)*
        p.classList.add('pricing-plans-cta-secondary');
      } else if (onlyStrong && (text.includes('$') || /^free$/i.test(text))) {
        // Price line: **Free** or **US$9.99/mo**
        p.classList.add('pricing-plans-price');
        priceSeen = true;
      } else if (priceSeen && onlyEm) {
        // Billing info after price: *Annual, billed monthly*
        p.classList.add('pricing-plans-billing');
      } else if (priceSeen && !p.querySelector('a')) {
        // Add-on/subscription detail text after price
        p.classList.add('pricing-plans-addons');
      } else if (p.querySelector('a') && !p.querySelector('strong') && !p.querySelector('em')) {
        // "See what's included | See terms" link
        p.classList.add('pricing-plans-see-more');
      }
    });

    // Gather CTAs into an actions wrapper
    const ctaEls = [...infoCell.querySelectorAll('.pricing-plans-cta-primary, .pricing-plans-cta-secondary')];
    if (ctaEls.length) {
      const actions = document.createElement('div');
      actions.className = 'pricing-plans-actions';
      ctaEls.forEach((p) => {
        infoCell.removeChild(p);
        actions.append(p);
      });
      infoCell.append(actions);
    }

    // Wrap all info cell content in a card-top container
    const cardTop = document.createElement('div');
    cardTop.className = 'pricing-plans-card-top';
    [...infoCell.childNodes].forEach((n) => cardTop.append(n));
    card.append(cardTop);

    // Features list
    if (featuresCell) {
      const features = document.createElement('div');
      features.className = 'pricing-plans-features';
      [...featuresCell.childNodes].forEach((n) => features.append(n));
      card.append(features);
    }

    grid.append(card);
  });

  // ── Footer CTA ─────────────────────────────────────────────────
  const footer = document.createElement('div');
  footer.className = 'pricing-plans-footer';

  if (footerRow) {
    const footerCell = footerRow.querySelector(':scope > div') || footerRow;
    const links = [...footerCell.querySelectorAll('a')];
    if (links.length) {
      const footerActions = document.createElement('div');
      footerActions.className = 'pricing-plans-footer-actions';
      const parents = [...new Set(links.map((a) => a.closest('p') || a))];
      parents.forEach((n) => {
        footerCell.removeChild(n);
        footerActions.append(n);
      });
      footer.append(footerActions);
    } else {
      [...footerCell.childNodes].forEach((n) => footer.append(n));
    }
  }

  // ── Rebuild block ───────────────────────────────────────────────
  block.innerHTML = '';
  const inner = document.createElement('div');
  inner.append(header, tabsNav, grid);
  if (footerRow) inner.append(footer);
  block.append(inner);
}
