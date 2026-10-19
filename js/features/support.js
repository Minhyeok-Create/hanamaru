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

// "문제가 이상해요" → Google Form (link set in js/config.js)
//   - pre-filled link (answer = ABC): the report text goes straight into the form
//   - plain form link: the report text is copied, then the form opens so it can be pasted
function openReportForm(text) {
  const link = safeUrl((APP_CONFIG.report || {}).form);
  if (!link || !/^https:\/\/(docs\.google\.com\/forms\/|forms\.gle\/)/.test(link)) return false;
  const pre = /=ABC(&|$)/.test(link);
  const url = pre ? link.replace(/=ABC(&|$)/, '=' + encodeURIComponent(text) + '$1') : link;
  if (!pre) {
    try {
      navigator.clipboard.writeText(text).catch(() => {});
    } catch (e) {}
  }
  const w = window.open(url, '_blank');
  if (!w) {
    toast('팝업이 막혔어요. 잠시 뒤 다시 눌러 주세요.');
    return false;
  }
  try {
    w.opener = null;
  } catch (e) {}
  toast(
    pre ? '신고 양식이 열렸어요. 보내기를 눌러 주세요. 고마워요!' : '신고 내용을 복사했어요. 열린 양식 칸에 붙여넣고 보내 주세요. 고마워요!'
  );
  return true;
}

// Backup reminder: after 2 weeks without copying a backup code (only once there is something to lose)
const BACKUP_EVERY = 14;
function backupDue() {
  if (totalN() < 50) return false;
  const t = dayIdx();
  if (S.backupSnooze && t < S.backupSnooze) return false;
  const since = S.lastBackup === undefined ? Infinity : t - S.lastBackup;
  return since >= BACKUP_EVERY;
}
function backupTodoHTML() {
  if (!backupDue()) return '';
  const never = S.lastBackup === undefined;
  return `<li class="todo-i backup"><button type="button" data-settings="backup"><span class="ck" aria-hidden="true"><i class="badge-n">!</i></span><span class="tl">기록 백업할 때가 됐어요<small>${never ? '아직 백업한 적이 없어요' : `마지막 백업 후 ${dayIdx() - S.lastBackup}일 지났어요`} · 휴대폰을 바꿔도 기록을 지킬 수 있어요</small></span><span class="go">백업</span></button></li>
    <li class="todo-snooze"><button type="button" class="link" data-bksnooze>일주일 뒤에 다시 알려 주세요</button></li>`;
}
function backupClick(b) {
  if (!('bksnooze' in b.dataset)) return false;
  S.backupSnooze = dayIdx() + 7;
  save();
  renderHome();
  return true;
}
