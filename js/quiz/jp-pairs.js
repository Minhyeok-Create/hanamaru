'use strict';
/* ---------- japanese minimal pairs ---------- */
const JMP = (typeof MPJ_RAW !== 'undefined' ? MPJ_RAW : []).map(([w1, r1, k1, w2, r2, k2, lb]) => ({
  w1,
  r1,
  k1,
  w2,
  r2,
  k2,
  lb,
  key: 'jm:' + r1 + '|' + r2
}));
const JM_LABELS = [...new Set(JMP.map(x => x.lb))];
const JM_TIP = {
  장음: '모음을 한 박자 더 길게 끌어요. 일본어는 소리 길이가 다르면 다른 단어가 돼요.',
  촉음: 'っ 자리에서 한 박자 멈췄다가 다음 소리를 내요. 멈춤도 한 박자예요.',
  탁음: '첫소리의 k/g, t/d 차이예요. 한국어 귀에는 둘 다 ㄱ·ㄷ처럼 들리기 쉬워요. が는 목이 울리고, か는 숨이 살짝 나가요.',
  요음: '작은 ゃゅょ는 앞 글자와 합쳐 한 박자, 큰 やゆよ는 따로 한 박자예요.',
  '발음 ん': 'ん도 한 박자예요. 짧게 삼키지 말고 한 박자를 채워요.',
  'ざ·じ (z 소리)': "한국어에는 z 소리가 없어서 ざ·ず·ぜ·ぞ를 じゃ·じゅ처럼 내기 쉬워요. 혀끝을 윗니 뒤에 대고 '즈'를 울리듯 내 보세요.",
  'つ 소리': "つ는 '쯔'에 가까워요. す(스)나 ちゅ(츄)와 헷갈리지 않게, 혀끝을 윗니 뒤에 붙였다 떼며 내요."
};
function showJM(mod, q, card, zone, r) {
  const fresh = !r.order;
  if (fresh)
    r.order = [1, 2].map(i => ({
      t: q['r' + i],
      ok: q.tg === i,
      cls: 'jp',
      lang: 'ja',
      sub: (q['w' + i] !== q['r' + i] ? q['w' + i] + ' · ' : '') + q['k' + i]
    }));
  card.innerHTML = `<span class="cat">소리 구별 · ${esc(q.lb)}</span>${playBox()}<p class="cap">들린 단어를 고르세요</p>${MARKS}`;
  zone.dataset.type = 'jlen';
  zone.innerHTML = optsHTML(r).replace('<div class="opts">', '<div class="opts grid2">');
  if (fresh && !r.answered) speak(q['r' + q.tg], 'ja');
}
INFO.jlen = q =>
  `<p class="fb-sub">들린 단어: <b class="jp" lang="ja" style="font-size:20px;color:var(--ink)">${esc(q['w' + q.tg])}</b> <span class="jp" lang="ja">${esc(q['r' + q.tg])}</span> · ${esc(q['k' + q.tg])}</p><div class="row">${spkBtn(q.r1, q.r1 + ' 듣기')}${spkBtn(q.r2, q.r2 + ' 듣기')}</div><p class="fb-sub">${esc(JM_TIP[q.lb] || '두 단어를 번갈아 들으며 차이를 비교해 보세요.')}</p>`;
AUTO.jlen = 0;
if (!S.jlen || !Array.isArray(S.jlen.lb) || !S.jlen.lb.some(l => JM_LABELS.includes(l))) S.jlen = { lb: [...JM_LABELS] };
else S.jlen.lb = S.jlen.lb.filter(l => JM_LABELS.includes(l));
// labels added in later versions start switched on for people who already had a saved selection
{
  const known = S.jlen.known || ['장음', '촉음', '탁음', '요음', '발음 ん'];
  for (const l of JM_LABELS) if (!known.includes(l) && !S.jlen.lb.includes(l)) S.jlen.lb.push(l);
  S.jlen.known = [...JM_LABELS];
}
