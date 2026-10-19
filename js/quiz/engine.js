'use strict';
/* ================= quiz modules ================= */
const PENDING = {}; // items for the next round (course tasks, retry lists)
// registries that newer quiz types fill in, so the engine needs no per-type edits
const POOLS = {},
  SHOWS = {},
  SETUPS = {},
  PREP = {},
  LABELS = {};
const R = {};
const setupOpen = {};
const CHEV = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m4 6 4 4 4-4"/></svg>';
const seg = (path, opts, cur) =>
  `<div class="seg" role="group">${opts.map(([v, l]) => `<button data-set="${path}" data-val="${v}" aria-pressed="${String(cur) === String(v)}">${l}</button>`).join('')}</div>`;
const catSum = (sel, cats) =>
  Object.keys(cats).every(c => sel.includes(c) || c === 'mine') ? '전체' : sel.map(c => catName(cats, c)).join('·');
function catChips(path, cats, sel, favKey, favN) {
  const hasMine = (path === 'word.cats' ? S.custom.ja : S.custom.en).length > 0;
  const keys = Object.keys(cats).filter(k => k !== 'mine' || hasMine);
  const all = keys.every(k => sel.includes(k));
  const ent = keys.map(k => [k, cats[k]]);
  const chip = ([v, [l]]) =>
    `<button class="chip" data-multi="${path}" data-val="${v}" aria-pressed="${!all && sel.includes(v)}">${l}</button>`;
  return `<div class="setup-row"><label>주제</label><div class="chips"><button class="chip" data-allcats aria-pressed="${all && !S[favKey].fav}">전체</button>${ent
    .filter(e => e[1][1] === 'topic')
    .map(chip)
    .join('')}</div></div>
    <div class="setup-row"><label>상황</label><div class="chips">${ent
      .filter(e => e[1][1] === 'scene')
      .map(chip)
      .join('')}</div></div>
    <div class="setup-row"><label>즐겨찾기</label><div class="chips"><button class="chip" data-favonly="${favKey}" aria-pressed="${S[favKey].fav}">★ 즐겨찾기만 ${favN}</button></div></div>`;
}
function sceneChips(lang) {
  const sel = S.scenes[lang];
  const all = sel.length === Object.keys(SCENES).length;
  const items = lang === 'ja' ? SENTS : EN_SENTS;
  return `<div class="setup-row"><label>상황</label><div class="chips"><button class="chip" data-allscenes aria-pressed="${all}">전체</button>${Object.entries(
    SCENES
  )
    .map(
      ([v, l]) =>
        `<button class="chip" data-scene="${v}" aria-pressed="${!all && sel.includes(v)}">${l} ${items.filter(s => s.sc === v).length}</button>`
    )
    .join('')}</div></div>`;
}
const ansRow = () =>
  `<div class="setup-row"><label>답 방식</label>${seg(
    'set.wans',
    [
      ['type', '직접 쓰기'],
      ['choice', '4지선다']
    ],
    S.set.wans
  )}</div>`;
const kanjiRow = lbl =>
  `<div class="setup-row"><label>${lbl}</label>${seg(
    'set.kanji',
    [
      ['true', '한자+가나'],
      ['false', '가나만']
    ],
    S.set.kanji
  )}</div>`;
const inputRow = () =>
  `<div class="setup-row"><label>입력 방식</label>${seg(
    'kana.input',
    [
      ['pad', '앱 키패드'],
      ['sys', '아이폰 일본어 키보드']
    ],
    S.kana.input
  )}<p class="note">웹앱은 아이폰 키보드 언어를 자동으로 바꿀 수 없어요. 앱 키패드는 설정 없이 바로 쓸 수 있고, 아이폰 키보드를 쓰려면 지구본 키로 일본어를 골라 주세요.</p></div>`;
const filt = m => S.filt[m] || 'all';
const favCount = lang => (lang === 'ja' ? WORDS : EN_WORDS).filter(w => S.fav[w.key]).length;

const lvlRow = (path, cur) =>
  `<div class="setup-row"><label>급수</label>${seg(
    path,
    [
      ['all', '전체'],
      ['5', 'N5'],
      ['4', 'N4']
    ],
    cur
  )}</div>`;
