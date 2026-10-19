'use strict';
/* ================= level test: 20 questions → which course day to start from ================= */

let LT = null; // { lang, qs, i, ans, res: [{sec, ok}] }

// Each section: how many questions, how to build one question, and the course day to start at if this is weak.
const LT_PLAN = {
  ja: [
    { sec: 'hira', name: '히라가나', n: 4, day: 1, make: R => ltKana(R, 'h') },
    { sec: 'kata', name: '가타카나', n: 3, day: 7, make: R => ltKana(R, 'k') },
    { sec: 'word', name: '기초 단어', n: 4, day: 5, make: R => ltWord(R, BASE_JP_N5, 'ja') },
    { sec: 'part', name: '조사', n: 3, day: 15, make: R => ltPart(R) },
    { sec: 'sent', name: '문장', n: 3, day: 14, make: R => ltSent(R, 'ja') },
    { sec: 'conj', name: '동사 활용', n: 3, day: 21, make: R => ltConj(R) }
  ],
  en: [
    {
      sec: 'word',
      name: '기초 단어',
      n: 6,
      day: 1,
      make: R =>
        ltWord(
          R,
          BASE_EN.filter(w => w.cats.some(c => ['verb', 'noun', 'talk'].includes(c))),
          'en'
        )
    },
    {
      sec: 'word2',
      name: '형용사·동사구',
      n: 4,
      day: 9,
      make: R =>
        ltWord(
          R,
          BASE_EN.filter(w => w.cats.some(c => ['adj', 'phr'].includes(c))),
          'en'
        )
    },
    { sec: 'sent', name: '문장', n: 4, day: 4, make: R => ltSent(R, 'en') },
    { sec: 'irr', name: '불규칙 동사', n: 3, day: 7, make: R => ltIrr(R) },
    { sec: 'gram', name: '전치사·시제', n: 3, day: 31, make: R => ltEG(R) }
  ]
};
const pick = (arr, R) => arr[(R() * arr.length) | 0];
const opts4 = (right, wrongs, R) => sShuffle([{ t: right, ok: true }, ...wrongs.slice(0, 3).map(t => ({ t, ok: false }))], R);
function ltKana(R, sc) {
  const pool = KANA.filter(x => x.set !== 'yoon');
  const x = pick(pool, R);
  const wr = sShuffle([...new Set(pool.map(y => y.alts[0]).filter(a => a !== x.alts[0]))], R);
  return {
    key: 'k:' + (sc === 'k' ? toKata(x.h) : x.h),
    show: sc === 'k' ? toKata(x.h) : x.h,
    glyph: true,
    ask: '발음을 고르세요',
    opts: opts4(x.alts[0], wr, R),
    optCls: 'mono-opt'
  };
}
function ltWord(R, src, lang) {
  const w = pick(src, R);
  const wr = [];
  for (const y of sShuffle(src, R)) {
    if (wr.length >= 3) break;
    if (!y.m.some(m => w.m.includes(m)) && !wr.includes(y.m[0])) wr.push(y.m[0]);
  }
  return { key: w.key, show: w.w, sub: lang === 'ja' && w.w !== w.r ? w.r : '', lang, ask: '뜻을 고르세요', opts: opts4(w.m[0], wr, R) };
}
function ltPart(R) {
  const q = pick(ITEMS.part, R);
  const ex = P_EXCL[q.p] || [];
  const wr = sShuffle(
    ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も', 'の', 'から', 'まで'].filter(p => p !== q.p && !ex.includes(p)),
    R
  );
  return {
    key: q.key,
    html: `<p class="ko" style="font-size:16px;color:var(--muted);margin-top:22px">${esc(q.k)}</p><p class="psent" lang="ja">${partSentence(q, false)}</p>`,
    ask: '빈칸에 알맞은 조사를 고르세요',
    opts: opts4(q.p, wr, R),
    optCls: 'jp'
  };
}
function ltSent(R, lang) {
  const s = pick(lang === 'ja' ? SENTS : EN_SENTS, R);
  const right = lang === 'ja' ? s.a[0] : s.a;
  return {
    key: s.key,
    ko: s.k,
    ask: lang === 'ja' ? '알맞은 일본어를 고르세요' : '알맞은 영어를 고르세요',
    opts: sShuffle([{ t: right, ok: true }, ...s.d.map(d => ({ t: d[0], ok: false }))], R),
    optCls: lang === 'ja' ? 'jp' : 'en'
  };
}
function ltConj(R) {
  const pool = CONJ_ITEMS.filter(x => ['te', 'ta', 'nai'].includes(x.form) && x.v.lvl === 5);
  const q = pick(pool, R);
  const wr = sShuffle(conjWrongs(q.v, q.form), R).map(x => x.w);
  return {
    key: q.key,
    show: q.v.w,
    sub: `${q.v.r} · ${q.v.m[0]}`,
    lang: 'ja',
    ask: `${FORMS[q.form]}으로 바꾸면?`,
    opts: opts4(q.right.w, wr, R),
    optCls: 'jp'
  };
}
function ltIrr(R) {
  const x = pick(IRR, R);
  const right = x.p.split('/')[0];
  const wr = [regPast(x.b), x.pp.split('/')[0], x.b + 'ed', x.b].filter(t => !x.p.split('/').includes(t));
  return { key: x.key, show: x.b, lang: 'en', sub: x.ko, ask: '과거형을 고르세요', opts: opts4(right, [...new Set(wr)], R), optCls: 'en' };
}
function ltEG(R) {
  const src = [...EG.eprep.items, ...EG.etense.items];
  const q = pick(src, R);
  return {
    key: q.key,
    html: `<p class="psent en" lang="en" style="font-family:var(--f-en);margin-top:22px">${esc(q.s).replace('___', '<span class="blank">？</span>')}</p><p class="cap">${esc(q.k)}</p>`,
    ask: '빈칸에 알맞은 말을 고르세요',
    opts: opts4(q.a, q.o, R),
    optCls: 'en'
  };
}

