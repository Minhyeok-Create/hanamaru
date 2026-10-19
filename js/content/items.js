'use strict';
/* ================= content ================= */
JP_CATS.mine = ['내 단어', 'topic'];
EN_CATS.mine = ['내 단어', 'topic'];
const CATS = JP_CATS;
const catName = (cats, k) => (cats[k] ? cats[k][0] : k);
const jpWord =
  lvl =>
  ([w, r, m, n, c, ex, exr, exko]) => ({ w, r, m: m.split('/'), n, cats: c.split(','), ex, exr, exko, lvl, key: 'w:' + w + '|' + r });
const BASE_JP = [...JP_WORDS_RAW.map(jpWord(5)), ...(typeof JP_WORDS_N4_RAW !== 'undefined' ? JP_WORDS_N4_RAW : []).map(jpWord(4))];
const BASE_JP_N5 = BASE_JP.filter(w => w.lvl === 5); // fixed set for friend-challenge links
const BASE_EN = EN_WORDS_RAW.map(([w, m, alt, c, ex, exko]) => ({
  w,
  m: m.split('/'),
  alt: alt ? alt.split('/') : [],
  cats: c.split(','),
  ex,
  exko,
  key: 'ew:' + w
}));
let WORDS = BASE_JP,
  EN_WORDS = BASE_EN,
  CONJ_ITEMS = [];
const SENTS = SENTS_RAW.map(([sc, k, a, r, t, d]) => ({ sc, k, a: [a, r], t, d, key: 's:' + a }));
const EN_SENTS = EN_SENTS_RAW.map(([sc, k, a, d]) => ({ sc, k, a, d, key: 'es:' + a }));
const withKey = (arr, p, f) => arr.map(s => ({ ...s, key: p + f(s) }));
const ITEMS = {
  sent: SENTS,
  jb: withKey(SENTS, 'jb:', s => s.a[0]),
  jl: withKey(SENTS, 'jl:', s => s.a[0]),
  jd: withKey(SENTS, 'jd:', s => s.a[0]),
  es: EN_SENTS,
  eb: withKey(EN_SENTS, 'eb:', s => s.a),
  el: withKey(EN_SENTS, 'el:', s => s.a),
  ed: withKey(EN_SENTS, 'ed:', s => s.a)
};
const LOANS = LOAN_RAW.map(([k, en, ko, note]) => ({ k, en, ko, note, key: 'lw:' + k }));
const CONF_ITEMS = CONF.flatMap(([sc, g], gi) => g.map(ch => ({ ch, sc, gi, key: 'k:' + ch })));
