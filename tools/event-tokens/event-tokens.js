/**
 * "Event Tokens" DA Library plugin.
 *
 * Surfaces the catalog of `[[placeholder]]` tokens available on event detail page
 * templates (see ./tokens.js for the catalog + provenance) so authors can look up,
 * copy, or insert a token without needing to know the underlying event data shape.
 */
// eslint-disable-next-line import/no-unresolved
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import { TOKEN_CATALOG, TOKEN_CATEGORIES } from './tokens.js';

function matchesQuery(entry, query) {
  if (!query) return true;
  const haystack = `${entry.category} ${entry.token} ${entry.label} ${entry.note || ''}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function createTokenRow(entry, actions) {
  const row = document.createElement('li');
  row.className = 'token-row';

  const main = document.createElement('div');
  main.className = 'token-row-main';

  const code = document.createElement('code');
  code.className = 'token-string';
  code.textContent = entry.token;
  main.append(code);

  const label = document.createElement('span');
  label.className = 'token-label';
  label.textContent = entry.label;
  main.append(label);

  row.append(main);

  if (entry.example) {
    const example = document.createElement('div');
    example.className = 'token-example';
    const exampleLabel = document.createElement('span');
    exampleLabel.className = 'token-example-tag';
    exampleLabel.textContent = 'Example:';
    const exampleValue = document.createElement('span');
    exampleValue.textContent = entry.example;
    example.append(exampleLabel, exampleValue);
    row.append(example);
  }

  if (entry.note) {
    const note = document.createElement('p');
    note.className = 'token-note';
    note.textContent = entry.note;
    row.append(note);
  }

  const buttons = document.createElement('div');
  buttons.className = 'token-actions';

  const insertBtn = document.createElement('button');
  insertBtn.type = 'button';
  insertBtn.className = 'token-btn token-btn-insert';
  insertBtn.textContent = 'Insert';
  insertBtn.addEventListener('click', () => actions.sendText(entry.token));

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'token-btn token-btn-copy';
  copyBtn.textContent = 'Copy';
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(entry.token);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1200);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Event Tokens: clipboard write failed', error);
    }
  });

  buttons.append(insertBtn, copyBtn);
  row.append(buttons);

  return row;
}

function renderCatalog(container, actions, query) {
  container.textContent = '';

  TOKEN_CATEGORIES.forEach((category) => {
    const entries = TOKEN_CATALOG.filter(
      (entry) => entry.category === category && matchesQuery(entry, query),
    );
    if (entries.length === 0) return;

    const section = document.createElement('section');
    section.className = 'token-category';

    const heading = document.createElement('h2');
    heading.textContent = category;
    section.append(heading);

    const list = document.createElement('ul');
    list.className = 'token-list';
    entries.forEach((entry) => list.append(createTokenRow(entry, actions)));
    section.append(list);

    container.append(section);
  });

  if (!container.children.length) {
    const empty = document.createElement('p');
    empty.className = 'token-empty';
    empty.textContent = 'No tokens match your search.';
    container.append(empty);
  }
}

function buildUi(actions) {
  const root = document.createElement('div');
  root.className = 'event-tokens-app';

  const header = document.createElement('div');
  header.className = 'event-tokens-header';

  const title = document.createElement('h1');
  title.textContent = 'Event Tokens';
  header.append(title);

  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = 'Search tokens (e.g. "speaker", "date", "image")';
  search.className = 'token-search';
  header.append(search);

  root.append(header);

  const results = document.createElement('div');
  results.className = 'token-results';
  root.append(results);

  search.addEventListener('input', () => renderCatalog(results, actions, search.value.trim()));
  renderCatalog(results, actions, '');

  document.body.append(root);
}

(async function init() {
  try {
    const { actions } = await DA_SDK;
    buildUi(actions);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Event Tokens: failed to initialize DA_SDK', error);
  }
}());
