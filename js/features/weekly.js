'use strict';
/* ================= weekly report: last week vs the week before ================= */

// Which study area a stats key belongs to (counted per day in S.days[day].m)
const KEY_GROUPS = [
  [/^k:/, '문자'],
  [/^kj:/, '한자'],
  [/^(w|ew):/, '단어'],
  [/^lw:/, '외래어'],
  [/^cj:/, '동사 활용'],
  [/^ct:/, '조수사·날짜'],
  [/^(s|es|jb|eb):/, '문장'],
  [/^pt:/, '조사'],
  [/^gp:/, '문법'],
  [/^pl:/, '반말·존댓말'],
  [/^(ep|et|eph):/, '영문법'],
  [/^ir:/, '불규칙 동사'],
  [/^(jl|el|jd|ed|sh|esh|jm|mp):/, '듣기·발음'],
  [/^dl:/, '대화']
];
function keyGroup(k) {
  if (!k) return '게임·도전';
  for (const [re, g] of KEY_GROUPS) if (re.test(k)) return g;
  return '기타';
}

const weekStart = d => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};
function weekSum(start) {
  const out = { n: 0, c: 0, x: 0, days: 0, m: {}, byDay: [] };
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const v = S.days[dayKey(d)] || {};
    out.byDay.push({ l: '월화수목금토일'[i], n: v.n || 0 });
    out.n += v.n || 0;
    out.c += v.c || 0;
    out.x += v.x || 0;
    if (v.n) out.days++;
    for (const [g, c] of Object.entries(v.m || {})) out.m[g] = (out.m[g] || 0) + c;
  }
  return out;
}
function lastWeeks() {
  const thisMon = weekStart(new Date());
  const lastMon = new Date(thisMon);
  lastMon.setDate(lastMon.getDate() - 7);
  const prevMon = new Date(thisMon);
  prevMon.setDate(prevMon.getDate() - 14);
  return { start: lastMon, cur: weekSum(lastMon), prev: weekSum(prevMon), key: dayKey(lastMon) };
}
const fmtMD = d => `${d.getMonth() + 1}/${d.getDate()}`;
function weekComment(w) {
  const { cur, prev } = w;
  if (!cur.n) return '지난주는 쉬어 갔어요. 이번 주에 다시 시작해 봐요!';
  if (!prev.n) return '첫 주간 기록이에요. 이 흐름을 이어 가요!';
  const diff = cur.n - prev.n;
  if (diff > 0) return `지지난주보다 ${diff}문제 더 풀었어요. 하나마루!`;
  if (diff === 0) return '지지난주와 똑같이 꾸준했어요.';
  return `지지난주보다 ${-diff}문제 적었어요. 이번 주에 조금만 더 힘내요.`;
}

// Home card: shown Monday–Wednesday until closed
function weeklyHomeHTML() {
  const w = lastWeeks();
  const dow = (new Date().getDay() + 6) % 7;
  if (dow > 2 || S.weekSeen === w.key || !(w.cur.n || w.prev.n)) return '';
  const end = new Date(w.start);
  end.setDate(end.getDate() + 6);
  const delta = w.cur.n - w.prev.n;
  return `<section class="week-card"><div class="wk-h"><b>지난주 리포트</b><span class="note">${fmtMD(w.start)} – ${fmtMD(end)}</span></div>
    <div class="wk-row"><div><b class="num">${w.cur.n}</b><span>문제</span></div><div><b class="num ${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '+' : ''}${delta}</b><span>지지난주 대비</span></div><div><b class="num">${w.cur.days}일</b><span>공부한 날</span></div></div>
    <p class="note" style="color:var(--ink)">${esc(weekComment(w))}</p>
    <div class="row"><button class="btn primary" data-week="open">자세히 보기</button><button class="btn quiet" data-week="close">닫기</button></div></section>`;
}
function weeklyClick(b) {
  if (b.dataset.week === 'open') {
    openWeekly();
    return true;
  }
  if (b.dataset.week === 'close') {
    S.weekSeen = lastWeeks().key;
    save();
    renderHome();
    return true;
  }
  return false;
}

