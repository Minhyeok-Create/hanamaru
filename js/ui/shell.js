'use strict';
/* ================= shell ================= */
const view = document.getElementById('view');
const tabsEl = document.getElementById('tabs');
let advT = null;
const clearAdv = () => {
  if (advT) {
    clearTimeout(advT);
    advT = null;
  }
};
const ICO = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 10.5 12 4l8 6.5V20h-5.5v-5.5h-5V20H4z"/></svg>',
  kana: '<svg viewBox="0 0 24 24"><text x="12" y="18" text-anchor="middle" font-size="17" fill="currentColor" style="font-family:var(--f-jp)">あ</text></svg>',
  word: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="4" y="6" width="13" height="14" rx="2"/><path d="M8 3.5h10a2 2 0 0 1 2 2V17"/></svg>',
  sent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 5h16v11H10l-4 3.5V16H4z"/><path d="M8 9.5h8M8 12.5h5"/></svg>',
  listen:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3.5" y="14" width="4" height="6" rx="1.5"/><rect x="16.5" y="14" width="4" height="6" rx="1.5"/></svg>',
  ref: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M13 4h5.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H13z"/></svg>',
  eword:
    '<svg viewBox="0 0 24 24"><text x="12" y="17.5" text-anchor="middle" font-size="14" font-weight="600" fill="currentColor" style="font-family:var(--f-en)">Aa</text></svg>'
};
ICO.talk =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3.5 5h11v8H8l-3 2.5V13H3.5z"/><path d="M17 9h3.5v8H19v2.5L16 17h-5.5v-2"/></svg>';
ICO.esent = ICO.sent;
ICO.elisten = ICO.talk;
ICO.eref = ICO.ref;
ICO.play =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M7.5 7.5h9a4.5 4.5 0 0 1 4.4 5.5l-.9 4a2.3 2.3 0 0 1-4 .9L14 16h-4l-2 1.9a2.3 2.3 0 0 1-4-.9l-.9-4a4.5 4.5 0 0 1 4.4-5.5z"/><path d="M8 10.5v3M6.5 12h3"/><circle cx="15.5" cy="11" r=".6" fill="currentColor"/><circle cx="17" cy="13" r=".6" fill="currentColor"/></svg>';
ICO.eplay = ICO.play;
const TAB_ICON = { listen: 'talk' };
const TABS = {
  ja: [
    ['home', '홈'],
    ['kana', '문자'],
    ['word', '단어'],
    ['sent', '문장'],
    ['listen', '회화'],
    ['play', '놀이'],
    ['ref', '자료']
  ],
  en: [
    ['home', '홈'],
    ['eword', '단어'],
    ['esent', '문장'],
    ['elisten', '회화'],
    ['eplay', '놀이'],
    ['eref', '자료']
  ]
};
const TAB_MODES = {
  kana: ['kana', 'kwrite', 'kconf', 'kanji', 'hj', 'hjr', 'sign', 'kspeed'],
  word: ['word', 'flash', 'hjw', 'loan', 'wasei', 'conj', 'cnt', 'wspeed'],
  sent: ['sent', 'jb', 'part', 'kpart', 'gram', 'pol'],
  listen: ['jdlg', 'jtrav', 'trip', 'jl', 'jd', 'jsh', 'jn', 'jlen', 'jauto'],
  play: ['omikuji', 'cards', 'stamps', 'rain', 'match', 'vs'],
  ref: ['today', 'wrongs', 'course', 'chart', 'jlist', 'gnote', 'koexp', 'stats', 'badges'],
  eword: ['ew', 'eflash', 'irr', 'kong', 'espeed'],
  esent: ['es', 'eb', 'eprep', 'etense', 'ephr'],
  elisten: ['edlg', 'etrav', 'etrip', 'el', 'ed', 'esh', 'enn', 'mp', 'eauto'],
  eplay: ['omikuji', 'cards', 'stamps', 'rain', 'match', 'vs'],
  eref: ['today', 'wrongs', 'course', 'elist', 'stats', 'badges']
};
const MODE_LABEL = {
  kpart: '조사 함정',
  koexp: '한국어 표현',
  sign: '메뉴판·간판',
  trip: '여행 D-day',
  etrip: '여행 D-day',
  hj: '한국음 한자',
  hjw: '한자어',
  hjr: '한국음 규칙',
  kwrite: '따라 쓰기',
  flash: '플래시카드',
  eflash: '플래시카드',
  wasei: '일본식 영어',
  kong: '콩글리시',
  jtrav: '여행 카드',
  etrav: '여행 카드',
  wrongs: '오답 노트',
  jauto: '연속 듣기',
  eauto: '연속 듣기',
  eprep: '전치사',
  etense: '시제',
  ephr: '구동사',
  cnt: '조수사·날짜',
  pol: '반말↔존댓말',
  jlen: '소리 구별',
  course: '학습 코스',
  kanji: '기초 한자',
  part: '조사 빈칸',
  gram: '문법',
  jdlg: '대화 연습',
  jsh: '따라 말하기',
  today: '오늘 요약',
  gnote: '문법 노트',
  irr: '불규칙 동사',
  edlg: '대화 연습',
  esh: '따라 말하기',
  mp: '발음 구별',
  kana: '문자 퀴즈',
  kconf: '헷갈리는 글자',
  kspeed: '60초 도전',
  word: '단어 퀴즈',
  loan: '외래어',
  conj: '동사 활용',
  wspeed: '60초 도전',
  sent: '보기 고르기',
  jb: '문장 조립',
  jl: '문장 듣기',
  jd: '받아쓰기',
  jn: '숫자 듣기',
  chart: '50음도',
  jlist: '단어장',
  stats: '학습 기록',
  badges: '배지',
  ew: '단어 퀴즈',
  espeed: '60초 도전',
  es: '보기 고르기',
  eb: '문장 조립',
  el: '문장 듣기',
  ed: '받아쓰기',
  enn: '숫자 듣기',
  elist: '단어장'
};
const DUE_LABEL = {
  kpart: '조사 함정',
  sign: '메뉴판·간판',
  hj: '한국음 한자',
  hjw: '한자어',
  wasei: '일본식 영어',
  kong: '콩글리시',
  eprep: '전치사',
  etense: '시제',
  ephr: '구동사',
  cnt: '조수사·날짜',
  pol: '반말↔존댓말',
  jlen: '소리 구별',
  kanji: '한자',
  part: '조사',
  gram: '문법',
  irr: '불규칙 동사',
  mp: '발음 구별',
  kana: '문자',
  word: '단어',
  loan: '외래어',
  conj: '동사 활용',
  sent: '문장 고르기',
  jb: '문장 조립',
  jl: '문장 듣기',
  jd: '받아쓰기',
  ew: '단어',
  es: '문장 고르기',
  eb: '문장 조립',
  el: '문장 듣기',
  ed: '받아쓰기'
};
const NEEDS_TTS = new Set(['jl', 'jd', 'jn', 'el', 'ed', 'enn', 'jsh', 'esh', 'mp', 'jlen', 'jauto', 'eauto']);
const VIEWS = new Set(['chart', 'jlist', 'elist', 'stats', 'badges', 'today', 'gnote', 'course', 'wrongs']);
const DLGM = new Set(['jdlg', 'edlg']);
const SPEED = new Set(['kspeed', 'wspeed', 'espeed']);
const SCENE_MODS = new Set(['sent', 'jb', 'jl', 'jd', 'es', 'eb', 'el', 'ed', 'part', 'jsh', 'esh']);
const BUILD = new Set(['jb', 'eb']);
const LISTEN = new Set(['jl', 'el']);
const DICT = new Set(['jd', 'ed']);
const NUMS = new Set(['jn', 'enn']);
const JA_MODS = new Set([
  'kpart',
  'koexp',
  'sign',
  'trip',
  'hj',
  'hjw',
  'hjr',
  'kwrite',
  'flash',
  'wasei',
  'jtrav',
  'kana',
  'kconf',
  'kspeed',
  'word',
  'loan',
  'conj',
  'wspeed',
  'sent',
  'jb',
  'jl',
  'jd',
  'jn',
  'chart',
  'jlist',
  'kanji',
  'part',
  'gram',
  'jdlg',
  'jsh',
  'gnote',
  'cnt',
  'pol',
  'jlen',
  'jauto'
]);
const modLang = m =>
  JA_MODS.has(m)
    ? 'ja'
    : ['stats', 'badges', 'today', 'course', 'wrongs', 'omikuji', 'cards', 'stamps', 'rain', 'match', 'vs'].includes(m)
      ? S.lang
      : 'en';
