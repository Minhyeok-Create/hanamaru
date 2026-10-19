'use strict';
/* ================= "오늘 공부 시작": one button that runs review → course → cards in a row (about 10 minutes) ================= */

let DAILY = null; // { lang, steps: [{ k, mod, label, di, ti }], i }

function dailyPlan(lang) {
  const steps = [];
  const dl = dueList();
  for (const [m, n] of dl.slice(0, 2))
    if (steps.length < 1 || n >= 5)
      steps.push({ k: 'due', mod: m, label: `${DUE_LABEL[m] || modeLabel(m)} 복습 ${Math.min(n, S.set.round)}개` });
  const cd = curDay(lang);
  if (cd < COURSE[lang].length)
    for (const { t, ti } of dayTasks(lang, cd)
      .filter(x => !cDone(lang, cd, x.ti))
      .slice(0, 2))
      if (steps.length < 3) steps.push({ k: 'task', mod: t.m, di: cd, ti, label: `${cd + 1}일차 · ${taskLabel(t)}` });
  if (steps.length < 2) steps.push({ k: 'mod', mod: lang === 'ja' ? 'flash' : 'eflash', label: '단어 카드 넘기기' });
  return steps.slice(0, 3);
}
function startDaily() {
  if (DAILY && DAILY.lang === S.lang && DAILY.i < DAILY.steps.length) return runDaily();
  DAILY = { lang: S.lang, steps: dailyPlan(S.lang), i: 0 };
  runDaily();
}
function runDaily() {
  const s = DAILY && DAILY.steps[DAILY.i];
  if (!s) return finishDaily();
  if (s.k === 'due') startDue(s.mod);
  else if (s.k === 'task') startTask(DAILY.lang, s.di, s.ti);
  else {
    R[s.mod] = null;
    if (typeof FC !== 'undefined') FC = null;
    startMod(s.mod);
  }
}
function finishDaily() {
  DAILY = null;
  S.dailyDone = S.dailyDone || {};
  S.dailyDone[S.lang] = today();
  save();
  go('home');
  sfx('lvl');
  toast('오늘 공부 끝! 하나마루');
}
// thin bar above the tab bar while a daily session runs
function dailyBar() {
  let el = document.getElementById('dailyBar');
  const on = DAILY && DAILY.lang === S.lang && curTab() !== 'home';
  if (!on) {
    if (el) el.remove();
    document.body.classList.remove('has-daily');
    return;
  }
  if (!el) {
    el = document.createElement('div');
    el.id = 'dailyBar';
    el.className = 'daily-bar';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
    el.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.dn === 'next') {
        DAILY.i++;
        runDaily();
      } else if (b.dataset.dn === 'stop') {
        DAILY = null;
        dailyBar();
      }
    });
  }
  document.body.classList.add('has-daily');
  const n = DAILY.steps.length,
    s = DAILY.steps[DAILY.i];
  el.innerHTML = `<span class="db-steps">${DAILY.steps.map((_, i) => `<i class="${i < DAILY.i ? 'done' : i === DAILY.i ? 'on' : ''}"></i>`).join('')}</span>
    <span class="db-t"><b>오늘 공부 ${DAILY.i + 1}/${n}</b><small>${esc(s ? s.label : '')}</small></span>
    <button type="button" class="btn primary" data-dn="next">${DAILY.i + 1 < n ? '다음 →' : '끝내기'}</button><button type="button" class="icon-btn" data-dn="stop" aria-label="그만하기">${XICON}</button>`;
}

// ---- home pieces ----
function heroHTML() {
  const lang = S.lang;
  const running = DAILY && DAILY.lang === lang && DAILY.i < DAILY.steps.length;
  const plan = running ? DAILY.steps.slice(DAILY.i) : dailyPlan(lang);
  const doneToday = S.dailyDone && S.dailyDone[lang] === today();
  const fresh = !Object.keys(S.course[lang]).length && totalN() < 30 && !(S.ltest && S.ltest[lang]);
  return `<section class="hero">
    <button type="button" class="hero-go" data-daily>
      <span class="hero-t"><b>${running ? '이어서 하기' : doneToday ? '한 번 더 공부하기' : '오늘 공부 시작'}</b><small>${plan.map(s => esc(s.label)).join(' → ')}</small></span>
      <span class="hero-m">${running ? `${DAILY.i + 1}/${DAILY.steps.length}` : `약 ${plan.length * 4}분`}</span>
    </button>
    ${fresh ? '<button type="button" class="link hero-sub" data-ltest>일본어를 조금 안다면: 레벨 테스트로 시작 위치 찾기</button>'.replace('일본어', lang === 'ja' ? '일본어' : '영어') : ''}
  </section>`;
}
function courseLineHTML() {
  const lang = S.lang,
    n = COURSE[lang].length,
    cd = curDay(lang),
    dd = daysDone(lang);
  return `<section><button type="button" class="course-line" data-gocourse>
    <span><small>${cd < n ? esc(stageOf(lang, cd)) : '코스 완주'}</small><b>${cd < n ? `${cd + 1}일차 · ${esc(COURSE[lang][cd].t)}` : `${n}일 코스를 모두 끝냈어요`}</b></span>
    <span class="cl-bar"><i style="width:${(dd * 100) / n}%"></i></span><span class="cl-n num">${dd}/${n}일</span></button></section>`;
}
function dailyClick(b) {
  if (!('daily' in b.dataset)) return false;
  startDaily();
  return true;
}