const byLvl = (arr, l) => (!l || l === 'all' ? arr : arr.filter(x => String(x.lvl || (x.g && x.g.lvl)) === l));
function setupHTML(mod) {
  let sum = '',
    body = '';
  const lang = modLang(mod);
  if (SETUPS[mod]) [sum, body] = SETUPS[mod](lang);
  else if (mod === 'kana') {
    const k = S.kana;
    sum = [
      { h: 'ひらがな', k: 'カタカナ', m: 'ひらがな+カタカナ' }[k.script],
      k.dir === 'k2r' ? '문자→발음' : '발음→문자',
      k.sets.map(s => SETS[s].split(' ')[0]).join('·')
    ].join(' · ');
    body = `<div class="setup-row"><label>문제 방향</label>${seg(
      'kana.dir',
      [
        ['k2r', '문자 보고 발음 쓰기'],
        ['r2k', '발음 보고 문자 쓰기']
      ],
      k.dir
    )}</div>
      <div class="setup-row"><label>문자</label>${seg(
        'kana.script',
        [
          ['h', 'ひらがな'],
          ['k', 'カタカナ'],
          ['m', '섞기']
        ],
        k.script
      )}</div>
      <div class="setup-row"><label>범위</label><div class="chips">${Object.entries(SETS)
        .map(([v, l]) => `<button class="chip" data-multi="kana.sets" data-val="${v}" aria-pressed="${k.sets.includes(v)}">${l}</button>`)
        .join('')}</div></div>
      ${k.dir === 'r2k' ? inputRow() : ''}`;
  } else if (mod === 'kconf') {
    sum = { h: 'ひらがな', k: 'カタカナ', m: 'ひらがな+カタカナ' }[S.kconf.script] + ' · 모양이 비슷한 글자';
    body = `<div class="setup-row"><label>문자</label>${seg(
      'kconf.script',
      [
        ['h', 'ひらがな'],
        ['k', 'カタカナ'],
        ['m', '섞기']
      ],
      S.kconf.script
    )}</div><p class="note">シ/ツ, ソ/ン, ぬ/め처럼 헷갈리는 글자끼리 묶어서 출제해요. 기록은 문자 퀴즈와 함께 쌓여요.</p>`;
  } else if (mod === 'word') {
    sum = [
      S.word.lvl && S.word.lvl !== 'all' ? 'N' + S.word.lvl : '',
      S.word.fav ? '★ 즐겨찾기' : catSum(S.word.cats, CATS),
      S.set.wans === 'choice' ? '4지선다' : '직접 쓰기',
      S.set.kanji ? '한자+가나' : '가나만'
    ].join(' · ');
    body =
      lvlRow('word.lvl', S.word.lvl || 'all') +
      catChips('word.cats', CATS, S.word.cats, 'word', favCount('ja')) +
      ansRow() +
      kanjiRow('표기');
    sum = sum.replace(/^ · /, '');
  } else if (mod === 'loan') {
    sum = `외래어 ${LOANS.length}개 · 원래 영어 고르기`;
    body = `<p class="note">가타카나로 쓰는 외래어를 읽고 원래 영어 단어를 골라요. 일본에서 만든 영어(일본식 영어)는 설명이 함께 나와요.</p>`;
  } else if (mod === 'conj') {
    sum = S.conj.forms.map(f => FORM_SHORT[f]).join('·') + ' · ' + (S.set.kanji ? '한자+가나' : '가나만');
    body =
      `<div class="setup-row"><label>활용형</label><div class="chips">${Object.keys(FORMS)
        .map(
          f =>
            `<button class="chip" data-multi="conj.forms" data-val="${f}" aria-pressed="${S.conj.forms.includes(f)}">${FORMS[f]}</button>`
        )
        .join('')}</div></div>` +
      kanjiRow('표기') +
      `<p class="note">1그룹(う동사)은 끝소리를 바꾸고, 2그룹(る동사)은 る를 떼고 붙이고, する·来る는 불규칙이에요.</p>`;
  } else if (mod === 'kanji') {
    sum = `한자 ${byLvl(KANJI, S.kjl.lvl).length}자 · ` + { mix: '뜻·읽기 섞기', mean: '뜻 고르기', read: '읽기 고르기' }[S.kj.mode];
    body =
      lvlRow('kjl.lvl', S.kjl.lvl) +
      `<div class="setup-row"><label>문제 종류</label>${seg(
        'kj.mode',
        [
          ['mix', '섞기'],
          ['mean', '뜻 고르기'],
          ['read', '읽기 고르기']
        ],
        S.kj.mode
      )}</div><p class="note">뜻 고르기는 한자를 보고 훈음(예: 날 일)을, 읽기 고르기는 한자 단어를 보고 읽는 법을 골라요.</p>`;
  } else if (mod === 'gram') {
    sum = `${S.grl.lvl === 'all' ? 'N5·N4' : 'N' + S.grl.lvl} 문법 ${byLvl(GRAM, S.grl.lvl).length}개 · 퀴즈 ${byLvl(GRAM_ITEMS, S.grl.lvl).length}문제 · ${S.set.kanji ? '한자+가나' : '가나만'}`;
    body =
      lvlRow('grl.lvl', S.grl.lvl) +
      kanjiRow('보기 표기') +
      `<p class="note">문법 설명과 예문은 자료 탭의 '문법 노트'에서 볼 수 있어요.</p>`;
  } else if (mod === 'cnt') {
    const K = { counter: '조수사', date: '날짜·월·요일' };
    sum = S.cnt.kinds.map(k => K[k]).join('·') + ' · 읽기·고르기';
    body = `<div class="setup-row"><label>종류</label><div class="chips">${Object.entries(K)
      .map(
        ([v, l]) => `<button class="chip" data-multi="cnt.kinds" data-val="${v}" aria-pressed="${S.cnt.kinds.includes(v)}">${l}</button>`
      )
      .join(
        ''
      )}</div></div><p class="note">本(자루)·枚(장)·匹(마리)처럼 일본어는 물건에 따라 세는 말이 달라요. 3本 さんぼん, 6本 ろっぽん처럼 소리가 바뀌는 곳을 집중해서 연습해요.</p>`;
  } else if (mod === 'pol') {
    sum =
      { mix: '양방향', p2c: '존댓말 → 반말', c2p: '반말 → 존댓말' }[S.pol.dir] +
      ` · ${POL.length}문장 · ` +
      (S.set.kanji ? '한자+가나' : '가나만');
    body =
      `<div class="setup-row"><label>방향</label>${seg(
        'pol.dir',
        [
          ['mix', '섞기'],
          ['p2c', '존댓말 → 반말'],
          ['c2p', '반말 → 존댓말']
        ],
        S.pol.dir
      )}</div>` +
      kanjiRow('표기') +
      `<p class="note">친구·가족에게는 반말(사전형·た형), 처음 만난 사람이나 윗사람에게는 です·ます를 써요.</p>`;
  } else if (mod === 'jlen') {
    sum = (S.jlen.lb.length === JM_LABELS.length ? '전체' : S.jlen.lb.join('·')) + ` · ${basePool('jlen', false).length}쌍`;
    body = `<div class="setup-row"><label>종류</label><div class="chips">${JM_LABELS.map(l => `<button class="chip" data-multi="jlen.lb" data-val="${esc(l)}" aria-pressed="${S.jlen.lb.includes(l)}">${esc(l)} ${JMP.filter(x => x.lb === l).length}</button>`).join('')}</div></div><p class="note">일본어는 소리 길이(おばさん/おばあさん)와 っ(きて/きって)가 다르면 뜻이 달라져요. 이어폰을 쓰면 더 잘 들려요.</p>`;
  } else if (mod === 'irr') {
    sum = `불규칙 동사 ${IRR.length}개 · ` + { mix: '과거형·과거분사', past: '과거형', pp: '과거분사' }[S.irr.form];
    body = `<div class="setup-row"><label>문제 종류</label>${seg(
      'irr.form',
      [
        ['mix', '섞기'],
        ['past', '과거형'],
        ['pp', '과거분사']
      ],
      S.irr.form
    )}</div>`;
  } else if (mod === 'mp') {
    sum = `발음이 비슷한 단어 ${MP.length}쌍`;
    body = `<p class="note">ship/sheep, light/right처럼 한국 사람이 헷갈리기 쉬운 발음을 듣고 구별해요. 이어폰을 쓰면 더 잘 들려요.</p>`;
  } else if (mod === 'ew') {
    sum = [
      S.ew.dir === 'e2k' ? '영어→뜻' : '뜻→영어',
      S.ew.fav ? '★ 즐겨찾기' : catSum(S.ew.cats, EN_CATS),
      S.set.wans === 'choice' ? '4지선다' : '직접 쓰기'
    ].join(' · ');
    body =
      `<div class="setup-row"><label>문제 방향</label>${seg(
        'ew.dir',
        [
          ['e2k', '영어 보고 뜻'],
          ['k2e', '뜻 보고 영어']
        ],
        S.ew.dir
      )}</div>` +
      catChips('ew.cats', EN_CATS, S.ew.cats, 'ew', favCount('en')) +
      ansRow();
  } else if (NUMS.has(mod)) {
    const sel = S.num[lang];
    const L = { price: '가격', time: '시간', number: '숫자' };
    sum = sel.map(t => L[t]).join('·') + ' 듣고 숫자로 쓰기';
    body = `<div class="setup-row"><label>종류</label><div class="chips">${Object.entries(L)
      .map(([v, l]) => `<button class="chip" data-numt="${v}" aria-pressed="${sel.includes(v)}">${l}</button>`)
      .join(
        ''
      )}</div></div><p class="note">문제가 매번 새로 만들어져서 끝없이 연습할 수 있어요. 시간은 6시 30분이면 630처럼 숫자만 써도 돼요.</p>`;
  } else {
    const sel = S.scenes[lang];
    sum =
      (sel.length === Object.keys(SCENES).length ? '모든 상황' : sel.map(s => SCENES[s]).join('·')) +
      (lang === 'ja' && !DICT.has(mod) && !LISTEN.has(mod) ? ' · ' + (S.set.kanji ? '한자+가나' : '가나만') : '');
    body =
      sceneChips(lang) +
      (lang === 'ja' && !LISTEN.has(mod) && !DICT.has(mod) && mod !== 'jsh'
        ? kanjiRow(BUILD.has(mod) ? '블록 표기' : mod === 'part' ? '문장 표기' : '보기 표기')
        : '') +
      (mod === 'jd' ? inputRow() : '');
    if (mod === 'jsh' || mod === 'esh')
      body += `<p class="note">녹음은 아이폰 Safari나 홈 화면 앱에서 마이크 권한을 허용하면 쓸 수 있어요. 녹음은 저장되지 않아요.</p>`;
    if (mod === 'part')
      body += `<p class="note">문장 속 조사 하나를 비워 두고 맞는 조사를 고르게 해요. 뜻이 비슷한 は/が, に/へ는 같은 보기에 함께 나오지 않아요.</p>`;
    if (LISTEN.has(mod) || DICT.has(mod))
      body += `<p class="note">문제가 나오면 문장이 바로 재생돼요. 안 들리면 재생 버튼을 누르세요. 무음 모드에서는 소리가 나지 않아요.</p>`;
    if (mod === 'jd') body += `<p class="note">가타카나 단어도 히라가나로 써도 정답이에요. 조사 は·へ·を는 わ·え·お로 써도 돼요.</p>`;
    if (mod === 'ed') body += `<p class="note">대소문자와 문장부호는 채점하지 않아요. I'm과 I am처럼 줄임말은 둘 다 정답이에요.</p>`;
    if (BUILD.has(mod)) body += `<p class="note">필요 없는 블록이 하나 섞여 있어요. 놓은 블록을 누르면 다시 빠져요.</p>`;
  }
  if (srsMods().includes(mod) || mod === 'kconf' || mod === 'jsh' || mod === 'esh') {
    const f = filt(mod);
    const wc = basePool(mod, false).filter(p => isWeak(p.key)).length;
    if (f !== 'all') sum = (f === 'due' ? '오늘 복습 · ' : '오답 복습 · ') + sum;
    body += `<div class="setup-row"><label>출제</label><div class="chips"><button class="chip" data-filt="all" aria-pressed="${f === 'all'}">전체에서 출제</button><button class="chip warn" data-filt="weak" aria-pressed="${f === 'weak'}">틀린 것만 ${wc}</button>${mod !== 'kconf' ? `<button class="chip warn" data-filt="due" aria-pressed="${f === 'due'}">오늘 복습 ${dueCount(mod)}</button>` : ''}</div><p class="note">틀린 문제는 다시 맞힐 때까지 더 자주 나와요.</p></div>`;
  }
  const open = !!setupOpen[mod];
  return `<div class="setup" data-open="${open}"><button class="setup-sum" aria-expanded="${open}"><span>${esc(sum)}</span>${CHEV}</button><div class="setup-body" ${open ? '' : 'hidden'}>${body}</div></div>`;
}

