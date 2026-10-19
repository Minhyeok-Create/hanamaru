'use strict';
/* ================= 한국 한자음 → 일본 음독: guess the Japanese reading from the Korean one =================
   Data: KANJIDIC2 (© EDRDG, CC BY-SA 4.0) Korean + on'yomi readings, built by tools/build_data.py */

const HJ_DATA = typeof HJ_KANJI !== 'undefined' ? HJ_KANJI : [];
const HJ_WORD_LIST = typeof HJ_WORDS !== 'undefined' ? HJ_WORDS : [];
const HJ_DIFF_LIST = typeof HJ_DIFF !== 'undefined' ? HJ_DIFF : [];
if (!S.hj || typeof S.hj !== 'object') S.hj = { lv: '1', wlv: '1' };

// ---- Hangul + kana helpers ----
const hjDec = h => {
  const c = h.charCodeAt(0) - 0xac00;
  return c < 0 || c > 11171 ? null : [Math.floor(c / 588), Math.floor((c % 588) / 28), c % 28];
};
const HJ_CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const HJ_JONG = [
  '',
  'ㄱ',
  'ㄲ',
  'ㄳ',
  'ㄴ',
  'ㄵ',
  'ㄶ',
  'ㄷ',
  'ㄹ',
  'ㄺ',
  'ㄻ',
  'ㄼ',
  'ㄽ',
  'ㄾ',
  'ㄿ',
  'ㅀ',
  'ㅁ',
  'ㅂ',
  'ㅄ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ'
];
// ending class of an on'yomi: k (く/き) · t (つ/ち) · n (ん) · long (う/い) · none
function hjEnd(o) {
  const z = o[o.length - 1];
  if (z === 'ん') return 'n';
  if (z === 'く' || z === 'き') return 'k';
  if (z === 'つ' || z === 'ち') return 't';
  if (o.length > 1 && (z === 'う' || z === 'い') && !/^[あい]$/.test(o)) return 'long';
  return 'none';
}
// what the Korean final consonant predicts
const HJ_RULES = [
  { id: 'k', jong: [1], from: '받침 ㄱ', to: 'く · き', ends: ['k'], ex: ['学', '国', '駅'] },
  { id: 'n', jong: [4, 16], from: '받침 ㄴ · ㅁ', to: 'ん', ends: ['n'], ex: ['安', '三', '新'] },
  { id: 't', jong: [8], from: '받침 ㄹ', to: 'つ · ち', ends: ['t'], ex: ['一', '発', '月'] },
  { id: 'ng', jong: [21], from: '받침 ㅇ', to: '길게 (う · い)', ends: ['long'], ex: ['東', '生', '京'] },
  { id: 'p', jong: [17], from: '받침 ㅂ', to: '길게 (う), 가끔 つ', ends: ['long', 't'], ex: ['合', '入', '雑'] },
  { id: '0', jong: [0], from: '받침 없음', to: '짧게, 또는 길게', ends: ['none', 'long'], ex: ['火', '家', '時'] }
];
const hjRuleOf = h => {
  const d = hjDec(h);
  return d ? HJ_RULES.find(r => r.jong.includes(d[2])) || null : null;
};
const HJ_ROWS = [
  ['あいうえお', 'あ'],
  ['かきくけこ', 'か'],
  ['がぎぐげご', 'が'],
  ['さしすせそ', 'さ'],
  ['ざじずぜぞ', 'ざ'],
  ['たちつてと', 'た'],
  ['だぢづでど', 'だ'],
  ['なにぬねの', 'な'],
  ['はひふへほ', 'は'],
  ['ばびぶべぼ', 'ば'],
  ['まみむめも', 'ま'],
  ['やゆよ', 'や'],
  ['らりるれろ', 'ら'],
  ['わ', 'わ']
];
const hjRow = o => (HJ_ROWS.find(([s]) => s.includes(o[0])) || ['', o[0]])[1];
// first consonant → which kana row (for the rules page)
const HJ_CHO_RULES = [
  { c: ['ㄱ', 'ㅋ'], to: 'か · が', ex: ['国', '金'] },
  { c: ['ㅎ'], to: 'か · が', ex: ['学', '韓', '花'], star: true },
  { c: ['ㅂ', 'ㅍ'], to: 'は · ば', ex: ['方', '便'] },
  { c: ['ㅁ'], to: 'ま · ば', ex: ['毎', '文'] },
  { c: ['ㄷ', 'ㅌ'], to: 'た · だ', ex: ['東', '大'] },
  { c: ['ㄹ'], to: 'ら', ex: ['料', '旅'] },
  { c: ['ㅅ', 'ㅈ', 'ㅊ'], to: 'さ · ざ (ㅈ·ㅊ은 가끔 た)', ex: ['山', '自', '茶'] },
  { c: ['ㅇ'], to: 'あ · や · が', ex: ['安', '有', '外'] },
  { c: ['ㄴ'], to: 'な · だ', ex: ['内', '男'] }
];

