'use strict';
/* ================= extra quiz types: kanji, particles, grammar, irregular verbs, minimal pairs ================= */
const regPast = b => (/e$/.test(b) ? b + 'd' : /[^aeiou]y$/.test(b) ? b.slice(0, -1) + 'ied' : b + 'ed');
/* ---------- kanji ---------- */
function showKanji(mod, q, card, zone, r) {
  const w = q.ex[q.exi || 0];
  if (!r.order) {
    if (q.dir === 'mean') {
      const others = shuffle(KANJI.filter(x => x !== q && x.hun !== q.hun)).slice(0, 3);
      r.order = shuffle([q, ...others].map(x => ({ t: x.hun, ok: x === q, cls: 'ko-opt', sub: x.k, subCls: 'jp', subLang: 'ja' })));
    } else {
      const pool = KANJI.flatMap(x => x.ex).filter(e => e[1] !== w[1] && e[0] !== w[0]);
      const near = shuffle(pool.filter(e => Math.abs(e[1].length - w[1].length) <= 1));
      const pick = [];
      for (const e of near.concat(shuffle(pool))) {
        if (pick.length >= 3) break;
        if (!pick.some(p => p[1] === e[1])) pick.push(e);
      }
      r.order = shuffle([
        { t: w[1], ok: true, cls: 'jp', lang: 'ja', sub: `${w[0]} · ${w[2]}` },
        ...pick.map(e => ({ t: e[1], ok: false, cls: 'jp', lang: 'ja', sub: `${e[0]} · ${e[2]}` }))
      ]);
    }
  }
  card.innerHTML =
    q.dir === 'mean'
      ? `<span class="cat">기초 한자</span><div class="tz"><span class="glyph" lang="ja">${q.k}</span></div><p class="cap">이 한자의 뜻과 음을 고르세요</p>${MARKS}`
      : `<span class="cat">기초 한자 · 읽기</span><div class="tz wide"><span class="word" lang="ja" style="font-size:${wordSize(w[0])}px">${esc(w[0])}</span></div><p class="cap">이 단어의 읽는 법을 고르세요</p>${MARKS}`;
  zone.dataset.type = 'kanji';
  zone.innerHTML = optsHTML(r);
}
INFO.kanji = q =>
  `<div class="fb-line"><span class="jp" lang="ja" style="font-size:36px">${q.k}</span><b>${esc(q.hun)}</b><span class="fb-sub">${esc(q.mean)}</span></div><p class="fb-sub">음독 <span class="jp">${esc(q.on || '–')}</span> · 훈독 <span class="jp">${esc(q.kun || '–')}</span></p><div class="form-tbl">${q.ex.map(e => `<span class="jp" lang="ja">${esc(e[0])}</span><span><span class="jp" lang="ja">${esc(e[1])}</span> · ${esc(e[2])}</span>`).join('')}</div><div>${spkBtn(q.ex[q.exi || 0][1], '단어 듣기')}</div>`;
SPEAKQ.kanji = q => [q.ex[q.exi || 0][1], 'ja'];

/* ---------- particles ---------- */
function partSentence(q, reveal) {
  const kj = S.set.kanji;
  const toks = (kj ? q.t : q.a[1]).split(' ');
  return toks
    .map((t, i) => (i === q.pi ? esc(t).replace(esc(q.p), `<span class="blank">${reveal ? esc(q.p) : '？'}</span>`) : esc(t)))
    .join(kj ? '' : ' ');
}
function showPart(mod, q, card, zone, r) {
  if (!r.order) {
    const ex = P_EXCL[q.p] || [];
    const pool = shuffle(
      ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も', 'の', 'から', 'まで'].filter(p => p !== q.p && !ex.includes(p))
    ).slice(0, 3);
    r.order = shuffle([q.p, ...pool].map(p => ({ t: p, ok: p === q.p, cls: 'jp', lang: 'ja', sub: PART_EXP[p] })));
  }
  card.innerHTML = `<span class="cat">${SCENES[q.sc] || ''} · 조사 빈칸</span><p class="ko" style="font-size:17px;font-weight:500;color:var(--muted);margin-top:22px">${esc(q.k)}</p><p class="psent" lang="ja">${partSentence(q, r.answered)}</p><p class="cap">빈칸에 들어갈 조사를 고르세요</p>${MARKS}`;
  zone.dataset.type = 'part';
  zone.innerHTML = optsHTML(r);
}
INFO.part = q =>
  `<p class="fb-big" lang="ja">${partSentence({ ...q }, true)}</p><p class="fb-sub" lang="ja" style="font-family:var(--f-jp);font-size:16px">${esc(q.a[1])}</p><p class="fb-sub mono">${esc(romaji(q.a[1]))}</p><p class="fb-sub"><b class="jp" style="color:var(--ink)">${q.p}</b> · ${esc(PART_EXP[q.p])}</p><div>${spkBtn(q.a[0], '문장 듣기')}</div>`;
SPEAKQ.part = q => [q.a[0], 'ja'];

