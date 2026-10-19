'use strict';
/* ================= home: level, season, today, to-do list, study areas ================= */

function modStats(keys) {
  let done = 0,
    weak = 0;
  for (const k of keys) {
    if (k.startsWith('dl:') ? S.stats[k]?.c > 0 : isDone(k)) done++;
    if (isWeak(k)) weak++;
  }
  return { done, weak, total: keys.length };
}
const kanaKeys = () => KANA.flatMap(x => ['k:' + x.h, 'k:' + toKata(x.h)]);
function dueCount(mod) {
  return basePool(mod, true).filter(p => isDue(p.key)).length;
}
function dueList() {
  return srsMods()
    .map(m => [m, dueCount(m)])
    .filter(x => x[1] > 0);
}
function startDue(mod) {
  S.filt[mod] = 'due';
  R[mod] = null;
  save();
  startMod(mod);
}
const isStandalone = () => window.navigator.standalone === true || !!window.matchMedia?.('(display-mode: standalone)').matches;

/* ---------- pieces ---------- */
function todayBoxHTML() {
  const d = S.days[today()] || { n: 0, c: 0 };
  const goal = S.set.goal,
    gDone = goal && d.n >= goal,
    pct = goal ? Math.min(100, (d.n / goal) * 100) : 0;
  const now = new Date();
  const dstr = `${now.getMonth() + 1}월 ${now.getDate()}일 ${'일월화수목금토'[now.getDay()]}요일`;
  return `<section class="today-box" data-done="${!!gDone}">
    ${goal ? `<svg viewBox="0 0 60 60" aria-hidden="true"><circle class="bg" cx="30" cy="30" r="25"/><circle class="fg" cx="30" cy="30" r="25" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${100 - pct}"/></svg>` : ''}
    <div class="tb-main"><span class="lbl">${dstr}</span><b class="num">${goal ? `${d.n} / ${goal}문제` : `${d.n}문제`}</b><small>${goal ? (gDone ? '오늘 목표 달성! 하나마루' : `목표까지 ${goal - d.n}문제`) : '오늘 푼 문제'}</small></div>
    <div class="tb-side"><div><b class="num">${d.n ? Math.round((d.c / d.n) * 100) + '%' : '–'}</b><span>정답률</span></div><div><b class="num">${streak()}일</b><span>연속</span></div></div>
  </section>`;
}

function todoRow({ act, ico, title, sub, right, done, cls }) {
  return `<li class="todo-i ${cls || ''}" data-done="${!!done}"><button type="button" ${act}><span class="ck" aria-hidden="true">${done ? CHECK_SVG : ico || ''}</span><span class="tl">${title}${sub ? `<small>${sub}</small>` : ''}</span><span class="go">${right || ''}</span></button></li>`;
}

function courseTodo(lang) {
  const n = COURSE[lang].length,
    cd = curDay(lang);
  if (cd >= n)
    return todoRow({
      act: 'data-gocourse',
      title: '코스를 모두 끝냈어요',
      sub: '오늘의 복습으로 잊기 전에 다시 봐요',
      done: true,
      right: '코스 보기'
    });
  const day = COURSE[lang][cd];
  const justFin = cd > 0 && S.courseFin[lang + (cd - 1)] === today();
  const head = `<li class="todo-h"><span>${stageOf(lang, cd)} · <b>${cd + 1}일차</b> ${esc(day.t)}</span><button type="button" class="link" data-gocourse>전체 보기</button></li>`;
  const fin = justFin
    ? `<li class="todo-note"><b>오늘 ${cd}일차를 끝냈어요!</b> 내일 이어서 하거나, 바로 ${cd + 1}일차를 해도 좋아요. <button type="button" class="link" data-share>결과 카드</button></li>`
    : '';
  return (
    head +
    fin +
    dayTasks(lang, cd)
      .map(({ t, ti }) => {
        const d = cDone(lang, cd, ti);
        return todoRow({
          act: `data-ctask="${lang}:${cd}:${ti}"`,
          title: esc(taskLabel(t)),
          sub: esc(MODE_LABEL[t.m] || ''),
          done: d,
          right: d ? '다시' : '시작',
          ico: '<i class="dot"></i>'
        });
      })
      .join('')
  );
}

function todoHTML() {
  const lang = S.lang,
    rows = [];
  const fresh = !Object.keys(S.course[lang]).length && totalN() < 30 && !(S.ltest && S.ltest[lang]);
  if (fresh)
    rows.push(
      todoRow({
        act: 'data-ltest',
        ico: '<i class="dot ai"></i>',
        title: '처음이라면: 레벨 테스트',
        sub: '20문제로 시작할 날을 추천받아요',
        right: '시작'
      })
    );
  rows.push(courseTodo(lang));
  const dl = dueList(),
    dueN = dl.reduce((a, x) => a + x[1], 0);
  rows.push(`<li class="todo-h"><span>오늘의 복습과 미션</span></li>`);
  rows.push(
    dueN
      ? todoRow({
          act: `data-duestart="${dl[0][0]}"`,
          ico: `<i class="badge-n num">${dueN > 99 ? '99+' : dueN}</i>`,
          title: `복습할 때가 된 문제 ${dueN}개`,
          sub: dl
            .map(([m, n]) => `${DUE_LABEL[m]} ${n}`)
            .slice(0, 4)
            .join(' · '),
          right: '복습'
        })
      : todoRow({ act: 'data-noop', title: '오늘 복습할 문제가 없어요', sub: '맞힌 문제는 1·3·7·14·30일 뒤에 다시 나와요', done: true })
  );
  rows.push(missionsHTML());
  const o = S.omi[lang];
  if (!(o && o.d === today()))
    rows.push(
      todoRow({
        act: 'data-goplay="omikuji"',
        ico: `<i class="badge-n ${lang === 'ja' ? 'jp' : ''}">${lang === 'ja' ? '籤' : '운'}</i>`,
        title: lang === 'ja' ? '오늘의 오미쿠지' : '오늘의 포춘 쿠키',
        sub: '하루 한 번 운세 뽑기',
        right: '뽑기'
      })
    );
  if (S.tickets[lang] > 0)
    rows.push(
      todoRow({
        act: 'data-goplay="cards"',
        ico: `<i class="badge-n num">${S.tickets[lang]}</i>`,
        title: `카드 뽑기권 ${S.tickets[lang]}장`,
        sub: '단어 카드를 뽑아 보세요',
        right: '뽑기'
      })
    );
  return `<section><ul class="todo">${rows.join('')}</ul></section>`;
}

function renderHome() {
  const ja = S.lang === 'ja';
  const bk = backupTodoHTML();
  view.innerHTML = `<div class="home">
    ${tripHomeHTML()}
    ${todayBoxHTML()}
    ${heroHTML()}
    ${bk ? `<ul class="todo">${bk}</ul>` : ''}
    ${courseLineHTML()}
    ${pinsHomeHTML()}
    <details class="home-more"><summary>오늘 할 일 · 복습 · 미션 자세히</summary>${todoHTML(true)}</details>
    <details class="home-more"><summary>레벨 · 이벤트 · 주간 리포트</summary>${levelHTML()}${seasonBannerHTML()}${weeklyHomeHTML()}</details>
    <section class="home-links">
      <button class="btn" data-today>오늘 공부한 내용</button><button class="btn" data-gowrong>오답 노트</button>
      <button class="btn" data-share>결과 카드</button><button class="btn" data-help>사용 안내</button>
    </section>
    ${donateHomeHTML()}
    ${isStandalone() ? '' : `<button class="install-tip" data-settings="install"><b>아이폰 홈 화면에 추가하기</b><span>Safari 공유 버튼 → '홈 화면에 추가'. 앱처럼 바로 열려요 →</span></button>`}
  </div>`;
  view.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (dailyClick(b) || homeExtraClick(b) || playClick(b) || weeklyClick(b) || backupClick(b) || tripClick(b)) return;
    if ('today' in b.dataset) startMod('today');
    else if ('gowrong' in b.dataset) startMod('wrongs');
    else if ('gotrav' in b.dataset) startMod(S.lang === 'ja' ? 'jtrav' : 'etrav');
    else if ('ltest' in b.dataset) startLevelTest();
    else if (b.dataset.settings) openSettings(b.dataset.settings);
    else if (b.dataset.gotab) {
      for (const m of tabModes(b.dataset.gotab))
        if (S.filt[m] === 'due') {
          S.filt[m] = 'all';
          R[m] = null;
        }
      go(b.dataset.gotab);
    } else if (b.dataset.review) {
      S.filt[b.dataset.review] = 'weak';
      R[b.dataset.review] = null;
      startMod(b.dataset.review);
    } else if (b.dataset.duestart) startDue(b.dataset.duestart);
    else if (b.dataset.goscene) {
      S.scenes[S.lang] = [b.dataset.goscene];
      for (const m of SCENE_MODS) {
        R[m] = null;
        if (modLang(m) === S.lang && S.filt[m] !== 'all') S.filt[m] = 'all';
      }
      save();
      startMod(ja ? 'sent' : 'es');
    }
  };
}
