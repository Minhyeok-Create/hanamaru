'use strict';
/* ================= 여행 D-day: set a departure date, get a daily share of travel phrases (+ signs for Japan) ================= */

// S.trip = { lang, day (dayIdx of departure), start (dayIdx when set), name, done: {phraseKey: 1} }
const TRIP_ORDER = ['basic', 'food', 'move', 'shop', 'stay', 'trouble', 'sight', 'health'];
const SIGN_ORDER = ['menu', 'station', 'shop', 'sign', 'stay'];
const tripOf = lang => (S.trip && S.trip.lang === lang ? S.trip : null);
const dateIdx = s => {
  const [y, m, d] = (s || '').split('-').map(Number);
  return y && m && d ? dayIdx(new Date(y, m - 1, d, 12)) : null;
};
const idxDate = i => {
  const d = new Date((i + 0.5) * 864e5);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
};

function tripLists(lang) {
  const ph = TRIP_ORDER.flatMap(c => TRAVEL[lang].filter(x => x.c === c));
  const sg = lang === 'ja' ? SIGN_ORDER.flatMap(c => SIGN_ITEMS.filter(x => x.c === c)) : [];
  return { ph, sg };
}
const signDone = x => !!(S.stats[x.key] && S.stats[x.key].c);
// Today's share: what is left, spread evenly over the days until departure (the day before departure is the last study day)
function tripToday(t) {
  const { ph, sg } = tripLists(t.lang);
  const left = Math.max(1, t.day - dayIdx());
  const phLeft = ph.filter(x => !t.done[x.key]),
    sgLeft = sg.filter(x => !signDone(x));
  const nP = Math.min(phLeft.length, Math.max(3, Math.ceil(phLeft.length / left))),
    nS = Math.min(sgLeft.length, Math.max(3, Math.ceil(sgLeft.length / left)));
  // today's list stays stable within the day even after items get checked
  if (!t.today || t.today.d !== dayIdx()) {
    t.today = { d: dayIdx(), p: phLeft.slice(0, Math.min(nP, 10)).map(x => x.key), s: sgLeft.slice(0, Math.min(nS, 10)).map(x => x.key) };
    save();
  }
  const byKey = new Map([...ph, ...sg].map(x => [x.key, x]));
  return {
    ph: t.today.p.map(k => byKey.get(k)).filter(Boolean),
    sg: t.today.s.map(k => byKey.get(k)).filter(Boolean),
    total: ph.length + sg.length,
    done: ph.length - phLeft.length + (sg.length - sgLeft.length)
  };
}
const dLabel = n => (n > 0 ? `D-${n}` : n === 0 ? 'D-DAY' : `여행 ${-n + 1}일째`);

// ---- home card ----
function tripHomeHTML() {
  const t = tripOf(S.lang);
  if (!t) return '';
  const n = t.day - dayIdx();
  if (n < -14) return '';
  const td = tripToday(t);
  const todayDone = td.ph.every(x => t.done[x.key]) && td.sg.every(signDone);
  const pct = Math.round((td.done * 100) / Math.max(1, td.total));
  return `<section class="trip-card"><button type="button" data-trip>
    <span class="trip-d num">${dLabel(n)}</span>
    <span class="trip-main"><b>${esc(t.name || (S.lang === 'ja' ? '일본 여행' : '해외여행'))}</b>
      <small>${n > 0 ? (todayDone ? '오늘 분량 끝! 내일 또 만나요' : `오늘 분량 · 문장 ${td.ph.length}개${td.sg.length ? ` · 간판 ${td.sg.length}개` : ''}`) : n === 0 ? '즐거운 여행 되세요! 여행 카드를 꺼내 쓰세요' : '여행 중이에요. 여행 카드를 꺼내 쓰세요'}</small>
      <span class="trip-bar"><i style="width:${pct}%"></i></span></span>
    <span class="go">${n > 0 ? (todayDone ? '복습' : '시작') : '카드'}</span></button></section>`;
}
function tripClick(b) {
  if (!('trip' in b.dataset) && !('tripset' in b.dataset)) return false;
  startMod(S.lang === 'ja' ? 'trip' : 'etrip');
  return true;
}

