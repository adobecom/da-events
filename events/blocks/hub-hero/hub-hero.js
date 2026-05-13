/**
 * Hub Hero block decorator.
 *
 * Expected DOM from AEM:
 *   .hub-hero > div > div:1  → text column (eyebrow, h1, desc, CTAs)
 *   .hub-hero > div > div:2  → media column (picture / img)
 */
export default function decorate(block) {
  const [textCol, mediaCol] = [...block.querySelectorAll(':scope > div > div')];

  if (textCol) {
    // Wrap all <a> siblings into a CTA actions container
    const links = [...textCol.querySelectorAll('a')];
    if (links.length) {
      const actions = document.createElement('div');
      actions.className = 'hub-hero-actions';
      // Move the paragraph containing the links, or the links themselves
      const linkParents = [...new Set(links.map((l) => l.closest('p') || l))];
      linkParents.forEach((node) => actions.append(node));
      textCol.append(actions);
    }
  }

  if (mediaCol) {
    const img = mediaCol.querySelector('img');
    if (img) img.loading = 'eager'; // LCP image
  }
}
