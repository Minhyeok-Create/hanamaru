'use strict';
/* ================= "what's new" sheet, shown once to people who already used the app ================= */
// v: the version that added the item; people only see items newer than the last list they saw
const WHATS_NEW = [
  {
    v: 14,
    t: '내 약점 리포트',
    d: '자료 탭. 어디가 약한지 정답률로 짚어 주고, 약한 곳만 골라 바로 연습해요. 오늘 공부 시작에도 자동으로 섞여요.'
  },
  { v: 14, t: '목소리 고르기', d: '설정 → 발음 목소리. 더 자연스러운 고음질 목소리를 고르고 미리 들어 볼 수 있어요.' },
  { v: 14, t: '공유 카드', d: '여행 D-day와 한국음 단어(학교 = 学校 = がっこう)를 이미지 카드로 친구에게 보내요.' },
  { v: 14, ja: true, t: '간사이벤', d: '회화·여행 탭. おおきに, なんでやねん — 오사카에서 듣는 사투리를 배워요.' },
  {
    v: 13,
    t: '화면을 정리했어요',
    d: '아래 탭이 5개로 줄었어요. 탭을 누르면 연습 목록이 설명과 함께 카드로 나와요. ☆를 누르면 홈과 목록 맨 위에 고정돼요.'
  },
  { v: 13, t: '오늘 공부 시작', d: '홈의 큰 버튼 하나로 복습 → 코스 → 단어 카드를 이어서 해요. 아래 막대에서 다음 단계로 넘어가요.' },
  { v: 13, t: '검색', d: '맨 위 돋보기로 단어·문법·표현·간판·한자·연습을 한 번에 찾아요.' },
  {
    v: 12,
    ja: true,
    t: '여행 D-day',
    d: '회화·여행 탭. 출발 날짜를 넣으면 여행 문장과 메뉴판 한자를 하루치씩 나눠 줘요. 홈에 D-day가 떠요.'
  },
  {
    v: 12,
    ja: true,
    t: '메뉴판·간판 읽기',
    d: '회화·여행 탭. 定食, 税込, 改札口처럼 일본에서 실제로 보는 글자를 간판 모양 그대로 읽어요.'
  },
  {
    v: 12,
    ja: true,
    t: '조사 함정',
    d: "배우기 탭 · 한국인 맞춤. '친구를 만나다'는 友達に会う! 한국어 조사를 그대로 옮기면 틀리는 곳만 모았어요."
  },
  { v: 12, ja: true, t: '번역 안 되는 한국어 표현', d: "회화·여행 탭. '수고하세요', '화이팅'은 일본어로 뭐라고 할까요?" },
  { v: 12, ja: true, t: '소리 구별 추가', d: '회화·여행 탭 · 발음. が/か, ざ/じゃ, つ/す처럼 한국인 귀에 똑같이 들리는 소리를 연습해요.' },
  { v: 12, ja: false, t: '여행 D-day', d: '회화·여행 탭. 출발 날짜를 넣으면 여행 영어 문장을 하루치씩 나눠 줘요.' },
  {
    v: 11,
    ja: true,
    t: '한국음으로 한자 읽기',
    d: '배우기 탭 · 한국인 맞춤. 학교(學校) → がっこう처럼 한국 한자음에서 일본어 음독을 짐작하는 규칙을 배워요.'
  },
  { v: 10, t: '여행 회화 카드', d: "회화·여행 탭. '보여주기'를 누르면 화면 가득 크게 띄우고 읽어 줘요." },
  { v: 10, ja: true, t: '글자 따라 쓰기', d: '배우기 탭. 획순 번호를 보며 손가락으로 따라 써요.' },
  { v: 10, t: '플래시카드', d: '배우기 탭. 넘기면서 알아요 / 몰라요만 눌러요.' },
  { v: 10, t: '단어장 공유', d: '자료 탭 → 단어장에서 링크로 친구에게 보내요.' }
];
const WN_LATEST = 14;

function whatsNew10(since) {
  const ja = S.lang === 'ja';
  // ja: true = Japanese only, false = English only, undefined = both
  const items = WHATS_NEW.filter(x => x.v > (since || 9) && (x.ja === undefined || x.ja === ja));
  if (!items.length) return;
  const el = openSheet(
    `<div class="sheet-h"><b>새로 생긴 것</b><button type="button" class="icon-btn" data-close aria-label="닫기">${XICON}</button></div>
    <div class="h-scroll"><div class="h-sec" style="padding:14px;display:grid;gap:10px;font-size:15px;line-height:1.6">
      ${items.map(x => `<p style="margin:0"><b>${esc(x.t)}</b> · ${esc(x.d)}</p>`).join('')}</div>
      <button class="btn primary" data-wn style="width:100%">확인</button></div>`,
    'help'
  );
  el.querySelector('[data-wn]').addEventListener('click', closeSheet);
}
