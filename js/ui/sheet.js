'use strict';
/* ---------- sheets (modal) ---------- */
function openSheet(html, cls) {
  closeSheet();
  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.id = 'sheet';
  bg.innerHTML = `<div class="sheet ${cls || ''}" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(bg);
  document.body.classList.add('sheet-open');
  bg.addEventListener('click', e => {
    if (e.target === bg || e.target.closest('[data-close]')) closeSheet();
  });
  requestAnimationFrame(() => bg.classList.add('show'));
  return bg.firstElementChild;
}
function closeSheet() {
  const s = document.getElementById('sheet');
  if (s) s.remove();
  document.body.classList.remove('sheet-open');
}
document.addEventListener(
  'keydown',
  e => {
    if (e.key === 'Escape' && document.getElementById('sheet')) closeSheet();
  },
  true
);
const XICON =
  '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5 5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
