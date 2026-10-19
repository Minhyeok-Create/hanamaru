'use strict';
/* ================= reference views ================= */
function renderView(mod) {
  const body = {
    chart: renderChart,
    jlist: () => renderWordList('ja'),
    elist: () => renderWordList('en'),
    stats: renderStats,
    badges: renderBadges,
    today: renderToday,
    gnote: renderGNote,
    course: renderCourse,
    wrongs: renderWrongNotes
  }[mod];
  view.innerHTML = `<section class="mod">${modeSeg(mod)}<div id="vbody"></div></section>`;
  bindModes();
  body();
}
let chartSc = 'h';
const LEGEND =
  '<div class="legend"><span><i style="background:var(--ok)"></i>익힘</span><span><i style="background:var(--warn)"></i>연습 중</span><span><i style="background:var(--ng)"></i>복습 필요</span></div>';
function renderChart() {
  const vb = document.getElementById('vbody');
  const cv = chartSc === 'k' ? toKata : x => x;
  const by = h => KANA.find(x => x.h === h);
  const cell = h => {
    if (!h) return '<span class="cell blank"></span>';
    const x = by(h);
    const ch = cv(h);
    return `<button class="cell" data-ch="${ch}" data-st="${itemStatus('k:' + ch)}"><span class="jp" lang="ja">${ch}</span><span class="mono">${x.alts[0]}</span></button>`;
  };
  const rows = [
    'あいうえお',
    'かきくけこ',
    'さしすせそ',
    'たちつてと',
    'なにぬねの',
    'はひふへほ',
    'まみむめも',
    'や_ゆ_よ',
    'らりるれろ',
    'わ___を',
    'ん____'
  ];
  const drows = ['がぎぐげご', 'ざじずぜぞ', 'だぢづでど', 'ばびぶべぼ', 'ぱぴぷぺぽ'];
  const grid = rs =>
    rs
      .map(r =>
        r
          .split('')
          .map(c => cell(c === '_' ? null : c))
          .join('')
      )
      .join('');
  vb.innerHTML = `<div class="chart">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
      <div class="seg" role="group">${[
        ['h', 'ひらがな'],
        ['k', 'カタカナ']
      ]
        .map(([v, l]) => `<button data-sc="${v}" aria-pressed="${chartSc === v}">${l}</button>`)
        .join('')}</div>${LEGEND}
    </div>
    <p class="note">${hasTTS ? '글자를 누르면 발음을 들을 수 있어요.' : '글자별 학습 상태를 색 점으로 보여 줘요.'}</p>
    <section><h2 class="sec-title">청음 · 기본</h2><div class="gojuon">${grid(rows)}</div></section>
    <section><h2 class="sec-title">탁음 · 반탁음</h2><div class="gojuon">${grid(drows)}</div></section>
    <section><h2 class="sec-title">요음</h2><div class="gojuon y">${KANA.filter(x => x.set === 'yoon')
      .map(x => cell(x.h))
      .join('')}</div></section>
  </div>`;
  vb.onclick = e => {
    const s = e.target.closest('[data-sc]');
    if (s) {
      chartSc = s.dataset.sc;
      renderChart();
      return;
    }
    const c = e.target.closest('.cell[data-ch]');
    if (c) {
      speak(c.dataset.ch);
      vb.querySelectorAll('.cell.hit').forEach(x => x.classList.remove('hit'));
      c.classList.add('hit');
    }
  };
}
