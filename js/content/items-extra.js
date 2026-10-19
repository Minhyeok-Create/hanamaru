'use strict';
/* ================= content: particles, grammar, kanji, english extras, dialogues ================= */
const PARTICLES = ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も', 'の', 'から', 'まで', 'や'];
const P_EXCL = { は: ['が'], が: ['は'], へ: ['に'], に: ['へ'], と: ['や'], や: ['と'] };
const PART_EXP = {
  は: '주제 "은/는"',
  が: '주어 "이/가" · 好き·ある 등의 대상',
  を: '목적어 "을/를"',
  に: '시간·도착점·대상 "에/에게"',
  で: '행동 장소·수단 "에서/(으)로"',
  へ: '방향 "(으)로/에"',
  と: '함께·나열 "와/과, 하고"',
  も: '"도"',
  の: '소유·수식 "의"',
  から: '출발점·이유 "부터/에서/니까"',
  まで: '끝점 "까지"',
  や: '예시 나열 "(이)랑, 등"'
};
const PART_ITEMS = SENTS.flatMap(s => {
  const tk = s.t.split(' '),
    rk = s.a[1].split(' ');
  const out = [];
  tk.forEach((t, i) => {
    const p = stripP(t);
    if (i > 0 && PARTICLES.includes(p) && stripP(rk[i] || '') === p) out.push({ ...s, pi: i, p, key: 'pt:' + s.a[0] + '|' + i });
  });
  return out;
});
ITEMS.part = PART_ITEMS;
ITEMS.jsh = withKey(SENTS, 'sh:', s => s.a[0]);
ITEMS.esh = withKey(EN_SENTS, 'esh:', s => s.a);
const GRAM = [
  ...GRAM_RAW.map(g => ({ ...g, lvl: 5 })),
  ...(typeof GRAM_N4_RAW !== 'undefined' ? GRAM_N4_RAW : []).map(g => ({ ...g, lvl: 4 }))
];
const GRAM_ITEMS = GRAM.flatMap(g => g.q.map((q, qi) => ({ g, qi, k: q.k, a: [q.a, q.r], d: q.d, key: 'gp:' + g.id + ':' + qi })));
const KANJI = [
  ...KANJI_RAW.map(x => ({ ...x, lvl: 5, key: 'kj:' + x.k })),
  ...(typeof KANJI_N4_RAW !== 'undefined' ? KANJI_N4_RAW : []).map(x => ({ ...x, lvl: 4, key: 'kj:' + x.k }))
];
const IRR = IRR_RAW.map(([b, p, pp, ko, ex, exko]) => ({ b, p, pp, ko, ex, exko, key: 'ir:' + b }));
const MP = MP_RAW.map(([w1, k1, w2, k2, lb]) => ({ w1, k1, w2, k2, lb, key: 'mp:' + w1 + '|' + w2 }));
const DLG = { jdlg: DLG_JA.map(d => ({ ...d, key: 'dl:ja:' + d.id })), edlg: DLG_EN.map(d => ({ ...d, key: 'dl:en:' + d.id })) };