function openWeekly() {
  const w = lastWeeks();
  const { cur, prev } = w;
  const end = new Date(w.start);
  end.setDate(end.getDate() + 6);
  const groups = Object.entries(cur.m)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const gmax = Math.max(1, ...groups.map(g => g[1]));
  const grew = Object.entries(cur.m)
    .map(([g, c]) => [g, c - (prev.m[g] || 0)])
    .sort((a, b) => b[1] - a[1])[0];
  const best = cur.byDay.reduce((a, b) => (b.n > a.n ? b : a), { n: 0 });
  const dmax = Math.max(10, ...cur.byDay.map(d => d.n));
  const pct = (a, b) => (b ? Math.round((a / b) * 100) + '%' : '–');
  const row = (label, a, b, unit = '') =>
    `<div class="wk-cmp"><span>${label}</span><b class="num">${a}${unit}</b><small class="num">${b}${unit}</small></div>`;
  const el = openSheet(
    `<div class="sheet-h"><b>주간 리포트 · ${fmtMD(w.start)} – ${fmtMD(end)}</b><button type="button" class="icon-btn" data-close aria-label="닫기">${XICON}</button></div>
    <div class="h-scroll">
      <p style="margin:0;font-weight:600">${esc(weekComment(w))}</p>
      <section class="chart-box"><div class="wk-cmp head"><span></span><b>지난주</b><small>지지난주</small></div>
        ${row('푼 문제', cur.n, prev.n)}${row('정답률', pct(cur.c, cur.n), pct(prev.c, prev.n))}${row('공부한 날', cur.days, prev.days, '일')}${row('얻은 경험치', cur.x, prev.x)}</section>
      <section class="chart-box"><h2 class="sec-title">요일별</h2><div class="wk-bars">${cur.byDay.map(d => `<div><i style="height:${Math.round((d.n / dmax) * 100)}%" class="${d === best && d.n ? 'best' : ''}"></i><span>${d.l}</span><small class="num">${d.n || ''}</small></div>`).join('')}</div>
        ${best.n ? `<p class="note">가장 많이 한 날: ${best.l}요일 ${best.n}문제</p>` : ''}</section>
      ${
        groups.length
          ? `<section class="chart-box"><h2 class="sec-title">많이 공부한 것</h2><div class="mst">${groups.map(([g, c]) => `<div class="mst-row"><div><b style="font-weight:500">${esc(g)}</b><span class="num">${c}</span></div><div class="meter"><i style="width:${(c / gmax) * 100}%"></i></div></div>`).join('')}</div>
        ${grew && grew[1] > 0 ? `<p class="note" style="margin-top:8px">가장 많이 늘어난 것: <b style="color:var(--ink)">${esc(grew[0])}</b> (+${grew[1]})</p>` : ''}</section>`
          : ''
      }
      <button class="btn" data-wk="share" style="width:100%">주간 카드 공유</button>
    </div>`,
    'help'
  );
  el.querySelector('[data-wk=share]').addEventListener('click', () =>
    shareImage(drawWeekCard(w), `하나마루 주간 리포트 · ${cur.n}문제`, '주간 카드')
  );
  S.weekSeen = w.key;
  save();
}

function drawWeekCard(w) {
  const W = 1080,
    H = 1350;
  let cv;
  try {
    cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
  } catch (e) {
    return null;
  }
  let x = null;
  try {
    x = cv.getContext && cv.getContext('2d');
  } catch (e) {}
  if (!x) return null;
  const C = SHARE_COLORS,
    F = SHARE_FONT;
  const font = (wt, s) => {
    x.font = `${wt} ${s}px ${F}`;
  };
  const rr = (X, Y, w2, h, r, fill, stroke) => roundRect(x, X, Y, w2, h, r, fill, stroke);
  const { cur, prev } = w;
  const end = new Date(w.start);
  end.setDate(end.getDate() + 6);
  x.fillStyle = C.paper;
  x.fillRect(0, 0, W, H);
  x.textBaseline = 'alphabetic';
  drawMark(x, 80, 74, 2.4, 6);
  font(700, 50);
  x.fillStyle = C.ink;
  x.fillText('하나마루', 172, 132);
  font(500, 34);
  x.fillStyle = C.muted;
  x.textAlign = 'right';
  x.fillText(`주간 리포트 · ${fmtMD(w.start)} – ${fmtMD(end)}`, 1000, 130);
  x.textAlign = 'left';
  rr(80, 190, 920, 400, 40, C.surface, C.line);
  font(600, 38);
  x.fillStyle = C.muted;
  x.fillText('지난주 푼 문제', 140, 280);
  font(700, 180);
  x.fillStyle = C.ink;
  const t = String(cur.n);
  x.fillText(t, 132, 460);
  const tw = x.measureText(t).width;
  font(600, 56);
  x.fillText('문제', 150 + tw, 460);
  const d = cur.n - prev.n;
  font(600, 40);
  x.fillStyle = d >= 0 ? C.ok : C.shu;
  x.fillText(`지지난주 대비 ${d >= 0 ? '+' : ''}${d}`, 140, 540);
  const kp = [
    [cur.days + '일', '공부한 날'],
    [cur.n ? Math.round((cur.c / cur.n) * 100) + '%' : '–', '정답률'],
    [String(cur.x), '경험치']
  ];
  kp.forEach(([v, l], i) => {
    const X = 80 + i * 313;
    rr(X, 625, 293, 190, 30, C.surface, C.line);
    font(700, 64);
    x.fillStyle = C.ink;
    x.fillText(v, X + 34, 730);
    font(500, 32);
    x.fillStyle = C.muted;
    x.fillText(l, X + 34, 780);
  });
  rr(80, 850, 920, 380, 30, C.surface, C.line);
  font(600, 34);
  x.fillStyle = C.muted;
  x.fillText('요일별', 120, 910);
  const mx = Math.max(10, ...cur.byDay.map(v => v.n));
  const bw = 70,
    gap = (840 - 7 * bw) / 6;
  cur.byDay.forEach((v, i) => {
    const X = 120 + i * (bw + gap);
    const h = Math.round((200 * v.n) / mx);
    rr(X, 1160 - Math.max(h, 4), bw, Math.max(h, 4), 12, v.n ? C.ai : C.line);
    font(500, 28);
    x.fillStyle = C.muted;
    x.textAlign = 'center';
    x.fillText(v.l, X + bw / 2, 1205);
    if (v.n) {
      font(600, 28);
      x.fillStyle = C.ink;
      x.fillText(String(v.n), X + bw / 2, 1150 - h);
    }
    x.textAlign = 'left';
  });
  font(500, 30);
  x.fillStyle = C.muted;
  x.textAlign = 'center';
  x.fillText('하나마루 · 일본어·영어 회화 기초', W / 2, 1300);
  x.textAlign = 'left';
  return cv;
}
