'use strict';
/* ================= play tab: modes, labels, saved state ================= */
const PLAY = new Set(['omikuji', 'cards', 'stamps', 'rain', 'match', 'vs']);
const LBL_LANG = { ja: { omikuji: '오미쿠지', rain: '가나 비' }, en: { omikuji: '포춘 쿠키', rain: '단어 비' } };
const modeLabel = m => (LBL_LANG[S.lang] || {})[m] || MODE_LABEL[m] || m;
Object.assign(MODE_LABEL, {
  omikuji: '오늘의 운세',
  cards: '단어 카드',
  stamps: '여행 도장',
  rain: '비 게임',
  match: '짝 맞추기',
  vs: '친구 대결'
});
for (const [k, v] of Object.entries({
  xp: { ja: 0, en: 0 },
  cards: { ja: {}, en: {} },
  tickets: { ja: 0, en: 0 },
  omi: { ja: {}, en: {} },
  omiDays: { ja: {}, en: {} },
  gbest: {},
  cardStart: {},
  name: ''
}))
  if (S[k] === undefined || S[k] === null || (typeof v === 'object' && typeof S[k] !== 'object')) S[k] = clone(v);
for (const k of ['xp', 'tickets']) for (const l of ['ja', 'en']) if (typeof S[k][l] !== 'number') S[k][l] = 0;
for (const k of ['cards', 'omi', 'omiDays']) for (const l of ['ja', 'en']) if (!S[k][l] || typeof S[k][l] !== 'object') S[k][l] = {};
if (S.set.sfx === undefined) S.set.sfx = true;
