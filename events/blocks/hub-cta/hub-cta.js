/**
 * Hub CTA block decorator.
 *
 * Expected DOM (single row, single cell):
 *   eyebrow <p> + <h2> + desc <p> + CTA links <p>
 */
export default function decorate(block) {
  const links = [...block.querySelectorAll('a')];
  if (!links.length) return;

  const actions = document.createElement('div');
  actions.className = 'hub-cta-actions';

  const linkParents = [...new Set(links.map((l) => l.closest('p') || l))];
  linkParents.forEach((node) => actions.append(node));

  block.querySelector(':scope > div > div')?.append(actions);
}
