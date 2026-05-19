export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  // Unique gradient ID to avoid conflicts when multiple instances are on the page
  const gradId = `asg-grad-${Math.random().toString(36).slice(2, 8)}`;

  // Helper: safely extract a row's first cell
  function getCell(row) {
    if (!row) return null;
    return row.querySelector(':scope > div') || row;
  }

  const [headlineRow, bodyRow, disclaimerRow] = rows;

  // ── Copy lockup ────────────────────────────────────────────
  const copy = document.createElement('div');
  copy.className = 'snowflake-agentic-search-copy';

  const headlineCell = getCell(headlineRow);
  if (headlineCell) {
    [...headlineCell.childNodes].forEach((n) => copy.append(n));
  }

  const bodyCell = getCell(bodyRow);
  if (bodyCell) {
    [...bodyCell.childNodes].forEach((n) => copy.append(n));
  }

  // ── Search input group ─────────────────────────────────────
  const inputGroup = document.createElement('div');
  inputGroup.className = 'snowflake-agentic-search-input-group';
  inputGroup.setAttribute('role', 'search');

  // Gradient magnifying-glass icon
  const searchIcon = document.createElement('span');
  searchIcon.className = 'snowflake-agentic-search-icon';
  searchIcon.setAttribute('aria-hidden', 'true');
  searchIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="${gradId}" x1="8" y1="16" x2="8" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#8D88F2"/>
        <stop offset="100%" stop-color="#EB1000"/>
      </linearGradient>
    </defs>
    <circle cx="6.5" cy="6.5" r="4.5" stroke="url(#${gradId})" stroke-width="2" stroke-linecap="round"/>
    <line x1="10" y1="10" x2="14.5" y2="14.5" stroke="url(#${gradId})" stroke-width="2" stroke-linecap="round"/>
  </svg>`;

  // Text input
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'snowflake-agentic-search-field';
  input.placeholder = 'Ask anything';
  input.setAttribute('aria-label', 'Ask anything');

  // Send button
  const sendBtn = document.createElement('button');
  sendBtn.type = 'button';
  sendBtn.className = 'snowflake-agentic-search-send';
  sendBtn.setAttribute('aria-label', 'Send');
  sendBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
    <path d="M3 10h14M13 6l4 4-4 4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  inputGroup.append(searchIcon, input, sendBtn);

  // ── Disclaimer ─────────────────────────────────────────────
  const disclaimerCell = getCell(disclaimerRow);
  let disclaimer = null;
  if (disclaimerCell && disclaimerCell.textContent.trim()) {
    disclaimer = document.createElement('p');
    disclaimer.className = 'snowflake-agentic-search-disclaimer';
    [...disclaimerCell.childNodes].forEach((n) => disclaimer.append(n));
  }

  // ── Assemble ────────────────────────────────────────────────
  const inner = document.createElement('div');
  inner.className = 'snowflake-agentic-search-inner';
  inner.append(copy, inputGroup);
  if (disclaimer) inner.append(disclaimer);

  block.innerHTML = '';
  block.append(inner);
}
