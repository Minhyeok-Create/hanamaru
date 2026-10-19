'use strict';
/* ================= kana handwriting: trace over a faint model with numbered strokes (no grading) =================
   Stroke data: KanjiVG (CC BY-SA 3.0, Ulrich Apel — http://kanjivg.tagaini.net) */

const WR_ROWS = ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ'];
let WR = { sc: 'h', row: 'あ', i: 0, guide: true };
if (!S.wr || typeof S.wr !== 'object') S.wr = {}; // practiced counts per character

const wrChars = () => {
  const cv = WR.sc === 'k' ? toKata : x => x;
  return [...ROWS[WR.row]].map(cv);
};
const strokesOf = ch => (typeof KANA_STROKES !== 'undefined' && KANA_STROKES[ch]) || null;

function renderWriting() {
  const chars = wrChars();
  if (WR.i >= chars.length) WR.i = 0;
  const ch = chars[WR.i];
  const st = strokesOf(ch);
  const n = st ? st.p.length : 0;
  view.innerHTML = `<section class="mod">${modeSeg('kwrite')}<div class="wr">
    <div class="wr-top">${seg(
      'wr.sc',
      [
        ['h', 'ひらがな'],
        ['k', 'カタカナ']
      ],
      WR.sc
    )}<button class="chip" data-wrg aria-pressed="${WR.guide}">견본 보기</button></div>
    <div class="chips">${WR_ROWS.map(r => `<button class="chip jp" lang="ja" data-wrrow="${r}" aria-pressed="${WR.row === r}">${WR.sc === 'k' ? toKata(r) : r}행</button>`).join('')}</div>
    <div class="wr-strip">${chars.map((c, i) => `<button class="wr-c jp ${i === WR.i ? 'on' : ''}" lang="ja" data-wri="${i}">${c}${S.wr[c] ? '<i></i>' : ''}</button>`).join('')}</div>
    <div class="wr-pad" id="wrPad">
      <svg viewBox="0 0 109 109" class="wr-model ${WR.guide ? '' : 'off'}" aria-hidden="true">
        <line x1="54.5" y1="2" x2="54.5" y2="107" class="grid"/><line x1="2" y1="54.5" x2="107" y2="54.5" class="grid"/>
        ${st ? st.p.map((d, k) => `<path d="${d}" class="stk" data-k="${k}"/>`).join('') : ''}
        ${st ? st.n.map(([x, y], k) => `<g class="num"><circle cx="${x + 1.5}" cy="${y - 3}" r="4.6"/><text x="${x + 1.5}" y="${y - 1.2}" text-anchor="middle">${k + 1}</text></g>`).join('') : ''}
      </svg>
      <canvas id="wrCanvas" aria-label="${ch} 따라 쓰기 칸"></canvas>
    </div>
    <p class="cap" style="text-align:center"><b class="jp" lang="ja" style="font-size:20px;color:var(--ink)">${ch}</b> · ${esc(kanaRom(ch))} · ${n}획 · 번호 순서대로 따라 써 보세요</p>
    <div class="row wr-act"><button class="btn" data-wr="anim">획순 보기</button><button class="btn" data-wr="clear">지우기</button>${spkBtn(ch, '듣기')}</div>
    <div class="row wr-nav"><button class="btn" data-wr="prev">← 이전</button><button class="btn primary" data-wr="next">다 썼어요 · 다음 →</button></div>
    <p class="note" style="text-align:center">채점은 없어요. 손에 익을 때까지 여러 번 써 보세요. 획순 자료: KanjiVG (CC BY-SA 3.0)</p>
  </div></section>`;
  bindModes();
  wrSetupCanvas();
  view.onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.closest('.modes') || b.dataset.speak) return;
    if (b.dataset.set === 'wr.sc') {
      WR.sc = b.dataset.val;
      WR.i = 0;
      renderWriting();
    } else if ('wrg' in b.dataset) {
      WR.guide = !WR.guide;
      renderWriting();
    } else if (b.dataset.wrrow) {
      WR.row = b.dataset.wrrow;
      WR.i = 0;
      renderWriting();
    } else if (b.dataset.wri !== undefined) {
      WR.i = +b.dataset.wri;
      renderWriting();
    } else if (b.dataset.wr === 'clear') wrClear();
    else if (b.dataset.wr === 'anim') wrAnimate();
    else if (b.dataset.wr === 'prev') {
      wrStep(-1);
    } else if (b.dataset.wr === 'next') {
      S.wr[ch] = (S.wr[ch] || 0) + 1;
      save();
      wrStep(1);
    }
  };
}
function wrStep(d) {
  const chars = wrChars();
  WR.i += d;
  if (WR.i < 0) {
    const r = WR_ROWS.indexOf(WR.row);
    WR.row = WR_ROWS[(r - 1 + WR_ROWS.length) % WR_ROWS.length];
    WR.i = wrChars().length - 1;
  } else if (WR.i >= chars.length) {
    const r = WR_ROWS.indexOf(WR.row);
    WR.row = WR_ROWS[(r + 1) % WR_ROWS.length];
    WR.i = 0;
  }
  renderWriting();
}

let WR_CTX = null;
function wrSetupCanvas() {
  const cv = document.getElementById('wrCanvas'),
    pad = document.getElementById('wrPad');
  if (!cv || !pad) return;
  const size = pad.clientWidth || 300,
    dpr = window.devicePixelRatio || 1;
  cv.width = size * dpr;
  cv.height = size * dpr;
  let x = null;
  try {
    x = cv.getContext && cv.getContext('2d');
  } catch (e) {}
  WR_CTX = x;
  if (!x) return;
  x.scale(dpr, dpr);
  x.lineCap = 'round';
  x.lineJoin = 'round';
  x.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#19202C';
  x.lineWidth = Math.max(7, size / 30);
  let drawing = false,
    last = null;
  const pos = e => {
    const r = cv.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  cv.onpointerdown = e => {
    drawing = true;
    last = pos(e);
    try {
      cv.setPointerCapture(e.pointerId);
    } catch (er) {}
    x.beginPath();
    x.arc(last[0], last[1], x.lineWidth / 2, 0, Math.PI * 2);
    x.fillStyle = x.strokeStyle;
    x.fill();
    e.preventDefault();
  };
  cv.onpointermove = e => {
    if (!drawing) return;
    const p = pos(e);
    x.beginPath();
    x.moveTo(last[0], last[1]);
    x.lineTo(p[0], p[1]);
    x.stroke();
    last = p;
    e.preventDefault();
  };
  cv.onpointerup = cv.onpointercancel = () => {
    drawing = false;
  };
}
function wrClear() {
  const cv = document.getElementById('wrCanvas');
  if (!cv || !WR_CTX) return;
  WR_CTX.save();
  WR_CTX.setTransform(1, 0, 0, 1, 0, 0);
  WR_CTX.clearRect(0, 0, cv.width, cv.height);
  WR_CTX.restore();
}
function wrAnimate() {
  const svg = view.querySelector('.wr-model');
  if (!svg) return;
  svg.classList.remove('off');
  const paths = [...svg.querySelectorAll('.stk')];
  paths.forEach(p => {
    p.classList.remove('draw');
    let L = 300;
    try {
      L = p.getTotalLength();
    } catch (e) {}
    p.style.setProperty('--len', L);
  });
  paths.forEach((p, k) => setTimeout(() => p.classList.add('draw'), 80 + k * 650));
}
CUSTOM.kwrite = renderWriting;
