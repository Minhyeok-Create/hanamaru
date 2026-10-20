'use strict';
/* ================= more share cards: 여행 D-day progress, 한국음 discovery (학교 = 学校 = がっこう) ================= */

const JP_FONT = '"Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",' + SHARE_FONT;
const appUrl = () => (location.protocol.startsWith('http') ? location.host + location.pathname.replace(/index\.html$/, '') : '');
function cardCanvas(W, H) {
  try {
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const x = cv.getContext('2d');
    if (!x) return null;
    x.fillStyle = SHARE_COLORS.paper;
    x.fillRect(0, 0, W, H);
    return [cv, x];
  } catch (e) {
    return null;
  }
}
function cardHeader(x, W, sub) {
  drawMark(x, 64, 58, 2.1, 6);
  x.fillStyle = SHARE_COLORS.ink;
  x.font = `700 40px ${SHARE_FONT}`;
  x.fillText('하나마루', 146, 106);
  x.fillStyle = SHARE_COLORS.muted;
  x.font = `500 30px ${SHARE_FONT}`;
  x.textAlign = 'right';
  x.fillText(sub, W - 64, 104);
  x.textAlign = 'left';
}
function cardFooter(x, W, H, line) {
  x.fillStyle = SHARE_COLORS.muted;
  x.font = `500 28px ${SHARE_FONT}`;
  x.textAlign = 'center';
  x.fillText(line, W / 2, H - 92);
  const u = appUrl();
  if (u) {
    x.fillStyle = SHARE_COLORS.ai;
    x.font = `600 28px ${SHARE_FONT}`;
    x.fillText(u, W / 2, H - 50);
  }
  x.textAlign = 'left';
}
// shrink a font until the text fits the width
function fitText(x, text, weight, size, family, maxW) {
  let s = size;
  do {
    x.font = `${weight} ${s}px ${family}`;
    if (x.measureText(text).width <= maxW) break;
    s -= 4;
  } while (s > 20);
  return s;
}

// ---- 여행 D-day ----
function drawTripCard(t) {
  const W = 1080,
    H = 1350,
    c = cardCanvas(W, H);
  if (!c) return null;
  const [cv, x] = c;
  const n = t.day - dayIdx();
  const { ph, sg } = tripLists(t.lang);
  const pDone = ph.filter(p => t.done[p.key]).length,
    sDone = sg.filter(signDone).length;
  cardHeader(x, W, t.lang === 'ja' ? '일본 여행 준비' : '여행 영어 준비');
  roundRect(x, 64, 160, W - 128, 560, 36, SHARE_COLORS.surface, SHARE_COLORS.line);
  x.fillStyle = SHARE_COLORS.shu;
  x.textAlign = 'center';
  x.font = `800 220px ${SHARE_FONT}`;
  x.fillText(n > 0 ? `D-${n}` : n === 0 ? 'D-DAY' : '여행 중', W / 2, 440);
  x.fillStyle = SHARE_COLORS.ink;
  fitText(x, t.name || (t.lang === 'ja' ? '일본 여행' : '해외여행'), 700, 56, SHARE_FONT, W - 220);
  x.fillText(t.name || (t.lang === 'ja' ? '일본 여행' : '해외여행'), W / 2, 540);
  x.fillStyle = SHARE_COLORS.muted;
  x.font = `500 34px ${SHARE_FONT}`;
  x.fillText(idxDate(t.day).replace(/-/g, '.') + ' 출발', W / 2, 610);
  x.textAlign = 'left';
  const bar = (Y, label, done, total) => {
    x.fillStyle = SHARE_COLORS.ink;
    x.font = `600 38px ${SHARE_FONT}`;
    x.fillText(label, 96, Y);
    x.textAlign = 'right';
    x.fillStyle = SHARE_COLORS.muted;
    x.font = `600 36px ${SHARE_FONT}`;
    x.fillText(`${done} / ${total}`, W - 96, Y);
    x.textAlign = 'left';
    roundRect(x, 96, Y + 22, W - 192, 22, 11, SHARE_COLORS.aiSoft);
    if (total && done) roundRect(x, 96, Y + 22, Math.max(22, ((W - 192) * done) / total), 22, 11, SHARE_COLORS.shu);
  };
  bar(800, '익힌 여행 문장', pDone, ph.length);
  if (sg.length) bar(910, '읽을 수 있는 간판', sDone, sg.length);
  // one phrase they already learned (or the first one)
  const p = ph.find(q => t.done[q.key]) || ph[0];
  if (p) {
    const Y = sg.length ? 1010 : 920;
    roundRect(x, 64, Y, W - 128, 170, 28, SHARE_COLORS.aiSoft);
    x.fillStyle = SHARE_COLORS.ai;
    fitText(x, p.t, 700, 48, t.lang === 'ja' ? JP_FONT : SHARE_FONT, W - 200);
    x.fillText(p.t, 100, Y + 76);
    x.fillStyle = SHARE_COLORS.muted;
    x.font = `500 32px ${SHARE_FONT}`;
    x.fillText(p.ko, 100, Y + 130);
  }
  cardFooter(x, W, H, '여행 가기 전 하루 10분 벼락치기');
  return cv;
}
async function shareTripCard() {
  const t = tripOf(S.lang);
  if (!t) return;
  await loadCardFonts();
  const n = t.day - dayIdx();
  shareImage(drawTripCard(t), `${t.name || '여행'} ${n > 0 ? 'D-' + n : 'D-DAY'}! 하나마루로 여행 회화 준비 중`, '여행 D-day 카드');
}