// ---- kanji items ----
const HJ_ITEMS = HJ_DATA.map(([k, hun, on, g, f]) => {
  const parts = hun.split(' ');
  const h = parts.length > 1 ? parts[parts.length - 1] : hun.split('/')[0];
  return { k, hun: parts.length > 1 ? hun : '', h, hs: parts.length > 1 ? [h] : hun.split('/'), on, o: on[0], g, f, key: 'hj:' + k };
});
const HJ_BY_K = new Map(HJ_ITEMS.map(x => [x.k, x]));
const HJ_LV = { 1: [2, '기초 (초1~2 한자)'], 2: [4, '중급 (초1~4)'], 3: [6, '교육한자 전체'] };

// Wrong options that break the 받침 rule: same start, different ending (がく → がん / がつ / がう)
function hjWrongEnds(o, real) {
  const end = hjEnd(o);
  const stem = end === 'none' ? o : o.slice(0, -1);
  if (!stem) return [];
  const last = stem[stem.length - 1];
  const eRow = 'えけげせぜてでねへべぺめれ'.includes(last),
    aRow = 'あかがさざただなはばぱまやら'.includes(last);
  const small = /[ゃゅょ]$/.test(stem);
  // after きょ/ちゅ… only endings that really occur (しゅつ, じゅん are fine; ちゅつ, きょん are not)
  const tails = small ? ['く', 'う', ...(/^[しじ]ゅ$/.test(stem) ? ['つ', 'ん'] : [])] : ['く', 'つ', 'ん', eRow ? 'い' : 'う'];
  if (aRow) tails.push('い');
  if (!/[ゃゅょ]$/.test(stem) && stem.length > 0) tails.push('');
  const out = new Set();
  for (const t of tails) {
    const v = stem + t;
    if (v && v !== o && !real.includes(v) && hjEnd(v) !== end) out.add(v);
  }
  return [...out];
}
const hjVoice = o => {
  const A = 'かきくけこさしすせそたちつてとはひふへほ',
    B = 'がぎぐげござじずぜぞだじずでどばびぶべぼ';
  const i = A.indexOf(o[0]),
    j = B.indexOf(o[0]);
  return i >= 0 ? B[i] + o.slice(1) : j >= 0 ? A[j] + o.slice(1) : null;
};
function hjKanjiOpts(q) {
  let wrong = shuffle(hjWrongEnds(q.o, q.on));
  const v = hjVoice(q.o);
  if (v && !q.on.includes(v)) wrong.splice(1, 0, v);
  if (wrong.length < 3) {
    const same = shuffle(HJ_ITEMS.filter(x => x.k !== q.k && hjRow(x.o) === hjRow(q.o)).map(x => x.o));
    wrong = wrong.concat(same);
  }
  return [...new Set(wrong.filter(x => !q.on.includes(x)))].slice(0, 3);
}

// ---- word items ----
const HJW_ITEMS = HJ_WORD_LIST.map(w => ({ ...w, key: 'hw:' + w.k }));
function hjWordOpts(q) {
  const out = new Set();
  const plain = q.s.map(x => x[2]).join('');
  if (plain !== q.r) out.add(plain); // forgot the sound change (がくこう)
  for (const step of shuffle(q.s.map((_, i) => i))) {
    const x = q.s[step];
    const real = (HJ_BY_K.get(x[0]) || { on: [x[2]] }).on;
    for (const alt of shuffle(hjWrongEnds(x[2], real))) {
      const r = q.s.map((y, i) => (i === step ? alt : y[3])).join('');
      if (r !== q.r) out.add(r);
    }
  }
  const arr = shuffle([...out]);
  // keep the "forgot the change" option when there is one, it is the most useful mistake
  if (plain !== q.r) arr.sort((a, b) => (b === plain) - (a === plain));
  return arr.slice(0, 3);
}

