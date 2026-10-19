'use strict';
/* ================= support the app: donation links + privacy-friendly visit counter ================= */

const DONATE_KINDS = [
  ['toss', '토스로 후원'],
  ['kakaopay', '카카오페이로 후원'],
  ['bmc', 'Buy Me a Coffee']
];
const safeUrl = u => (/^https:\/\/[^\s"'<>]+$/.test(u || '') ? u : '');
const donateLinks = () => DONATE_KINDS.map(([k, label]) => [safeUrl(APP_CONFIG.donate[k]), label]).filter(([u]) => u);

// Settings section (and help) — nothing is shown until a link is set in js/config.js
function donateHTML() {
  const links = donateLinks();
  if (!links.length) return '';
  return `<section><h2 class="sec-title">앱 응원하기</h2><div class="panel donate" style="padding:14px;display:grid;gap:10px">
    <p class="note" style="color:var(--ink)">${esc(APP_CONFIG.donate.message || '')}</p>
    <div class="row">${links.map(([u, label], i) => `<a class="btn ${i ? '' : 'primary'}" href="${esc(u)}" target="_blank" rel="noopener">${esc(label)}</a>`).join('')}</div>
    <p class="note">후원은 앱 기능과 상관없어요. 모든 기능은 계속 무료예요.</p></div></section>`;
}
// One quiet line on the home screen
function donateHomeHTML() {
  return donateLinks().length
    ? `<button class="donate-line" data-settings="donate">하나마루가 도움이 됐다면 커피 한 잔 후원하기 →</button>`
    : '';
}

// Visit counter: only on the real website (not in previews or local files)
function startAnalytics() {
  const a = APP_CONFIG.analytics || {};
  if (!/^https?:$/.test(location.protocol) || /claude\.ai|claudeusercontent|localhost|127\.0\.0\.1/.test(location.hostname)) return;
  if (document.getElementById('hm-analytics')) return;
  const s = document.createElement('script');
  s.id = 'hm-analytics';
  s.defer = true;
  if (/^[0-9a-f]{32}$/i.test(a.cloudflareToken || '')) {
    s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    s.setAttribute('data-cf-beacon', JSON.stringify({ token: a.cloudflareToken }));
  } else if (/^https:\/\/[a-z0-9-]+\.goatcounter\.com\/count$/i.test(a.goatcounter || '')) {
    s.src = 'https://gc.zgo.at/count.js';
    s.setAttribute('data-goatcounter', a.goatcounter);
  } else return;
  document.head.appendChild(s);
}
const analyticsOn = () => !!(APP_CONFIG.analytics && (APP_CONFIG.analytics.cloudflareToken || APP_CONFIG.analytics.goatcounter));
