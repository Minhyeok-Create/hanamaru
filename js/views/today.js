'use strict';
/* ---------- today summary ---------- */
function itemIndex() {
  if (IDX) return IDX;
  IDX = new Map();
  const mods = [
    'kana',
    'word',
    'loan',
    'conj',
    'kanji',
    'cnt',
    'sent',
    'jb',
    'part',
    'gram',
    'pol',
    'jl',
    'jd',
    'jsh',
    'jlen',
    'ew',
    'irr',
    'es',
    'eb',
    'el',
    'ed',
    'esh',
    'mp'
  ];
  for (const m of [...mods, ...Object.keys(POOLS).filter(x => !mods.includes(x))])
    for (const it of basePool(m, true)) if (!IDX.has(it.key)) IDX.set(it.key, { mod: m, it });
  for (const m of ['jdlg', 'edlg']) for (const d of DLG[m]) IDX.set(d.key, { mod: m, it: d });
  return IDX;
}
function itemLabel(mod, q) {
  if (LABELS[mod]) return LABELS[mod](q);
  if (mod === 'kana' || mod === 'kconf') return [q.ch, kanaRom(q.ch)];
  if (mod === 'word') return [q.w, (q.w !== q.r ? q.r + ' · ' : '') + q.m[0]];
  if (mod === 'ew') return [q.w, q.m[0]];
  if (mod === 'loan') return [q.k, q.en];
  if (mod === 'conj') return [`${q.v.w} → ${FORM_SHORT[q.form]}`, q.right.w];
  if (mod === 'kanji') return [q.k, q.hun];
  if (mod === 'irr') return [q.b, `${q.p} · ${q.pp}`];
  if (mod === 'mp') return [`${q.w1} / ${q.w2}`, q.lb];
  if (mod === 'jdlg' || mod === 'edlg') return [q.title, SCENES[q.sc] || ''];
  if (mod === 'part') return [q.k, q.p];
  if (mod === 'cnt') return [q.disp, q.ok[0]];
  if (mod === 'pol') return [q.p, q.c];
  if (mod === 'jlen') return [`${q.r1} / ${q.r2}`, q.lb];
  return [q.k, modLang(mod) === 'ja' ? q.a[0] : q.a];
}
function renderToday() {
  const vb = document.getElementById('vbody');
  const t = dayIdx();
  const idx = itemIndex();
  const d = S.days[today()] || { n: 0, c: 0 };
  const groups = {},
    fresh = {};
  let newN = 0,
    wrongN = 0;
  for (const [k, s] of Object.entries(S.stats)) {
    const e = idx.get(k);
    if (!e) continue;
    if (modLang(e.mod) !== S.lang) continue;
    if (s.f === t) {
      newN++;
      fresh[e.mod] = (fresh[e.mod] || 0) + 1;
    }
    if (s.lw === t) {
      wrongN++;
      (groups[e.mod] = groups[e.mod] || []).push(e.it);
    }
  }
  const label = m => MODE_LABEL[m] || m;
  vb.innerHTML = `<div class="chart">
    <div class="kpis" style="margin-top:0"><div class="kpi"><b class="num">${d.n}</b><span>오늘 푼 문제</span></div><div class="kpi"><b class="num">${newN}</b><span>처음 본 문제</span></div><div class="kpi"><b class="num">${wrongN}</b><span>오늘 틀린 문제</span></div></div>
    ${d.n ? '' : `<div class="empty"><p style="margin:0;font-weight:600">오늘은 아직 공부 기록이 없어요</p><p class="note">문제를 풀면 오늘 틀린 문제와 새로 본 문제가 여기에 모여요.</p></div>`}
    ${
      Object.keys(fresh).length
        ? `<section class="chart-box"><h2 class="sec-title">오늘 새로 본 것</h2><p class="note" style="color:var(--ink)">${Object.entries(
            fresh
          )
            .map(([m, n]) => `${label(m)} ${n}`)
            .join(' · ')}</p></section>`
        : ''
    }
    ${Object.entries(groups)
      .map(
        ([
          m,
          items
        ]) => `<section class="chart-box"><div class="cal-head"><h2 class="sec-title" style="margin:0">${label(m)} · 틀린 ${items.length}개</h2>${m === 'jdlg' || m === 'edlg' ? '' : `<button class="btn primary" data-retoday="${m}" style="min-height:38px;padding:6px 14px">다시 풀기</button>`}</div>
      <ul class="miss">${items
        .slice(0, 12)
        .map(q => {
          const [a, b] = itemLabel(m, q);
          return `<li><span class="${modLang(m) === 'ja' && !['jdlg', 'part'].includes(m) ? 'jp' : ''}" style="font-size:17px">${esc(a)}</span><span class="s">${esc(b)}</span></li>`;
        })
        .join('')}${items.length > 12 ? `<li><span class="s">외 ${items.length - 12}개</span></li>` : ''}</ul></section>`
      )
      .join('')}
  </div>`;
  vb.onclick = e => {
    const b = e.target.closest('[data-retoday]');
    if (!b) return;
    const m = b.dataset.retoday;
    PENDING[m] = groups[m];
    R[m] = null;
    S.filt[m] = 'all';
    startMod(m);
  };
}
