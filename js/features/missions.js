'use strict';
/* ================= daily missions: 3 small goals a day, per language ================= */

// id, text, target, which event advances it, and how much
const MISSION_POOL = [
  { id: 'solve20', t: '문제 20개 풀기', n: 20, ev: 'answer', f: () => 1 },
  { id: 'solve30', t: '문제 30개 풀기', n: 30, ev: 'answer', f: () => 1 },
  { id: 'ok15', t: '정답 15개 맞히기', n: 15, ev: 'answer', f: d => (d.ok ? 1 : 0) },
  { id: 'ok25', t: '정답 25개 맞히기', n: 25, ev: 'answer', f: d => (d.ok ? 1 : 0) },
  { id: 'new10', t: '처음 보는 문제 10개 풀기', n: 10, ev: 'answer', f: d => (d.isNew ? 1 : 0) },
  { id: 'rev10', t: '전에 본 문제 10개 다시 풀기', n: 10, ev: 'answer', f: d => (d.isReview ? 1 : 0) },
  {
    id: 'listen8',
    t: '듣기·발음 문제 8개',
    n: 8,
    ev: 'answer',
    tts: true,
    f: d => (/^(jl|el|jd|ed|sh|esh|jm|mp):/.test(d.key || '') ? 1 : 0)
  },
  { id: 'combo5', t: '5콤보 만들기', n: 5, ev: 'combo', max: true, f: d => d.n },
  { id: 'combo10', t: '10콤보 만들기', n: 10, ev: 'combo', max: true, f: d => d.n },
  { id: 'dlg1', t: '대화 연습 1개 끝내기', n: 1, ev: 'dialogue', f: () => 1 },
  { id: 'course1', t: '코스 과제 1개 끝내기', n: 1, ev: 'course', f: () => 1 },
  { id: 'perfect', t: '한 라운드 전부 맞히기', n: 1, ev: 'perfect', f: () => 1 },
  { id: 'game1', t: '미니게임 한 판 하기', n: 1, ev: 'game', f: () => 1 },
  { id: 'omikuji', t: '오늘의 운세 뽑기', n: 1, ev: 'omikuji', f: () => 1 },
  { id: 'speed1', t: '60초 도전 한 번', n: 1, ev: 'speed', f: () => 1 }
];
const MISSION_XP = 30;

function missionState(lang) {
  if (!S.missions || typeof S.missions !== 'object') S.missions = {};
  let m = S.missions[lang];
  if (!m || m.d !== today()) {
    // pick 3 from different event kinds, the same way all day (seeded by date)
    const R = rng(dayIdx() * 7 + (lang === 'en' ? 3 : 0));
    const pool = sShuffle(
      MISSION_POOL.filter(x => hasTTS || !x.tts),
      R
    );
    const ids = [],
      kinds = new Set();
    for (const x of pool) {
      if (ids.length >= 3) break;
      if (kinds.has(x.ev)) continue;
      kinds.add(x.ev);
      ids.push(x.id);
    }
    m = S.missions[lang] = { d: today(), ids, p: [0, 0, 0], done: [0, 0, 0], all: 0 };
  }
  return m;
}
const missionDef = id => MISSION_POOL.find(x => x.id === id);

function missionEvent(ev, data = {}) {
  const lang = S.lang,
    m = missionState(lang);
  let changed = false;
  m.ids.forEach((id, i) => {
    const def = missionDef(id);
    if (!def || def.ev !== ev || m.done[i]) return;
    const v = def.f(data);
    if (!v) return;
    m.p[i] = def.max ? Math.max(m.p[i], v) : m.p[i] + v;
    changed = true;
    if (m.p[i] >= def.n) {
      m.p[i] = def.n;
      m.done[i] = 1;
      gainXP(MISSION_XP, lang);
      setTimeout(() => {
        sfx('combo');
        toast(`미션 완료: ${def.t} · +${MISSION_XP} XP`);
      }, 700);
    }
  });
  if (changed && !m.all && m.done.every(Boolean)) {
    m.all = 1;
    setTimeout(() => grantTicket(lang, '오늘의 미션 모두 완료'), 1800);
  }
  if (changed) save();
}

function missionsHTML() {
  const m = missionState(S.lang);
  return m.ids
    .map((id, i) => {
      const def = missionDef(id);
      if (!def) return '';
      return `<li class="todo-i ms" data-done="${!!m.done[i]}"><span class="ck" aria-hidden="true">${m.done[i] ? CHECK_SVG : ''}</span><span class="tl">${esc(def.t)}<span class="ms-bar"><i style="width:${(m.p[i] / def.n) * 100}%"></i></span></span><span class="num ms-n">${m.p[i]}/${def.n}</span></li>`;
    })
    .join('');
}
const CHECK_SVG =
  '<svg viewBox="0 0 20 20"><path d="M4 10.5 8 14l8-8.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