function basePool(mod, full) {
  if (POOLS[mod]) return POOLS[mod](full);
  const lang = modLang(mod);
  const inScene = s => S.scenes[lang].includes(s.sc);
  if (mod === 'kana') {
    if (full)
      return KANA.flatMap(x =>
        ['h', 'k'].map(sc => {
          const ch = sc === 'h' ? x.h : toKata(x.h);
          return { ...x, ch, sc, key: 'k:' + ch };
        })
      );
    const k = S.kana;
    const scripts = k.script === 'm' ? ['h', 'k'] : [k.script];
    return KANA.filter(x => k.sets.includes(x.set)).flatMap(x =>
      scripts.map(sc => {
        const ch = sc === 'h' ? x.h : toKata(x.h);
        return { ...x, ch, sc, key: 'k:' + ch };
      })
    );
  }
  if (mod === 'kconf') return CONF_ITEMS.filter(x => S.kconf.script === 'm' || x.sc === S.kconf.script);
  if (mod === 'word')
    return full
      ? WORDS
      : WORDS.filter(
          w =>
            (S.word.fav ? S.fav[w.key] : w.cats.some(c => S.word.cats.includes(c))) &&
            (!S.word.lvl || S.word.lvl === 'all' || w.mine || String(w.lvl) === S.word.lvl)
        );
  if (mod === 'ew') return full ? EN_WORDS : EN_WORDS.filter(w => (S.ew.fav ? S.fav[w.key] : w.cats.some(c => S.ew.cats.includes(c))));
  if (mod === 'loan') return LOANS;
  if (mod === 'conj') return full ? CONJ_ITEMS : CONJ_ITEMS.filter(x => S.conj.forms.includes(x.form));
  if (mod === 'kanji') return full ? KANJI : byLvl(KANJI, S.kjl.lvl);
  if (mod === 'gram') return full ? GRAM_ITEMS : byLvl(GRAM_ITEMS, S.grl.lvl);
  if (mod === 'irr') return IRR;
  if (mod === 'mp') return MP;
  if (mod === 'cnt') return full ? CNT_ITEMS : CNT_ITEMS.filter(x => S.cnt.kinds.includes(x.kind));
  if (mod === 'pol') return POL;
  if (mod === 'jlen') return full ? JMP : JMP.filter(x => S.jlen.lb.includes(x.lb));
  if (ITEMS[mod]) return full ? ITEMS[mod] : ITEMS[mod].filter(inScene);
  return [];
}
function buildPool(mod) {
  const f = filt(mod);
  if (f === 'due') return basePool(mod, true).filter(p => isDue(p.key));
  const p = basePool(mod, false);
  return f === 'weak' ? p.filter(x => isWeak(x.key)) : p;
}
function newRound(mod, items) {
  clearAdv();
  let qs;
  if (NUMS.has(mod)) {
    const lang = modLang(mod);
    const types = S.num[lang];
    qs = Array.from({ length: S.set.round }, () => genNumQ(lang, types[(Math.random() * types.length) | 0]));
  } else qs = items ? shuffle(items) : pickN(buildPool(mod), S.set.round);
  if (mod === 'kconf') qs = qs.map(q => ({ ...q, dir: Math.random() < 0.5 ? 'g2r' : 'r2g' }));
  if (mod === 'kanji')
    qs = qs.map(q => ({
      ...q,
      dir: S.kj.mode === 'mix' ? (Math.random() < 0.5 ? 'mean' : 'read') : S.kj.mode,
      exi: (Math.random() * q.ex.length) | 0
    }));
  if (mod === 'irr') qs = qs.map(q => ({ ...q, form: S.irr.form === 'mix' ? (Math.random() < 0.5 ? 'past' : 'pp') : S.irr.form }));
  if (mod === 'mp') qs = qs.map(q => ({ ...q, tg: Math.random() < 0.5 ? q.w1 : q.w2 }));
  if (mod === 'jlen') qs = qs.map(q => ({ ...q, tg: Math.random() < 0.5 ? 1 : 2 }));
  if (PREP[mod]) qs = qs.map(PREP[mod]);
  if (mod === 'pol') qs = qs.map(q => ({ ...q, dir: S.pol.dir === 'mix' ? (Math.random() < 0.5 ? 'p2c' : 'c2p') : S.pol.dir }));
  if (mod === 'cnt')
    qs = qs.map(q => ({
      ...q,
      dir: q.id === '曜' ? 'pick' : q.kind === 'date' || q.id === 'つ' ? 'read' : Math.random() < 0.6 ? 'read' : 'pick',
      noun: q.def ? q.def.nouns[(Math.random() * q.def.nouns.length) | 0] : null
    }));
  R[mod] = { qs, i: 0, res: [], answered: false, done: false, empty: qs.length === 0, due: filt(mod) === 'due' };
  if (CRUN && CRUN.mod === mod) {
    R[mod].course = CRUN;
    R[mod].due = false;
    CRUN = null;
  }
  padVal = '';
}
function renderModule(mod) {
  view.innerHTML = `<section class="mod">${modeSeg(mod)}${setupHTML(mod)}
    <div class="prog"><div class="prog-bar"><i id="pfill"></i></div><span id="ptext" class="num"></span><span class="score num" id="pscore"></span></div>
    <div id="stage"></div></section>`;
  bindModes();
  bindSetup(mod);
  if (PENDING[mod]) {
    newRound(mod, PENDING[mod]);
    delete PENDING[mod];
  } else if (!R[mod]) newRound(mod);
  showQ(mod, false);
}
function bindSetup(mod) {
  const el = view.querySelector('.setup');
  if (!el) return;
  el.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.classList.contains('setup-sum')) {
      setupOpen[mod] = !setupOpen[mod];
      el.dataset.open = setupOpen[mod];
      b.setAttribute('aria-expanded', setupOpen[mod]);
      el.querySelector('.setup-body').hidden = !setupOpen[mod];
      return;
    }
    const lang = modLang(mod);
    const resetScene = () => {
      for (const m of SCENE_MODS) if (modLang(m) === lang) R[m] = null;
    };
    if (b.dataset.set) {
      const [g, k] = b.dataset.set.split('.');
      let v = b.dataset.val;
      if (v === 'true' || v === 'false') v = v === 'true';
      S[g][k] = v;
      if (g === 'set') for (const m in R) R[m] = null;
    } else if (b.dataset.multi) {
      const [g, k] = b.dataset.multi.split('.');
      const v = b.dataset.val;
      let arr = S[g][k];
      if (g === 'word' || g === 'ew') {
        const cats = g === 'ew' ? EN_CATS : CATS;
        if (Object.keys(cats).every(c => arr.includes(c) || c === 'mine')) arr = [v];
        else if (arr.includes(v)) {
          if (arr.length > 1) arr = arr.filter(x => x !== v);
        } else arr = [...arr, v];
        S[g].fav = false;
      } else {
        if (arr.includes(v)) {
          if (arr.length > 1) arr = arr.filter(x => x !== v);
        } else arr = [...arr, v];
      }
      if (g === 'kana') arr = Object.keys(SETS).filter(s => arr.includes(s));
      if (g === 'conj') arr = Object.keys(FORMS).filter(s => arr.includes(s));
      if (g === 'cnt') arr = ['counter', 'date'].filter(s => arr.includes(s));
      if (g === 'jlen') arr = JM_LABELS.filter(s => arr.includes(s));
      S[g][k] = arr;
    } else if ('allcats' in b.dataset) {
      if (mod === 'ew') {
        S.ew.cats = Object.keys(EN_CATS);
        S.ew.fav = false;
      } else {
        S.word.cats = Object.keys(CATS);
        S.word.fav = false;
      }
    } else if (b.dataset.favonly) {
      const g = b.dataset.favonly;
      S[g].fav = !S[g].fav;
    } else if (b.dataset.scene) {
      const v = b.dataset.scene;
      let arr = S.scenes[lang];
      if (arr.length === Object.keys(SCENES).length) arr = [v];
      else if (arr.includes(v)) {
        if (arr.length > 1) arr = arr.filter(x => x !== v);
      } else arr = [...arr, v];
      S.scenes[lang] = arr;
      resetScene();
    } else if ('allscenes' in b.dataset) {
      S.scenes[lang] = allScenes();
      resetScene();
    } else if (b.dataset.numt) {
      const v = b.dataset.numt;
      let arr = S.num[lang];
      if (arr.includes(v)) {
        if (arr.length > 1) arr = arr.filter(x => x !== v);
      } else arr = [...arr, v];
      S.num[lang] = ['price', 'time', 'number'].filter(t => arr.includes(t));
    } else if (b.dataset.filt) {
      S.filt[mod] = b.dataset.filt;
    } else return;
    save();
    R[mod] = null;
    renderModule(mod);
  });
}
function updateProg(mod) {
  const r = R[mod];
  const n = r.qs.length;
  const c = r.res.filter(x => x.ok).length,
    w = r.res.length - c;
  const pf = document.getElementById('pfill');
  if (!pf) return;
  pf.style.width = (n ? (r.res.length / n) * 100 : 0) + '%';
  document.getElementById('ptext').textContent = n ? `${Math.min(r.i + 1, n)} / ${n}` : '';
  document.getElementById('pscore').innerHTML = r.res.length ? `<span class="o">○ ${c}</span><span>× ${w}</span>` : '';
}
const MARKS = `<svg class="mark o" viewBox="0 0 200 200" aria-hidden="true"><path pathLength="1" d="M108 24C158 22 184 62 178 108 172 152 132 180 92 176 48 172 20 140 24 96 28 56 62 30 104 30"/></svg><svg class="mark x" viewBox="0 0 200 200" aria-hidden="true"><path pathLength="1" d="M48 158 158 44"/></svg>`;
function ensureStage() {
  const st = document.getElementById('stage');
  if (!document.getElementById('card'))
    st.innerHTML = `<div class="card" id="card"></div><div class="zone" id="zone"></div><div class="fb" id="fb"></div>`;
  return { card: document.getElementById('card'), zone: document.getElementById('zone'), fb: document.getElementById('fb') };
}
function showQ(mod, focus) {
  const r = R[mod];
  const st = document.getElementById('stage');
  if (!st) return;
  updateProg(mod);
  if (r.empty) {
    const f = filt(mod);
    st.innerHTML =
      f !== 'all'
        ? `<div class="empty"><p style="margin:0;font-weight:600">${f === 'due' ? '오늘 복습할 문제가 없어요' : '복습할 오답이 없어요'}</p><p class="note">${f === 'due' ? '복습할 때가 된 문제를 모두 끝냈어요.' : '지금 범위에서 틀린 문제를 모두 다시 맞혔어요.'}</p><button class="btn primary" data-act="allmode">전체에서 출제하기</button></div>`
        : `<div class="empty"><p style="margin:0;font-weight:600">출제할 문제가 없어요</p><p class="note">위의 설정에서 범위를 골라 주세요.</p></div>`;
    st.onclick = e => {
      if (e.target.closest('[data-act=allmode]')) {
        S.filt[mod] = 'all';
        save();
        R[mod] = null;
        renderModule(mod);
      }
    };
    return;
  }
  if (r.done) return summary(mod);
  const q = r.qs[r.i];
  const { card, zone, fb } = ensureStage();
  card.dataset.mark = r.mark || '';
  fb.innerHTML = r.fb || '';
  (
    ({
      kana: showKana,
      kconf: showConf,
      word: showWord,
      ew: showEW,
      loan: showLoan,
      conj: showConj,
      kanji: showKanji,
      part: showPart,
      gram: showGram,
      irr: showIrr,
      mp: showMP,
      jsh: showShadow,
      esh: showShadow,
      cnt: showCnt,
      pol: showPol,
      jlen: showJM
    })[mod] ||
    SHOWS[mod] ||
    (BUILD.has(mod) ? showBuild : DICT.has(mod) ? showDict : NUMS.has(mod) ? showNum : showChoice)
  )(mod, q, card, zone, r, focus);
  st.onclick = e => stageClick(mod, e);
  st.onmousedown = e => {
    if (e.target.closest('[data-act],.k,.pad-fn button')) e.preventDefault();
  };
}