function startLevelTest(lang) {
  lang = lang || S.lang;
  stopAll();
  const R = rng((Math.random() * 2 ** 31) >>> 0);
  const qs = [];
  for (const p of LT_PLAN[lang])
    for (let k = 0; k < p.n; k++) {
      const q = p.make(R);
      q.sec = p.sec;
      qs.push(q);
    }
  LT = { lang, qs, i: 0, ans: null, res: [] };
  if (S.lang !== lang) {
    S.lang = lang;
    save();
    renderTabs();
  }
  for (const b of tabsEl.children) b.removeAttribute('aria-current');
  ltRender();
  window.scrollTo(0, 0);
}
function ltRender() {
  if (!LT) return;
  if (LT.i >= LT.qs.length) return ltResult();
  const q = LT.qs[LT.i],
    n = LT.qs.length;
  const head =
    q.html ||
    (q.ko
      ? `<p class="ko">${esc(q.ko)}</p>`
      : `<div class="tz ${q.glyph ? '' : 'wide'}"><span class="${q.glyph ? 'glyph' : q.lang === 'en' ? 'eword' : 'word'}" lang="${q.lang || 'ja'}" ${q.glyph ? '' : `style="font-size:${q.lang === 'en' ? enSize(q.show) : wordSize(q.show)}px"`}>${esc(q.show)}</span></div>${q.sub ? `<p class="cap ${q.lang === 'ja' ? 'jp' : ''}">${esc(q.sub)}</p>` : ''}`);
  view.innerHTML = `<section class="mod lt"><div class="lt-head"><b>레벨 테스트</b><button class="btn quiet" data-lt="quit" style="min-height:36px">그만하기</button></div>
    <div class="prog"><div class="prog-bar"><i style="width:${(LT.i / n) * 100}%"></i></div><span class="num">${LT.i + 1} / ${n}</span></div>
    <div class="card" id="card"><span class="cat">${esc(LT_PLAN[LT.lang].find(p => p.sec === q.sec).name)}</span>${head}<p class="cap">${q.ask}</p>${MARKS}</div>
    <div class="opts" style="margin-top:12px">${q.opts
      .map((o, i) => {
        const st = LT.ans === null ? '' : o.ok ? 'ok' : i === LT.ans ? 'ng' : 'dim';
        return `<button type="button" class="opt" data-lto="${i}" ${st ? `data-state="${st}"` : ''}><span class="n">${i + 1}</span><span class="${q.optCls || ''}">${esc(o.t)}</span></button>`;
      })
      .join('')}</div>
    <div class="sub-actions"><button type="button" class="btn quiet" data-lto="-1">모르겠어요</button></div>
    <p class="note" style="text-align:center;margin-top:8px">모르는 문제는 '모르겠어요'를 눌러 주세요. 그래야 시작할 곳을 정확히 찾을 수 있어요.</p></section>`;
  if (LT.ans !== null) document.getElementById('card').dataset.mark = LT.ans >= 0 && q.opts[LT.ans].ok ? 'ok' : 'ng';
  view.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.lt === 'quit') {
      LT = null;
      go(curTab());
      return;
    }
    if (b.dataset.lto === undefined || LT.ans !== null) return;
    LT.ans = +b.dataset.lto;
    const ok = LT.ans >= 0 && q.opts[LT.ans].ok;
    LT.res.push({ sec: q.sec, ok });
    record(q.key, ok);
    sfx(ok ? 'ok' : 'ng');
    ltRender();
    setTimeout(
      () => {
        if (!LT) return;
        LT.ans = null;
        LT.i++;
        ltRender();
      },
      ok ? 550 : 1100
    );
  };
}
function ltRecommend(lang, res) {
  const plan = LT_PLAN[lang];
  const score = p => {
    const r = res.filter(x => x.sec === p.sec);
    return [r.filter(x => x.ok).length, r.length];
  };
  const weak = plan.filter(p => {
    const [c, n] = score(p);
    return c < Math.ceil(n * 0.7);
  });
  const total = COURSE[lang].length;
  const day = weak.length ? Math.min(...weak.map(p => p.day)) : Math.min(total, lang === 'ja' ? 31 : 41);
  return { day: Math.min(day, total), weak, score };
}
function ltResult() {
  const { lang, res } = LT;
  const rec = ltRecommend(lang, res);
  const plan = LT_PLAN[lang];
  const c = res.filter(x => x.ok).length;
  const di = rec.day - 1;
  const d = COURSE[lang][di];
  S.ltest = S.ltest || {};
  S.ltest[lang] = { d: today(), c, n: res.length, day: rec.day };
  save();
  view.innerHTML = `<section class="mod lt"><div class="sum">
    <div class="sum-score"><b class="num">${c}</b><span class="num">/ ${res.length}</span></div>
    <div class="mst">${plan
      .map(p => {
        const [cc, n] = rec.score(p);
        return `<div class="mst-row"><div><b style="font-weight:500">${esc(p.name)}</b><span class="num">${cc} / ${n}</span></div><div class="meter"><i style="width:${n ? (cc / n) * 100 : 0}%"></i></div></div>`;
      })
      .join('')}</div>
    <div class="lt-rec"><span class="lbl">추천 시작 지점</span><b>${rec.day}일차 · ${esc(d ? d.t : '')}</b><span class="note">${rec.weak.length ? `${rec.weak.map(p => p.name).join(', ')} 쪽을 먼저 다지면 좋아요.` : '기초는 탄탄해요! 다음 단계부터 시작해요.'}</span></div>
    <div class="row">${rec.day > 1 ? `<button class="btn primary" data-lt="skip">${rec.day}일차부터 시작</button>` : ''}<button class="btn ${rec.day > 1 ? '' : 'primary'}" data-lt="from1">1일차부터 차근차근</button></div>
    <p class="note">'${rec.day}일차부터 시작'을 누르면 그 앞의 코스 과제는 끝낸 것으로 표시돼요. 언제든 코스 화면에서 다시 할 수 있어요.</p></div></section>`;
  view.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.lt === 'skip') {
      for (let i = 0; i < di; i++) S.course[lang][i] = COURSE[lang][i].k.map(() => 1);
      save();
      LT = null;
      toast(`${rec.day}일차부터 시작해요`);
      go('home');
    } else if (b.dataset.lt === 'from1') {
      LT = null;
      go('home');
    }
  };
}