// ---- registry ----
POOLS.hj = full => (full ? HJ_ITEMS : HJ_ITEMS.filter(x => x.g <= (HJ_LV[S.hj.lv] || HJ_LV[1])[0]));
POOLS.hjw = full => (full ? HJW_ITEMS : HJW_ITEMS.filter(x => x.lv <= +(S.hj.wlv || 1)));
PREP.hj = q => ({ ...q, opts: hjKanjiOpts(q) });
PREP.hjw = q => ({ ...q, opts: hjWordOpts(q) });
SETUPS.hj = () => [
  `${HJ_LV[S.hj.lv][1]} · ${POOLS.hj().length}자`,
  `<div class="setup-row"><label>범위</label>${seg(
    'hj.lv',
    Object.entries(HJ_LV).map(([v, [, l]]) => [v, l.split(' ')[0]]),
    S.hj.lv
  )}</div>
   <p class="note">한국 한자음을 보고 일본어 음독을 골라요. 받침 규칙만 알아도 절반은 맞힐 수 있어요. <button type="button" class="link" data-gorule>규칙 먼저 보기</button></p>`
];
SETUPS.hjw = () => [
  `한자어 ${POOLS.hjw().length}개 · ${['', '기초', '기초+중급', '전체'][S.hj.wlv || 1]}`,
  `<div class="setup-row"><label>범위</label>${seg(
    'hj.wlv',
    [
      ['1', '기초'],
      ['2', '+중급'],
      ['3', '전체']
    ],
    S.hj.wlv || '1'
  )}</div>
   <p class="note">학교 → がっこう처럼 한국어와 한자가 같은 단어예요. 한자 하나하나의 음을 이어 붙이고, 소리가 바뀌는 곳(촉음·탁음)만 조심하면 돼요. <button type="button" class="link" data-gorule>규칙 보기</button></p>`
];
LABELS.hj = q => [q.k + ' ' + q.h, q.o];
LABELS.hjw = q => [q.k + ' ' + q.ko, q.r];
SPEAKQ.hj = q => [q.o, 'ja'];
SPEAKQ.hjw = q => [q.r, 'ja'];
AUTO.hj = 1900;
AUTO.hjw = 2100;
CHECK.hj = (v, s) => genericChoice('hj', -1, s);
CHECK.hjw = (v, s) => genericChoice('hjw', -1, s);

function hjRuleNote(h, o) {
  const r = hjRuleOf(h);
  if (!r) return '';
  const ok = r.ends.includes(hjEnd(o));
  return `<span class="hj-rule ${ok ? 'ok' : 'ex'}">${r.from} → ${r.to} ${ok ? '규칙대로' : '예외'}</span>`;
}
const hjWordsWith = k => HJW_ITEMS.filter(w => w.k.includes(k)).slice(0, 3);

SHOWS.hj = (mod, q, card, zone, r) => {
  if (!r.order)
    r.order = shuffle([{ t: q.o, ok: true, cls: 'jp', lang: 'ja' }, ...q.opts.map(t => ({ t, ok: false, cls: 'jp', lang: 'ja' }))]);
  card.innerHTML = `<span class="cat">한국음 → 음독</span><div class="tz"><span class="word" lang="ja" style="font-size:72px">${esc(q.k)}</span></div>
    <p class="hj-hun">${q.hun ? esc(q.hun) : `한국음 <b>${esc(q.h)}</b>`}</p><p class="cap">일본어 음독은?</p>${MARKS}`;
  zone.dataset.type = 'hj';
  zone.innerHTML = optsHTML(r);
};
INFO.hj = q => {
  const ws = hjWordsWith(q.k);
  return `<p class="fb-big"><span class="jp" lang="ja">${esc(q.k)}</span> <span class="hj-arrow">${esc(q.h)} → </span><span class="jp" lang="ja">${esc(q.o)}</span></p>
    <p class="fb-sub">${hjRuleNote(q.h, q.o)}${q.on.length > 1 ? ` 다른 음독: <span class="jp" lang="ja">${esc(q.on.slice(1).join('・'))}</span>` : ''}</p>
    ${ws.length ? `<p class="fb-sub">${ws.map(w => `<span class="jp" lang="ja">${esc(w.k)}</span> ${esc(w.r)} (${esc(w.ko)})`).join(' · ')}</p>` : ''}
    <div>${spkBtn(q.o, '듣기')}</div>`;
};

SHOWS.hjw = (mod, q, card, zone, r) => {
  if (!r.order)
    r.order = shuffle([{ t: q.r, ok: true, cls: 'jp', lang: 'ja' }, ...q.opts.map(t => ({ t, ok: false, cls: 'jp', lang: 'ja' }))]);
  card.innerHTML = `<span class="cat">한자어 · 같은 한자, 비슷한 소리</span><div class="tz wide"><span class="word" style="font-size:${Math.min(60, wordSize(q.ko))}px">${esc(q.ko)}</span></div>
    <p class="hj-kan jp" lang="ja">${esc(q.k)}</p><p class="cap">일본어로 어떻게 읽을까요?</p>${MARKS}`;
  zone.dataset.type = 'hjw';
  zone.innerHTML = optsHTML(r);
};
INFO.hjw = q => {
  const rows = q.s
    .map(
      ([k, h, o, v, t]) =>
        `<tr><td class="jp" lang="ja">${esc(k)}</td><td>${esc(h)}</td><td class="jp" lang="ja">${esc(o)}${v !== o ? ` → <b>${esc(v)}</b>` : ''}</td><td>${t ? `<span class="hj-chg">${t}</span>` : hjRuleNote(h, o)}</td></tr>`
    )
    .join('');
  return `<p class="fb-big"><span class="jp" lang="ja">${esc(q.k)}</span> <span class="jp" lang="ja">${esc(q.r)}</span></p>
    <table class="hj-split">${rows}</table><div>${spkBtn(q.r, '듣기')}</div>`;
};

document.addEventListener('click', e => {
  if (e.target.closest('[data-gorule]')) startMod('hjr');
});
