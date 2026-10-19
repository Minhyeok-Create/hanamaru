'use strict';
/* ---------- loanwords ---------- */
function showLoan(mod, q, card, zone, r) {
  if (!r.order) {
    const others = shuffle(LOANS.filter(x => x !== q && x.en !== q.en)).slice(0, 3);
    r.order = shuffle(
      [q, ...others].map(x => ({ t: x.en, ok: x === q, cls: 'en', lang: 'en', sub: `${x.k} · ${x.ko}`, subCls: 'jp', subLang: 'ja' }))
    );
  }
  card.innerHTML = `<span class="cat">외래어</span><div class="tz wide"><span class="word" lang="ja" style="font-size:${wordSize(q.k)}px">${q.k}</span></div><p class="cap">원래 영어 단어를 고르세요</p>${MARKS}`;
  zone.dataset.type = 'loan';
  zone.innerHTML = optsHTML(r);
}
function checkLoan(i, skip) {
  const r = R.loan,
    q = r.qs[r.i];
  if (r.answered) return;
  if (!skip) r.chosen = i;
  const ok = !skip && r.order[i].ok;
  const info = `<div class="fb-line"><span class="jp" lang="ja">${q.k}</span><span class="mono">${romaji(q.k)}</span>${spkBtn(q.k)}</div><p class="fb-sub"><span class="en" style="font-size:17px;color:var(--ink)">${esc(q.en)}</span> · ${esc(q.ko)}</p>${q.note ? `<p class="fb-sub">${esc(q.note)}</p>` : ''}`;
  finish('loan', q, ok, skip ? '' : r.order[i].t, resultBody(ok, skip, '', info));
  document.getElementById('zone').innerHTML = optsHTML(r);
  if (S.set.autoSpeak) speak(q.k);
  if (ok && S.set.autoNext) advT = setTimeout(() => next('loan'), 1500);
}

/* ---------- verb conjugation ---------- */
const GROUP_NAME = {
  godan: '1그룹 (う동사) · 끝소리를 바꿔요',
  ichi: '2그룹 (る동사) · る를 떼고 붙여요',
  suru: '3그룹 (する동사) · 불규칙',
  kuru: '3그룹 (来る) · 불규칙'
};
function showConj(mod, q, card, zone, r) {
  const kanji = S.set.kanji;
  const disp = x => (kanji ? x.w : x.r);
  if (!r.order) {
    const wr = shuffle(conjWrongs(q.v, q.form)).slice(0, 3);
    r.order = shuffle([{ x: q.right, ok: true }, ...wr.map(x => ({ x, ok: false }))]).map(o => ({
      t: disp(o.x),
      ok: o.ok,
      cls: 'jp',
      lang: 'ja',
      sub: kanji && o.x.w !== o.x.r ? o.x.r : '',
      subCls: 'jp',
      subLang: 'ja'
    }));
  }
  const vd = disp(q.v);
  card.innerHTML = `<span class="cat">동사 활용</span><div class="tz wide" style="min-height:96px"><span class="big-word" lang="ja" style="font-size:${Math.min(56, wordSize(vd))}px">${esc(vd)}</span></div><p class="cap">${kanji && q.v.w !== q.v.r ? esc(q.v.r) + ' · ' : ''}${esc(q.v.m[0])}</p><span class="target">${FORMS[q.form]}</span>${MARKS}`;
  zone.dataset.type = 'conj';
  zone.innerHTML = optsHTML(r);
}
function checkConj(i, skip) {
  const r = R.conj,
    q = r.qs[r.i];
  if (r.answered) return;
  if (!skip) r.chosen = i;
  const ok = !skip && r.order[i].ok;
  const g = verbGroup(q.v.w, q.v.r);
  const tbl = Object.keys(FORMS)
    .filter(f => conjugate(q.v, f))
    .map(f => {
      const c = conjugate(q.v, f);
      return `<span class="${f === q.form ? 'cur' : ''}">${FORM_SHORT[f]}</span><span class="jp ${f === q.form ? 'cur' : ''}" lang="ja">${esc(c.w)}${c.w !== c.r ? ` <small style="color:var(--muted)">${esc(c.r)}</small>` : ''}</span>`;
    })
    .join('');
  const info = `<div class="fb-line"><span class="jp" lang="ja">${esc(q.right.w)}</span>${q.right.w !== q.right.r ? `<span class="jp" lang="ja" style="font-size:17px">${esc(q.right.r)}</span>` : ''}<span class="mono">${romaji(q.right.r)}</span>${spkBtn(q.right.r)}</div><p class="fb-sub">${GROUP_NAME[g]}</p><div class="form-tbl">${tbl}</div>`;
  finish('conj', q, ok, skip ? '' : r.order[i].t, resultBody(ok, skip, '', info));
  document.getElementById('zone').innerHTML = optsHTML(r);
  if (S.set.autoSpeak) speak(q.right.r);
  if (ok && S.set.autoNext) advT = setTimeout(() => next('conj'), 1800);
}
