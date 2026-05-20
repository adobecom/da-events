export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  // ── Hero content row (first row) ──────────────────────────────
  const heroRow = rows[0];
  const heroCell = heroRow.querySelector(':scope > div') || heroRow;
  heroRow.classList.add('router-marquee-hero');
  heroCell.classList.add('router-marquee-content');

  // Background image: move first <picture> to heroRow as absolute bg layer
  const bgPicture = heroCell.querySelector('picture');
  if (bgPicture) {
    bgPicture.classList.add('router-marquee-bg');
    const bgImg = bgPicture.querySelector('img');
    if (bgImg) bgImg.loading = 'eager';
    heroRow.prepend(bgPicture);
  }

  // Mark eyebrow: first <p> before the heading that contains no link
  const heading = heroCell.querySelector('h1, h2, h3');
  if (heading) {
    [...heroCell.querySelectorAll('p')].forEach((p) => {
      const isBeforeHeading = !!(heading.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING);
      if (isBeforeHeading && !p.querySelector('a')) {
        p.classList.add('router-marquee-eyebrow');
      }
    });
  }

  // Collect CTA links into a dedicated actions wrapper
  const ctaLinks = [...heroCell.querySelectorAll('a')];
  if (ctaLinks.length) {
    const actions = document.createElement('div');
    actions.className = 'router-marquee-actions';
    [...new Set(ctaLinks.map((a) => a.closest('p') || a))].forEach((node) => actions.append(node));
    heroCell.append(actions);
  }

  // ── Router tab rows (rows 1 onwards) ──────────────────────────
  const tabRows = rows.slice(1);
  if (!tabRows.length) return;

  const nav = document.createElement('nav');
  nav.className = 'router-marquee-nav';
  nav.setAttribute('aria-label', 'Product categories');

  const tabList = document.createElement('div');
  tabList.className = 'router-marquee-tabs';

  tabRows.forEach((row, i) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    const iconCell = cells[0];
    const labelCell = cells.length > 1 ? cells[1] : cells[0];
    const link = labelCell?.querySelector('a');

    const tab = document.createElement('a');
    tab.className = 'router-marquee-tab';
    tab.href = link ? link.href : '#';

    // First tab is active by default (matches current product context)
    if (i === 0) {
      tab.classList.add('is-active');
      tab.setAttribute('aria-current', 'page');
    }

    // Indicator bar (red stripe at top of active tab)
    const indicator = document.createElement('span');
    indicator.className = 'router-marquee-tab-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    tab.append(indicator);

    // Product icon
    const iconEl = iconCell?.querySelector('picture') || iconCell?.querySelector('img');
    if (iconEl) {
      const iconWrap = document.createElement('span');
      iconWrap.className = 'router-marquee-tab-icon';
      iconWrap.append(iconEl);
      tab.append(iconWrap);
    }

    // Category label text
    const labelSpan = document.createElement('span');
    labelSpan.className = 'router-marquee-tab-label';
    labelSpan.textContent = link ? link.textContent.trim() : (labelCell?.textContent?.trim() || '');
    tab.append(labelSpan);

    // Chevron arrow
    const chevron = document.createElement('span');
    chevron.className = 'router-marquee-tab-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.innerHTML = '<svg viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    tab.append(chevron);

    tabList.append(tab);
    row.remove();
  });

  // Play / Pause carousel control button
  const playPause = document.createElement('button');
  playPause.className = 'router-marquee-play-pause';
  playPause.setAttribute('aria-label', 'Pause auto-rotation');
  playPause.setAttribute('aria-pressed', 'false');
  playPause.innerHTML = '<svg viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="3" height="12" rx="1.5" fill="currentColor"/><rect x="7" y="0" width="3" height="12" rx="1.5" fill="currentColor"/></svg>';
  playPause.addEventListener('click', () => {
    const pressed = playPause.getAttribute('aria-pressed') === 'true';
    playPause.setAttribute('aria-pressed', String(!pressed));
    playPause.setAttribute('aria-label', pressed ? 'Pause auto-rotation' : 'Resume auto-rotation');
    // Play icon when paused
    playPause.innerHTML = pressed
      ? '<svg viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="3" height="12" rx="1.5" fill="currentColor"/><rect x="7" y="0" width="3" height="12" rx="1.5" fill="currentColor"/></svg>'
      : '<svg viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L9 6L1 11V1Z" fill="currentColor"/></svg>';
  });

  nav.append(tabList);
  nav.append(playPause);

  // Append nav inside heroRow so it overlays the background image at the bottom
  heroRow.append(nav);
}