// ---- 한국음 발견 카드 ----
function drawHanjaCard(w) {
  const W = 1080,
    H = 1350,
    c = cardCanvas(W, H);
  if (!c) return null;
  const [cv, x] = c;
  cardHeader(x, W, '한국어를 알면 일본어가 보여요');
  roundRect(x, 64, 160, W - 128, 600, 36, SHARE_COLORS.surface, SHARE_COLORS.line);
  x.textAlign = 'center';
  x.fillStyle = SHARE_COLORS.ink;
  x.font = `800 150px ${SHARE_FONT}`;
  x.fillText(w.ko, W / 2, 350);
  x.fillStyle = SHARE_COLORS.muted;
  x.font = `500 60px ${SHARE_FONT}`;
  x.fillText('=', W / 2, 440);
  x.fillStyle = SHARE_COLORS.ink;
  x.font = `700 110px ${JP_FONT}`;
  x.fillText(w.k, W / 2, 570);
  x.fillStyle = SHARE_COLORS.shu;
  fitText(x, w.r, 700, 84, JP_FONT, W - 200);
  x.fillText(w.r, W / 2, 690);
  x.textAlign = 'left';
  // per-kanji breakdown
  let Y = 880;
  for (const [k, h, o, v, t] of w.s.slice(0, 4)) {
    roundRect(x, 64, Y - 62, W - 128, 92, 22, SHARE_COLORS.aiSoft);
    x.fillStyle = SHARE_COLORS.ink;
    x.font = `700 52px ${JP_FONT}`;
    x.fillText(k, 96, Y);
    x.font = `600 42px ${SHARE_FONT}`;
    x.fillText(h, 176, Y - 2);
    x.fillStyle = SHARE_COLORS.ai;
    x.font = `600 42px ${JP_FONT}`;
    x.fillText('→ ' + o + (v !== o ? ` → ${v}` : ''), 260, Y - 2);
    const r = hjRuleOf(h);
    x.textAlign = 'right';
    x.fillStyle = SHARE_COLORS.muted;
    x.font = `500 28px ${SHARE_FONT}`;
    const rule = r && r.id !== '0' ? `${r.from} → ${r.to.split(' (')[0].split(',')[0]}` : '';
    x.fillText([rule, t].filter(Boolean).join(' · '), W - 96, Y - 4);
    x.textAlign = 'left';
    Y += 112;
  }
  cardFooter(x, W, H, '받침 ㄱ은 く, ㄹ은 つ, ㅇ은 장음 — 한국음 규칙으로 읽어 보세요');
  return cv;
}
async function shareHanjaCard(k) {
  const w = HJW_ITEMS.find(x => x.k === k) || HJW_ITEMS[Math.floor(Math.random() * HJW_ITEMS.length)];
  if (!w) return;
  await loadCardFonts();
  shareImage(drawHanjaCard(w), `${w.ko} = ${w.k} = ${w.r}! 한국어를 알면 일본어가 보여요 · 하나마루`, '한국음 카드');
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-share-trip],[data-share-hj]');
  if (!b) return;
  if (b.dataset.shareHj !== undefined) shareHanjaCard(b.dataset.shareHj);
  else shareTripCard();
});
