'use strict';
/* ---------- XP, levels, titles ---------- */
const TITLES = {
  ja: [
    [1, '일본어 새싹'],
    [3, '히라가나 견습생'],
    [5, '가타카나 탐험가'],
    [8, '단어 수집가'],
    [11, '편의점 주문 가능'],
    [14, '라멘집 단골'],
    [17, '길 묻기 성공'],
    [20, '호텔 체크인 마스터'],
    [24, '이자카야 수다쟁이'],
    [28, '여행 회화 달인'],
    [33, '일본 친구 사귀기'],
    [40, '하나마루 선생님']
  ],
  en: [
    [1, '영어 새싹'],
    [3, 'ABC 견습생'],
    [5, '단어 수집가'],
    [8, '카페 주문 가능'],
    [11, '길 묻기 성공'],
    [14, '쇼핑 프로'],
    [17, '공항 프리패스'],
    [20, '스몰토크 입문'],
    [24, '여행 회화 달인'],
    [28, '현지인 친구'],
    [33, '프리토킹 도전자'],
    [40, '하나마루 선생님']
  ]
};
const lvNeed = L => 80 + 20 * L;
function levelOf(xp) {
  let L = 1;
  xp = Math.max(0, xp | 0);
  while (xp >= lvNeed(L)) {
    xp -= lvNeed(L);
    L++;
  }
  return { L, cur: xp, need: lvNeed(L) };
}
const titleOf = (lang, L) => {
  let t = TITLES[lang][0][1];
  for (const [l, n] of TITLES[lang]) if (L >= l) t = n;
  return t;
};
const nextTitle = (lang, L) => TITLES[lang].find(([l]) => l > L);
let LAST_GAIN = 0;
function gainXP(n, lang) {
  lang = lang || S.lang;
  if (!n) return;
  const dd = S.days[today()] || (S.days[today()] = { n: 0, c: 0 });
  dd.x = (dd.x || 0) + n;
  const before = levelOf(S.xp[lang]).L;
  S.xp[lang] += n;
  LAST_GAIN = n;
  const after = levelOf(S.xp[lang]).L;
  if (after > before) {
    S.tickets[lang] += 1;
    save();
    const newT = titleOf(lang, after) !== titleOf(lang, before);
    setTimeout(() => levelUp(lang, after, newT), 350);
    checkBadges();
  }
}
function levelUp(lang, L, newTitle) {
  sfx('lvl');
  const old = document.getElementById('lvup');
  if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'lvup';
  el.id = 'lvup';
  el.setAttribute('role', 'status');
  el.innerHTML = `<span class="lv-k">LEVEL UP</span><b>Lv.${L}</b><span>${newTitle ? '새 칭호 · ' : ''}${esc(titleOf(lang, L))}</span><small>카드 뽑기권 +1</small>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  el.addEventListener('click', () => el.remove());
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 400);
  }, 3200);
  if (curTab() === 'home') renderHome();
}
function levelHTML() {
  const lang = S.lang;
  const { L, cur, need } = levelOf(S.xp[lang]);
  const nt = nextTitle(lang, L);
  return `<div class="lvl"><div class="lv-badge"><small>Lv</small><b class="num">${L}</b></div><div class="lv-main"><b>${esc(titleOf(lang, L))}</b><div class="meter"><i style="width:${(cur / need) * 100}%"></i></div><small class="num">다음 레벨까지 ${need - cur} XP${nt ? ` · Lv.${nt[0]} '${esc(nt[1])}'` : ''}</small></div></div>`;
}

/* ---------- combo ---------- */
let COMBO = 0;
function onAnswer(ok) {
  const prev = COMBO;
  COMBO = ok ? COMBO + 1 : 0;
  if (ok) missionEvent('combo', { n: COMBO });
  if (!ok) {
    sfx('ng');
    return;
  }
  const mile = COMBO >= 10 && COMBO % 10 === 0;
  sfx(mile || (COMBO >= 5 && COMBO % 5 === 0) ? 'combo' : 'ok');
  if (mile) {
    gainXP(20);
    setTimeout(() => toast(`${COMBO} 콤보! 보너스 +20 XP`), 200);
  }
  const card = document.getElementById('card');
  if (!card) return;
  if (LAST_GAIN) {
    const f = document.createElement('span');
    f.className = 'xpf';
    f.textContent = `+${LAST_GAIN} XP`;
    card.appendChild(f);
    setTimeout(() => f.remove(), 1100);
  }
  if (COMBO >= 3) {
    const c = document.createElement('span');
    c.className = 'combo c' + (COMBO >= 20 ? 3 : COMBO >= 10 ? 2 : 1);
    c.innerHTML = `<b class="num">${COMBO}</b>콤보`;
    card.appendChild(c);
  }
}
