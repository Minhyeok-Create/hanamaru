'use strict';
/* ---------- play tab renderer ---------- */
function renderPlay(mod) {
  view.innerHTML = `<section class="mod">${modeSeg(mod)}<div id="pbody"></div></section>`;
  bindModes();
  ({ omikuji: renderOmikuji, cards: renderCards, stamps: renderStamps, rain: renderRain, match: renderMatch, vs: renderVS })[mod]();
}

/* ---------- badges, help, tour, home hooks ---------- */
BADGES.push(
  {
    id: 'lv10',
    name: '레벨 10',
    desc: '한 언어에서 레벨 10 달성',
    p: () => [Math.min(10, Math.max(levelOf(S.xp.ja).L, levelOf(S.xp.en).L)), 10]
  },
  {
    id: 'stamp12',
    name: '여행 도장 12',
    desc: '여행 도장 12개 모으기',
    p: () => [Math.min(12, Math.max(stampTotal('ja'), stampTotal('en'))), 12]
  },
  {
    id: 'omi7',
    name: '운세 7번',
    desc: '오미쿠지나 포춘 쿠키 7번 뽑기',
    p: () => [Math.min(7, Object.keys(S.omiDays.ja).length + Object.keys(S.omiDays.en).length), 7]
  },
  { id: 'card30', name: '카드 수집가', desc: '단어 카드 30장 모으기', p: () => [Math.min(30, cardCount('ja') + cardCount('en')), 30] },
  {
    id: 'rain30',
    name: '비 피하기 달인',
    desc: '비 게임에서 30개 맞히기',
    p: () => [
      Math.min(
        30,
        Math.max(
          0,
          ...Object.entries(S.gbest)
            .filter(([k]) => k.startsWith('rain_'))
            .map(([, v]) => +v || 0)
        )
      ),
      30
    ]
  }
);
Object.assign(MODE_HELP, {
  omikuji: '하루 한 번 뽑는 오늘의 운세예요. 일본어 모드는 오미쿠지, 영어 모드는 포춘 쿠키예요. 운세 문장의 뜻을 맞히면 경험치를 받아요.',
  cards: '뽑기권으로 단어 카드를 뽑아 도감을 채워요. 관용구·의성어·유행어처럼 퀴즈에 없는 재미있는 표현이 들어 있어요.',
  stamps: '회화 탭의 대화 연습을 끝까지 하면 그 대화가 열리는 도시에 도장이 찍혀요. 지도를 채워 보세요.',
  rain: '떨어지는 글자나 단어가 바닥에 닿기 전에 알맞은 답을 눌러요. 갈수록 빨라져요.',
  match: '뒤집힌 카드 두 장을 골라 짝을 맞춰요. 적은 횟수로 끝낼수록 좋아요.',
  vs: '같은 10문제를 친구와 풀고 점수를 비교해요. 링크로 도전장을 보내요.'
});
TAB_HELP.play = '오미쿠지·단어 카드·여행 도장·미니게임·친구 대결';
TAB_HELP.eplay = '포춘 쿠키·단어 카드·여행 도장·미니게임·친구 대결';
TOUR.splice(TOUR.length - 1, 0, {
  h: '놀면서 레벨 업',
  p: '문제를 맞히면 경험치가 쌓여 <b>레벨과 칭호</b>가 올라가요. <b>놀이</b> 탭에는 오늘의 운세, 단어 카드 뽑기, 여행 도장 지도, 미니게임, 친구 대결이 있어요.',
  art: 'play'
});
TOUR_ART.play = `<div class="t-play"><div class="lvl" style="pointer-events:none"><div class="lv-badge"><small>Lv</small><b class="num">5</b></div><div class="lv-main"><b>가타카나 탐험가</b><div class="meter"><i style="width:62%"></i></div></div></div><div class="t-play-row"><span class="jp">大吉</span><span>도장</span><span>카드</span></div></div>`;
function playHomeHTML() {
  const lang = S.lang;
  const ja = lang === 'ja';
  const o = S.omi[lang];
  const drawnToday = o && o.d === today();
  const tk = S.tickets[lang];
  const items = [];
  if (!drawnToday)
    items.push(
      `<button class="pl-chip" data-goplay="omikuji"><span class="pl-ico ${ja ? 'jp' : ''}">${ja ? '籤' : '운'}</span><span><b>${ja ? '오늘의 오미쿠지' : '오늘의 포춘 쿠키'}</b><small>아직 안 뽑았어요</small></span></button>`
    );
  if (tk > 0)
    items.push(
      `<button class="pl-chip" data-goplay="cards"><span class="pl-ico num">${tk}</span><span><b>카드 뽑기권 ${tk}장</b><small>단어 카드를 뽑아 보세요</small></span></button>`
    );
  return items.length ? `<div class="pl-row">${items.join('')}</div>` : '';
}
function playClick(b) {
  if (b.dataset.goplay) {
    startMod(b.dataset.goplay);
    return true;
  }
  return false;
}
function whatsNew9() {
  openSheet(
    `<div class="sheet-h"><b>새로 생긴 것</b><button type="button" class="icon-btn" data-close aria-label="닫기">${XICON}</button></div>
    <div class="h-scroll"><div class="h-sec" style="padding:14px;display:grid;gap:10px;font-size:15px;line-height:1.6">
    <p style="margin:0"><b>홈 정리</b> · 오늘 할 일(코스·복습·미션)이 한곳에 모였어요. 설정과 백업은 맨 위 톱니바퀴로 옮겼어요.</p>
    <p style="margin:0"><b>오늘의 미션</b> · 매일 3개, 다 하면 카드 뽑기권!</p>
    <p style="margin:0"><b>레벨 테스트</b> · 20문제로 코스 시작 지점을 추천받아요.</p>
    <p style="margin:0"><b>${S.lang === 'ja' ? 'N4 단계' : '실전 단계'}</b> · ${S.lang === 'ja' ? 'N4 단어 335개, 문법 31개, 한자 80자, 가능형·의지형, 코스 31~60일차' : '전치사·시제·구동사 270문제와 코스 31~60일차'}가 생겼어요.</p>
    <p style="margin:0"><b>연속 듣기 · 오답 노트 · 주간 리포트 · 시즌 이벤트</b>도 추가됐어요.</p></div>
    <button class="btn primary" data-wn style="width:100%">확인</button></div>`,
    'help'
  );
  document.querySelector('#sheet [data-wn]').addEventListener('click', () => closeSheet());
}
function whatsNew() {
  openSheet(
    `<div class="sheet-h"><b>새로 생긴 것</b><button type="button" class="icon-btn" data-close aria-label="닫기">${XICON}</button></div>
    <div class="h-scroll"><div class="h-sec" style="padding:14px;display:grid;gap:10px;font-size:15px;line-height:1.6">
    <p style="margin:0"><b>레벨과 칭호</b> · 문제를 맞힐 때마다 경험치가 쌓여요. 홈 맨 위에서 확인하세요.</p>
    <p style="margin:0"><b>콤보와 효과음</b> · 연속으로 맞히면 콤보가 쌓여요. 효과음은 홈의 설정에서 끌 수 있어요.</p>
    <p style="margin:0"><b>놀이 탭</b> · 오늘의 운세, 단어 카드 뽑기, 여행 도장 지도, 미니게임, 친구 대결이 생겼어요.</p>
    <p style="margin:0" class="note">지금까지 끝낸 대화는 도장으로 바로 반영돼요. 지금까지 푼 문제만큼 경험치도 넣어 뒀어요.</p></div>
    <button class="btn primary" data-wn style="width:100%">놀이 탭 가 보기</button></div>`,
    'help'
  );
  document.querySelector('#sheet [data-wn]').addEventListener('click', () => {
    closeSheet();
    startMod('omikuji');
  });
}
/* retroactive XP for existing learners (once) */
if (!S.seen.xpInit) {
  S.seen.xpInit = 1;
  let ja = 0,
    en = 0;
  for (const [k, s] of Object.entries(S.stats)) {
    const v = (s.c || 0) * 10 + (s.w || 0) * 3;
    if (/^(ew|es|eb|el|ed|esh|ir|mp|dl:en):/.test(k) || k.startsWith('dl:en:')) en += v;
    else ja += v;
  }
  S.xp.ja = Math.max(S.xp.ja, Math.min(ja, 6000));
  S.xp.en = Math.max(S.xp.en, Math.min(en, 6000));
  save();
}
