'use strict';
/* ================= tab menus: grouped cards with a one-line description, ☆ pins, "new" badges ================= */

const MENU_DESC = {
  kana: '히라가나·가타카나 읽기와 쓰기',
  kwrite: '획순 번호 보며 손가락으로 따라 쓰기',
  kconf: 'シ/ツ, ソ/ン처럼 닮은 글자 구별',
  kanji: '기초 한자의 뜻과 읽는 법',
  word: '뜻 고르기 · 직접 쓰기',
  flash: '넘기면서 알아요 / 몰라요',
  conj: 'ます형·て형·た형… 동사 바꾸기',
  cnt: '~개, ~명, 날짜 읽기',
  loan: 'コーヒー처럼 영어에서 온 말',
  sent: '한국어 문장에 맞는 일본어 고르기',
  jb: '블록을 눌러 문장 만들기',
  part: 'は·が·を·に 빈칸 채우기',
  gram: '문형을 써서 문장 고르기',
  pol: '반말과 존댓말 바꿔 말하기',
  hj: '한국 한자음으로 음독 맞히기',
  hjw: '학교 → がっこう 한자어 읽기',
  hjr: '받침 ㄱ→く 같은 규칙 정리와 사전',
  kpart: '친구를 만나다 → 友達に会う',
  wasei: 'サラリーマン은 영어로?',
  kspeed: '60초 동안 글자 많이 맞히기',
  wspeed: '60초 동안 단어 많이 맞히기',
  jtrav: '화면 가득 보여 주고 읽어 주는 문장',
  trip: '출발일까지 하루치씩 벼락치기',
  sign: '메뉴판·역·편의점 글자 읽기',
  koexp: "'수고하세요'는 일본어로?",
  kansai: '오사카 사투리 おおきに·なんでやねん',
  jdlg: '상황별 대화를 직접 주고받기',
  jl: '듣고 맞는 문장 고르기',
  jd: '듣고 그대로 받아쓰기',
  jsh: '듣고 따라 말하기',
  jn: '가격·시간·숫자 알아듣기',
  jlen: '장음·촉음·탁음, が/か 구별',
  jauto: '화면 안 보고 계속 듣기',
  omikuji: '하루 한 번 운세 뽑기',
  cards: '모은 뽑기권으로 단어 카드 뽑기',
  stamps: '공부할수록 채워지는 여행 지도',
  rain: '떨어지는 글자 맞히기 게임',
  match: '짝 맞추기 게임',
  vs: '친구와 같은 문제로 대결',
  weak: '어디가 약한지 정답률로 짚어 줘요',
  wrongs: '틀린 문제만 모아서 다시',
  today: '오늘 공부한 내용 한눈에',
  course: '하루 15분 단계별 코스',
  chart: '50음도 표',
  jlist: '단어 찾기·내 단어 추가·공유',
  gnote: '문법 정리 노트',
  stats: '날짜별 기록과 정답률',
  badges: '모은 배지',
  ew: '영단어 뜻 고르기 · 쓰기',
  eflash: '넘기면서 알아요 / 몰라요',
  irr: 'go-went-gone 불규칙 동사',
  kong: '핸드폰은 영어로?',
  es: '한국어 문장에 맞는 영어 고르기',
  eb: '단어 블록으로 문장 만들기',
  eprep: 'in·on·at 전치사',
  etense: '시제 고르기',
  ephr: 'pick up 같은 구동사',
  espeed: '60초 동안 단어 많이 맞히기',
  etrav: '화면 가득 보여 주고 읽어 주는 문장',
  etrip: '출발일까지 하루치씩 벼락치기',
  edlg: '상황별 대화를 직접 주고받기',
  el: '듣고 맞는 문장 고르기',
  ed: '듣고 그대로 받아쓰기',
  esh: '듣고 따라 말하기',
  enn: '가격·시간·숫자 알아듣기',
  mp: 'ship / sheep 소리 구별',
  eauto: '화면 안 보고 계속 듣기',
  elist: '단어 찾기·내 단어 추가·공유'
};
// modes added recently get a "새로" badge until opened once
const NEW_MODS = new Set([
  'kansai',
  'weak',
  'kwrite',
  'flash',
  'eflash',
  'wasei',
  'kong',
  'jtrav',
  'etrav',
  'hj',
  'hjw',
  'hjr',
  'kpart',
  'koexp',
  'sign',
  'trip',
  'etrip'
]);
const TAB_LEAD = {
  learn: '문자 · 단어 · 문장, 그리고 한국인에게 딱 맞춘 연습',
  talk: '여행에서 바로 쓰는 것과 듣기 · 말하기',
  play: '쉬어 가며 즐기는 놀이',
  ref: '복습과 정리 자료, 내 기록',
  elearn: '단어와 문장 연습',
  etalk: '여행 영어와 듣기 · 말하기',
  eplay: '쉬어 가며 즐기는 놀이',
  eref: '복습과 정리 자료, 내 기록'
};

