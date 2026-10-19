'use strict';
/* ---------- 30-day course ---------- */
const ROWS = {
  あ: 'あいうえお',
  か: 'かきくけこ',
  さ: 'さしすせそ',
  た: 'たちつてと',
  な: 'なにぬねの',
  は: 'はひふへほ',
  ま: 'まみむめも',
  や: 'やゆよ',
  ら: 'らりるれろ',
  わ: 'わをん'
};
const cK = (sc, rows) => () => {
  const cv = sc === 'k' ? toKata : x => x;
  const want = new Set([...rows].flatMap(r => [...ROWS[r]]).map(cv));
  return basePool('kana', true).filter(x => x.sc === sc && want.has(x.ch));
};
const cKS = (sc, sets) => () => basePool('kana', true).filter(x => x.sc === sc && sets.includes(x.set));
const cW = (cat, a, b) => () => WORDS.filter(w => w.cats.includes(cat)).slice(a, b);
const cEW = (cat, a, b) => () => EN_WORDS.filter(w => w.cats.includes(cat)).slice(a, b);
const cSN = (mod, sc, a, b) => () => (ITEMS[mod] || []).filter(s => s.sc === sc).slice(a, b);
const cG =
  (...ids) =>
  () =>
    GRAM_ITEMS.filter(x => ids.includes(x.g.id));
const cKJ = (a, b) => () => KANJI.slice(a, b);
const cCJ =
  (...f) =>
  () =>
    CONJ_ITEMS.filter(x => f.includes(x.form));
const cCN =
  (...ids) =>
  () =>
    CNT_ITEMS.filter(x => ids.includes(x.id));
const cPL =
  (...t) =>
  () =>
    POL.filter(x => t.includes(x.t));
const cJM =
  (...l) =>
  () =>
    JMP.filter(x => l.includes(x.lb));
