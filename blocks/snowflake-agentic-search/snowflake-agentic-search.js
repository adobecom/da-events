export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  // ── 1. Parse authored rows ──────────────────────────────────────────────────
  // Row 0: Copy lockup — h2/h3 (headline) + p (subheadline)
  // Row 1: Search placeholder text (e.g. "Ask anything")
  // Row 2: Disclaimer text (may contain links)
  const copyCell = rows[0]?.querySelector(':scope > div') || rows[0];
  const searchCell = rows[1]?.querySelector(':scope > div') || rows[1];
  const disclaimerCell = rows[2]?.querySelector(':scope > div') || rows[2];

  const placeholderText = searchCell?.textContent.trim() || 'Ask anything';

  // ── 2. Build DOM structure ──────────────────────────────────────────────────
  // Outer wrapper (direct block child — CSS max-width container)
  const wrapper = document.createElement('div');

  // Inner flex column
  const inner = document.createElement('div');
  inner.className = 'snowflake-agentic-search-inner';

  // ── Copy lockup ──
  if (copyCell) {
    const copy = document.createElement('div');
    copy.className = 'snowflake-agentic-search-copy';
    [...copyCell.childNodes].forEach((node) => copy.append(node));
    inner.append(copy);
  }

  // ── Search input group ──
  const inputGroup = document.createElement('div');
  inputGroup.className = 'snowflake-agentic-search-input-group';
  inputGroup.setAttribute('role', 'search');

  // Gradient sparkle / AI icon (Figma: gradient #8d87f2 purple → #eb1000 red)
  const iconWrap = document.createElement('div');
  iconWrap.className = 'snowflake-agentic-search-icon';
  iconWrap.setAttribute('aria-hidden', 'true');
  iconWrap.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sas-sparkle-grad" x1="9" y1="18" x2="9" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#8d87f2"/>
        <stop offset="100%" stop-color="#eb1000"/>
      </linearGradient>
    </defs>
    <path d="M9 0C9 0 10.4 5.6 12 7.1C13.6 8.6 18 9 18 9C18 9 13.6 9.7 12 11.2C10.4 12.7 9 18 9 18C9 18 7.6 12.7 6 11.2C4.4 9.7 0 9 0 9C0 9 4.4 8 6 6.5C7.6 5 9 0 9 0Z" fill="url(#sas-sparkle-grad)"/>
  </svg>`;

  // Text input field
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'snowflake-agentic-search-field';
  input.placeholder = placeholderText;
  input.setAttribute('aria-label', placeholderText);

  // Action buttons container
  const actions = document.createElement('div');
  actions.className = 'snowflake-agentic-search-actions';

  // Attach / paperclip button
  const attachBtn = document.createElement('button');
  attachBtn.className = 'snowflake-agentic-search-action-btn';
  attachBtn.setAttribute('type', 'button');
  attachBtn.setAttribute('aria-label', 'Attach file');
  attachBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.5 9.5L9 17C7.3 18.7 4.7 18.7 3 17C1.3 15.3 1.3 12.7 3 11L10.5 3.5C11.7 2.3 13.5 2.3 14.7 3.5C15.9 4.7 15.9 6.5 14.7 7.7L7.7 14.7C7 15.3 5.9 15.3 5.3 14.7C4.7 14.1 4.7 13 5.3 12.3L11.5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  // Send / arrow button
  const sendBtn = document.createElement('button');
  sendBtn.className = 'snowflake-agentic-search-action-btn snowflake-agentic-search-send-btn';
  sendBtn.setAttribute('type', 'button');
  sendBtn.setAttribute('aria-label', 'Send message');
  sendBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 9L15.5 2.5L9 15.5L7.5 10L2 9Z" fill="currentColor"/>
    <path d="M7.5 10L15.5 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  actions.append(attachBtn, sendBtn);
  inputGroup.append(iconWrap, input, actions);
  inner.append(inputGroup);

  // ── Disclaimer text ──
  if (disclaimerCell) {
    const disclaimer = document.createElement('div');
    disclaimer.className = 'snowflake-agentic-search-disclaimer';
    [...disclaimerCell.childNodes].forEach((node) => disclaimer.append(node));
    inner.append(disclaimer);
  }

  // ── 3. Replace block content ────────────────────────────────────────────────
  wrapper.append(inner);
  block.innerHTML = '';
  block.append(wrapper);
}