/* ---------- grammar ---------- */
function showGram(mod, q, card, zone, r) {
  const kj = S.set.kanji;
  if (!r.order)
    r.order = shuffle([
      { t: kj ? q.a[0] : q.a[1], ok: true, cls: 'jp', lang: 'ja', sub: (kj ? q.a[1] + ' · ' : '') + q.k, subCls: '', subLang: '' },
      ...q.d.map(d => ({ t: kj ? d[0] : d[1], ok: false, cls: 'jp', lang: 'ja', sub: (kj ? d[1] + ' · ' : '') + d[2] }))
    ]);
  card.innerHTML = `<span class="cat">문법 · <span class="jp">${esc(q.g.p)}</span></span><p class="ko">${esc(q.k)}</p><p class="cap">${esc(q.g.name)} 표현을 써서 알맞은 일본어를 고르세요</p>${MARKS}`;
  zone.dataset.type = 'gram';
  zone.innerHTML = optsHTML(r);
}
const gramBox = g =>
  `<div class="ex"><p><b class="jp">${esc(g.p)}</b> · ${esc(g.name)}</p><p class="fb-sub">${esc(g.form)}</p><p class="fb-sub" style="color:var(--ink)">${esc(g.exp)}</p>${g.ex.map(e => `<p class="ex-jp" lang="ja">${esc(e[0])}</p><p class="ex-ko">${esc(e[2])}</p>`).join('')}</div>`;
INFO.gram = q =>
  `<p class="fb-big" lang="ja">${esc(q.a[0])}</p><p class="fb-sub" lang="ja" style="font-family:var(--f-jp);font-size:16px">${esc(q.a[1])}</p><p class="fb-sub mono">${esc(romaji(q.a[1]))}</p><div>${spkBtn(q.a[0], '문장 듣기')}</div>${gramBox(q.g)}`;
SPEAKQ.gram = q => [q.a[0], 'ja'];

/* ---------- irregular verbs ---------- */
function showIrr(mod, q, card, zone, r) {
  const right = q.form === 'past' ? q.p : q.pp;
  const ok = right.split('/');
  if (!r.order) {
    const cands = [regPast(q.b), q.form === 'past' ? q.pp : q.p, q.b, q.b + 'en', (q.form === 'past' ? q.p : q.pp).split('/')[0] + 'ed'];
    for (const x of shuffle(IRR)) {
      if (x !== q) cands.push((q.form === 'past' ? x.p : x.pp).split('/')[0]);
    }
    const wr = [];
    for (const c of cands) {
      if (wr.length >= 3) break;
      if (!ok.includes(c) && c !== right && !wr.includes(c) && !right.split('/').includes(c)) wr.push(c);
    }
    r.order = shuffle([{ t: right, ok: true, cls: 'en', lang: 'en' }, ...wr.map(t => ({ t, ok: false, cls: 'en', lang: 'en' }))]);
  }
  card.innerHTML = `<span class="cat">불규칙 동사</span><div class="tz wide" style="min-height:90px"><span class="eword" lang="en" style="font-size:48px">${esc(q.b)}</span></div><p class="cap">${esc(q.ko)}</p><span class="target">${q.form === 'past' ? '과거형' : '과거분사 (p.p.)'}</span>${MARKS}`;
  zone.dataset.type = 'irr';
  zone.innerHTML = optsHTML(r);
}
INFO.irr =
  q => `<div class="form-tbl"><span>원형</span><span class="en" style="font-size:18px">${esc(q.b)}</span><span class="${q.form === 'past' ? 'cur' : ''}">과거형</span><span class="en ${q.form === 'past' ? 'cur' : ''}" style="font-size:18px">${esc(q.p)}</span><span class="${q.form === 'pp' ? 'cur' : ''}">과거분사</span><span class="en ${q.form === 'pp' ? 'cur' : ''}" style="font-size:18px">${esc(q.pp)}</span></div>
  <div class="ex"><p class="ex-en" lang="en">${markWord(q.ex, q.p.split('/'), true)}</p><p class="ex-ko">${esc(q.exko)}</p>${spkBtn(q.ex, '예문 듣기', 'en')}</div>`;
SPEAKQ.irr = q => [`${q.b}, ${q.p.split('/')[0]}, ${q.pp.split('/')[0]}`, 'en'];

/* ---------- minimal pairs ---------- */
function showMP(mod, q, card, zone, r) {
  const fresh = !r.order;
  if (fresh)
    r.order = [
      { t: q.w1, ok: q.tg === q.w1, cls: 'en', lang: 'en', sub: q.k1 },
      { t: q.w2, ok: q.tg === q.w2, cls: 'en', lang: 'en', sub: q.k2 }
    ];
  card.innerHTML = `<span class="cat">발음 구별 · ${esc(q.lb)}</span>${playBox()}<p class="cap">들린 단어를 고르세요</p>${MARKS}`;
  zone.dataset.type = 'mp';
  zone.innerHTML = optsHTML(r).replace('<div class="opts">', '<div class="opts grid2">');
  if (fresh && !r.answered) speak(q.tg, 'en');
}
INFO.mp = q =>
  `<p class="fb-sub">들린 단어: <b class="en" style="font-size:20px;color:var(--ink)">${esc(q.tg)}</b></p><div class="row">${spkBtn(q.w1, q.w1 + ' 듣기', 'en')}${spkBtn(q.w2, q.w2 + ' 듣기', 'en')}</div><p class="fb-sub">두 단어를 번갈아 들으며 차이를 비교해 보세요.</p>`;