const cLO = (a, b) => () => LOANS.slice(a, b);
const cCF = sc => () => CONF_ITEMS.filter(x => x.sc === sc);
const cIR = (a, b) => () => IRR.slice(a, b);
const cMP = (a, b) => () => MP.slice(a, b);
const COURSE = {
  ja: [
    {
      t: '히라가나 첫걸음',
      d: 'あ·か·さ행과 첫인사',
      k: [
        { m: 'chart', l: '50음도 훑어보기' },
        { m: 'kana', l: '히라가나 あ·か·さ행', f: cK('h', 'あかさ') },
        { m: 'sent', l: '인사 문장 고르기', f: cSN('sent', 'greet', 0, 8) }
      ]
    },
    {
      t: '히라가나 た·な·は행',
      d: '15자 더 배우고 섞어서 복습',
      k: [
        { m: 'kana', l: '히라가나 た·な·は행', f: cK('h', 'たなは') },
        { m: 'kana', l: 'あ~は행 섞어서', f: cK('h', 'あかさたなは') },
        { m: 'sent', l: '인사 문장 고르기 2', f: cSN('sent', 'greet', 8, 16) }
      ]
    },
    {
      t: '히라가나 ま~わ행',
      d: '기본 글자 마지막 줄과 첫 대화',
      k: [
        { m: 'kana', l: '히라가나 ま·や·ら·わ행', f: cK('h', 'まやらわ') },
        { m: 'jdlg', dl: ['greet', 0] }
      ]
    },
    {
      t: '히라가나 46자 완성',
      d: '기본 글자 전체와 헷갈리는 글자',
      k: [
        { m: 'kana', l: '히라가나 기본 46자', f: cKS('h', ['basic']) },
        { m: 'kconf', l: '헷갈리는 히라가나', f: cCF('h') }
      ]
    },
    {
      t: '탁음·반탁음',
      d: 'が·ざ·だ·ば·ぱ와 인사 단어',
      k: [
        { m: 'kana', l: '히라가나 탁음·반탁음', f: cKS('h', ['daku']) },
        { m: 'word', l: '인사·표현 단어', f: cW('greet', 0, 15) }
      ]
    },
    {
      t: '요음과 소리 길이',
      d: 'きゃ·しゅ·ちょ, 장음·촉음 듣기',
      k: [
        { m: 'kana', l: '히라가나 요음', f: cKS('h', ['yoon']) },
        { m: 'jlen', l: '장음·촉음 구별', f: cJM('장음', '촉음') },
        { m: 'sent', l: '인사 문장 고르기 3', f: cSN('sent', 'greet', 16, 30) }
      ]
    },
    {
      t: '가타카나 ア~ナ',
      d: '가타카나 앞 25자와 외래어',
      k: [
        { m: 'kana', l: '가타카나 ア·カ·サ·タ·ナ행', f: cK('k', 'あかさたな') },
        { m: 'loan', l: '외래어 읽기 1', f: cLO(0, 12) }
      ]
    },
    {
      t: '가타카나 ハ~ン',
      d: '가타카나 나머지와 외래어',
      k: [
        { m: 'kana', l: '가타카나 ハ·マ·ヤ·ラ·ワ행', f: cK('k', 'はまやらわ') },
        { m: 'loan', l: '외래어 읽기 2', f: cLO(12, 24) }
      ]
    },
    {
      t: '가타카나 완성',
      d: '기본 46자와 シ/ツ·ソ/ン',
      k: [
        { m: 'kana', l: '가타카나 기본 46자', f: cKS('k', ['basic']) },
        { m: 'kconf', l: '헷갈리는 가타카나', f: cCF('k') }
      ]
    },
    {
      t: '가타카나 탁음·요음',
      d: 'ガ·ジャ와 숫자 단어',
      k: [
        { m: 'kana', l: '가타카나 탁음·요음', f: cKS('k', ['daku', 'yoon']) },
        { m: 'word', l: '숫자·세기 단어', f: cW('num', 0, 15) }
      ]
    },
    {
      t: '숫자와 세는 말',
      d: '가격 듣기, ひとつ·ひとり',
      k: [
        { m: 'jn', l: '숫자·가격 듣기' },
        { m: 'cnt', l: '조수사: つ · 人', f: cCN('つ', '人') }
      ]
    },
    {
      t: '첫 문법 です',
      d: '〜は〜です, 〜の와 사람 단어',
      k: [
        { m: 'gram', l: '문법: です · の', f: cG('desu', 'no') },
        { m: 'word', l: '사람·가족 단어', f: cW('people', 0, 15) }
      ]
    },
    {
      t: '동사 ます형',
      d: '정중하게 말하는 기본형',
      k: [
        { m: 'gram', l: '문법: 〜ます', f: cG('masu') },
        { m: 'conj', l: '동사 ます형 만들기', f: cCJ('masu') },
        { m: 'word', l: '동사 단어', f: cW('verb', 0, 15) }
      ]
    },
    {
      t: '일상 대화',
      d: '날씨와 하루 이야기',
      k: [
        { m: 'sent', l: '일상 문장 고르기', f: cSN('sent', 'daily', 0, 10) },
        { m: 'jdlg', dl: ['daily', 0] }
      ]
    },
    {
      t: '조사 익히기',
      d: 'は·が·を·に·で를 문장 속에서',
      k: [
        { m: 'part', l: '조사 빈칸: 일상', f: cSN('part', 'daily', 0, 15) },
        { m: 'jb', l: '문장 조립: 일상', f: cSN('jb', 'daily', 0, 10) }
      ]
    },
    {
      t: '식당에서',
      d: '주문하고 계산하기',
      k: [
        { m: 'word', l: '식당 단어', f: cW('s_food', 0, 15) },
        { m: 'sent', l: '식당 문장 고르기', f: cSN('sent', 'food', 0, 10) },
        { m: 'jdlg', dl: ['food', 0] }
      ]
    },
    {
      t: '날짜와 요일',
      d: 'ついたち·ふつか, 월·요일',
      k: [
        { m: 'cnt', l: '날짜·월·요일 읽기', f: cCN('日', '月', '曜') },
        { m: 'word', l: '시간·날짜 단어', f: cW('time', 0, 15) }
      ]
    },
    {
      t: '쇼핑',
      d: '몇 개·몇 장 세며 사기',
      k: [
        { m: 'cnt', l: '조수사: 個 · 枚 · 本', f: cCN('個', '枚', '本') },
        { m: 'sent', l: '쇼핑 문장 고르기', f: cSN('sent', 'shop', 0, 10) },
        { m: 'jdlg', dl: ['shop', 0] }
      ]
    },
    {
      t: '한자 첫걸음',
      d: '숫자·요일 한자, あります·います',
      k: [
        { m: 'kanji', l: '기초 한자 1~20', f: cKJ(0, 20) },
        { m: 'gram', l: '문법: あります · います', f: cG('arimasu_imasu') }
      ]
    },
    {
      t: '길 찾기',
      d: '역·버스·택시',
      k: [
        { m: 'word', l: '길·교통 단어', f: cW('s_move', 0, 15) },
        { m: 'jl', l: '문장 듣기: 길·교통', f: cSN('jl', 'move', 0, 8) },
        { m: 'jdlg', dl: ['move', 0] }
      ]
    },
    {
      t: 'て형',
      d: '〜てください, 〜ています',
      k: [
        { m: 'conj', l: '동사 て형 만들기', f: cCJ('te') },
        { m: 'gram', l: '문법: 〜てください · 〜ています', f: cG('tekudasai', 'teimasu') }
      ]
    },
    {
      t: '반말 시작',
      d: '친구에게 말하는 법',
      k: [
        { m: 'pol', l: '반말↔존댓말: 동사 현재·부정', f: cPL('verb-present', 'verb-negative') },
        { m: 'jdlg', dl: ['social', 0] }
      ]
    },
    {
      t: '과거형',
      d: '했어요 / 안 했어요',
      k: [
        { m: 'conj', l: '동사 た형·ない형', f: cCJ('ta', 'nai') },
        { m: 'gram', l: '문법: い형용사 과거', f: cG('i_adj_past') },
        { m: 'pol', l: '반말↔존댓말: 과거', f: cPL('verb-past', 'verb-past-negative') }
      ]
    },
    {
      t: '공항·호텔',
      d: '체크인부터 방 문제까지',
      k: [
        { m: 'word', l: '호텔 단어', f: cW('s_hotel', 0, 15) },
        { m: 'sent', l: '공항·호텔 문장', f: cSN('sent', 'stay', 0, 10) },
        { m: 'jdlg', dl: ['stay', 0] }
      ]
    },
    {
      t: '하고 싶어요',
      d: '〜たい, 〜ましょう, 〜ませんか',
      k: [
        { m: 'gram', l: '문법: たい · ましょう · ませんか', f: cG('tai', 'mashou', 'masenka') },
        { m: 'pol', l: '반말↔존댓말: 희망·권유', f: cPL('tai', 'invite', 'request') }
      ]
    },
    {
      t: '한자 두 번째',
      d: '시간·방향 한자와 받아쓰기',
      k: [
        { m: 'kanji', l: '기초 한자 21~45', f: cKJ(20, 45) },
        { m: 'jd', l: '받아쓰기: 인사', f: cSN('jd', 'greet', 0, 6) }
      ]
    },
    {
      t: '전화·예약',
      d: '식당 예약과 따라 말하기',
      k: [
        { m: 'sent', l: '전화 문장 고르기', f: cSN('sent', 'phone', 0, 10) },
        { m: 'jdlg', dl: ['phone', 0] },
        { m: 'jsh', l: '따라 말하기: 전화', f: cSN('jsh', 'phone', 0, 5) }
      ]
    },
    {
      t: '병원·약국',
      d: '아픈 곳 말하기',
      k: [
        { m: 'word', l: '몸·건강 단어', f: cW('body', 0, 15) },
        { m: 'sent', l: '병원 문장 고르기', f: cSN('sent', 'health', 0, 10) },
        { m: 'jdlg', dl: ['health', 1] }
      ]
    },
    {
      t: '곤란할 때',
      d: '분실·길 잃음, 탁음 듣기',
      k: [
        { m: 'jdlg', dl: ['help', 0] },
        { m: 'sent', l: '곤란할 때 문장', f: cSN('sent', 'help', 0, 10) },
        { m: 'jlen', l: '탁음·요음·ん 구별', f: cJM('탁음', '요음', '발음 ん') }
      ]
    },
    {
      t: '마무리 도전',
      d: '이유·생각 말하기와 60초 도전',
      k: [
        { m: 'gram', l: '문법: から · けど · と思います', f: cG('kara', 'kedo', 'toomoimasu') },
        { m: 'jdlg', dl: ['food', 5] },
        { m: 'wspeed', l: '60초 단어 도전' }
      ]
    }
  ],
  en: [
    {
      t: '첫인사',
      d: '인사 표현과 문장',
      k: [
        { m: 'ew', l: '회화 표현 단어', f: cEW('talk', 0, 15) },
        { m: 'es', l: '인사 문장 고르기', f: cSN('es', 'greet', 0, 8) }
      ]
    },
    {
      t: '인사 대화',
      d: '처음 만나 인사하기',
      k: [
        { m: 'edlg', dl: ['greet', 0] },
        { m: 'eb', l: '문장 조립: 인사', f: cSN('eb', 'greet', 0, 8) }
      ]
    },
    {
      t: '기초 동사',
      d: '자주 쓰는 동사와 발음',
      k: [
        { m: 'ew', l: '기초 동사 1', f: cEW('verb', 0, 15) },
        { m: 'mp', l: '발음 구별 1', f: cMP(0, 12) }
      ]
    },
    {
      t: '일상 대화',
      d: '날씨와 하루 이야기',
      k: [
        { m: 'es', l: '일상 문장 고르기', f: cSN('es', 'daily', 0, 10) },
        { m: 'edlg', dl: ['daily', 0] }
      ]
    },
    {
      t: '생활 명사',
      d: '단어와 듣기',
      k: [
        { m: 'ew', l: '생활 명사 1', f: cEW('noun', 0, 15) },
        { m: 'el', l: '문장 듣기: 일상', f: cSN('el', 'daily', 0, 8) }
      ]
    },
    {
      t: '숫자와 시간',
      d: '가격·시간 듣기',
      k: [
        { m: 'enn', l: '숫자·가격 듣기' },
        { m: 'ew', l: '시간·빈도 단어', f: cEW('time', 0, 15) }
      ]
    },
    {
      t: '불규칙 동사 1',
      d: 'go - went - gone',
      k: [
        { m: 'irr', l: '불규칙 동사 1~15', f: cIR(0, 15) },
        { m: 'es', l: '친구 문장 고르기', f: cSN('es', 'social', 0, 8) }
      ]
    },
    {
      t: '친구·취미',
      d: '취미 이야기',
      k: [
        { m: 'edlg', dl: ['social', 0] },
        { m: 'eb', l: '문장 조립: 친구', f: cSN('eb', 'social', 0, 8) }
      ]
    },
    {
      t: '형용사',
      d: '형용사와 발음',
      k: [
        { m: 'ew', l: '형용사 1', f: cEW('adj', 0, 15) },
        { m: 'mp', l: '발음 구별 2', f: cMP(12, 26) }
      ]
    },
    {
      t: '식당에서',
      d: '주문하기',
      k: [
        { m: 'ew', l: '식당 단어', f: cEW('s_food', 0, 15) },
        { m: 'es', l: '식당 문장 고르기', f: cSN('es', 'food', 0, 8) },
        { m: 'edlg', dl: ['food', 0] }
      ]
    },
    {
      t: '불규칙 동사 2',
      d: '받아쓰기 시작',
      k: [
        { m: 'irr', l: '불규칙 동사 16~30', f: cIR(15, 30) },
        { m: 'ed', l: '받아쓰기: 일상', f: cSN('ed', 'daily', 0, 6) }
      ]
    },
    {
      t: '쇼핑',
      d: '사이즈·가격 묻기',
      k: [
        { m: 'ew', l: '쇼핑 단어', f: cEW('s_shop', 0, 15) },
        { m: 'es', l: '쇼핑 문장 고르기', f: cSN('es', 'shop', 0, 8) },
        { m: 'edlg', dl: ['shop', 0] }
      ]
    },
    {
      t: '동사구',
      d: 'pick up, look for',
      k: [
        { m: 'ew', l: '동사구 1', f: cEW('phr', 0, 15) },
        { m: 'eb', l: '문장 조립: 쇼핑', f: cSN('eb', 'shop', 0, 8) }
      ]
    },
    {
      t: '관광',
      d: '표 사고 사진 부탁하기',
      k: [
        { m: 'es', l: '관광 문장 고르기', f: cSN('es', 'sight', 0, 10) },
        { m: 'edlg', dl: ['sight', 0] }
      ]
    },
    {
      t: '따라 말하기',
      d: '소리 내어 말하기',
      k: [
        { m: 'esh', l: '따라 말하기: 인사', f: cSN('esh', 'greet', 0, 5) },
        { m: 'mp', l: '발음 구별 3', f: cMP(26, 40) }
      ]
    },
    {
      t: '길·교통',
      d: '길 묻기',
      k: [
        { m: 'ew', l: '길·교통 단어', f: cEW('s_move', 0, 15) },
        { m: 'el', l: '문장 듣기: 길·교통', f: cSN('el', 'move', 0, 8) },
        { m: 'edlg', dl: ['move', 0] }
      ]
    },
    {
      t: '불규칙 동사 3',
      d: '동사 더 늘리기',
      k: [
        { m: 'irr', l: '불규칙 동사 31~45', f: cIR(30, 45) },
        { m: 'ew', l: '기초 동사 2', f: cEW('verb', 15, 30) }
      ]
    },
    {
      t: '공항·호텔',
      d: '체크인하기',
      k: [
        { m: 'ew', l: '공항 단어', f: cEW('s_air', 0, 15) },
        { m: 'es', l: '공항·호텔 문장', f: cSN('es', 'stay', 0, 10) },
        { m: 'edlg', dl: ['stay', 0] }
      ]
    },
    {
      t: '전화',
      d: '예약 전화',
      k: [
        { m: 'edlg', dl: ['phone', 0] },
        { m: 'es', l: '전화 문장 고르기', f: cSN('es', 'phone', 0, 8) },
        { m: 'ed', l: '받아쓰기: 전화', f: cSN('ed', 'phone', 0, 6) }
      ]
    },
    {
      t: '병원',
      d: '증상 말하기',
      k: [
        { m: 'es', l: '병원 문장 고르기', f: cSN('es', 'health', 0, 10) },
        { m: 'edlg', dl: ['health', 1] }
      ]
    },
    {
      t: '곤란할 때',
      d: '분실 신고',
      k: [
        { m: 'es', l: '곤란할 때 문장', f: cSN('es', 'help', 0, 10) },
        { m: 'edlg', dl: ['help', 0] }
      ]
    },
    {
      t: '회화 표현',
      d: '자주 쓰는 말',
      k: [
        { m: 'ew', l: '회화 표현 2', f: cEW('talk', 15, 35) },
        { m: 'eb', l: '문장 조립: 일상', f: cSN('eb', 'daily', 0, 8) }
      ]
    },
    {
      t: '불규칙 동사 4',
      d: '발음까지 같이',
      k: [
        { m: 'irr', l: '불규칙 동사 46~60', f: cIR(45, 60) },
        { m: 'mp', l: '발음 구별 4', f: cMP(40, 55) }
      ]
    },
    {
      t: '약속 잡기',
      d: '친구와 계획 세우기',
      k: [
        { m: 'edlg', dl: ['social', 1] },
        { m: 'esh', l: '따라 말하기: 친구', f: cSN('esh', 'social', 0, 5) }
      ]
    },
    {
      t: '식당 2',
      d: '제대로 주문하기',
      k: [
        { m: 'edlg', dl: ['food', 1] },
        { m: 'eb', l: '문장 조립: 식당', f: cSN('eb', 'food', 0, 8) },
        { m: 'el', l: '문장 듣기: 식당', f: cSN('el', 'food', 0, 8) }
      ]
    },
    {
      t: '쇼핑 2',
      d: '반품하기',
      k: [
        { m: 'edlg', dl: ['shop', 1] },
        { m: 'ed', l: '받아쓰기: 쇼핑', f: cSN('ed', 'shop', 0, 6) }
      ]
    },
    {
      t: '불규칙 동사 5',
      d: '형용사 더하기',
      k: [
        { m: 'irr', l: '불규칙 동사 61~80', f: cIR(60, 80) },
        { m: 'ew', l: '형용사 2', f: cEW('adj', 15, 30) }
      ]
    },
    {
      t: '여행 2',
      d: '입국 심사와 지하철',
      k: [
        { m: 'edlg', dl: ['stay', 1] },
        { m: 'edlg', dl: ['move', 1] }
      ]
    },
    {
      t: '전화·병원 2',
      d: '예약 변경과 진료 예약',
      k: [
        { m: 'edlg', dl: ['phone', 1] },
        { m: 'edlg', dl: ['phone', 2] }
      ]
    },
    {
      t: '마무리 도전',
      d: '마지막 동사와 60초 도전',
      k: [
        { m: 'irr', l: '불규칙 동사 81~101', f: cIR(80, 101) },
        { m: 'edlg', dl: ['help', 3] },
        { m: 'espeed', l: '60초 영단어 도전' }
      ]
    }
  ]
};