const SRS_MODS = {
  ja: [
    'kana',
    'word',
    'kanji',
    'hj',
    'hjw',
    'sign',
    'kpart',
    'loan',
    'wasei',
    'conj',
    'cnt',
    'sent',
    'jb',
    'part',
    'gram',
    'pol',
    'jl',
    'jd',
    'jlen'
  ],
  en: ['ew', 'irr', 'kong', 'es', 'eb', 'eprep', 'etense', 'ephr', 'el', 'ed', 'mp']
};
const srsMods = () => SRS_MODS[S.lang].filter(m => hasTTS || !NEEDS_TTS.has(m));
const tabModes = t => TAB_MODES[t].filter(m => hasTTS || !NEEDS_TTS.has(m));
const tabList = () => TABS[S.lang].filter(([t]) => t === 'home' || tabModes(t).length);
function curTab() {
  const t = S.tabs[S.lang];
  return tabList().some(x => x[0] === t) ? t : 'home';
}
function activeMod() {
  const t = curTab();
  if (t === 'home') return null;
  const ms = tabModes(t);
  const m = S.smode[S.lang][t];
  return ms.includes(m) ? m : ms[0];
}
const modTab = m =>
  tabList()
    .map(x => x[0])
    .find(t => t !== 'home' && TAB_MODES[t].includes(m));
