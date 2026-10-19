'use strict';

/* ---------- counters & dates ---------- */
const CNT_DEF = [
  {
    id: '本',
    base: 'ほん',
    desc: '가늘고 긴 것',
    r: ['なんぼん', 'いっぽん', 'にほん', 'さんぼん', 'よんほん', 'ごほん', 'ろっぽん', 'ななほん', 'はっぽん', 'きゅうほん', 'じゅっぽん'],
    nouns: [
      ['鉛筆', '연필', '자루'],
      ['傘', '우산', '개'],
      ['バナナ', '바나나', '개']
    ],
    sv: ['ほん', 'ぼん', 'ぽん']
  },
  {
    id: '枚',
    base: 'まい',
    desc: '얇고 평평한 것',
    r: ['なんまい', 'いちまい', 'にまい', 'さんまい', 'よんまい', 'ごまい', 'ろくまい', 'ななまい', 'はちまい', 'きゅうまい', 'じゅうまい'],
    nouns: [
      ['紙', '종이', '장'],
      ['シャツ', '셔츠', '장'],
      ['切手', '우표', '장']
    ],
    sv: ['まい']
  },
  {
    id: '匹',
    base: 'ひき',
    desc: '작은 동물',
    r: ['なんびき', 'いっぴき', 'にひき', 'さんびき', 'よんひき', 'ごひき', 'ろっぴき', 'ななひき', 'はっぴき', 'きゅうひき', 'じゅっぴき'],
    nouns: [
      ['猫', '고양이', '마리'],
      ['犬', '개', '마리'],
      ['魚', '물고기', '마리']
    ],
    sv: ['ひき', 'びき', 'ぴき']
  },
  {
    id: '個',
    base: 'こ',
    desc: '작은 물건',
    r: ['なんこ', 'いっこ', 'にこ', 'さんこ', 'よんこ', 'ごこ', 'ろっこ', 'ななこ', 'はっこ', 'きゅうこ', 'じゅっこ'],
    nouns: [
      ['卵', '달걀', '개'],
      ['りんご', '사과', '개'],
      ['消しゴム', '지우개', '개']
    ],
    sv: ['こ']
  },
  {
    id: '冊',
    base: 'さつ',
    desc: '책·공책',
    r: ['なんさつ', 'いっさつ', 'にさつ', 'さんさつ', 'よんさつ', 'ごさつ', 'ろくさつ', 'ななさつ', 'はっさつ', 'きゅうさつ', 'じゅっさつ'],
    nouns: [
      ['本', '책', '권'],
      ['ノート', '공책', '권'],
      ['雑誌', '잡지', '권']
    ],
    sv: ['さつ']
  },
  {
    id: '台',
    base: 'だい',
    desc: '기계·탈것',
    r: ['なんだい', 'いちだい', 'にだい', 'さんだい', 'よんだい', 'ごだい', 'ろくだい', 'ななだい', 'はちだい', 'きゅうだい', 'じゅうだい'],
    nouns: [
      ['車', '자동차', '대'],
      ['自転車', '자전거', '대'],
      ['パソコン', '컴퓨터', '대']
    ],
    sv: ['だい']
  },
  {
    id: '杯',
    base: 'はい',
    desc: '잔·그릇',
    r: ['なんばい', 'いっぱい', 'にはい', 'さんばい', 'よんはい', 'ごはい', 'ろっぱい', 'ななはい', 'はっぱい', 'きゅうはい', 'じゅっぱい'],
    nouns: [
      ['コーヒー', '커피', '잔'],
      ['ご飯', '밥', '공기'],
      ['水', '물', '잔']
    ],
    sv: ['はい', 'ばい', 'ぱい']
  },
  {
    id: '足',
    base: 'そく',
    desc: '신발·양말',
    r: ['なんぞく', 'いっそく', 'にそく', 'さんぞく', 'よんそく', 'ごそく', 'ろくそく', 'ななそく', 'はっそく', 'きゅうそく', 'じゅっそく'],
    nouns: [
      ['靴', '신발', '켤레'],
      ['靴下', '양말', '켤레']
    ],
    sv: ['そく', 'ぞく']
  },
  {
    id: '人',
    base: 'にん',
    desc: '사람',
    r: [
      'なんにん',
      'ひとり',
      'ふたり',
      'さんにん',
      'よにん',
      'ごにん',
      'ろくにん',
      'ななにん/しちにん',
      'はちにん',
      'きゅうにん',
      'じゅうにん'
    ],
    nouns: [['', '', '명']],
    sv: ['にん']
  },
  {
    id: '回',
    base: 'かい',
    desc: '횟수',
    r: ['なんかい', 'いっかい', 'にかい', 'さんかい', 'よんかい', 'ごかい', 'ろっかい', 'ななかい', 'はっかい', 'きゅうかい', 'じゅっかい'],
    nouns: [['', '', '번']],
    sv: ['かい']
  },
  {
    id: '階',
    base: 'かい',
    desc: '건물 층',
    r: [
      'なんがい/なんかい',
      'いっかい',
      'にかい',
      'さんがい/さんかい',
      'よんかい',
      'ごかい',
      'ろっかい',
      'ななかい',
      'はっかい/はちかい',
      'きゅうかい',
      'じゅっかい'
    ],
    nouns: [['', '', '층']],
    sv: ['かい', 'がい']
  },
  {
    id: '歳',
    base: 'さい',
    desc: '나이',
    r: ['なんさい', 'いっさい', 'にさい', 'さんさい', 'よんさい', 'ごさい', 'ろくさい', 'ななさい', 'はっさい', 'きゅうさい', 'じゅっさい'],
    nouns: [['', '', '살']],
    sv: ['さい']
  },
  {
    id: 'つ',
    base: 'つ',
    desc: '물건 (일반)',
    r: ['いくつ', 'ひとつ', 'ふたつ', 'みっつ', 'よっつ', 'いつつ', 'むっつ', 'ななつ', 'やっつ', 'ここのつ', 'とお'],
    nouns: [['', '', '개']],
    sv: []
  }
];
const CNT_BY = Object.fromEntries(CNT_DEF.map(d => [d.id, d]));
const KAN_NUM = ['何', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const CNT_STD = ['なん', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう', 'じゅう'];
const PFX = {
  0: ['なん'],
  1: ['いち', 'いっ'],
  2: ['に'],
  3: ['さん'],
  4: ['よん', 'よ', 'し'],
  5: ['ご'],
  6: ['ろく', 'ろっ'],
  7: ['なな'],
  8: ['はち', 'はっ'],
  9: ['きゅう', 'く'],
  10: ['じゅう', 'じゅっ']
};
const DATE_D = [
  [1, 'ついたち'],
  [2, 'ふつか'],
  [3, 'みっか'],
  [4, 'よっか'],
  [5, 'いつか'],
  [6, 'むいか'],
  [7, 'なのか'],
  [8, 'ようか'],
  [9, 'ここのか'],
  [10, 'とおか'],
  [14, 'じゅうよっか'],
  [20, 'はつか'],
  [24, 'にじゅうよっか']
];
const DATE_CONF = {
  1: [5],
  2: [20],
  3: [6],
  4: [8, 14],
  5: [1],
  6: [3],
  7: [8],
  8: [4],
  9: [10],
  10: [9],
  14: [4, 24],
  20: [2, 10],
  24: [14, 4]
};
const DATE_NAIVE = { 14: 'じゅうよんにち', 20: 'にじゅうにち', 24: 'にじゅうよんにち' };
const MONTH_R = [
  '',
  'いちがつ',
  'にがつ',
  'さんがつ',
  'しがつ',
  'ごがつ',
  'ろくがつ',
  'しちがつ',
  'はちがつ',
  'くがつ',
  'じゅうがつ',
  'じゅういちがつ',
  'じゅうにがつ'
];
const WEEK = [
  ['月', 'げつようび', '월요일'],
  ['火', 'かようび', '화요일'],
  ['水', 'すいようび', '수요일'],
  ['木', 'もくようび', '목요일'],
  ['金', 'きんようび', '금요일'],
  ['土', 'どようび', '토요일'],
  ['日', 'にちようび', '일요일']
];
const cDisp = (d, n) => (d.id === 'つ' ? (n === 10 ? '十' : KAN_NUM[n] + 'つ') : (n === 0 ? '何' : n) + d.id);
const CNT_ITEMS = [
  ...CNT_DEF.flatMap(d =>
    d.r
      .map((rd, n) => ({ kind: 'counter', id: d.id, def: d, n, disp: cDisp(d, n), ok: rd.split('/'), key: 'ct:' + d.id + '|' + n }))
      .filter(x => !(x.id === 'つ' && x.n === 0))
  ),
  ...DATE_D.map(([n, rd]) => ({ kind: 'date', id: '日', n, disp: n + '日', ok: [rd], ko: n + '일', key: 'ct:日|' + n })),
  ...MONTH_R.slice(1).map((rd, i) => ({
    kind: 'date',
    id: '月',
    n: i + 1,
    disp: i + 1 + '月',
    ok: [rd],
    ko: i + 1 + '월',
    key: 'ct:月|' + (i + 1)
  })),
  ...WEEK.map(([k, rd, ko]) => ({ kind: 'date', id: '曜', n: k, disp: k + '曜日', ok: [rd], ko, key: 'ct:曜|' + k }))
];
function cntKo(q) {
  if (q.kind === 'date') return q.ko;
  const [jw, ko, c] = q.noun;
  const num = q.n === 0 ? '몇 ' : q.n;
  return (ko ? ko + ' ' : '') + num + c;
}
const VOICE = { か: 'が', き: 'ぎ', こ: 'ご', さ: 'ざ', そ: 'ぞ', た: 'だ', だ: 'た', は: 'ばぱ', ひ: 'びぴ', ほ: 'ぼぽ' };
const voiceVar = b => [...(VOICE[b[0]] || '')].map(c => c + b.slice(1));
function cntReadWrongs(q) {
  const acc = new Set(q.ok);
  const out = [];
  const first = q.ok[0];
  const add = c => {
    if (!c || acc.has(c) || out.includes(c)) return;
    if (/^しち/.test(c)) return;
    if (q.n === 8 && first.startsWith('はっ') && c.startsWith('はち')) return;
    if (q.n === 6 && first.startsWith('ろっ') && c.startsWith('ろく')) return;
    if (/^じっ/.test(c)) return;
    out.push(c);
  };
  if (q.id === '日') {
    add(q.n <= 10 ? CNT_STD[q.n] + 'にち' : DATE_NAIVE[q.n]);
    for (const n of shuffle(DATE_CONF[q.n] || [])) add(DATE_D.find(x => x[0] === n)[1]);
    for (const x of shuffle(DATE_D)) add(x[1]);
  } else if (q.id === '月') {
    for (const p of shuffle(PFX[q.n] || [])) add(p + 'がつ');
    for (const r of shuffle(MONTH_R.slice(1))) add(r);
  } else {
    const d = q.def;
    if (d.id === '人' || d.id === 'つ') {
      add(CNT_STD[q.n] + d.base);
      if (q.n === 1) add(d.id === '人' ? 'ひとにん' : 'いちつ');
      if (q.n === 2) add(d.id === '人' ? 'ふたにん' : 'につ');
      const near = [q.n - 1, q.n + 1, q.n === 4 ? 8 : q.n === 8 ? 4 : q.n === 3 ? 6 : q.n === 6 ? 3 : -1].filter(n => n >= 1 && n <= 10);
      for (const n of shuffle(near)) add(d.r[n].split('/')[0]);
    } else {
      const c = [];
      const sv = [...new Set([...d.sv, ...voiceVar(d.base)])];
      for (const p of PFX[q.n] || []) for (const s of sv) c.push(p + s);
      shuffle(c).forEach(add);
    }
    for (const o of shuffle(CNT_DEF.filter(x => x !== d && x.id !== 'つ'))) add(o.r[q.n].split('/')[0]);
  }
  return out.slice(0, 3);
}
function showCnt(mod, q, card, zone, r) {
  if (!r.order) {
    if (q.dir === 'pick') {
      if (q.id === '曜') {
        const ws = shuffle(WEEK.filter(w => w[0] !== q.n)).slice(0, 3);
        r.order = shuffle([
          { t: q.disp, ok: true, cls: 'jp', lang: 'ja', sub: q.ok[0] },
          ...ws.map(w => ({ t: w[0] + '曜日', ok: false, cls: 'jp', lang: 'ja', sub: w[1] + ' · ' + w[2] }))
        ]);
      } else {
        const others = shuffle(CNT_DEF.filter(x => x !== q.def && x.id !== 'つ')).slice(0, 3);
        r.order = shuffle(
          [q.def, ...others].map(d => ({
            t: cDisp(d, q.n),
            ok: d === q.def,
            cls: 'jp',
            lang: 'ja',
            sub: d.r[q.n].split('/')[0] + ' · ' + d.desc
          }))
        );
      }
    } else
      r.order = shuffle([
        { t: q.ok[0], ok: true, cls: 'jp', lang: 'ja' },
        ...cntReadWrongs(q).map(t => ({ t, ok: false, cls: 'jp', lang: 'ja' }))
      ]);
  }
  const ko = cntKo(q);
  const tag = q.kind === 'date' ? '날짜·요일' : '조수사 · ' + q.def.desc;
  if (q.dir === 'pick')
    card.innerHTML = `<span class="cat">${tag}</span><p class="ko">${esc(ko)}</p><p class="cap">알맞은 일본어를 고르세요</p>${MARKS}`;
  else
    card.innerHTML = `<span class="cat">${tag}</span><div class="tz wide"><span class="word" lang="ja" style="font-size:${Math.min(64, wordSize(q.disp))}px">${esc(q.disp)}</span></div><p class="cap">${q.noun && q.noun[0] ? `<span class="jp" lang="ja">${esc(q.noun[0])}</span> · ` : ''}${esc(ko)} · 읽는 법을 고르세요</p>${MARKS}`;
  zone.dataset.type = 'cnt';
  zone.innerHTML = optsHTML(r);
}
function cntTable(q) {
  if (q.id === '日')
    return `<div class="cnt-tbl">${DATE_D.map(([n, rd]) => `<span class="${n === q.n ? 'cur' : ''}"><b>${n}日</b><span class="jp" lang="ja">${rd}</span></span>`).join('')}</div><p class="fb-sub">1~10일, 14·20·24일은 읽는 법이 특별해요. 나머지는 じゅういちにち처럼 숫자+にち예요.</p>`;
  if (q.id === '月') return `<p class="fb-sub">4월 しがつ, 7월 しちがつ, 9월 くがつ만 조심하면 나머지는 숫자+がつ예요.</p>`;
  if (q.id === '曜')
    return `<div class="cnt-tbl">${WEEK.map(w => `<span class="${w[0] === q.n ? 'cur' : ''}"><b>${w[2]}</b><span class="jp" lang="ja">${w[0]}曜日</span></span>`).join('')}</div>`;
  const d = q.def;
  return `<div class="cnt-tbl">${d.r.map((rd, n) => (n === 0 && d.id === 'つ' ? '' : `<span class="${n === q.n ? 'cur' : ''}"><b class="jp" lang="ja">${cDisp(d, n)}</b><span class="jp" lang="ja">${rd.split('/')[0]}</span></span>`)).join('')}</div>
    <p class="fb-sub"><b class="jp" style="color:var(--ink)">${d.id}</b> · ${esc(d.desc)}을 셀 때${d.nouns[0][0] ? ` (예: ${d.nouns.map(n => `<span class="jp" lang="ja">${n[0]}</span> ${n[1]}`).join(', ')})` : ''}</p>`;
}
INFO.cnt = q =>
  `<div class="fb-line"><span class="jp" lang="ja">${esc(q.disp)}</span><span class="jp" lang="ja" style="font-size:19px">${esc(q.ok.join(' / '))}</span><span class="mono">${romaji(q.ok[0])}</span>${spkBtn(q.ok[0])}</div>${cntTable(q)}`;
SPEAKQ.cnt = q => [q.ok[0], 'ja'];
AUTO.cnt = 1700;
