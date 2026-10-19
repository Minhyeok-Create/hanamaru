'use strict';
/* ---------- mini game: memory match ---------- */
let MG = null;
const MATCH_TYPES = {
  ja: [
    ['wm', '단어 ↔ 뜻'],
    ['hk', '히라가나 ↔ 가타카나'],
    ['kj', '한자 ↔ 뜻']
  ],
  en: [
    ['wm', '단어 ↔ 뜻'],
    ['irr', '원형 ↔ 과거형']
  ]
};
function matchPairs(ty) {
  if (ty === 'hk') {
    return shuffle(KANA.filter(x => x.set === 'basic'))
      .slice(0, 6)
      .map(x => [x.h, toKata(x.h), 'jp', 'jp']);
  }
  if (ty === 'kj') {
    return shuffle(KANJI)
      .slice(0, 6)
      .map(k => [k.k, k.hun, 'jp', '']);
  }
  if (ty === 'irr') {
    return shuffle(IRR)
      .slice(0, 6)
      .map(x => [x.b, x.p.split('/')[0], 'en', 'en']);
  }
  const lang = S.lang;
  const src = lang === 'ja' ? BASE_JP : BASE_EN;
  const out = [];
  const ms = new Set();
  for (const w of shuffle(src)) {
    if (out.length >= 6) break;
    const m = w.m[0];
    if (ms.has(m) || [...(lang === 'ja' ? (S.set.kanji ? w.w : w.r) : w.w)].length > 8) continue;
    ms.add(m);
    out.push([lang === 'ja' ? (S.set.kanji ? w.w : w.r) : w.w, m, lang === 'ja' ? 'jp' : 'en', '']);
  }
  return out;
}
function renderMatch() {
  stopGames();
  const pb = document.getElementById('pbody');
  const lang = S.lang;
  const types = MATCH_TYPES[lang];
  const ty = S.gbest.matchType && types.some(t => t[0] === S.gbest.matchType) ? S.gbest.matchType : types[0][0];
  const pairs = matchPairs(ty);
  const cards = shuffle(
    pairs.flatMap((p, i) => [
      { p: i, t: p[0], c: p[2] },
      { p: i, t: p[1], c: p[3] }
    ])
  );
  MG = { ty, cards, open: [], done: new Set(), moves: 0, start: 0, lock: false };
  const bk = S.gbest['match_' + lang + '_' + ty];
  pb.innerHTML = `<div class="chart"><div class="chips">${types.map(([v, l]) => `<button class="chip" data-mty="${v}" aria-pressed="${v === ty}">${l}</button>`).join('')}</div>
    <div class="cal-head" style="margin:0"><p class="note">뒤집힌 카드 두 장을 골라 짝을 찾아요.${bk ? ` 최고 기록 ${bk.m}번 · ${bk.s}초` : ''}</p><span class="num" id="mgM" style="font-weight:600">0번</span></div>
    <div class="mgrid">${cards.map((c, i) => `<button type="button" class="mc" data-mc="${i}" aria-label="카드 ${i + 1}"><span class="mc-in"><span class="mc-b"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="${HANAMARU_PATHS[0]}"/><path d="${HANAMARU_PATHS[1]}"/></svg></span><span class="mc-f ${c.c}" ${c.c === 'jp' ? 'lang="ja"' : c.c === 'en' ? 'lang="en"' : ''} style="font-size:${[...c.t].length <= 2 ? 30 : [...c.t].length <= 4 ? 20 : [...c.t].length <= 6 ? 16 : 13}px">${esc(c.t)}</span></span></button>`).join('')}</div>
    <div id="mgEnd"></div></div>`;
  pb.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.mty) {
      S.gbest.matchType = b.dataset.mty;
      save();
      renderMatch();
      return;
    }
    if ('mgagain' in b.dataset) {
      renderMatch();
      return;
    }
    if (b.dataset.mc === undefined || MG.lock) return;
    const i = +b.dataset.mc;
    if (MG.open.includes(i) || MG.done.has(i)) return;
    if (!MG.start) MG.start = Date.now();
    b.classList.add('up');
    sfx('flip');
    MG.open.push(i);
    if (MG.open.length === 2) {
      MG.moves++;
      document.getElementById('mgM').textContent = MG.moves + '번';
      const [a, c] = MG.open;
      if (MG.cards[a].p === MG.cards[c].p) {
        MG.done.add(a);
        MG.done.add(c);
        MG.open = [];
        setTimeout(() => {
          pb.querySelectorAll(`[data-mc="${a}"],[data-mc="${c}"]`).forEach(x => x.classList.add('got'));
          sfx('ok');
        }, 250);
        if (MG.done.size === MG.cards.length) setTimeout(endMatch, 600);
      } else {
        MG.lock = true;
        MG.t = setTimeout(() => {
          pb.querySelectorAll('.mc.up:not(.got)').forEach(x => x.classList.remove('up'));
          MG.open = [];
          MG.lock = false;
        }, 850);
      }
    }
  };
}
function endMatch() {
  if (!MG) return;
  missionEvent('game');
  const lang = S.lang;
  const s = Math.round((Date.now() - MG.start) / 1000);
  const k = 'match_' + lang + '_' + MG.ty;
  const prev = S.gbest[k];
  const nb = !prev || MG.moves < prev.m || (MG.moves === prev.m && s < prev.s);
  if (nb) S.gbest[k] = { m: MG.moves, s };
  const xp = 30 + (MG.moves <= 9 ? 20 : 0);
  gainXP(xp);
  save();
  sfx('combo');
  const end = document.getElementById('mgEnd');
  if (end)
    end.innerHTML = `<div class="sum"><div class="sum-score"><b class="num">${MG.moves}</b><span>번 · ${s}초</span></div><p class="sum-msg">${nb ? '최고 기록이에요!' : `최고 기록 ${prev.m}번 · ${prev.s}초`} · 경험치 +${xp}</p><div class="row"><button class="btn primary" data-mgagain>다시 하기</button></div></div>`;
  try {
    end.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  } catch (e) {}
}