function menuCard(m) {
  let badge = '';
  if (NEW_MODS.has(m) && !S.seenMod[m]) badge = '<i class="mc-new">새로</i>';
  else if (srsMods().includes(m)) {
    const n = dueCount(m);
    if (n) badge = `<i class="mc-due num">복습 ${n > 99 ? '99+' : n}</i>`;
  }
  return `<div class="mcard"><button type="button" class="mc-go" data-mode="${m}"><b>${esc(modeLabel(m))}${badge}</b><small>${esc(MENU_DESC[m] || '')}</small></button>${pinBtn(m)}</div>`;
}
function renderMenu(tab) {
  view.onclick = null;
  const vis = new Set(menuModes(tab));
  const pinned = (S.pins[S.lang] || []).filter(m => vis.has(m));
  const groups = MENU[tab].map(([g, ms]) => [g, ms.filter(m => vis.has(m))]).filter(([, ms]) => ms.length);
  const tl = (tabList().find(x => x[0] === tab) || [, ''])[1];
  const hidden = tabModes(tab).length - vis.size;
  view.innerHTML = `<section class="menu">
    <header class="menu-h"><h1>${tl}</h1><p>${TAB_LEAD[tab] || ''}</p></header>
    ${pinned.length ? `<h2 class="menu-g">★ 고정</h2><div class="mcards">${pinned.map(menuCard).join('')}</div>` : ''}
    ${groups.map(([g, ms]) => `<h2 class="menu-g">${g}</h2><div class="mcards">${ms.map(menuCard).join('')}</div>`).join('')}
    <p class="note menu-foot">☆를 누르면 홈과 메뉴 맨 위에 고정돼요.${hidden ? ` 숨긴 연습 ${hidden}개는` : ' 안 쓰는 연습은'} <button type="button" class="link" data-settings="menu">설정 → 메뉴 편집</button>에서 ${hidden ? '다시 켤 수 있어요' : '숨길 수 있어요'}.</p>
  </section>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('.menu [data-settings]');
  if (b) openSettings(b.dataset.settings);
});

// ---- settings: show / hide modes ----
function menuEditHTML() {
  const tabs = tabList().filter(([t]) => t !== 'home');
  return tabs
    .map(
      ([t, l]) =>
        `<div class="me-tab"><b>${l}</b><div class="chips">${tabModes(t)
          .map(
            m =>
              `<button type="button" class="chip" data-mhide="${m}" aria-pressed="${!(S.hide[S.lang] || []).includes(m)}">${esc(modeLabel(m))}</button>`
          )
          .join('')}</div></div>`
    )
    .join('');
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-mhide]');
  if (!b) return;
  const m = b.dataset.mhide,
    l = S.hide[S.lang] || (S.hide[S.lang] = []);
  if (l.includes(m)) l.splice(l.indexOf(m), 1);
  else l.push(m);
  save();
  b.setAttribute('aria-pressed', !l.includes(m));
  if (!CUR_MOD && curTab() !== 'home') renderMenu(curTab());
});

// ---- home: pinned shortcuts ----
function pinsHomeHTML() {
  const ms = (S.pins[S.lang] || []).filter(m => modTab(m));
  if (!ms.length) return '';
  return `<section><h2 class="sec-title">자주 쓰는 연습</h2><div class="pin-row">${ms.map(m => `<button type="button" class="pin-go" data-mode="${m}">${esc(modeLabel(m))}</button>`).join('')}</div></section>`;
}
