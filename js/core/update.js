'use strict';
/* ---------- update banner ---------- */
const APP_VERSION = '20261019152815';
function checkUpdate() {
  if (APP_VERSION.startsWith('__')) return;
  try {
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (j && j.v && j.v !== APP_VERSION && !document.getElementById('upd')) {
          document.body.insertAdjacentHTML(
            'beforeend',
            `<div class="upd" id="upd" role="status"><span>새 버전이 나왔어요</span><button type="button" class="btn primary" id="updBtn">업데이트</button></div>`
          );
          document.getElementById('updBtn').addEventListener('click', () => location.reload());
        }
      })
      .catch(() => {});
  } catch (e) {}
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkUpdate();
});
