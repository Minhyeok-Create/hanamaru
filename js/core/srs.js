'use strict';
/* stats & spaced repetition */
const LADDER = [1, 3, 7, 14, 30, 60];
const isWeak = k => {
  const s = S.stats[k];
  return !!s && s.w > 0 && s.s < 2;
};
const isDone = k => {
  const s = S.stats[k];
  return !!s && s.s >= 2 && s.c >= 2;
};
const isDue = k => {
  const s = S.stats[k];
  return !!s && s.d !== undefined && s.d <= dayIdx();
};
function itemStatus(k) {
  const s = S.stats[k];
  if (!s) return '';
  if (isWeak(k)) return 'weak';
  if (isDone(k)) return 'done';
  return 'learn';
}
function srs(s, ok) {
  const t = dayIdx();
  if (ok) {
    const nx = LADDER.find(x => x > (s.iv || 0)) || Math.round((s.iv || 60) * 1.5);
    s.iv = nx;
    s.d = t + nx;
  } else {
    s.iv = 0;
    s.d = t;
  }
}
function record(k, ok) {
  let prev = null;
  if (k) {
    prev = S.stats[k] ? { ...S.stats[k] } : null;
    const s = S.stats[k] || (S.stats[k] = { c: 0, w: 0, s: 0 });
    if (ok) {
      s.c++;
      s.s++;
    } else {
      s.w++;
      s.s = 0;
      s.lw = dayIdx();
    }
    if (s.f === undefined) s.f = dayIdx();
    srs(s, ok);
  }
  const d = S.days[today()] || (S.days[today()] = { n: 0, c: 0 });
  d.n++;
  if (ok) d.c++;
  const g = keyGroup(k);
  d.m = d.m || {};
  d.m[g] = (d.m[g] || 0) + 1;
  LAST_GAIN = 0;
  gainXP(ok ? 10 : 3);
  missionEvent('answer', { ok, key: k, isNew: !!k && !prev, isReview: !!prev });
  if (S.set.goal && d.n === S.set.goal) {
    S.goalDays[today()] = 1;
    toast(`오늘 목표 ${S.set.goal}문제 달성! 하나마루`);
    grantTicket(S.lang, '오늘 목표 달성');
  }
  save();
  checkBadges();
  return prev;
}
function forceCorrect(k, prev) {
  if (k) {
    if (prev) S.stats[k] = prev;
    else delete S.stats[k];
    const s = S.stats[k] || (S.stats[k] = { c: 0, w: 0, s: 0 });
    s.c++;
    s.s++;
    srs(s, true);
  }
  const d = S.days[today()];
  if (d) d.c++;
  save();
  checkBadges();
}
function weight(k) {
  const s = S.stats[k];
  if (!s) return 1.4;
  let w = 1 + Math.max(0, s.w * 2 - s.c) * 0.8;
  if (s.s === 0 && s.w > 0) w += 2.5;
  if (s.s >= 3) w *= 0.5;
  return Math.max(0.25, w);
}
function pickN(pool, n) {
  const arr = pool.map(p => ({ p, w: weight(p.key) }));
  const out = [];
  n = Math.min(n, arr.length);
  while (out.length < n) {
    const tot = arr.reduce((a, b) => a + b.w, 0);
    let r = Math.random() * tot,
      i = 0;
    for (; i < arr.length - 1; i++) {
      r -= arr[i].w;
      if (r <= 0) break;
    }
    out.push(arr[i].p);
    arr.splice(i, 1);
  }
  return out;
}
const shuffle = a => {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const doneCount = keys => keys.filter(isDone).length;
