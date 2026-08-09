// Modern rounded-line icon set (Material-Symbols inspired), inline so the app
// works fully offline with zero icon-font dependency.
const ICONS = {
  home: `<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9"/>`,
  apps: `<rect x="4" y="4" width="6" height="6" rx="1.6"/><rect x="14" y="4" width="6" height="6" rx="1.6"/><rect x="4" y="14" width="6" height="6" rx="1.6"/><rect x="14" y="14" width="6" height="6" rx="1.6"/>`,
  folder: `<path d="M4 6.5A1.5 1.5 0 0 1 5.5 5H10l2 2.2h6.5A1.5 1.5 0 0 1 20 8.7V17a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17Z"/>`,
  github: `<path d="M12 3.2c-4.9 0-8.8 4-8.8 8.9 0 3.9 2.5 7.2 6 8.4.4.1.6-.2.6-.4v-1.6c-2.5.5-3-1.1-3-1.1-.4-1-1-1.3-1-1.3-.8-.6.1-.6.1-.6.9.1 1.4.9 1.4.9.8 1.4 2.1 1 2.6.8.1-.6.3-1 .6-1.3-2-.2-4.1-1-4.1-4.4 0-1 .3-1.7.9-2.4-.1-.2-.4-1.2.1-2.5 0 0 .8-.2 2.5 1a8.4 8.4 0 0 1 4.6 0c1.7-1.2 2.5-1 2.5-1 .5 1.3.2 2.3.1 2.5.6.7.9 1.4.9 2.4 0 3.4-2.1 4.2-4.1 4.4.3.3.6.9.6 1.8v2.6c0 .2.2.5.6.4 3.5-1.2 6-4.5 6-8.4 0-4.9-4-8.9-8.8-8.9Z"/>`,
  settings: `<circle cx="12" cy="12" r="3"/><path d="M19.4 13.5c.1-.5.1-1 0-1.5l1.6-1.3-1.6-2.8-1.9.6a6.6 6.6 0 0 0-1.3-.8L15.8 5h-3.6l-.4 2.1c-.5.2-.9.5-1.3.8l-1.9-.6-1.6 2.8 1.6 1.3a5.4 5.4 0 0 0 0 1.5l-1.6 1.3 1.6 2.8 1.9-.6c.4.3.8.6 1.3.8l.4 2.1h3.6l.4-2.1c.5-.2.9-.5 1.3-.8l1.9.6 1.6-2.8Z"/>`,
  add: `<path d="M12 5v14M5 12h14"/>`,
  upload: `<path d="M12 16V6M7 10l5-5 5 5"/><path d="M5 18h14"/>`,
  cloud_upload: `<path d="M7 18a4.5 4.5 0 0 1-1-8.9 5.5 5.5 0 0 1 10.8-1.4A4 4 0 0 1 17 18Z"/><path d="M12 15V9M9.5 11.5 12 9l2.5 2.5"/>`,
  cloud_done: `<path d="M7 17a4.5 4.5 0 0 1-1-8.9 5.5 5.5 0 0 1 10.8-1.4A4 4 0 0 1 17 17Z"/><path d="m9.5 12.5 1.8 1.8L15 10.6"/>`,
  file_code: `<path d="M7 3.5h7L18.5 8V20a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V4.5A1 1 0 0 1 7 3.5Z"/><path d="m10 13-1.8 1.8L10 16.6M14 13l1.8 1.8L14 16.6"/>`,
  file_pdf: `<path d="M7 3.5h7L18.5 8V20a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V4.5A1 1 0 0 1 7 3.5Z"/><path d="M14 3.5V8h4.4"/><text x="7.3" y="17" font-size="6" fill="currentColor" stroke="none" font-family="sans-serif" font-weight="700">PDF</text>`,
  file_image: `<rect x="4" y="5" width="16" height="14" rx="1.6"/><circle cx="9" cy="10" r="1.4"/><path d="m5 17 4.5-4.5L12 15l3-3 4 5"/>`,
  file_generic: `<path d="M7 3.5h7L18.5 8V20a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V4.5A1 1 0 0 1 7 3.5Z"/><path d="M14 3.5V8h4.4"/>`,
  trash: `<path d="M5 7h14M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m2 0-.8 12a1.5 1.5 0 0 1-1.5 1.4H9.3A1.5 1.5 0 0 1 7.8 19L7 7"/>`,
  search: `<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.3-4.3"/>`,
  back: `<path d="m15 5-7 7 7 7"/>`,
  close: `<path d="m6 6 12 12M18 6 6 18"/>`,
  key: `<circle cx="8" cy="15" r="3.2"/><path d="M10.3 12.7 18 5l1.5 1.5L18 8l1.4 1.4-2 2L16 10l-3.5 3.5"/>`,
  link: `<path d="M9 15l6-6"/><path d="M8 12l-1.5 1.5a3 3 0 0 0 4.2 4.2L12 16.4"/><path d="M16 12l1.5-1.5a3 3 0 0 0-4.2-4.2L12 7.6"/>`,
  device: `<rect x="7" y="2.5" width="10" height="19" rx="1.8"/><path d="M11 18.5h2"/>`,
  chevron_right: `<path d="m9 6 6 6-6 6"/>`,
  refresh: `<path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.5"/><path d="M20 4v4.5h-4.5"/><path d="M20 12a8 8 0 0 1-13.7 5.7L4 15.5"/><path d="M4 20v-4.5h4.5"/>`,
  check: `<path d="m5 13 4 4 10-10"/>`,
  info: `<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 8v.01"/>`,
  toggle_on: `<rect x="3" y="7" width="18" height="10" rx="5"/><circle cx="16" cy="12" r="3.6" fill="white" stroke="none"/>`,
  toggle_off: `<rect x="3" y="7" width="18" height="10" rx="5"/><circle cx="8" cy="12" r="3.6" fill="white" stroke="none"/>`,
  star: `<path d="m12 4 2.4 5.1 5.6.6-4.2 3.8 1.2 5.5L12 16.2 6.9 19l1.3-5.5L4 9.7l5.6-.6Z"/>`,
  play_store_bag: `<path d="M6 9.5A2 2 0 0 1 8 7.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z"/><path d="M9 7.5V6a3 3 0 0 1 6 0v1.5"/>`,
};

function icon(name, cls = "") {
  const body = ICONS[name] || ICONS.info;
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
