'use strict';
/* ================= storage ================= */
const KEY = 'hanamaru-ja-v1';
const allScenes = () => Object.keys(SCENES);
const DEF_SMODE = {
  ja: { kana: 'kana', word: 'word', sent: 'sent', listen: 'jdlg', play: 'omikuji', ref: 'today' },
  en: { eword: 'ew', esent: 'es', elisten: 'edlg', eplay: 'omikuji', eref: 'today' }
};
const DEF = {
  ver: 8,
  lang: 'ja',
  tabs: { ja: 'home', en: 'home' },
  pins: { ja: [], en: [] },
  hide: { ja: [], en: [] },
  seenMod: {},
  smode: DEF_SMODE,
  stats: {},
  days: {},
  set: { round: 10, autoNext: true, autoSpeak: true, slow: false, kanji: true, wans: 'type', goal: 20, theme: 'auto', zoom: 1, sfx: true },
  kana: { dir: 'k2r', script: 'h', sets: ['basic'], input: 'pad' },
  kconf: { script: 'm' },
  word: { cats: Object.keys(CATS), fav: false, lvl: 'all' },
  kjl: { lvl: 'all' },
  grl: { lvl: 'all' },
  ew: { dir: 'e2k', cats: Object.keys(EN_CATS), fav: false },
  conj: { forms: ['masu', 'te', 'nai', 'ta'] },
  num: { ja: ['price', 'time', 'number'], en: ['price', 'time', 'number'] },
  kj: { mode: 'mix' },
  irr: { form: 'mix' },
  cnt: { kinds: ['counter', 'date'] },
  pol: { dir: 'mix' },
  jlen: { lb: null },
  course: { ja: {}, en: {} },
  courseFin: {},
  seen: { tour: 0, tips: {} },
  dlg: { rd: true, ko: false, sc: { ja: 'all', en: 'all' } },
  scenes: { ja: allScenes(), en: allScenes() },
  filt: {},
  fav: {},
  custom: { ja: [], en: [] },
  best: {},
  badges: [],
  goalDays: {}
};
const clone = o => JSON.parse(JSON.stringify(o));
function merge(a, b) {
  for (const k in b) {
    if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k]))
      merge(a[k], b[k]);
    else a[k] = b[k];
  }
  return a;
}
const dayIdx = (d = new Date()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 864e5);
function load() {
  let m = clone(DEF);
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const o = JSON.parse(raw);
      if (typeof o.smode?.ja !== 'object') delete o.smode;
      if (o.only) {
        o.filt = o.filt || {};
        for (const k in o.only) if (o.only[k]) o.filt[k] = 'weak';
        delete o.only;
      }
      m = merge(m, o);
      if ((o.ver || 1) < 3) {
        m.word.cats = Object.keys(CATS);
        m.ew.cats = Object.keys(EN_CATS);
      }
      if ((o.ver || 1) < 4) {
        m.word.cats = [...new Set([...m.word.cats, 'mine'])];
        m.ew.cats = [...new Set([...m.ew.cats, 'mine'])];
        const t = dayIdx();
        for (const s of Object.values(m.stats)) {
          if (s.d === undefined) {
            const weak = s.w > 0 && s.s < 2;
            s.iv = weak ? 0 : s.s >= 2 ? 3 : 1;
            s.d = weak ? t : t + 1;
          }
        }
      }
      if ((o.ver || 1) < 5) {
        for (const l of ['ja', 'en']) if ((m.scenes[l] || []).length >= 7) m.scenes[l] = allScenes();
      }
      if ((o.ver || 1) < 6 && o.smode) {
        m.smode = clone(DEF_SMODE);
      }
      m.ver = 8;
    }
  } catch (e) {}
  m.word.cats = m.word.cats.filter(c => CATS[c]);
  if (!m.word.cats.length) m.word.cats = Object.keys(CATS);
  m.ew.cats = m.ew.cats.filter(c => EN_CATS[c]);
  if (!m.ew.cats.length) m.ew.cats = Object.keys(EN_CATS);
  return m;
}
let S = load();
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {}
}
function rebuildWords() {
  WORDS = BASE_JP.concat(
    S.custom.ja.map(c => ({
      w: c.w,
      r: c.r,
      m: c.m.split('/'),
      n: '내가 추가한 단어',
      cats: ['mine'],
      ex: '',
      exr: '',
      exko: '',
      key: 'w:' + c.w + '|' + c.r,
      mine: true
    }))
  );
  EN_WORDS = BASE_EN.concat(
    S.custom.en.map(c => ({ w: c.w, m: c.m.split('/'), alt: [], cats: ['mine'], ex: '', exko: '', key: 'ew:' + c.w, mine: true }))
  );
  if (typeof IDX !== 'undefined') IDX = null;
  CONJ_ITEMS = WORDS.filter(v => v.cats.includes('verb') && verbGroup(v.w, v.r))
    .flatMap(v => Object.keys(FORMS).map(f => ({ v, form: f, right: conjugate(v, f), key: 'cj:' + v.w + '|' + f })))
    .filter(x => x.right);
}
rebuildWords();

const pad2 = n => String(n).padStart(2, '0');
const dayKey = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const today = () => dayKey(new Date());
function streak() {
  let n = 0;
  const d = new Date();
  if (!S.days[dayKey(d)]?.n) d.setDate(d.getDate() - 1);
  while (S.days[dayKey(d)]?.n) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
function longestStreak() {
  const ks = Object.keys(S.days)
    .filter(k => S.days[k].n > 0)
    .sort();
  let best = 0,
    cur = 0,
    prev = null;
  for (const k of ks) {
    const t = new Date(k + 'T00:00:00');
    if (prev && (t - prev) / 864e5 < 1.5) cur++;
    else cur = 1;
    best = Math.max(best, cur);
    prev = t;
  }
  return best;
}
const totalN = () => Object.values(S.days).reduce((a, d) => a + d.n, 0);
