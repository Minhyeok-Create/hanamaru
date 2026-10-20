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
ICO.learn =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M4 6.5C6.5 5 9.5 5 12 6.5v13C9.5 18 6.5 18 4 19.5z"/><path d="M20 6.5C17.5 5 14.5 5 12 6.5v13c2.5-1.5 5.5-1.5 8 0z"/></svg>';
ICO.talk2 =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M3.5 5h11v8H8l-3 2.5V13H3.5z"/><path d="M17 9h3.5v8H19v2.5L16 17h-5.5v-2"/></svg>';
const TAB_ICON = { listen: 'talk', elearn: 'learn', talk: 'talk2', etalk: 'talk2' };
const TABS = {
  ja: [
    ['home', '홈'],
    ['learn', '배우기'],
    ['talk', '회화·여행'],
    ['play', '놀이'],
    ['ref', '자료']
  ],
  en: [
    ['home', '홈'],
    ['elearn', '배우기'],
    ['etalk', '회화·여행'],
    ['eplay', '놀이'],
    ['eref', '자료']
  ]
};
// tab names from older versions (and older code paths) → where those modes live now
const OLD_TAB = { kana: 'learn', word: 'learn', sent: 'learn', listen: 'talk', eword: 'elearn', esent: 'elearn', elisten: 'etalk' };
// Each tab shows a menu of cards in these groups; the flat TAB_MODES list is derived from it.
const MENU = {
  learn: [
    ['문자', ['kana', 'kwrite', 'kconf', 'kanji']],
    ['단어', ['word', 'flash', 'conj', 'cnt', 'loan']],
    ['문장', ['sent', 'jb', 'part', 'gram', 'pol']],
    ['한국인 맞춤', ['hj', 'hjw', 'hjr', 'kpart', 'wasei']],
    ['도전', ['kspeed', 'wspeed']]
  ],
  talk: [
    ['여행', ['jtrav', 'trip', 'sign', 'koexp', 'kansai']],
    ['대화·듣기', ['jdlg', 'jl', 'jd', 'jsh', 'jn']],
    ['발음', ['jlen', 'jauto']]
  ],
  play: [['놀이', ['omikuji', 'cards', 'stamps', 'rain', 'match', 'vs']]],
  ref: [
    ['복습', ['weak', 'wrongs', 'today']],
    ['자료', ['course', 'chart', 'jlist', 'gnote']],
    ['기록', ['stats', 'badges']]
  ],
  elearn: [
    ['단어', ['ew', 'eflash', 'irr', 'kong']],
    ['문장', ['es', 'eb', 'eprep', 'etense', 'ephr']],
    ['도전', ['espeed']]
  ],
  etalk: [
    ['여행', ['etrav', 'etrip']],
    ['대화·듣기', ['edlg', 'el', 'ed', 'esh', 'enn']],
    ['발음', ['mp', 'eauto']]
  ],
  eplay: [['놀이', ['omikuji', 'cards', 'stamps', 'rain', 'match', 'vs']]],
  eref: [
    ['복습', ['weak', 'wrongs', 'today']],
    ['자료', ['course', 'elist']],
    ['기록', ['stats', 'badges']]
  ]
};
const TAB_MODES = Object.fromEntries(Object.entries(MENU).map(([t, gs]) => [t, gs.flatMap(g => g[1])]));
const MODE_LABEL = {
  kansai: '간사이벤',
  weak: '약점 리포트',
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
  kansai: '간사이벤',
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
  'kansai',
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
    : ['stats', 'badges', 'today', 'course', 'wrongs', 'weak', 'omikuji', 'cards', 'stamps', 'rain', 'match', 'vs'].includes(m)
      ? S.lang
      : 'en';
const SRS_MODS = {
  ja: [
    'kansai',
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
const tabModes = t => (TAB_MODES[OLD_TAB[t] || t] || []).filter(m => hasTTS || !NEEDS_TTS.has(m));
// modes the person chose to hide (settings → 메뉴 편집) are left out of menus
const menuModes = t => tabModes(t).filter(m => !(S.hide[S.lang] || []).includes(m));
const tabList = () => TABS[S.lang].filter(([t]) => t === 'home' || tabModes(t).length);
function curTab() {
  const t = OLD_TAB[S.tabs[S.lang]] || S.tabs[S.lang];
  return tabList().some(x => x[0] === t) ? t : 'home';
}
let CUR_MOD = null; // the mode on screen, or null when a tab menu (or home) is showing
function activeMod() {
  return curTab() === 'home' ? null : CUR_MOD;
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
function markTab(tab) {
  for (const b of tabsEl.children) {
    if (b.dataset.tab === tab) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  }
}
// a tab shows its menu; startMod opens one practice inside it
function go(tab) {
  tab = OLD_TAB[tab] || tab;
  if (tab !== 'home' && !tabList().some(x => x[0] === tab)) tab = 'home';
  stopAll();
  CUR_MOD = null;
  S.tabs[S.lang] = tab;
  save();
  markTab(tab);
  if (tab === 'home') renderHome();
  else renderMenu(tab);
  dailyBar();
  window.scrollTo(0, 0);
}
function startMod(mod) {
  const t = modTab(mod);
  if (!t) return;
  stopAll();
  S.tabs[S.lang] = t;
  S.smode[S.lang][t] = mod;
  if (!S.seenMod[mod]) S.seenMod[mod] = 1;
  save();
  markTab(t);
  CUR_MOD = mod;
  renderMod(mod);
  dailyBar();
  window.scrollTo(0, 0);
}
const CUSTOM = {}; // modes that draw their own screen (registered by feature files)
function renderMod(mod) {
  view.onclick = null;
  CUR_MOD = mod;
  if (VIEWS.has(mod)) renderView(mod);
  else if (SPEED.has(mod)) renderSpeed(mod);
  else if (DLGM.has(mod)) renderDialogue(mod);
  else if (CUSTOM[mod]) CUSTOM[mod](mod);
  else if (PLAY.has(mod)) renderPlay(mod);
  else renderModule(mod);
  addTip(mod);
}
// Header of a practice screen: ← back to the tab menu, the title, and a ☆ to pin it.
// (keeps the old name: every screen calls modeSeg/bindModes)
function modeSeg(mod) {
  const t = modTab(mod);
  const tl = (tabList().find(x => x[0] === t) || [, ''])[1];
  return `<div class="mhead modes"><button type="button" class="mback" data-back aria-label="${tl} 메뉴로">${BACK_ICO}<span>${tl}</span></button><b class="mtitle">${esc(modeLabel(mod))}</b>${pinBtn(mod)}</div>`;
}
const BACK_ICO =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
const isPinned = m => (S.pins[S.lang] || []).includes(m);
const pinBtn = m =>
  `<button type="button" class="pin" data-pin="${m}" aria-pressed="${isPinned(m)}" aria-label="${isPinned(m) ? '고정 풀기' : '자주 쓰는 연습으로 고정'}">${isPinned(m) ? '★' : '☆'}</button>`;
function togglePin(m) {
  const l = S.pins[S.lang] || (S.pins[S.lang] = []);
  if (l.includes(m)) l.splice(l.indexOf(m), 1);
  else l.unshift(m);
  save();
  toast(isPinned(m) ? `'${modeLabel(m)}'을 홈과 메뉴 맨 위에 고정했어요` : '고정을 풀었어요');
  document.querySelectorAll(`[data-pin="${m}"]`).forEach(b => (b.outerHTML = pinBtn(m)));
  if (!CUR_MOD && curTab() !== 'home' && !document.getElementById('sheet')) renderMenu(curTab());
}
function bindModes() {}
document.addEventListener(
  'click',
  e => {
    const p = e.target.closest('[data-pin]');
    if (p) {
      e.stopPropagation();
      togglePin(p.dataset.pin);
      return;
    }
    if (e.target.closest('[data-back]')) {
      e.stopPropagation();
      go(curTab());
    }
  },
  true
);
tabsEl.addEventListener('click', e => {
  const b = e.target.closest('.tab');
  if (b) go(b.dataset.tab);
});
// any [data-mode] button (menu cards, home shortcuts, search results) opens that practice
document.addEventListener('click', e => {
  const b = e.target.closest('[data-mode]');
  if (b && !e.defaultPrevented) startMod(b.dataset.mode);
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
