'use strict';
/* ---------- dialogues ---------- */
let DG = null;
function dlgList(mod) {
  const lang = modLang(mod);
  const sc = S.dlg.sc[lang] || 'all';
  return DLG[mod].filter(d => sc === 'all' || d.sc === sc);
}
function renderDialogue(mod) {
  if (DG && DG.mod === mod) return renderDlgPlay();
  renderDlgList(mod);
}
function renderDlgList(mod) {
  const lang = modLang(mod);
  const all = DLG[mod];
  const sc = S.dlg.sc[lang] || 'all';
  const st = d => {
    const s = S.stats[d.key];
    return !s ? '' : s.c > 0 ? 'done' : 'learn';
  };
  const doneN = all.filter(d => S.stats[d.key]?.c > 0).length;
  view.innerHTML = `<section class="mod">${modeSeg(mod)}<div class="chart">
    <p class="note">상대의 말을 듣고, 내 차례에는 목표에 맞는 말을 골라 대화를 이어 가요. 실수 없이 끝내면 완료로 표시돼요. (${doneN} / ${all.length} 완료)</p>
    <div class="chips">${[['all', '전체'], ...Object.entries(SCENES)]
      .filter(([v]) => v === 'all' || all.some(d => d.sc === v))
      .map(
        ([v, l]) =>
          `<button class="chip" data-dsc="${v}" aria-pressed="${sc === v}">${l}${v === 'all' ? '' : ' ' + all.filter(d => d.sc === v).length}</button>`
      )
      .join('')}</div>
    <button class="btn primary" data-drand>${sc === 'all' ? '아무 대화나 시작' : SCENES[sc] + ' 대화 시작'}</button>
    <div class="wl">${dlgList(mod)
      .map(
        d =>
          `<div class="wl-i" data-st="${st(d)}"><button class="wl-main" data-dstart="${esc(d.id)}"><span class="w" style="font-size:16px;font-weight:600">${esc(d.title)}</span><span class="s">${SCENES[d.sc] || ''} · 상대: ${esc(d.role)} · 내 차례 ${d.lines.filter(l => l.who === 'me').length}번</span></button><span></span></div>`
      )
      .join('')}</div>
    <div style="display:flex;justify-content:flex-end">${LEGEND.replace('연습 중', '완료(실수 있음)').replace('<span><i style="background:var(--ng)"></i>복습 필요</span>', '')}</div>
  </div></section>`;
  bindModes();
  view.onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.closest('.modes')) return;
    if (b.dataset.dsc) {
      S.dlg.sc[lang] = b.dataset.dsc;
      save();
      renderDlgList(mod);
    } else if ('drand' in b.dataset) {
      const l = dlgList(mod);
      const fresh = l.filter(d => !(S.stats[d.key]?.c > 0));
      const pool = fresh.length ? fresh : l;
      if (pool.length) startDlg(mod, pool[(Math.random() * pool.length) | 0]);
    } else if (b.dataset.dstart) {
      const d = DLG[mod].find(x => x.id === b.dataset.dstart);
      if (d) startDlg(mod, d);
    }
  };
}
function startDlg(mod, d, course) {
  stopAll();
  DG = { mod, d, i: 0, log: [], mist: 0, wrong: [], order: null, done: false, recorded: false, course: course || null };
  const more = collectThem();
  speakSeq(more, modLang(mod));
  renderDlgPlay();
  window.scrollTo(0, 0);
}
function collectThem() {
  const L = DG.d.lines;
  const texts = [];
  while (DG.i < L.length && L[DG.i].who === 'them') {
    DG.log.push({ ...L[DG.i] });
    texts.push(L[DG.i].a);
    DG.i++;
  }
  if (DG.i >= L.length) {
    DG.done = true;
    if (!DG.recorded) {
      DG.recorded = true;
      const first = !S.stats[DG.d.key];
      record(DG.d.key, DG.mist === 0);
      onDialogueDone(DG.mod, DG.d, first, DG.mist === 0);
      sfx('combo');
    }
    if (DG.course && !DG.course.marked) {
      DG.course.marked = true;
      courseMark(DG.course);
    }
  } else {
    const l = L[DG.i];
    const ja = modLang(DG.mod) === 'ja';
    DG.order = shuffle([
      { t: l.a, r: l.r, k: l.k, ok: true },
      ...l.d.map(x => (ja ? { t: x[0], r: x[1], k: x[2], ok: false } : { t: x[0], k: x[1], ok: false }))
    ]);
    DG.wrong = [];
  }
  return texts;
}
function pickDlg(i, giveUp) {
  if (!DG || DG.done) return;
  const o = DG.order[i];
  if (!giveUp && !o.ok) {
    if (!DG.wrong.includes(i)) {
      DG.wrong.push(i);
      DG.mist++;
    }
    sfx('ng');
    renderDlgPlay();
    return;
  }
  if (!giveUp) sfx('ok');
  if (giveUp) DG.mist++;
  const l = DG.d.lines[DG.i];
  DG.log.push({ ...l, who: 'me', hint: giveUp });
  DG.i++;
  const more = collectThem();
  speakSeq([l.a, ...more], modLang(DG.mod));
  renderDlgPlay();
}
function renderDlgPlay() {
  const d = DG.d,
    ja = modLang(DG.mod) === 'ja',
    lg = ja ? 'ja' : 'en',
    cls = ja ? 'jp' : 'en';
  const bub = l =>
    `<div class="bub ${l.who}"><span class="who">${l.who === 'me' ? '나' : esc(d.role)}${l.hint ? ' · 정답 보기' : ''}</span><span class="t ${cls}" lang="${lg}">${esc(l.a)}</span>${ja && S.dlg.rd && l.r ? `<span class="rd" lang="ja">${esc(l.r)}</span>` : ''}${S.dlg.ko ? `<span class="kr">${esc(l.k)}</span>` : ''}${hasTTS ? `<button type="button" class="bub-spk" data-speak="${esc(l.a)}" data-lang="${lg}" aria-label="듣기">${SPK_ICON}</button>` : ''}</div>`;
  let bottom;
  if (DG.done) {
    const list = dlgList(DG.mod);
    const idx = list.indexOf(d);
    bottom = `<div class="sum dlg-bottom"><div class="sum-score">${DG.mist === 0 ? `<svg viewBox="0 0 200 200" aria-hidden="true"><path pathLength="1" d="M108 18C162 16 190 60 184 108 178 156 134 186 92 182 44 178 14 142 18 96 22 52 60 24 106 26M110 64c24 2 38 20 36 42-2 22-22 38-44 36-20-2-34-20-32-40 2-18 18-30 36-28 16 2 26 14 24 28"/></svg>` : ''}<b class="num">${DG.mist}</b><span>번 실수</span></div>
      <p class="sum-msg">${DG.mist === 0 ? '실수 없이 대화를 끝냈어요. 하나마루!' : '대화를 끝까지 이어 갔어요. 한 번 더 하면 더 자연스러워져요.'}</p>
      <div class="row"><button class="btn" data-dagain>다시 하기</button>${DG.course ? `<button class="btn primary" data-dcourse>코스로 돌아가기</button>` : list.length > 1 || idx < 0 ? `<button class="btn primary" data-dnext>다음 대화</button>` : ''}</div></div>`;
  } else {
    const l = d.lines[DG.i];
    bottom = `<div class="goal-box dlg-bottom"><span class="lbl">내 차례 · 이렇게 말해 보세요</span><b>${esc(l.goal || '')}</b><div class="opts">${DG.order
      .map((o, i) => {
        const w = DG.wrong.includes(i);
        return `<button type="button" class="opt" data-dpick="${i}" ${w ? 'data-state="ng" aria-disabled="true"' : ''}><span class="n">${i + 1}</span><span class="${cls}" lang="${lg}" style="font-size:18px;padding-right:20px">${esc(o.t)}</span>${ja && S.dlg.rd && o.r ? `<span class="rd" lang="ja">${esc(o.r)}</span>` : ''}${w ? `<span class="tr">"${esc(o.k)}"라는 뜻이라 지금은 맞지 않아요</span>` : ''}</button>`;
      })
      .join('')}</div>
      <button type="button" class="btn quiet" data-dhint>모르겠어요 · 정답 보기</button></div>`;
  }
  view.innerHTML = `<section class="mod">${modeSeg(DG.mod)}<div class="dlg">
    <div class="dlg-bar"><button class="btn quiet" data-dback style="flex:none">← 목록</button><div class="chips">${ja ? `<button class="chip" data-dtog="rd" aria-pressed="${S.dlg.rd}">읽는 법</button>` : ''}<button class="chip" data-dtog="ko" aria-pressed="${S.dlg.ko}">해석</button></div></div>
    <div class="dlg-head"><b>${esc(d.title)}</b><span class="note">${SCENES[d.sc] || ''} · ${esc(d.setting)}</span></div>
    <div class="chat">${DG.log.map(bub).join('')}</div>${bottom}</div></section>`;
  bindModes();
  view.onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.closest('.modes') || b.dataset.speak) return;
    if ('dback' in b.dataset) {
      stopAll();
      const m = DG.mod;
      DG = null;
      renderDlgList(m);
    } else if (b.dataset.dtog) {
      S.dlg[b.dataset.dtog] = !S.dlg[b.dataset.dtog];
      save();
      renderDlgPlay();
    } else if (b.dataset.dpick !== undefined) pickDlg(+b.dataset.dpick);
    else if ('dhint' in b.dataset) {
      const i = DG.order.findIndex(o => o.ok);
      pickDlg(i, true);
    } else if ('dagain' in b.dataset) startDlg(DG.mod, DG.d);
    else if ('dcourse' in b.dataset) {
      DG = null;
      go('home');
    } else if ('dnext' in b.dataset) {
      const list = dlgList(DG.mod);
      const i = list.indexOf(DG.d);
      const n = list[(i + 1) % list.length] || DLG[DG.mod][0];
      startDlg(DG.mod, n);
    }
  };
  const bt = view.querySelector('.dlg-bottom');
  if (bt && DG.log.length > 1) bt.scrollIntoView({ block: 'end', behavior: 'smooth' });
}
