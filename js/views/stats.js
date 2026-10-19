'use strict';
/* stats */
let CAL = null;
function renderStats() {
  const vb = document.getElementById('vbody');
  const now = new Date();
  if (!CAL) CAL = { y: now.getFullYear(), m: now.getMonth() };
  const days = Object.entries(S.days);
  const tn = totalN(),
    tc = days.reduce((a, [, d]) => a + d.c, 0);
  const studied = days.filter(([, d]) => d.n > 0).length;
  const first = new Date(CAL.y, CAL.m, 1),
    dim = new Date(CAL.y, CAL.m + 1, 0).getDate();
  const lvl = n => (!n ? 0 : n < 10 ? 1 : n < 30 ? 2 : 3);
  let cells = '일월화수목금토'
    .split('')
    .map(d => `<span class="dow">${d}</span>`)
    .join('');
  for (let i = 0; i < first.getDay(); i++) cells += '<span class="d out"></span>';
  for (let d = 1; d <= dim; d++) {
    const k = dayKey(new Date(CAL.y, CAL.m, d));
    const n = S.days[k]?.n || 0;
    cells += `<span class="d${S.goalDays[k] ? ' goal' : ''}${k === today() ? ' today' : ''}" data-l="${lvl(n)}" title="${n}문제">${d}</span>`;
  }
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = dayKey(d);
    week.push({ lbl: '일월화수목금토'[d.getDay()], n: S.days[k]?.n || 0, c: S.days[k]?.c || 0, today: i === 0 });
  }
  const mx = Math.max(10, ...week.map(w => w.n));
  const W = 320,
    H = 150,
    top = 22,
    bot = 24,
    bw = 28,
    gap = (W - 7 * bw) / 8;
  const bars = week
    .map((w, i) => {
      const x = gap + i * (bw + gap);
      const h = Math.round(((H - top - bot) * w.n) / mx);
      const y = H - bot - h;
      return `<rect x="${x}" y="${y}" width="${bw}" height="${Math.max(h, w.n ? 2 : 0)}" rx="4" fill="${w.today ? 'var(--shu)' : 'var(--ai)'}"/>${w.n ? `<text x="${x + bw / 2}" y="${y - 6}" text-anchor="middle" font-size="11" fill="var(--ink)" style="font-variant-numeric:tabular-nums">${w.n}</text>` : ''}<text x="${x + bw / 2}" y="${H - 7}" text-anchor="middle" font-size="11" fill="var(--muted)">${w.lbl}</text>`;
    })
    .join('');
  const wn = week.reduce((a, w) => a + w.n, 0),
    wc = week.reduce((a, w) => a + w.c, 0);
  const rows =
    S.lang === 'ja'
      ? [
          ['문자', kanaKeys()],
          ['단어', WORDS.map(w => w.key)],
          ['외래어', LOANS.map(x => x.key)],
          ['동사 활용', CONJ_ITEMS.map(x => x.key)],
          ['조수사·날짜', CNT_ITEMS.map(x => x.key)],
          ['기초 한자', KANJI.map(x => x.key)],
          ['문장 고르기', SENTS.map(s => s.key)],
          ['문장 조립', ITEMS.jb.map(s => s.key)],
          ['조사 빈칸', ITEMS.part.map(s => s.key)],
          ['문법', GRAM_ITEMS.map(x => x.key)],
          ['반말↔존댓말', POL.map(x => x.key)],
          ['문장 듣기', ITEMS.jl.map(s => s.key)],
          ['받아쓰기', ITEMS.jd.map(s => s.key)],
          ['장음·촉음', JMP.map(x => x.key)]
        ]
      : [
          ['단어', EN_WORDS.map(w => w.key)],
          ['불규칙 동사', IRR.map(x => x.key)],
          ['문장 고르기', EN_SENTS.map(s => s.key)],
          ['문장 조립', ITEMS.eb.map(s => s.key)],
          ['문장 듣기', ITEMS.el.map(s => s.key)],
          ['받아쓰기', ITEMS.ed.map(s => s.key)]
        ];
  vb.innerHTML = `<div class="chart">
    <div class="kpis" style="margin-top:0">
      <div class="kpi"><b class="num">${tn.toLocaleString()}</b><span>누적 문제</span></div>
      <div class="kpi"><b class="num">${tn ? Math.round((tc / tn) * 100) + '%' : '–'}</b><span>전체 정답률</span></div>
      <div class="kpi"><b class="num">${longestStreak()}일</b><span>최장 연속</span></div>
    </div>
    <div class="cal-head" style="margin:0"><p class="note">공부한 날 ${studied}일 · 목표 달성 ${Object.keys(S.goalDays).length}일</p><button class="btn" data-share style="min-height:38px;padding:6px 14px">결과 카드</button></div>
    <section class="chart-box"><div class="cal-head"><button class="btn quiet" data-cal="-1" aria-label="이전 달">‹</button><b>${CAL.y}년 ${CAL.m + 1}월</b><button class="btn quiet" data-cal="1" aria-label="다음 달">›</button></div><div class="cal">${cells}</div>
      <p class="note" style="margin-top:8px">색이 진할수록 많이 푼 날이에요. 빨간 동그라미는 하루 목표를 채운 날이에요.</p></section>
    <section class="chart-box"><h2 class="sec-title" style="margin-bottom:4px">최근 7일</h2><p class="note">${wn}문제 · 정답률 ${wn ? Math.round((wc / wn) * 100) + '%' : '–'}</p><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="최근 7일 푼 문제 수"><line x1="0" y1="${H - bot}" x2="${W}" y2="${H - bot}" stroke="var(--line)"/>${bars}</svg></section>
    <section class="chart-box"><h2 class="sec-title">${S.lang === 'ja' ? '일본어' : '영어'} 익힌 정도</h2><div class="mst">${rows
      .map(([l, ks]) => {
        const d = doneCount(ks);
        return `<div class="mst-row"><div><b style="font-weight:500">${l}</b><span>${d} / ${ks.length}</span></div><div class="meter"><i style="width:${ks.length ? (d / ks.length) * 100 : 0}%"></i></div></div>`;
      })
      .join('')}</div>
      <p class="note" style="margin-top:8px">두 번 연속으로 맞히면 '익힘'으로 셉니다.</p></section>
  </div>`;
  vb.onclick = e => {
    if (e.target.closest('[data-share]')) {
      shareCard();
      return;
    }
    const b = e.target.closest('[data-cal]');
    if (!b) return;
    CAL.m += +b.dataset.cal;
    if (CAL.m < 0) {
      CAL.m = 11;
      CAL.y--;
    }
    if (CAL.m > 11) {
      CAL.m = 0;
      CAL.y++;
    }
    renderStats();
  };
}
function renderBadges() {
  const vb = document.getElementById('vbody');
  checkBadges();
  const got = BADGES.filter(b => S.badges.includes(b.id)).length;
  vb.innerHTML = `<div class="chart"><p class="note">${BADGES.length}개 중 ${got}개 획득</p><div class="badges">${BADGES.map(b => {
    const has = S.badges.includes(b.id);
    const [c, m] = b.p();
    return `<div class="bdg" data-got="${has}"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M21 3.5c9.5 0 16 7 15.5 16.5-.5 9-7.5 16-16.5 15.5C11 35 4 28 4.5 19 5 10 12 3.8 22 4.5"/><path d="M21 12c4.5.3 7.5 3.8 7.2 8-.4 4.2-3.9 7.3-8.1 7-4-.4-6.8-3.8-6.4-7.7.4-3.4 3.2-5.5 6.3-5.2 2.9.3 4.6 2.5 4.4 5.2-.2 2.1-2 3.6-4 3.4"/></svg>
      <b>${b.name}</b><small>${b.desc}</small>${has ? '<small style="color:var(--ok);font-weight:600">획득</small>' : `<div class="meter"><i style="width:${Math.min(100, (c / m) * 100)}%"></i></div><small class="num">${c} / ${m}</small>`}</div>`;
  }).join('')}</div></div>`;
}
