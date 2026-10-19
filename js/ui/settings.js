'use strict';
/* ================= settings screen (header gear button): study options, look, backup, reset ================= */

let confirmReset = false;
let bk = { mode: null, msg: '', code: '', input: '' };

function settingsHTML() {
  const segRow = (label, small, key, opts) =>
    `<div class="set-row"><div><b>${label}</b>${small ? `<small>${small}</small>` : ''}</div><div class="seg" role="group" aria-label="${label}">${opts.map(([v, l]) => `<button data-setk="${key}" data-v="${v}" aria-pressed="${String(S.set[key]) === String(v)}">${l}</button>`).join('')}</div></div>`;
  const sw = (key, label, small) =>
    `<div class="set-row"><div><b>${label}</b>${small ? `<small>${small}</small>` : ''}</div><button class="switch" role="switch" data-sw="${key}" aria-checked="${S.set[key]}" aria-label="${label}"></button></div>`;
  return `<div class="sheet-h"><b>설정</b><button type="button" class="icon-btn" data-close aria-label="닫기">${XICON}</button></div>
  <div class="h-scroll">
    <section><h2 class="sec-title">공부</h2><div class="panel">
      ${segRow('하루 목표', '푼 문제 수 기준', 'goal', [
        [0, '끄기'],
        [10, '10'],
        [20, '20'],
        [30, '30'],
        [50, '50']
      ])}
      ${segRow('한 라운드 문제 수', '', 'round', [
        [10, '10'],
        [20, '20'],
        [30, '30']
      ])}
      ${sw('autoNext', '맞히면 자동으로 다음 문제', '문자·단어 연습에 적용')}
      ${hasTTS ? sw('autoSpeak', '답 확인 후 자동 발음', '아이폰 무음 모드에서는 소리가 나지 않아요') + sw('slow', '천천히 발음', '') : ''}
      ${sw('sfx', '효과음', '정답·콤보·레벨 업 소리')}
    </div></section>
    <section><h2 class="sec-title">화면</h2><div class="panel">
      ${segRow('테마', '', 'theme', [
        ['auto', '자동'],
        ['light', '밝게'],
        ['dark', '어둡게']
      ])}
      ${segRow('글자 크기', '', 'zoom', [
        [1, '보통'],
        [1.1, '크게'],
        [1.2, '아주 크게']
      ])}
    </div></section>
    <section><h2 class="sec-title">레벨 테스트</h2><div class="panel" style="padding:14px;display:grid;gap:10px">
      <p class="note">20문제로 실력을 확인하고 코스를 어디서부터 할지 추천받아요.${S.ltest && S.ltest[S.lang] ? ` 지난 결과: ${S.ltest[S.lang].c}/${S.ltest[S.lang].n} · ${S.ltest[S.lang].day}일차 추천` : ''}</p>
      <button class="btn" data-set-ltest>${S.lang === 'ja' ? '일본어' : '영어'} 레벨 테스트 하기</button></div></section>
    <section id="set-backup"><h2 class="sec-title">기록 백업</h2><div class="panel backup" style="padding:14px;display:grid;gap:10px">
      <p class="note">학습 기록은 이 기기에만 저장돼요. 휴대폰을 바꾸거나 Safari 데이터를 지우기 전에 백업 코드를 복사해서 메모 앱이나 '카톡 나에게 보내기'에 보관하세요. 레벨·카드·코스 기록도 함께 저장돼요.</p>
      <div class="row"><button class="btn" data-bk="copy">백업 코드 복사</button><button class="btn" data-bk="open">코드로 복원</button></div>
      ${bk.mode === 'show' ? `<textarea id="bkOut" readonly aria-label="백업 코드">${esc(bk.code)}</textarea>` : ''}
      ${bk.mode === 'import' ? `<textarea id="bkIn" placeholder="HM2. 으로 시작하는 백업 코드를 붙여 넣으세요" aria-label="백업 코드 입력">${esc(bk.input)}</textarea><button class="btn primary" data-bk="restore">복원하기</button><p class="note">지금 기록과 합쳐져요. 같은 문제는 더 많이 푼 쪽 기록을 남겨요.</p>` : ''}
      ${bk.msg ? `<p class="note" style="color:var(--ink)">${esc(bk.msg)}</p>` : ''}
    </div></section>
    ${
      isStandalone()
        ? ''
        : `<section id="set-install"><h2 class="sec-title">아이폰 홈 화면에 추가</h2><div class="panel" style="padding:14px">
      <ol class="steps"><li>Safari에서 이 앱 주소를 엽니다.</li><li>아래쪽 공유 버튼(네모에 위쪽 화살표)을 누릅니다.</li><li>'홈 화면에 추가'를 누르면 앱 아이콘이 생깁니다.</li></ol></div></section>`
    }
    <div id="set-donate">${donateHTML()}</div>
    <section><h2 class="sec-title">도움말</h2><div class="row"><button class="btn" data-set-remind>매일 알림 만들기</button><button class="btn" data-set-help>사용 안내</button><button class="btn" data-set-tour>튜토리얼 다시 보기</button></div></section>
    <section class="danger">${confirmReset ? `<span class="note">학습 기록을 모두 지울까요?</span><button class="btn" data-reset="yes" style="color:var(--ng)">지우기</button><button class="btn quiet" data-reset="no">취소</button>` : `<button class="btn quiet" data-reset="ask">학습 기록 초기화</button>`}</section>
    <p class="note" style="text-align:center;padding:4px 0">하나마루 · 버전 ${esc(APP_VERSION.startsWith('__') ? '미리보기' : APP_VERSION.slice(0, 8))}</p>
  </div>`;
}

