'use strict';
/* badges */
const SCENE_KEYS = arr =>
  Object.keys(SCENES)
    .map(sc => arr.filter(s => s.sc === sc).map(s => s.key))
    .filter(a => a.length);
const bestScene = arr => {
  let b = [0, 1];
  for (const ks of SCENE_KEYS(arr)) {
    const d = doneCount(ks);
    if (d / ks.length > b[0] / b[1]) b = [d, ks.length];
  }
  return b;
};
const kanaK = (f, kata) => KANA.filter(f).map(x => 'k:' + (kata ? toKata(x.h) : x.h));
const BADGES = [
  { id: 'first', name: '첫걸음', desc: '첫 문제 풀기', p: () => [Math.min(totalN(), 1), 1] },
  { id: 'hira', name: '히라가나 기본', desc: '히라가나 기본 46자 익히기', p: () => [doneCount(kanaK(x => x.set === 'basic')), 46] },
  { id: 'kata', name: '가타카나 기본', desc: '가타카나 기본 46자 익히기', p: () => [doneCount(kanaK(x => x.set === 'basic', true)), 46] },
  {
    id: 'kana_all',
    name: '가나 정복',
    desc: '탁음·요음까지 208자 모두 익히기',
    p: () => [doneCount([...kanaK(() => true), ...kanaK(() => true, true)]), 208]
  },
  {
    id: 'jw100',
    name: '일본어 단어 100',
    desc: '일본어 단어 100개 익히기',
    p: () => [Math.min(doneCount(WORDS.map(w => w.key)), 100), 100]
  },
  {
    id: 'jw300',
    name: '일본어 단어 300',
    desc: '일본어 단어 300개 익히기',
    p: () => [Math.min(doneCount(WORDS.map(w => w.key)), 300), 300]
  },
  { id: 'conj50', name: '활용 마스터', desc: '동사 활용 50개 익히기', p: () => [Math.min(doneCount(CONJ_ITEMS.map(x => x.key)), 50), 50] },
  { id: 'scene_ja', name: '일본어 상황 완주', desc: '한 상황의 일본어 문장 모두 익히기 (보기 고르기)', p: () => bestScene(SENTS) },
  { id: 'ew100', name: '영단어 100', desc: '영단어 100개 익히기', p: () => [Math.min(doneCount(EN_WORDS.map(w => w.key)), 100), 100] },
  { id: 'ew300', name: '영단어 300', desc: '영단어 300개 익히기', p: () => [Math.min(doneCount(EN_WORDS.map(w => w.key)), 300), 300] },
  { id: 'scene_en', name: '영어 상황 완주', desc: '한 상황의 영어 문장 모두 익히기 (보기 고르기)', p: () => bestScene(EN_SENTS) },
  {
    id: 'dict10',
    name: '받아 적기',
    desc: '받아쓰기 10문장 맞히기',
    p: () => [Math.min(Object.entries(S.stats).filter(([k, s]) => /^(jd|ed):/.test(k) && s.c > 0).length, 10), 10]
  },
  {
    id: 'speed20',
    name: '번개손',
    desc: '60초 도전에서 20개 이상 맞히기',
    p: () => [Math.min(Math.max(0, ...Object.values(S.best)), 20), 20]
  },
  { id: 'streak7', name: '일주일 연속', desc: '7일 연속 공부하기', p: () => [Math.min(longestStreak(), 7), 7] },
  { id: 'streak30', name: '한 달 연속', desc: '30일 연속 공부하기', p: () => [Math.min(longestStreak(), 30), 30] },
  { id: 'goal7', name: '목표 달성 7회', desc: '하루 목표 7번 달성하기', p: () => [Math.min(Object.keys(S.goalDays).length, 7), 7] },
  {
    id: 'dlg10',
    name: '수다쟁이',
    desc: '대화 연습 10개를 실수 없이 끝내기',
    p: () => [Math.min(Object.entries(S.stats).filter(([k, s]) => k.startsWith('dl:') && s.c > 0).length, 10), 10]
  },
  {
    id: 'kanji40',
    name: '한자 40',
    desc: '기초 한자 40자 익히기',
    p: () => [Math.min(doneCount(KANJI_RAW.map(x => 'kj:' + x.k)), 40), 40]
  },
  { id: 'q1000', name: '천 문제', desc: '누적 1000문제 풀기', p: () => [Math.min(totalN(), 1000), 1000] }
];
function checkBadges() {
  const fresh = [];
  for (const b of BADGES) {
    if (S.badges.includes(b.id)) continue;
    const [c, m] = b.p();
    if (c >= m) {
      S.badges.push(b.id);
      fresh.push(b.name);
    }
  }
  if (fresh.length) {
    save();
    setTimeout(() => toast(`배지 획득: ${fresh.join(', ')}`), S.set.goal && S.days[today()]?.n === S.set.goal ? 3000 : 0);
  }
}
