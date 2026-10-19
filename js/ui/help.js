'use strict';
/* ---------- help, tutorial, first-visit tips ---------- */
const MODE_HELP = {
  kpart: "'친구를 만나다'는 友達に会う처럼, 한국어 조사를 그대로 옮기면 틀리는 곳만 모았어요.",
  koexp: "'수고하세요', '화이팅'처럼 일본어로 딱 옮겨지지 않는 한국어 표현을 일본에서는 어떻게 말하는지 정리했어요.",
  sign: '일본 여행에서 보는 메뉴판·간판·역 안내를 읽어요. 실제 간판 모양으로 보여 줘요.',
  trip: '출발 날짜를 넣으면 여행 문장과 간판을 하루치씩 나눠 줘요. 홈 화면에 D-day가 떠요.',
  etrip: '출발 날짜를 넣으면 여행 영어 문장을 하루치씩 나눠 줘요. 홈 화면에 D-day가 떠요.',
  hj: '한국 한자음을 보고 일본어 음독을 골라요. 받침 ㄱ→く, ㄴ·ㅁ→ん, ㄹ→つ, ㅇ→장음 규칙만 알아도 많이 맞혀요.',
  hjw: '학교 → がっこう처럼 한국어와 한자가 같은 단어의 일본어 읽기를 맞혀요. 소리가 바뀌는 곳(っ, 탁음)을 조심하세요.',
  hjr: '한국 한자음과 일본어 음독 사이의 규칙을 실제 비율과 함께 정리했어요. 한국음으로 한자를 찾아볼 수도 있어요.',
  kwrite: '히라가나·가타카나를 흐린 견본 위에 손가락으로 따라 써요. 번호 순서가 획순이에요. 채점은 없어요.',
  flash: '단어 카드를 뒤집어 보고 알아요 / 몰라요만 눌러요. 몰라요는 복습에 다시 나와요.',
  eflash: '영단어 카드를 뒤집어 보고 알아요 / 몰라요만 눌러요. 몰라요는 복습에 다시 나와요.',
  wasei: 'サラリーマン처럼 일본에서 만든 영어가 영어권에서는 뭐라고 하는지 맞혀요.',
  kong: '핸드폰, 아이쇼핑처럼 한국에서 만든 영어를 원어민이 쓰는 말로 바꿔요.',
  jtrav: '여행에서 바로 쓰는 문장 카드예요. 보여주기를 누르면 화면 가득 띄우고 읽어 줘요.',
  etrav: '여행에서 바로 쓰는 영어 문장 카드예요. 보여주기를 누르면 화면 가득 띄우고 읽어 줘요.',
  kana: '히라가나·가타카나를 보고 발음을 알파벳으로 쓰거나, 발음을 보고 글자를 써요. 위의 설정 줄을 누르면 방향과 범위를 바꿀 수 있어요.',
  kconf: 'シ/ツ, ぬ/め처럼 모양이 비슷한 글자끼리 묶어서 구별해요.',
  kanji: '기초 한자 95자의 뜻(훈음)과, 그 한자가 들어간 단어의 읽는 법을 골라요.',
  kspeed: '60초 동안 글자를 보고 발음을 최대한 많이 골라요. 최고 기록이 남아요.',
  word: '일본어 단어를 보고 뜻을 한국어로 써요. 설정에서 4지선다로 바꿀 수 있고, ? 버튼을 누르면 읽는 법이 보여요.',
  loan: '가타카나로 쓴 외래어를 읽고 원래 영어 단어를 골라요.',
  conj: '동사를 ます형·て형·ない형·た형으로 바꿔요. 틀린 보기는 흔한 실수로 만들었어요.',
  cnt: '本·枚·匹처럼 물건마다 달라지는 세는 말과 날짜·월·요일 읽기를 연습해요. 3本(さんぼん)처럼 소리가 바뀌는 곳이 핵심이에요.',
  wspeed: '60초 동안 일본어 단어 뜻을 최대한 많이 골라요.',
  sent: '한국어 문장을 보고 알맞은 일본어를 3개 중에서 골라요. ? 버튼으로 보기의 읽는 법을 볼 수 있어요.',
  jb: '블록을 순서대로 눌러 일본어 문장을 만들어요. 필요 없는 블록이 하나 섞여 있어요.',
  part: '문장 속 빈칸에 들어갈 조사(は·が·を·に…)를 골라요.',
  gram: 'N5 핵심 문법을 쓴 문장을 골라요. 설명은 자료 탭의 문법 노트에 있어요.',
  pol: '존댓말(です·ます)을 친구에게 쓰는 반말로, 반말을 존댓말로 바꿔요. 설정에서 방향을 고를 수 있어요.',
  jdlg: '상황별 대화를 이어 가요. 상대의 말을 듣고, 내 차례에는 목표에 맞는 말을 3개 중에서 골라요.',
  jl: '일본어 문장을 듣고 뜻을 골라요. 아이폰 무음 모드에서는 소리가 나지 않아요.',
  jd: '일본어 문장을 듣고 그대로 받아써요. 앱 키패드나 아이폰 일본어 키보드로 입력해요.',
  jsh: '문장을 듣고 소리 내어 따라 말해요. 녹음해서 원어민 발음과 번갈아 들어 볼 수 있어요.',
  jn: '가격·시간·숫자를 듣고 숫자로 써요. 문제가 계속 새로 만들어져요.',
  jlen: 'おばさん/おばあさん, きて/きって처럼 소리 길이·っ·탁음만 다른 단어를 듣고 구별해요. 이어폰을 쓰면 더 잘 들려요.',
  today: '오늘 푼 문제, 처음 본 문제, 틀린 문제를 모아 보여 줘요. 틀린 것만 바로 다시 풀 수 있어요.',
  course: '하루 2~3개 과제로 기초 30일, 이어서 N4·실전 30일을 순서대로 익히는 코스예요. 레벨 테스트로 시작할 날을 추천받을 수 있어요.',
  wrongs: '최근 7일·30일 동안 틀린 문제를 많이 틀린 순서로 모았어요. 종류별로 바로 다시 풀 수 있어요.',
  jauto: '문장을 일본어 → 한국어 순서로 계속 읽어 줘요. 이동할 때 틀어 두고 들어 보세요.',
  eauto: '문장을 영어 → 한국어 순서로 계속 읽어 줘요. 이동할 때 틀어 두고 들어 보세요.',
  eprep: 'in/on/at처럼 헷갈리는 전치사를 문장 속 빈칸에서 골라요.',
  etense: '시간 표현을 보고 알맞은 시제와 동사 형태를 골라요.',
  ephr: 'pick up, find out 같은 구동사를 문장 속 빈칸에서 골라요.',
  chart: '50음도 표예요. 글자를 누르면 발음을 듣고, 익힌 정도를 색으로 볼 수 있어요.',
  jlist: '전체 단어를 검색하고 즐겨찾기하거나 내 단어를 추가할 수 있어요.',
  elist: '전체 영단어를 검색하고 즐겨찾기하거나 내 단어를 추가할 수 있어요.',
  gnote: 'N5 문법 32개의 만드는 법과 예문이에요. 그 문법 퀴즈를 바로 풀 수 있어요.',
  stats: '달력, 최근 7일 그래프, 영역별로 익힌 정도를 보여 줘요. 결과 카드도 여기서 만들어요.',
  badges: '목표를 채우면 배지를 받아요. 진행 정도가 막대로 보여요.',
  ew: '영어 단어를 보고 뜻을 쓰거나, 뜻을 보고 영어를 써요. 4지선다로 바꿀 수도 있어요.',
  irr: '불규칙 동사의 과거형과 과거분사를 골라요.',
  espeed: '60초 동안 영단어 뜻을 최대한 많이 골라요.',
  es: '한국어 문장을 보고 알맞은 영어 문장을 골라요.',
  eb: '단어 블록을 순서대로 눌러 영어 문장을 만들어요.',
  edlg: '상황별 영어 대화를 이어 가요. 내 차례에는 목표에 맞는 말을 골라요.',
  el: '영어 문장을 듣고 뜻을 골라요.',
  ed: '영어 문장을 듣고 받아써요. 대소문자와 문장부호는 채점하지 않아요.',
  esh: '영어 문장을 듣고 따라 말해요. 녹음해서 비교할 수 있어요.',
  enn: '가격·시간·숫자를 영어로 듣고 숫자로 써요.',
  mp: 'ship/sheep처럼 비슷한 영어 발음을 듣고 구별해요.'
};
if (!S.seen || typeof S.seen !== 'object') S.seen = { tour: 0, tips: {} };
if (!S.seen.tips) S.seen.tips = {};
function addTip(mod) {
  if (S.seen.tips[mod] || !MODE_HELP[mod]) return;
  const sec = view.querySelector('section.mod');
  if (!sec) return;
  const anchor = sec.querySelector('.modes');
  const el = document.createElement('div');
  el.className = 'tip';
  el.setAttribute('role', 'note');
  el.innerHTML = `<span class="tip-i" aria-hidden="true">i</span><p>${esc(MODE_HELP[mod])}</p><div class="tip-a"><button type="button" class="btn quiet" data-tiphelp>사용 안내</button><button type="button" class="btn" data-tipok>알겠어요</button></div>`;
  if (anchor) anchor.after(el);
  else sec.prepend(el);
  el.addEventListener('click', e => {
    e.stopPropagation();
    const b = e.target.closest('button');
    if (!b) return;
    if ('tiphelp' in b.dataset) {
      openHelp('modes');
      return;
    }
    S.seen.tips[mod] = 1;
    save();
    el.remove();
  });
}
const TAB_HELP = {
  home: "'오늘 공부 시작' 버튼 하나로 복습 → 코스 → 단어 카드를 이어서 해요. 코스 진행, 고정한 연습도 여기 있어요.",
  learn: '문자·단어·문장 연습, 그리고 한국음 한자·조사 함정 같은 한국인 맞춤 연습',
  talk: '여행 카드·여행 D-day·메뉴판 읽기·한국어 표현, 대화와 듣기·발음 연습',
  play: '오미쿠지·카드 뽑기·스탬프 지도·게임·친구 대결',
  ref: '오답 노트·오늘 요약·코스·50음도·단어장·문법 노트·기록',
  elearn: '영단어·불규칙 동사·콩글리시, 문장·전치사·시제·구동사',
  etalk: '여행 카드·여행 D-day, 대화와 듣기·발음 연습',
  eplay: '포춘 쿠키·카드 뽑기·스탬프 지도·게임·친구 대결',
  eref: '오답 노트·오늘 요약·코스·단어장·기록'
};
function helpHTML() {
  const tabs = tabList().filter(([t]) => t !== 'home');
  const modeList = tabs
    .map(
      ([t, l]) =>
        `<div class="h-tab"><b>${l} 탭</b>${tabModes(t)
          .map(m => `<p><span class="h-m">${MODE_LABEL[m]}</span>${esc(MODE_HELP[m] || '')}</p>`)
          .join('')}</div>`
    )
    .join('');
  const sec = (id, title, body, open) =>
    `<details class="h-sec" id="h-${id}" ${open ? 'open' : ''}><summary>${title}</summary><div class="h-body">${body}</div></details>`;
  return `<div class="sheet-h"><b>사용 안내</b><button type="button" class="icon-btn" data-close aria-label="닫기">${XICON}</button></div>
  <div class="h-scroll">
  <div class="h-quick"><button type="button" class="btn primary" data-h="tour">튜토리얼 다시 보기</button><button type="button" class="btn" data-h="course">30일 코스 보기</button></div>
  ${sec('start', '처음이라면 이렇게 시작하세요', `<ol class="steps"><li>이미 조금 안다면 <b>레벨 테스트</b>(20문제)로 시작할 날을 추천받아요. 처음이라면 홈의 <b>오늘 공부 시작</b>을 누르세요. 코스 1일차부터 알아서 이어져요. 하루 15~20분이면 충분해요.</li><li>하루 목표(기본 20문제)를 채우면 빨간 동그라미(하나마루)가 생겨요.</li><li>다음 날부터도 <b>오늘 공부 시작</b> 하나면 돼요. 복습할 문제와 코스 다음 분량을 알아서 섞어 줘요.</li><li>아이폰이라면 <b>홈 화면에 추가</b>해서 앱처럼 쓰세요. (아래 '설치·업데이트' 참고)</li></ol><p>설정(목표·효과음·테마·백업)은 맨 위 <b>톱니바퀴</b> 버튼에 있어요.</p>`, true)}
  ${sec(
    'screen',
    '화면 구성',
    `<p>맨 위 오른쪽에서 <b>일본어 / 영어</b>를 바꿔요. 기록은 언어별로 따로 쌓여요.</p><p>맨 아래 탭을 누르면 연습 목록이 카드로 나와요. 카드를 누르면 그 연습이 열리고, 왼쪽 위 <b>‹</b>로 목록에 돌아가요. 카드의 <b>☆</b>를 누르면 홈과 목록 맨 위에 고정돼요. 맨 위 <b>돋보기</b>로 단어·문법·표현·간판·한자를 한 번에 찾을 수 있어요.</p><div class="h-tabs">${tabList()
      .map(([t, l]) => `<p><span class="h-m">${l}</span>${esc(TAB_HELP[t] || '')}</p>`)
      .join('')}</div><p>문제 위의 회색 요약 줄을 누르면 범위·방향·표기(한자+가나 / 가나만) 같은 설정이 펼쳐져요.</p>`
  )}
  ${sec('solve', '문제 푸는 법', `<ul class="h-list"><li><b>?</b> 버튼: 읽는 법이나 힌트를 보여 줘요. 처음엔 숨겨져 있어요.</li><li><b>모르겠어요</b>: 정답을 바로 보여 주고, 그 문제는 나중에 다시 나와요.</li><li><b>맞은 걸로 처리</b>: 직접 쓴 답이 사실상 맞는데 오답 처리됐을 때 눌러요.</li><li><b>문제가 이상해요</b>: 신고 내용이 복사돼요. 카톡으로 앱 만든 사람에게 보내 주세요.</li><li>일본어 입력 문제에는 <b>앱 키패드</b>가 나와요. ゛는 탁점(か→が), ゜는 반탁점(は→ぱ), 小는 작은 글자(つ→っ, や→ゃ)예요.</li><li>맞히면 자동으로 다음 문제로 넘어가요. 홈의 설정에서 끌 수 있어요.</li></ul>`)}
  ${sec('modes', '연습 방식 한눈에 보기', modeList)}
  ${sec('review', '복습은 이렇게 돌아가요', `<p>틀린 문제는 바로 다시 나오고, 맞힌 문제는 <b>1일 → 3일 → 7일 → 14일 → 30일</b> 뒤에 다시 나와요. 잊어버릴 때쯤 다시 보는 방식이에요.</p><p>홈의 <b>오늘의 복습</b>에 오늘 다시 볼 문제 수가 나와요. 각 연습의 설정에서 '틀린 것만', '오늘 복습'을 고를 수도 있어요.</p><p>두 번 연속 맞히면 '익힘'으로 세요. 자료 탭의 <b>오늘 요약</b>에서 오늘 틀린 문제만 모아 다시 풀 수 있어요.</p>`)}
  ${sec('course', '학습 코스 · 레벨 테스트', `<p>${S.lang === 'ja' ? '기초 30일(히라가나 → 가타카나 → 단어·문법 → 상황별 대화)과 N4 30일(N4 문법·단어·한자, 가능형·의지형)' : '기초 30일(단어 → 문장 → 불규칙 동사 → 상황별 대화)과 실전 30일(전치사·시제·구동사와 대화)'}, 모두 60일 코스예요. 하루 2~3개 과제로 이어져요. 과제를 끝까지 풀면 체크되고, 하루치를 다 끝내면 다음 날 과제가 홈에 나와요.</p><p>날짜를 놓쳐도 괜찮아요. 하루에 여러 날치를 해도 되고, 끝낸 과제를 다시 해도 돼요. 일본어와 영어 코스는 따로 진행돼요.</p><p><b>레벨 테스트</b>는 코스 화면이나 설정에서 할 수 있어요. 추천받은 날부터 시작하면 그 앞의 과제는 끝낸 것으로 표시돼요.</p>`)}
  ${sec('today', '오늘 할 일 · 미션 · 오답 노트', `<p>홈의 <b>오늘 할 일</b>에 코스 과제, 복습할 문제, 오늘의 미션 3개가 모여 있어요. 미션을 하나 끝낼 때마다 경험치 30, 3개를 모두 끝내면 카드 뽑기권을 받아요.</p><p><b>오답 노트</b>(자료 탭)에는 최근 7일·30일 동안 틀린 문제가 많이 틀린 순서로 모여요. 종류별로 바로 다시 풀 수 있어요.</p><p>월요일부터 수요일까지는 홈에 <b>지난주 리포트</b>가 떠요. 지지난주와 비교한 문제 수, 정답률, 많이 공부한 것을 보여 주고 이미지로 공유할 수 있어요.</p><p>설날·벚꽃·여름 축제·할로윈·가을·크리스마스 기간에는 <b>시즌 이벤트</b>가 열려서 한정 카드와 특별 운세가 나와요.</p>`)}
  ${sec('sound', '소리가 안 나거나 녹음이 안 될 때', `<ul class="h-list"><li>아이폰 옆의 <b>무음 스위치</b>가 켜져 있으면 소리가 나지 않아요.</li><li>발음은 아이폰에 들어 있는 음성을 써요. 설정 → 손쉬운 사용 → 읽기 및 말하기 → 음성에서 일본어(Kyoko 등)를 받아 두면 더 자연스러워요.</li><li>너무 빠르면 홈의 설정에서 <b>천천히 발음</b>을 켜세요.</li><li>따라 말하기 녹음은 Safari나 홈 화면 앱에서 마이크 권한을 허용해야 해요. 녹음은 기기에 저장되지 않아요.</li></ul>`)}
  ${sec('backup', '기록 저장과 백업', `<p>학습 기록은 <b>이 기기의 이 브라우저</b>에만 저장돼요. 다른 사람과 섞이지 않고, 서버로 보내지 않아요.</p><p>휴대폰을 바꾸거나 Safari 데이터를 지우기 전에, 홈 맨 아래 <b>백업 코드 복사</b>를 눌러 메모 앱이나 '카톡 나에게 보내기'에 보관하세요. 새 기기에서 <b>코드로 복원</b>에 붙여 넣으면 돼요.</p><p>Safari로 연 것과 홈 화면 앱은 저장 공간이 따로일 수 있어요. 홈 화면 앱으로 옮길 때도 백업 코드를 쓰면 돼요.</p>`)}
  ${sec('install', '설치·업데이트', `<ol class="steps"><li>Safari에서 앱 주소를 열어요.</li><li>아래쪽 공유 버튼(네모에 위쪽 화살표)을 눌러요.</li><li>'홈 화면에 추가'를 누르면 앱 아이콘이 생겨요.</li></ol><p>새 버전이 나오면 화면 아래에 <b>"새 버전이 나왔어요 · 업데이트"</b>가 떠요. 눌러도 기록은 그대로예요.</p>`)}
  ${sec('play', '레벨·놀이 탭', `<p>문제를 맞히면 <b>경험치 10</b>, 틀려도 3이 쌓여요. 대화를 끝내거나 코스 과제를 마치면 더 받아요. 레벨이 오르면 칭호가 바뀌고 카드 뽑기권을 받아요. 레벨은 일본어·영어 따로 쌓여요.</p><p>연속으로 맞히면 <b>콤보</b>가 쌓이고, 10콤보마다 보너스 경험치를 받아요. 효과음은 홈의 설정에서 끌 수 있어요.</p><ul class="h-list"><li><b>${S.lang === 'ja' ? '오미쿠지' : '포춘 쿠키'}</b>: 하루 한 번 운세를 뽑고 운세 문장 뜻을 맞혀요.</li><li><b>단어 카드</b>: 뽑기권으로 재미있는 표현 카드를 뽑아 도감을 채워요. 뽑기권은 하루 목표·레벨 업·코스 하루치 완료로 받아요.</li><li><b>여행 도장</b>: 대화 연습을 끝까지 하면 그 도시에 도장이 찍혀요.</li><li><b>${S.lang === 'ja' ? '가나 비' : '단어 비'} · 짝 맞추기</b>: 짧게 즐기는 미니게임이에요.</li><li><b>친구 대결</b>: 같은 10문제를 링크로 보내 친구와 점수를 겨뤄요.</li></ul>`)}
  ${sec(
    'remind',
    '매일 공부 알림 만들기 (아이폰)',
    `<p>웹앱은 스스로 알림을 보낼 수 없어서, 아이폰 <b>단축어</b> 앱으로 매일 같은 시간에 알림이 뜨게 만들어요. 한 번만 설정하면 돼요.</p>
    <div class="ios-steps">
      <div class="ios-step"><span class="n">1</span><div class="ios-mock"><div class="ios-bar">단축어</div><div class="ios-tabs"><i>단축어</i><i class="on">자동화</i><i>갤러리</i></div></div><p><b>단축어</b> 앱을 열고 아래쪽 <b>자동화</b> 탭을 눌러요.</p></div>
      <div class="ios-step"><span class="n">2</span><div class="ios-mock"><div class="ios-bar">새로운 자동화</div><div class="ios-row on">특정 시간</div><div class="ios-row">알람</div><div class="ios-row">수면</div></div><p><b>+</b>(새로운 자동화)를 누르고 <b>특정 시간</b>을 골라요.</p></div>
      <div class="ios-step"><span class="n">3</span><div class="ios-mock"><div class="ios-bar">언제</div><div class="ios-row">시간 <b>오후 9:00</b></div><div class="ios-row">반복 <b>매일</b></div><div class="ios-row on">즉시 실행</div></div><p>공부할 시간을 정하고 <b>매일</b>, <b>즉시 실행</b>을 고른 뒤 <b>다음</b>을 눌러요.</p></div>
      <div class="ios-step"><span class="n">4</span><div class="ios-mock"><div class="ios-bar">동작</div><div class="ios-row">알림</div><div class="ios-row on">알림 보기</div></div><p><b>새로운 빈 자동화</b> → <b>동작 추가</b>에서 '알림'을 검색해 <b>알림 보기</b>를 골라요.</p></div>
      <div class="ios-step"><span class="n">5</span><div class="ios-mock"><div class="ios-bar">알림 보기</div><div class="ios-note">하나마루 공부할 시간! 오늘의 미션 확인하기</div></div><p>알림 문구를 적고 <b>완료</b>. 이제 매일 그 시간에 알림이 떠요.</p></div>
    </div>
    <p class="note">메뉴 이름은 iOS 버전에 따라 조금 다를 수 있어요. 알림을 누르면 단축어 앱이 열리니, 하나마루는 홈 화면 아이콘으로 열어 주세요. 더 간단하게는 <b>미리 알림</b> 앱에 '하나마루'를 매일 반복으로 등록해도 돼요.</p>`
  )}
  ${sec('privacy', '개인정보 · 앱 응원', `<p>학습 기록은 이 기기에만 저장되고 서버로 보내지 않아요. 로그인도 없어요.</p>${analyticsOn() ? '<p>하루에 몇 명이 앱을 쓰는지 알기 위해 <b>방문 수만</b> 세요. 쿠키를 쓰지 않고, 이름·기록 같은 개인정보는 보내지 않아요.</p>' : ''}${donateLinks().length ? `<p>앱이 도움이 됐다면 설정(톱니바퀴)의 <b>앱 응원하기</b>에서 후원할 수 있어요. 후원과 상관없이 모든 기능은 무료예요.</p>` : ''}`)}
  ${sec('friends', '친구와 함께 쓰기', `<p>홈의 <b>결과 카드</b>를 누르면 오늘 푼 문제, 연속 학습, 최근 7일 기록이 담긴 이미지가 만들어져요. 길게 눌러 저장하거나 공유 버튼으로 카톡에 보내세요.</p><p>60초 도전 결과는 '결과 복사'로 글로 보낼 수 있어요.</p>`)}
  <p class="note" style="text-align:center;padding:8px 0 4px">하나마루 · 버전 ${esc(APP_VERSION.startsWith('__') ? '미리보기' : APP_VERSION.slice(0, 8))}</p>
  </div>`;
}
function openHelp(section) {
  const el = openSheet(helpHTML(), 'help');
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-h]');
    if (!b) return;
    if (b.dataset.h === 'tour') {
      closeSheet();
      openTour();
    } else if (b.dataset.h === 'course') {
      closeSheet();
      startMod('course');
    }
  });
  if (section) {
    const d = el.querySelector('#h-' + section);
    if (d) {
      d.open = true;
      setTimeout(() => {
        try {
          d.scrollIntoView({ block: 'start' });
        } catch (e) {}
      }, 30);
    }
  }
}
const TOUR = [
  {
    h: '하나마루에 오신 걸 환영해요',
    p: '일본어·영어 회화 기초를 하루 15분씩 익히는 앱이에요. 맞히면 선생님이 그려 주는 빨간 동그라미, <b>하나마루</b>가 생겨요.',
    art: 'mark'
  },
  {
    h: '언어와 탭',
    p: '맨 위에서 <b>일본어 / 영어</b>를 바꿔요. 맨 아래 탭을 누르면 연습 목록이 카드로 나오고, 카드를 누르면 시작해요. <b>☆</b>로 자주 쓰는 연습을 고정하고, <b>돋보기</b>로 무엇이든 찾을 수 있어요.',
    art: 'tabs'
  },
  {
    h: '문제 풀 때 알아 두면 좋아요',
    p: '<b>?</b> 버튼은 읽는 법·힌트, <b>모르겠어요</b>는 정답 보기예요. 직접 쓴 답이 맞는데 틀렸다고 나오면 <b>맞은 걸로 처리</b>를 누르세요.',
    art: 'card'
  },
  {
    h: '복습은 앱이 챙겨요',
    p: '틀린 문제는 바로 다시, 맞힌 문제는 1·3·7일 뒤에 다시 나와요. 홈의 <b>오늘 공부 시작</b> 버튼이 복습까지 알아서 챙겨 줘요. 기록은 이 기기에만 저장되니 가끔 <b>백업 코드</b>를 복사해 두세요.',
    art: 'cal'
  },
  {
    h: '코스로 시작해 볼까요?',
    p: '무엇부터 할지 고민할 필요 없이, 홈의 <b>오늘 공부 시작</b>만 누르면 코스 과제와 복습이 이어서 나와요. 사용법은 언제든 위쪽의 <b>?</b> 버튼에서 다시 볼 수 있어요.',
    art: 'course',
    last: true
  }
];
const TOUR_ART = {
  mark: `<svg viewBox="0 0 120 120" class="t-mark" aria-hidden="true"><path d="M60 13c28 0 47 20 46 47-1 26-22 46-47 45C33 104 13 84 14 58 15 32 34 14 62 15M61.5 36c13.5.7 22.5 10.9 21.4 23.6-1.1 12.4-11.6 21.7-24 20.6-12-1.1-20.2-11.2-19.1-22.9 1.1-10.1 9.4-16.5 18.7-15.7 8.6.7 13.9 7.5 13.1 15.4-.7 6.4-6 10.9-12 10.1" fill="none" stroke="var(--shu)" stroke-width="5" stroke-linecap="round"/></svg>`,
  tabs: `<div class="t-tabs"><div class="t-top"><span>하나마루</span><span class="t-seg"><i>일본어</i><i>영어</i></span></div><div class="t-modes"><i class="on">단어 퀴즈 ☆</i><i>플래시카드 ☆</i><i>한국음 한자 ★</i></div><div class="t-bar">${['홈', '배우기', '회화·여행', '놀이', '자료'].map((l, i) => `<i class="${i === 1 ? 'on' : ''}">${l}</i>`).join('')}</div></div>`,
  card: `<div class="t-card"><span class="t-q">?</span><span class="jp" lang="ja">猫</span><div class="t-btns"><i>모르겠어요</i><i class="on">맞은 걸로 처리</i></div></div>`,
  cal: `<div class="t-cal">${[1, 3, 7, 14, 30].map(n => `<span><b class="num">${n}일</b>뒤</span>`).join('<i>→</i>')}</div>`,
  course: `<div class="t-course">${[
    ['1', '히라가나 첫걸음'],
    ['2', '히라가나 た·な·は행'],
    ['3', '히라가나 ま~わ행']
  ]
    .map(([n, t], i) => `<p class="${i === 0 ? 'on' : ''}"><b class="num">${n}일차</b>${t}</p>`)
    .join('')}</div>`
};
let tourI = 0;
function openTour() {
  tourI = 0;
  renderTour();
}
function renderTour() {
  const s = TOUR[tourI];
  const html = `<div class="tour-in"><button type="button" class="btn quiet t-skip" data-t="skip">${s.last ? '닫기' : '건너뛰기'}</button>
    <div class="t-art">${TOUR_ART[s.art] || ''}</div><h2>${s.h}</h2><p>${s.p}</p>
    <div class="t-dots">${TOUR.map((_, i) => `<i class="${i === tourI ? 'on' : ''}"></i>`).join('')}</div>
    <div class="row t-nav">${tourI > 0 ? `<button type="button" class="btn" data-t="prev">이전</button>` : ''}${s.last ? `<button type="button" class="btn" data-t="look">둘러볼게요</button><button type="button" class="btn primary" data-t="course">코스 시작</button>` : `<button type="button" class="btn primary" data-t="next">다음</button>`}</div>
    ${s.last ? `<button type="button" class="btn quiet" data-t="ltest">조금 알아요 · 레벨 테스트로 시작</button>` : ''}</div>`;
  const cur = document.querySelector('#sheet .sheet.tour');
  if (cur) {
    cur.innerHTML = html;
    return;
  }
  const el = openSheet(html, 'tour');
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-t]');
    if (!b) return;
    const a = b.dataset.t;
    if (a === 'next') {
      tourI = Math.min(TOUR.length - 1, tourI + 1);
      renderTour();
    } else if (a === 'prev') {
      tourI = Math.max(0, tourI - 1);
      renderTour();
    } else {
      S.seen.tour = 1;
      S.seen.v9 = 1;
      save();
      closeSheet();
      if (a === 'ltest') {
        startLevelTest();
        return;
      }
      if (a === 'course') {
        go('home');
        setTimeout(() => {
          const c = view.querySelector('.course-card');
          if (c)
            try {
              c.scrollIntoView({ block: 'center', behavior: 'smooth' });
            } catch (e) {}
        }, 60);
      }
    }
  });
}
document.getElementById('helpBtn').addEventListener('click', () => openHelp());
function homeExtraClick(b) {
  if (b.dataset.ctask) {
    const [l, di, ti] = b.dataset.ctask.split(':');
    startTask(l, +di, +ti);
    return true;
  }
  if ('gocourse' in b.dataset) {
    startMod('course');
    return true;
  }
  if ('share' in b.dataset) {
    shareCard();
    return true;
  }
  if ('help' in b.dataset) {
    openHelp();
    return true;
  }
  return false;
}