/* ---------- second stage: N4 (Japanese) / 실전 (English), days 31–60 ---------- */
const COURSE_STAGES = {
  ja: [
    [0, '기초 30일'],
    [30, 'N4 30일']
  ],
  en: [
    [0, '기초 30일'],
    [30, '실전 30일']
  ]
};
const stageOf = (lang, di) => {
  let n = COURSE_STAGES[lang][0][1];
  for (const [from, name] of COURSE_STAGES[lang]) if (di >= from) n = name;
  return n;
};
const cGL =
  (...ids) =>
  () =>
    GRAM_ITEMS.filter(x => ids.includes(x.g.id));
const cWN4 = (a, b) => () => N4_WORDS_ORDER.slice(a, b);
const cKJ4 = (a, b) => () => KANJI.filter(k => k.lvl === 4).slice(a, b);
const cPLt =
  (...t) =>
  () =>
    POL.filter(x => t.includes(x.t));
const cEGt = (mod, a, b) => () => EG[mod].items.slice(a, b);
const N4_CAT_ORDER = [
  'verb',
  'adj',
  'adv',
  'school',
  'time',
  'place',
  'thing',
  'people',
  'body',
  'food',
  'nature',
  'greet',
  'num',
  'ask',
  's_move',
  's_hotel',
  's_air',
  's_food',
  's_shop'
];
const N4_WORDS_ORDER = BASE_JP.filter(w => w.lvl === 4).sort((a, b) => N4_CAT_ORDER.indexOf(a.cats[0]) - N4_CAT_ORDER.indexOf(b.cats[0]));
(function buildN4Days() {
  const G4 = GRAM.filter(g => g.lvl === 4);
  if (!G4.length) return;
  const third = [
    { m: 'conj', l: '동사 가능형 만들기', f: cCJ('pot') },
    { m: 'kanji', l: 'N4 한자 1~10', f: cKJ4(0, 10) },
    { m: 'jdlg', dl: ['greet', 1] },
    { m: 'conj', l: '동사 의지형 만들기', f: cCJ('vol') },
    { m: 'kanji', l: 'N4 한자 11~20', f: cKJ4(10, 20) },
    { m: 'jdlg', dl: ['daily', 1] },
    { m: 'pol', l: '반말↔존댓말: 의문문', f: cPLt('question') },
    { m: 'kanji', l: 'N4 한자 21~30', f: cKJ4(20, 30) },
    { m: 'jdlg', dl: ['social', 1] },
    { m: 'pol', l: '반말↔존댓말: 형용사·명사', f: cPLt('i-adj', 'na-adj-noun') },
    { m: 'kanji', l: 'N4 한자 31~40', f: cKJ4(30, 40) },
    { m: 'jdlg', dl: ['food', 1] },
    { m: 'jd', l: '받아쓰기: 일상', f: cSN('jd', 'daily', 0, 6) },
    { m: 'kanji', l: 'N4 한자 41~50', f: cKJ4(40, 50) },
    { m: 'jdlg', dl: ['shop', 1] },
    { m: 'pol', l: '반말↔존댓말: ている·ある/いる', f: cPLt('te-iru', 'aru-iru') },
    { m: 'kanji', l: 'N4 한자 51~60', f: cKJ4(50, 60) },
    { m: 'jdlg', dl: ['sight', 1] },
    { m: 'jsh', l: '따라 말하기: 쇼핑', f: cSN('jsh', 'shop', 0, 5) },
    { m: 'kanji', l: 'N4 한자 61~70', f: cKJ4(60, 70) },
    { m: 'jdlg', dl: ['move', 1] },
    { m: 'pol', l: '반말↔존댓말: 특수 표현', f: cPLt('special') },
    { m: 'kanji', l: 'N4 한자 71~80', f: cKJ4(70, 80) },
    { m: 'jdlg', dl: ['stay', 1] },
    { m: 'jl', l: '문장 듣기: 곤란할 때', f: cSN('jl', 'help', 0, 8) },
    { m: 'jdlg', dl: ['phone', 1] },
    { m: 'jdlg', dl: ['health', 2] },
    { m: 'jdlg', dl: ['help', 1] },
    { m: 'cnt', l: '조수사·날짜 총복습' },
    { m: 'wspeed', l: '60초 단어 도전' }
  ];
  const per = Math.ceil(N4_WORDS_ORDER.length / 28);
  for (let i = 0; i < 30; i++) {
    const gs = i < 15 ? [G4[2 * i], G4[2 * i + 1]].filter(Boolean) : i === 15 && G4[30] ? [G4[30]] : [];
    const k = [];
    if (gs.length)
      k.push({ m: 'gram', l: '문법: ' + gs.map(g => g.p.replace(/\s*\(.*?\)/g, '')).join(' · '), f: cGL(...gs.map(g => g.id)) });
    else k.push({ m: 'gram', l: 'N4 문법 복습', f: () => GRAM_ITEMS.filter(x => x.g.lvl === 4) });
    if (i < 28)
      k.push({ m: 'word', l: `N4 단어 ${i * per + 1}~${Math.min(N4_WORDS_ORDER.length, (i + 1) * per)}`, f: cWN4(i * per, (i + 1) * per) });
    k.push(third[i]);
    const title = gs.length ? gs[0].name.replace(/\s*\(.*?\)/g, '') : i < 29 ? 'N4 실력 다지기' : 'N4 마무리';
    COURSE.ja.push({ t: title, d: gs.length ? gs.map(g => g.p.replace(/\s*\(.*?\)/g, '')).join(' · ') : '배운 것 섞어서 복습', k });
  }
})();
(function buildEnPart2() {
  if (!EG.eprep.items.length) return;
  const dlgs = [
    ['greet', 1],
    ['daily', 1],
    ['social', 2],
    ['food', 2],
    ['shop', 2],
    ['sight', 1],
    ['move', 2],
    ['stay', 2],
    ['phone', 3],
    ['health', 0],
    ['help', 1],
    ['greet', 2],
    ['daily', 2],
    ['social', 3],
    ['food', 3],
    ['shop', 3],
    ['sight', 2],
    ['move', 3],
    ['stay', 3],
    ['health', 2],
    ['help', 2],
    ['greet', 3],
    ['daily', 3],
    ['food', 4],
    ['sight', 3],
    ['stay', 4],
    ['health', 3],
    ['food', 5],
    ['stay', 5],
    ['help', 1]
  ];
  const kinds = [
    ['eprep', '전치사'],
    ['etense', '시제'],
    ['ephr', '구동사']
  ];
  const third = i =>
    [
      { m: 'eb', l: '문장 조립: ' + SCENES[dlgs[i][0]], f: cSN('eb', dlgs[i][0], 8, 16) },
      { m: 'ed', l: '받아쓰기: ' + SCENES[dlgs[i][0]], f: cSN('ed', dlgs[i][0], 6, 12) },
      { m: 'esh', l: '따라 말하기: ' + SCENES[dlgs[i][0]], f: cSN('esh', dlgs[i][0], 5, 10) },
      { m: 'el', l: '문장 듣기: ' + SCENES[dlgs[i][0]], f: cSN('el', dlgs[i][0], 8, 16) },
      { m: 'mp', l: '발음 구별', f: cMP(55, 76) },
      { m: 'ew', l: '동사구 단어', f: cEW('phr', 15, 45) }
    ][i % 6];
  for (let i = 0; i < 30; i++) {
    const [mod, name] = kinds[i % 3];
    const items = EG[mod].items;
    const per = Math.ceil(items.length / 10);
    const c = Math.floor(i / 3);
    const sl = items.slice(c * per, (c + 1) * per);
    const topics = [...new Set(sl.map(x => x.t))].join('·');
    COURSE.en.push({
      t: `${name}: ${topics}`,
      d: `${SCENES[dlgs[i][0]]} 대화와 함께`,
      k: [
        { m: mod, l: `${name} ${c * per + 1}~${Math.min(items.length, (c + 1) * per)}`, f: cEGt(mod, c * per, (c + 1) * per) },
        { m: 'edlg', dl: dlgs[i] },
        third(i)
      ]
    });
  }
})();

