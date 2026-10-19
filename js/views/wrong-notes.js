'use strict';
/* ================= wrong-answer notebook: everything missed in the last 7 / 30 days ================= */

let WN_RANGE = 7; // days; 0 = all time
const WN_SKIP = new Set(['jdlg', 'edlg']);

function wrongItems(range) {
  const idx = itemIndex(),
    t = dayIdx(),
    out = [];
  for (const [k, s] of Object.entries(S.stats)) {
    if (!s.w) continue;
    if (range && !(s.lw !== undefined && s.lw >= t - range + 1)) continue;
    const e = idx.get(k);
    if (!e || WN_SKIP.has(e.mod) || modLang(e.mod) !== S.lang) continue;
    out.push({ k, s, mod: e.mod, it: e.it });
  }
  // most-missed first, then the ones still not fixed, then most recent
  out.sort((a, b) => b.s.w - a.s.w || isWeak(b.k) - isWeak(a.k) || (b.s.lw || 0) - (a.s.lw || 0));
  return out;
}

function renderWrongNotes() {
  const vb = document.getElementById('vbody');
  const list = wrongItems(WN_RANGE);
  const groups = {};
  for (const x of list) (groups[x.mod] = groups[x.mod] || []).push(x);
  const label = m => MODE_LABEL[m] || m;
  const line = x => {
    const [a, b] = itemLabel(x.mod, x.it);
    const ja = modLang(x.mod) === 'ja' && !['part', 'pol'].includes(x.mod);
    return `<li><span class="${ja ? 'jp' : modLang(x.mod) === 'en' ? 'en' : ''}" style="font-size:17px">${esc(a)}</span><span class="s">${esc(b)}</span><span class="wn-n num ${isWeak(x.k) ? 'weak' : ''}">${x.s.w}번${isWeak(x.k) ? '' : ' · 고침'}</span></li>`;
  };
  vb.innerHTML = `<div class="chart">
    <div class="seg" role="group" aria-label="기간">${[
      [7, '최근 7일'],
      [30, '최근 30일'],
      [0, '전체']
    ]
      .map(([v, l]) => `<button data-wnr="${v}" aria-pressed="${WN_RANGE === v}">${l}</button>`)
      .join('')}</div>
    <p class="note">틀린 적 있는 문제를 많이 틀린 순서로 모았어요. '고침'은 그 뒤에 두 번 연속 맞힌 문제예요.</p>
    ${list.length ? `<section class="chart-box"><h2 class="sec-title">가장 많이 틀린 10개</h2><ul class="miss wn">${list.slice(0, 10).map(line).join('')}</ul></section>` : `<div class="empty"><p style="margin:0;font-weight:600">이 기간에 틀린 문제가 없어요</p><p class="note">기간을 늘려 보거나, 문제를 더 풀어 보세요.</p></div>`}
    ${Object.entries(groups)
      .map(
        ([
          m,
          xs
        ]) => `<section class="chart-box"><div class="cal-head"><h2 class="sec-title" style="margin:0">${label(m)} · ${xs.length}개</h2><button class="btn primary" data-wnre="${m}" style="min-height:38px;padding:6px 14px">다시 풀기</button></div>
      <ul class="miss wn">${xs.slice(0, 8).map(line).join('')}${xs.length > 8 ? `<li><span class="s">외 ${xs.length - 8}개</span></li>` : ''}</ul></section>`
      )
      .join('')}
  </div>`;
  vb.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.wnr !== undefined) {
      WN_RANGE = +b.dataset.wnr;
      renderWrongNotes();
      return;
    }
    if (b.dataset.wnre) {
      const m = b.dataset.wnre;
      const xs = groups[m] || [];
      PENDING[m] = xs.slice(0, 20).map(x => x.it);
      R[m] = null;
      S.filt[m] = 'all';
      startMod(m);
    }
  };
}
