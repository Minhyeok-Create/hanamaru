'use strict';
/* ---------- share card ---------- */
const HANAMARU_PATHS = [
  'M16 3.5c7.6 0 12.6 5.3 12.3 12.6-.3 7-5.8 12.3-12.6 12.1C8.9 28 3.6 22.7 3.8 15.6 4 8.7 9.2 3.9 16.6 4.2',
  'M16.4 9.6c3.6.2 6 2.9 5.7 6.3-.3 3.3-3.1 5.8-6.4 5.5-3.2-.3-5.4-3-5.1-6.1.3-2.7 2.5-4.4 5-4.2 2.3.2 3.7 2 3.5 4.1-.2 1.7-1.6 2.9-3.2 2.7'
];
// Image cards always use the light palette so they look the same when shared.
const SHARE_COLORS = {
  paper: '#EDEFE9',
  surface: '#FAFBF7',
  ink: '#19202C',
  muted: '#5B6371',
  line: '#CDD2C7',
  ai: '#2A4A7C',
  aiSoft: '#DCE3EE',
  shu: '#C9372C',
  shuSoft: '#F6E1DE',
  ok: '#2C7A4D'
};
const SHARE_FONT = '"IBM Plex Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
function roundRect(x, X, Y, w, h, r, fill, stroke) {
  r = Math.min(r, h / 2, w / 2);
  x.beginPath();
  x.moveTo(X + r, Y);
  x.arcTo(X + w, Y, X + w, Y + h, r);
  x.arcTo(X + w, Y + h, X, Y + h, r);
  x.arcTo(X, Y + h, X, Y, r);
  x.arcTo(X, Y, X + w, Y, r);
  x.closePath();
  if (fill) {
    x.fillStyle = fill;
    x.fill();
  }
  if (stroke) {
    x.strokeStyle = stroke;
    x.lineWidth = 2;
    x.stroke();
  }
}
function drawMark(x, X, Y, s, w) {
  if (typeof Path2D === 'undefined') return;
  x.save();
  x.translate(X, Y);
  x.scale(s, s);
  x.strokeStyle = SHARE_COLORS.shu;
  x.lineCap = 'round';
  x.lineWidth = w / s;
  for (const p of HANAMARU_PATHS) x.stroke(new Path2D(p));
  x.restore();
}
async function loadCardFonts() {
  try {
    if (document.fonts && document.fonts.load) {
      await Promise.race([
        Promise.all([document.fonts.load('700 60px "IBM Plex Sans KR"'), document.fonts.load('500 30px "IBM Plex Sans KR"')]),
        new Promise(r => setTimeout(r, 1500))
      ]);
    }
  } catch (e) {}
}
// Show a canvas as an image in a sheet with share / save actions.
function shareImage(cv, text, title) {
  if (!cv) {
    toast('이 화면에서는 이미지를 만들 수 없어요');
    return;
  }
  let url = '';
  try {
    url = cv.toDataURL('image/png');
  } catch (e) {}
  if (!url) {
    toast('이미지를 만들 수 없어요');
    return;
  }
  const el = openSheet(
    `<div class="sheet-h"><b>${esc(title)}</b><button type="button" class="icon-btn" data-close aria-label="닫기">${XICON}</button></div>
    <img class="share-img" src="${url}" alt="${esc(title)}">
    <p class="note">이미지를 길게 누르면 사진 앱에 저장하거나 카톡으로 보낼 수 있어요.</p>
    <div class="row"><button type="button" class="btn primary" data-sh="share">공유하기</button><a class="btn" href="${url}" download="hanamaru.png" style="text-decoration:none;display:inline-flex;align-items:center;color:var(--ink)">이미지 저장</a></div>`,
    'share'
  );
  el.querySelector('[data-sh=share]').addEventListener('click', async () => {
    try {
      const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
      const file = new File([blob], 'hanamaru.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text });
        return;
      }
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    copyText(text, '기록 문구를 복사했어요. 이미지는 길게 눌러 저장해 주세요.', () => toast('이미지를 길게 눌러 저장한 뒤 보내 주세요'));
  });
}
function drawShareCard() {
  const W = 1080,
    H = 1440;
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
  const font = (w, s) => {
    x.font = `${w} ${s}px ${F}`;
  };
  const rr = (X, Y, w, h, r, fill, stroke) => roundRect(x, X, Y, w, h, r, fill, stroke);
  const mark = (X, Y, s, w) => drawMark(x, X, Y, s, w);
  const d = S.days[today()] || { n: 0, c: 0 };
  const ja = S.lang === 'ja';
  const now = new Date();
  x.fillStyle = C.paper;
  x.fillRect(0, 0, W, H);
  x.textBaseline = 'alphabetic';
  mark(80, 74, 2.4, 6);
  font(700, 50);
  x.fillStyle = C.ink;
  x.textAlign = 'left';
  x.fillText('하나마루', 172, 132);
  font(500, 34);
  x.fillStyle = C.muted;
  x.textAlign = 'right';
  x.fillText(`${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()} · ${ja ? '일본어' : '영어'}`, 1000, 130);
  x.textAlign = 'left';
  const lv = levelOf(S.xp[S.lang]);
  const tt = titleOf(S.lang, lv.L);
  font(700, 40);
  const tw = x.measureText(`Lv.${lv.L}`).width;
  font(600, 40);
  const tw2 = x.measureText(tt).width;
  rr(80, 182, tw + tw2 + 110, 84, 42, C.shu);
  font(700, 40);
  x.fillStyle = '#fff';
  x.fillText(`Lv.${lv.L}`, 118, 238);
  font(600, 40);
  x.fillText(tt, 118 + tw + 30, 238);
  const o = 110;
  rr(80, 190 + o, 920, 500, 40, C.surface, C.line);
  font(600, 38);
  x.fillStyle = C.muted;
  x.fillText('오늘 공부한 문제', 140, 282 + o);
  font(700, 200);
  x.fillStyle = C.ink;
  const nT = String(d.n);
  x.fillText(nT, 132, 480 + o);
  const nw = x.measureText(nT).width;
  font(600, 60);
  x.fillText('문제', 150 + nw, 480 + o);
  font(500, 40);
  x.fillStyle = C.muted;
  const goal = S.set.goal;
  x.fillText(
    `정답률 ${d.n ? Math.round((d.c / d.n) * 100) + '%' : '–'}${goal ? ` · 목표 ${goal}문제 ${d.n >= goal ? '달성' : '중 ' + d.n}` : ''}`,
    140,
    566 + o
  );
  const cd = curDay(S.lang),
    cn = COURSE[S.lang].length,
    fin = daysDone(S.lang);
  font(600, 36);
  x.fillStyle = C.ai;
  x.fillText(fin >= cn ? '60일 코스 완주!' : `${stageOf(S.lang, Math.min(cd, cn - 1))} · ${cd + 1}일차 도전 중`, 140, 640 + o);
  if (d.n > 0) {
    mark(700, 250 + o, 9, 15);
  } else {
    x.save();
    x.setLineDash([14, 16]);
    x.strokeStyle = C.line;
    x.lineWidth = 6;
    x.beginPath();
    x.arc(844, 394 + o, 130, 0, Math.PI * 2);
    x.stroke();
    x.restore();
  }
  const kp = [
    [streak() + '일', '연속 학습'],
    [stampTotal(S.lang) + '개', '여행 도장'],
    [cardCount(S.lang) + '장', '단어 카드']
  ];
  kp.forEach(([v, l], i) => {
    const X = 80 + i * (293 + 20);
    rr(X, 725 + o, 293, 190, 30, C.surface, C.line);
    font(700, 64);
    x.fillStyle = C.ink;
    x.fillText(v, X + 34, 830 + o);
    font(500, 32);
    x.fillStyle = C.muted;
    x.fillText(l, X + 34, 880 + o);
  });
  rr(80, 950 + o, 920, 290, 30, C.surface, C.line);
  font(600, 34);
  x.fillStyle = C.muted;
  x.fillText('최근 7일', 120, 1010 + o);
  font(500, 30);
  x.textAlign = 'right';
  x.fillText(`누적 ${totalN().toLocaleString()}문제`, 960, 1010 + o);
  x.textAlign = 'left';
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const dd = new Date();
    dd.setDate(dd.getDate() - i);
    const k = dayKey(dd);
    week.push({ l: '일월화수목금토'[dd.getDay()], n: S.days[k]?.n || 0, t: i === 0 });
  }
  const mx = Math.max(10, ...week.map(w => w.n));
  const bw = 70,
    gap = (840 - 7 * bw) / 6;
  week.forEach((w, i) => {
    const X = 120 + i * (bw + gap);
    const h = Math.round((130 * w.n) / mx);
    rr(X, 1180 + o - Math.max(h, 4), bw, Math.max(h, 4), 12, w.n ? (w.t ? C.shu : C.ai) : C.line);
    font(500, 28);
    x.fillStyle = C.muted;
    x.textAlign = 'center';
    x.fillText(w.l, X + bw / 2, 1222 + o);
    if (w.n) {
      font(600, 28);
      x.fillStyle = C.ink;
      x.fillText(String(w.n), X + bw / 2, 1170 + o - h);
    }
    x.textAlign = 'left';
  });
  font(500, 30);
  x.fillStyle = C.muted;
  x.textAlign = 'center';
  x.fillText('하나마루 · 일본어·영어 회화 기초', W / 2, 1400);
  x.textAlign = 'left';
  return cv;
}
async function shareCard() {
  await loadCardFonts();
  shareImage(drawShareCard(), `하나마루 · 오늘 ${(S.days[today()] || { n: 0 }).n}문제 · ${streak()}일 연속`, '결과 카드');
}