// ---- trip view ----
function renderTrip(mod) {
  const lang = mod === 'trip' ? 'ja' : 'en';
  const t = tripOf(lang);
  view.innerHTML = `<section class="mod">${modeSeg(mod)}<div class="chart trip" id="tripBody"></div></section>`;
  bindModes();
  const box = document.getElementById('tripBody');
  if (!t) box.innerHTML = tripSetupHTML(lang);
  else box.innerHTML = tripPlanHTML(t);
  view.onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.closest('.modes') || b.dataset.speak) return;
    const a = b.dataset.tp;
    if (a === 'save') {
      const day = dateIdx(document.getElementById('tpDate').value);
      if (day === null || day <= dayIdx()) return toast('오늘 이후 날짜를 골라 주세요.');
      if (day - dayIdx() > 365) return toast('1년 안의 날짜를 골라 주세요.');
      const name = document.getElementById('tpName').value.trim().slice(0, 20);
      const keep = S.trip && S.trip.lang === lang ? S.trip.done : {};
      S.trip = { lang, day, start: dayIdx(), name, done: keep || {} };
      save();
      renderTrip(mod);
    } else if (a === 'edit') box.innerHTML = tripSetupHTML(lang, t);
    else if (a === 'cancel') renderTrip(mod);
    else if (a === 'end') {
      S.trip = null;
      save();
      toast('여행 D-day를 지웠어요.');
      renderTrip(mod);
    } else if (a === 'got') {
      const k = b.dataset.k;
      if (t.done[k]) delete t.done[k];
      else t.done[k] = 1;
      save();
      b.setAttribute('aria-pressed', !!t.done[k]);
      b.textContent = t.done[k] ? '✓ 외웠어요' : '외웠어요';
      const p = box.querySelector('.trip-prog');
      if (p) p.outerHTML = tripProgHTML(t);
    } else if (a === 'show') {
      const list = tripToday(t).ph;
      openTravelShow(lang, list, +b.dataset.i);
    } else if (a === 'signs') {
      const items = tripToday(t).sg;
      if (!items.length) return;
      PENDING.sign = items;
      R.sign = null;
      startMod('sign');
    } else if (a === 'cards') startMod(lang === 'ja' ? 'jtrav' : 'etrav');
  };
}
function tripSetupHTML(lang, t) {
  const min = idxDate(dayIdx() + 1);
  return `<p class="trip-lead">출발 날짜를 넣으면 남은 날짜에 맞춰 <b>여행 문장</b>${lang === 'ja' ? '과 <b>메뉴판·간판</b>' : ''}을 하루치씩 나눠 줘요.</p>
    <label class="trip-f">출발 날짜<input type="date" id="tpDate" min="${min}" value="${t ? idxDate(t.day) : ''}"></label>
    <label class="trip-f">여행 이름 (선택)<input type="text" id="tpName" maxlength="20" placeholder="${lang === 'ja' ? '예: 오사카 3박 4일' : '예: 런던 여행'}" value="${esc((t && t.name) || '')}"></label>
    <div class="row"><button class="btn primary" data-tp="save">${t ? '바꾸기' : '시작하기'}</button>${t ? '<button class="btn" data-tp="cancel">취소</button>' : ''}</div>
    <p class="note">2주 전에 시작하면 하루 10분 정도예요. 날짜가 가까울수록 하루 분량이 늘어나요.</p>`;
}
function tripProgHTML(t) {
  const td = tripToday(t);
  const pct = Math.round((td.done * 100) / Math.max(1, td.total));
  return `<div class="trip-prog"><span class="trip-bar"><i style="width:${pct}%"></i></span><span class="num">${td.done} / ${td.total} 익힘</span></div>`;
}
function tripPlanHTML(t) {
  const n = t.day - dayIdx();
  const td = tripToday(t);
  const lang = t.lang,
    ja = lang === 'ja';
  const head = `<div class="trip-head"><span class="trip-d big num">${dLabel(n)}</span><div><b>${esc(t.name || (ja ? '일본 여행' : '해외여행'))}</b><small>${idxDate(t.day).replace(/-/g, '.')} 출발</small></div><div class="trip-hl"><button class="link" data-tp="edit">날짜 바꾸기</button><button class="link" data-share-trip>공유 카드</button></div></div>${tripProgHTML(t)}`;
  if (n <= 0)
    return `${head}<p class="trip-lead">${n === 0 ? '오늘 출발이에요! 즐거운 여행 되세요.' : '여행 잘 하고 계신가요?'} 필요한 문장은 여행 카드에서 <b>보여주기</b>로 꺼내 쓰세요.</p>
      <div class="row"><button class="btn primary" data-tp="cards">여행 카드 열기</button><button class="btn" data-tp="end">D-day 끝내기</button></div>`;
  const allDone = td.total && td.done >= td.total;
  return `${head}
    ${allDone ? '<p class="trip-lead">준비 끝! 전부 익혔어요. 남은 날은 여행 카드로 복습해요.</p>' : ''}
    <h3 class="hjr-h">오늘의 여행 문장 ${td.ph.length}개</h3>
    <div class="tv-list">${td.ph
      .map(
        (
          x,
          i
        ) => `<div class="tv-card"><div class="tv-ko">${esc(x.ko)}</div><div class="tv-t ${ja ? 'jp' : 'en'}" lang="${lang}">${esc(x.t)}</div>${ja && tvNeedsR(x) ? `<div class="tv-r jp" lang="ja">${esc(x.r)}</div>` : ''}
        <div class="tv-act"><button class="btn" data-tp="show" data-i="${i}">보여주기</button>${spkBtn(x.t, '듣기', lang)}<button class="btn trip-got" data-tp="got" data-k="${esc(x.key)}" aria-pressed="${!!t.done[x.key]}">${t.done[x.key] ? '✓ 외웠어요' : '외웠어요'}</button></div></div>`
      )
      .join('')}</div>
    ${td.sg.length ? `<h3 class="hjr-h">오늘의 메뉴판·간판 ${td.sg.length}개</h3><div class="sg-row">${td.sg.map(x => `<span class="sg-mini ${signDone(x) ? 'done' : ''}">${signBoard(x)}</span>`).join('')}</div><button class="btn primary" data-tp="signs" style="width:100%">간판 ${td.sg.length}개 퀴즈 풀기</button>` : ''}
    <p class="note" style="margin-top:14px">문장은 '외웠어요'를, 간판은 퀴즈에서 한 번 맞히면 익힌 걸로 쳐요.</p>
    <div class="row"><button class="link" data-tp="end">D-day 지우기</button></div>`;
}
CUSTOM.trip = renderTrip;
CUSTOM.etrip = renderTrip;