function renderTabs() {
  const list = tabList();
  tabsEl.style.gridTemplateColumns = `repeat(${list.length},1fr)`;
  tabsEl.innerHTML = list.map(([t, l]) => `<button class="tab" data-tab="${t}">${ICO[TAB_ICON[t] || t]}${l}</button>`).join('');
  document.querySelectorAll('#langSeg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === S.lang));
}
function stopAll() {
  clearAdv();
  stopSpeed();
  stopGames();
  stopAutoplay();
  LT = null;
  if (typeof recRelease === 'function') recRelease();
  if (hasTTS) {
    try {
      speechSynthesis.cancel();
    } catch (e) {}
  }
}
function go(tab) {
  stopAll();
  S.tabs[S.lang] = tab;
  save();
  for (const b of tabsEl.children) {
    if (b.dataset.tab === tab) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  }
  if (tab === 'home') renderHome();
  else renderMod(activeMod());
  window.scrollTo(0, 0);
}
function startMod(mod) {
  const t = modTab(mod);
  if (!t) return;
  S.smode[S.lang][t] = mod;
  go(t);
}
const CUSTOM = {}; // modes that draw their own screen (registered by feature files)
function renderMod(mod) {
  view.onclick = null;
  if (VIEWS.has(mod)) renderView(mod);
  else if (SPEED.has(mod)) renderSpeed(mod);
  else if (DLGM.has(mod)) renderDialogue(mod);
  else if (CUSTOM[mod]) CUSTOM[mod](mod);
  else if (PLAY.has(mod)) renderPlay(mod);
  else renderModule(mod);
  addTip(mod);
}
function modeSeg(mod) {
  const t = modTab(mod);
  const ms = tabModes(t);
  if (ms.length < 2) return '';
  return `<div class="seg modes" role="group" aria-label="연습 방식">${ms.map(m => `<button data-mode="${m}" aria-pressed="${m === mod}">${modeLabel(m)}</button>`).join('')}</div>`;
}
function bindModes() {
  const el = view.querySelector('.modes');
  if (!el) return;
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-mode]');
    if (!b || b.getAttribute('aria-pressed') === 'true') return;
    stopAll();
    S.smode[S.lang][curTab()] = b.dataset.mode;
    save();
    renderMod(b.dataset.mode);
    window.scrollTo(0, 0);
  });
}
tabsEl.addEventListener('click', e => {
  const b = e.target.closest('.tab');
  if (b) go(b.dataset.tab);
});
document.getElementById('langSeg').addEventListener('click', e => {
  const b = e.target.closest('[data-lang]');
  if (!b || b.dataset.lang === S.lang) return;
  S.lang = b.dataset.lang;
  save();
  renderTabs();
  go(curTab());
});
document.addEventListener('focusin', e => {
  if (e.target.matches('input[type=text],input[type=search],textarea')) document.body.classList.add('typing');
});
document.addEventListener('focusout', e => {
  if (e.target.matches('input[type=text],input[type=search],textarea')) document.body.classList.remove('typing');
});
document.addEventListener('click', e => {
  const b = e.target.closest('[data-speak]');
  if (b) {
    e.preventDefault();
    speak(b.dataset.speak, b.dataset.lang || 'ja');
  }
});