function openSettings(section) {
  const el = openSheet(settingsHTML(), 'help settings');
  const rerender = () => {
    el.innerHTML = settingsHTML();
    if (curTab() === 'home') renderHome();
  };
  const resetRounds = () => {
    for (const k in R) R[k] = null;
  };
  el.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.setk) {
      const k = b.dataset.setk,
        v = b.dataset.v;
      S.set[k] = k === 'theme' ? v : +v;
      if (k === 'round') resetRounds();
      save();
      applyLook();
      rerender();
    } else if (b.dataset.sw) {
      S.set[b.dataset.sw] = !S.set[b.dataset.sw];
      save();
      rerender();
    } else if ('setLtest' in b.dataset) {
      closeSheet();
      startLevelTest();
    } else if ('setRemind' in b.dataset) {
      closeSheet();
      openHelp('remind');
    } else if ('setHelp' in b.dataset) {
      closeSheet();
      openHelp();
    } else if ('setTour' in b.dataset) {
      closeSheet();
      openTour();
    } else if (b.dataset.bk === 'copy') {
      const code = makeCode();
      S.lastBackup = dayIdx();
      save();
      const fallback = () => {
        bk = { mode: 'show', code, msg: '자동 복사가 안 돼요. 위 코드를 길게 눌러 전체 선택한 뒤 복사하세요.', input: '' };
        rerender();
        const t = el.querySelector('#bkOut');
        if (t) {
          t.focus();
          t.select();
        }
      };
      try {
        navigator.clipboard
          .writeText(code)
          .then(() => {
            bk = {
              mode: null,
              msg: `백업 코드를 복사했어요 (${Object.keys(S.stats).length}개 문제 기록). 메모 앱 등에 붙여 넣어 보관하세요.`,
              code: '',
              input: ''
            };
            rerender();
          })
          .catch(fallback);
      } catch (err) {
        fallback();
      }
    } else if (b.dataset.bk === 'open') {
      bk = { mode: bk.mode === 'import' ? null : 'import', msg: '', code: '', input: '' };
      rerender();
      const t = el.querySelector('#bkIn');
      if (t) t.focus();
    } else if (b.dataset.bk === 'restore') {
      const val = (el.querySelector('#bkIn') || {}).value || '';
      try {
        const n = mergeBackup(readCode(val));
        resetRounds();
        bk = { mode: null, msg: `복원했어요. 문제 기록 ${n}개를 합쳤어요.`, code: '', input: '' };
      } catch (err) {
        bk = {
          mode: 'import',
          msg: '코드를 읽을 수 없어요. HM 으로 시작하는 코드 전체를 빠짐없이 붙여 넣었는지 확인하세요.',
          code: '',
          input: val
        };
      }
      rerender();
    } else if (b.dataset.reset) {
      if (b.dataset.reset === 'ask') confirmReset = true;
      else {
        if (b.dataset.reset === 'yes') {
          Object.assign(S, {
            stats: {},
            days: {},
            goalDays: {},
            badges: [],
            best: {},
            course: { ja: {}, en: {} },
            courseFin: {},
            xp: { ja: 0, en: 0 },
            cards: { ja: {}, en: {} },
            tickets: { ja: 0, en: 0 },
            omi: { ja: {}, en: {} },
            omiDays: { ja: {}, en: {} },
            gbest: {},
            cardStart: {},
            missions: {},
            ltest: {}
          });
          resetRounds();
          save();
          toast('학습 기록을 지웠어요');
        }
        confirmReset = false;
      }
      rerender();
    }
  });
  if (section) {
    const t = el.querySelector('#set-' + section);
    if (t)
      setTimeout(() => {
        try {
          t.scrollIntoView({ block: 'start' });
        } catch (e) {}
      }, 30);
  }
}
document.getElementById('setBtn').addEventListener('click', () => openSettings());