const taskDlg = t => {
  const l = DLG[t.m].filter(d => d.sc === t.dl[0]);
  return l[t.dl[1]] || l[0] || DLG[t.m][0];
};
const taskLabel = t => (t.dl ? '대화: ' + taskDlg(t).title : t.l);
const taskOK = t => hasTTS || !NEEDS_TTS.has(t.m);
let CRUN = null,
  SPEED_C = null;
if (!S.course || typeof S.course !== 'object') S.course = { ja: {}, en: {} };
for (const l of ['ja', 'en']) if (!S.course[l] || typeof S.course[l] !== 'object') S.course[l] = {};
if (!S.courseFin) S.courseFin = {};
const cDone = (lang, di, ti) => !!(S.course[lang][di] && S.course[lang][di][ti]);
const dayTasks = (lang, di) => COURSE[lang][di].k.map((t, ti) => ({ t, ti })).filter(x => taskOK(x.t));
const dayDone = (lang, di) => dayTasks(lang, di).every(x => cDone(lang, di, x.ti));
const daysDone = lang => COURSE[lang].filter((_, di) => dayDone(lang, di)).length;
function curDay(lang) {
  const i = COURSE[lang].findIndex((_, di) => !dayDone(lang, di));
  return i < 0 ? COURSE[lang].length : i;
}
function courseMark(c) {
  const { lang, di, ti } = c;
  const a = S.course[lang][di] || (S.course[lang][di] = []);
  if (a[ti]) return;
  a[ti] = 1;
  gainXP(20, lang);
  missionEvent('course');
  if (dayDone(lang, di)) {
    S.courseFin[lang + di] = today();
    gainXP(50, lang);
    grantTicket(lang, `${di + 1}일차 완료`);
    save();
    checkBadges();
    setTimeout(
      () =>
        toast(
          di === COURSE[lang].length - 1
            ? '코스를 모두 끝냈어요! 하나마루'
            : di === 29
              ? `${stageOf(lang, 0)} 완주! 이제 ${stageOf(lang, 30)}가 열려요`
              : `${di + 1}일차 완료! 하나마루`
        ),
      400
    );
  } else {
    save();
    setTimeout(() => toast('코스 과제를 끝냈어요'), 400);
  }
}
function startTask(lang, di, ti) {
  const t = COURSE[lang][di].k[ti];
  const c = { lang, di, ti, mod: t.m };
  if (S.lang !== lang) {
    S.lang = lang;
    save();
    renderTabs();
  }
  stopAll();
  if (VIEWS.has(t.m)) {
    courseMark(c);
    startMod(t.m);
    return;
  }
  if (SPEED.has(t.m)) {
    SPEED_C = c;
    startMod(t.m);
    return;
  }
  if (DLGM.has(t.m)) {
    DG = null;
    startMod(t.m);
    startDlg(t.m, taskDlg(t), c);
    return;
  }
  let items = t.f ? t.f() : null;
  if (items && !items.length) items = basePool(t.m, true);
  if (items) PENDING[t.m] = pickN(items, Math.min(items.length, 20));
  CRUN = c;
  R[t.m] = null;
  S.filt[t.m] = 'all';
  save();
  startMod(t.m);
}
function taskRow(lang, di, { t, ti }) {
  const d = cDone(lang, di, ti);
  return `<li data-done="${d}"><button type="button" class="ctask" data-ctask="${lang}:${di}:${ti}"><span class="ck" aria-hidden="true">${d ? '<svg viewBox="0 0 20 20"><path d="M4 10.5 8 14l8-8.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}</span><span class="tl">${esc(taskLabel(t))}<small>${esc(MODE_LABEL[t.m] || '')}</small></span><span class="go">${d ? '다시' : '시작'}</span></button></li>`;
}
function courseHomeHTML() {
  const lang = S.lang;
  const n = COURSE[lang].length;
  const cd = curDay(lang);
  const fin = daysDone(lang);
  const head = `<div class="cc-prog"><div class="meter"><i style="width:${(fin / n) * 100}%"></i></div><span class="num">${fin} / ${n}일</span></div>`;
  if (cd >= n)
    return `<section><h2 class="sec-title">30일 코스</h2><div class="course-card">${head}<p style="margin:0;font-weight:700">30일 코스를 모두 끝냈어요. 하나마루!</p><p class="note">이제 홈의 '오늘의 복습'으로 잊기 전에 다시 보면 돼요.</p><div class="row"><button class="btn" data-share>결과 카드 만들기</button><button class="btn quiet" data-gocourse>코스 다시 보기</button></div></div></section>`;
  const day = COURSE[lang][cd];
  const justFin = cd > 0 && S.courseFin[lang + (cd - 1)] === today();
  return `<section><h2 class="sec-title">30일 코스</h2><div class="course-card">${head}
    ${justFin ? `<div class="cc-done"><b>오늘 ${cd}일차를 끝냈어요!</b><span>내일 이어서 하거나, 지금 바로 ${cd + 1}일차를 시작해도 돼요.</span><button class="btn" data-share style="min-height:38px;padding:6px 12px">결과 카드</button></div>` : ''}
    <div class="cc-head"><span class="cc-day num">${cd + 1}일차</span><div><b>${esc(day.t)}</b><small>${esc(day.d)}</small></div></div>
    <ul class="cc-tasks">${dayTasks(lang, cd)
      .map(x => taskRow(lang, cd, x))
      .join('')}</ul>
    <button class="btn quiet" data-gocourse style="justify-self:start;padding-left:2px">코스 전체 보기 →</button></div></section>`;
}
let courseOpen = null;
function renderCourse() {
  const vb = document.getElementById('vbody');
  const lang = S.lang;
  const cd = curDay(lang);
  if (courseOpen === null || courseOpen >= COURSE[lang].length) courseOpen = Math.min(cd, COURSE[lang].length - 1);
  vb.innerHTML = `<div class="chart"><div class="lt-cta"><div><b>어디부터 시작할지 모르겠다면</b><span class="note">20문제 레벨 테스트로 시작할 날을 추천받아요.</span></div><button class="btn" data-ltest>레벨 테스트</button></div><p class="note">하루 2~3개 과제로 ${lang === 'ja' ? '글자부터 대화, N4까지' : '단어부터 대화, 문법까지'} 순서대로 익혀요. 과제를 끝까지 풀면 체크돼요. 날짜에 매이지 않고 내 속도로 해도 괜찮아요. (${daysDone(lang)} / ${COURSE[lang].length}일 완료)</p>
    <div class="cdays">${COURSE[lang]
      .map((d, di) => {
        const stage = COURSE_STAGES[lang].find(x => x[0] === di);
        const done = dayDone(lang, di);
        const tasks = dayTasks(lang, di);
        const nd = tasks.filter(x => cDone(lang, di, x.ti)).length;
        const open = di === courseOpen;
        return `${stage ? `<h2 class="sec-title cstage">${stage[1]}</h2>` : ''}<div class="cday" data-st="${done ? 'done' : di === cd ? 'cur' : ''}"><button type="button" class="cday-h" data-cday="${di}" aria-expanded="${open}"><span class="num cd-n">${di + 1}</span><span class="cd-t"><b>${esc(d.t)}</b><small>${esc(d.d)}</small></span><span class="num cd-p">${done ? '완료' : nd + ' / ' + tasks.length}</span></button>
        ${open ? `<ul class="cc-tasks">${tasks.map(x => taskRow(lang, di, x)).join('')}</ul>` : ''}</div>`;
      })
      .join('')}</div></div>`;
  vb.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.cday !== undefined) {
      const i = +b.dataset.cday;
      courseOpen = courseOpen === i ? -1 : i;
      renderCourse();
    } else if (b.dataset.ctask) {
      const [l, di, ti] = b.dataset.ctask.split(':');
      startTask(l, +di, +ti);
    } else if ('ltest' in b.dataset) startLevelTest(lang);
  };
}
BADGES.push(
  {
    id: 'course7',
    name: '코스 일주일',
    desc: '코스 7일차까지 끝내기',
    p: () => [Math.min(Math.max(daysDone('ja'), daysDone('en')), 7), 7]
  },
  {
    id: 'course30',
    name: '기초 코스 완주',
    desc: '기초 30일 코스 끝내기',
    p: () => [Math.min(30, Math.max(daysDone('ja'), daysDone('en'))), 30]
  },
  {
    id: 'course60',
    name: '코스 마스터',
    desc: '60일 코스(기초 + N4·실전) 모두 끝내기',
    p: () => [Math.min(60, Math.max(daysDone('ja'), daysDone('en'))), 60]
  }
);
