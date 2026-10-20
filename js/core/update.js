'use strict';
/* ---------- update banner ---------- */
const APP_VERSION = '20261020090458';
// Versions are build timestamps (YYYYMMDDhhmmss), so a plain string compare tells which is newer.
// Only a NEWER server version shows the banner: a stale version.json left on the server must never nag forever.
function checkUpdate() {
  if (APP_VERSION.startsWith('__')) return;
  try {
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        const v = j && String(j.v || '');
        if (!/^\d{14}$/.test(v) || v <= APP_VERSION || document.getElementById('upd')) return;
        // already tried this exact version and the page did not change: the server is still half-updated, so stay quiet
        if (sessionStorage.getItem('hm-upd-tried') === v) return;
        document.body.insertAdjacentHTML(
          'beforeend',
          `<div class="upd" id="upd" role="status"><span>새 버전이 나왔어요</span><button type="button" class="btn primary" id="updBtn">업데이트</button></div>`
        );
        document.getElementById('updBtn').addEventListener('click', () => updateNow(v));
      })
      .catch(() => {});
  } catch (e) {}
}
// Fetch the new service worker first, then load the page with a fresh URL so no cache can hand back the old one.
function updateNow(v) {
  const b = document.getElementById('updBtn');
  if (b) {
    b.disabled = true;
    b.textContent = '받는 중…';
  }
  try {
    sessionStorage.setItem('hm-upd-tried', v);
  } catch (e) {}
  const go = () => location.replace(location.pathname + '?u=' + v);
  const reg = 'serviceWorker' in navigator ? navigator.serviceWorker.getRegistration() : Promise.resolve(null);
  let done = false;
  const finish = () => {
    if (!done) {
      done = true;
      go();
    }
  };
  setTimeout(finish, 4000);
  reg
    .then(r => (r ? r.update().catch(() => {}) : null))
    .then(() => setTimeout(finish, 600))
    .catch(finish);
}
// drop the ?u= marker from the address bar after an update
if (/[?&]u=\d+/.test(location.search)) {
  try {
    history.replaceState(null, '', location.pathname + location.hash);
  } catch (e) {}
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkUpdate();
});
