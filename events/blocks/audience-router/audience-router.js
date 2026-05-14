export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  // First row is the section heading
  const [headingRow, ...cardRows] = rows;

  // Build heading section
  const headingSection = document.createElement('div');
  headingSection.className = 'audience-router-heading';
  const headingCell = headingRow.querySelector(':scope > div') || headingRow;
  [...headingCell.childNodes].forEach((node) => headingSection.append(node));

  // Build cards container
  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'audience-router-cards';

  cardRows.forEach((row, index) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    const [labelCell, mediaCell, taglineCell] = cells;

    const card = document.createElement('div');
    card.className = 'audience-router-card';
    if (index === 0) card.classList.add('active');

    // Tab header: audience label + chevron icon
    const tab = document.createElement('div');
    tab.className = 'audience-router-tab';

    const label = document.createElement('span');
    label.className = 'audience-router-label';
    if (labelCell) {
      label.textContent = labelCell.textContent.trim();
    }

    const chevron = document.createElement('span');
    chevron.className = 'audience-router-chevron';
    chevron.setAttribute('aria-hidden', 'true');

    tab.append(label, chevron);
    tab.addEventListener('click', () => {
      [...cardsContainer.querySelectorAll('.audience-router-card')].forEach((c) => {
        c.classList.remove('active');
      });
      card.classList.add('active');
    });

    // Media: product image
    const media = document.createElement('div');
    media.className = 'audience-router-media';
    if (mediaCell) {
      const img = mediaCell.querySelector('img');
      if (img) {
        if (index === 0) img.loading = 'eager';
        media.append(img);
      }
    }

    // Tagline and optional CTA link
    const tagline = document.createElement('div');
    tagline.className = 'audience-router-tagline';
    if (taglineCell) {
      [...taglineCell.childNodes].forEach((node) => tagline.append(node));
    }

    // Gather all links in the card row for navigation
    const allLinks = [...(mediaCell?.querySelectorAll('a') || []), ...(taglineCell?.querySelectorAll('a') || [])];
    if (allLinks.length) {
      const primaryLink = allLinks[0];
      card.setAttribute('role', 'link');
      card.setAttribute('tabindex', '0');
      card.addEventListener('click', () => {
        window.location.href = primaryLink.href;
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.location.href = primaryLink.href;
        }
      });
    }

    card.append(tab, media, tagline);
    cardsContainer.append(card);
  });

  // Progress indicator dots
  const progress = document.createElement('div');
  progress.className = 'audience-router-progress';
  cardRows.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'audience-router-dot';
    if (i === 0) dot.classList.add('active');
    dot.setAttribute('aria-label', `Go to card ${i + 1}`);
    dot.addEventListener('click', () => {
      const cards = [...cardsContainer.querySelectorAll('.audience-router-card')];
      const dots = [...progress.querySelectorAll('.audience-router-dot')];
      cards.forEach((c) => c.classList.remove('active'));
      dots.forEach((d) => d.classList.remove('active'));
      cards[i]?.classList.add('active');
      dot.classList.add('active');
      cards[i]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
    progress.append(dot);
  });

  block.innerHTML = '';
  block.append(headingSection, cardsContainer, progress);
}
