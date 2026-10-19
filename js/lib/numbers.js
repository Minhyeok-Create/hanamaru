'use strict';
/* japanese numbers */
const JD = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];
function jpNum(n) {
  if (n === 0) return 'ゼロ';
  let s = '';
  const man = Math.floor(n / 10000);
  if (man) {
    s += jpNum(man) + 'まん';
    n %= 10000;
  }
  const sen = Math.floor(n / 1000);
  if (sen) s += { 1: 'せん', 3: 'さんぜん', 8: 'はっせん' }[sen] || JD[sen] + 'せん';
  n %= 1000;
  const hy = Math.floor(n / 100);
  if (hy) s += { 1: 'ひゃく', 3: 'さんびゃく', 6: 'ろっぴゃく', 8: 'はっぴゃく' }[hy] || JD[hy] + 'ひゃく';
  n %= 100;
  const ju = Math.floor(n / 10);
  if (ju) s += (ju === 1 ? '' : JD[ju]) + 'じゅう';
  n %= 10;
  if (n) s += JD[n];
  return s;
}
const JP_HOUR = {
  1: 'いちじ',
  2: 'にじ',
  3: 'さんじ',
  4: 'よじ',
  5: 'ごじ',
  6: 'ろくじ',
  7: 'しちじ',
  8: 'はちじ',
  9: 'くじ',
  10: 'じゅうじ',
  11: 'じゅういちじ',
  12: 'じゅうにじ'
};
const JP_MIN = {
  5: 'ごふん',
  10: 'じゅっぷん',
  15: 'じゅうごふん',
  20: 'にじゅっぷん',
  25: 'にじゅうごふん',
  30: 'さんじゅっぷん',
  35: 'さんじゅうごふん',
  40: 'よんじゅっぷん',
  45: 'よんじゅうごふん',
  50: 'ごじゅっぷん',
  55: 'ごじゅうごふん'
};

/* english numbers */
const EN_ONES = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen'
];
const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function enNum(n) {
  if (n < 20) return EN_ONES[n];
  if (n < 100) return EN_TENS[Math.floor(n / 10)] + (n % 10 ? '-' + EN_ONES[n % 10] : '');
  if (n < 1000) return EN_ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + enNum(n % 100) : '');
  return enNum(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + enNum(n % 1000) : '');
}
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pickOne = a => a[Math.floor(Math.random() * a.length)];
function genNumQ(lang, type) {
  if (lang === 'ja') {
    if (type === 'price') {
      const n = pickOne([
        rnd(1, 9) * 100 + rnd(0, 9) * 10,
        rnd(1, 30) * 100,
        rnd(1, 9) * 1000 + rnd(0, 9) * 100 + pickOne([0, 0, 50, 80]),
        rnd(1, 3) * 10000 + rnd(0, 9) * 1000
      ]);
      return { type, say: `${n}円`, show: `${n.toLocaleString('ja-JP')}円`, read: jpNum(n) + 'えん', ans: { n } };
    }
    if (type === 'time') {
      const h = rnd(1, 12);
      const m = pickOne([0, 5, 10, 15, 20, 25, 30, 30, 35, 40, 45, 50, 55]);
      const half = m === 30 && Math.random() < 0.5;
      return {
        type,
        say: m === 0 ? `${h}時` : half ? `${h}時半` : `${h}時${m}分`,
        show: m === 0 ? `${h}時` : half ? `${h}時半` : `${h}時${m}分`,
        read: JP_HOUR[h] + (m === 0 ? '' : half ? ' はん' : ' ' + JP_MIN[m]),
        ans: { h, m }
      };
    }
    const n = pickOne([rnd(1, 99), rnd(100, 999), rnd(1000, 9999)]);
    return { type, say: String(n), show: String(n), read: jpNum(n), ans: { n } };
  }
  if (type === 'price') {
    const d = pickOne([rnd(1, 20), rnd(10, 99), rnd(100, 499)]);
    const c = pickOne([0, 0, 25, 50, 75, 99, 49, 95]);
    const say = c ? `$${d}.${String(c).padStart(2, '0')}` : `$${d}`;
    return {
      type,
      say,
      show: say,
      read: `${enNum(d)} dollar${d === 1 ? '' : 's'}${c ? ' and ' + enNum(c) + ' cents' : ''}`,
      ans: { cents: d * 100 + c }
    };
  }
  if (type === 'time') {
    const h = rnd(1, 12);
    const m = Math.random() < 0.6 ? pickOne([0, 5, 10, 15, 20, 30, 40, 45, 50]) : rnd(1, 59);
    const mm = String(m).padStart(2, '0');
    return {
      type,
      say: m === 0 ? `${h} o'clock` : `${h}:${mm}`,
      show: `${h}:${mm}`,
      read: m === 0 ? `${enNum(h)} o'clock` : `${enNum(h)} ${m < 10 ? 'oh ' + enNum(m) : enNum(m)}`,
      ans: { h, m }
    };
  }
  const n = pickOne([rnd(13, 19), rnd(2, 9) * 10, rnd(21, 99), rnd(100, 999), rnd(1000, 9999)]);
  return { type, say: n.toLocaleString('en-US'), show: n.toLocaleString('en-US'), read: enNum(n), ans: { n } };
}
function checkNum(q, input) {
  const raw = (input || '').replace(/[,，\s$円엔]/g, '');
  if (q.type === 'time') {
    const d = raw.replace(/\D/g, '');
    if (!d) return null;
    let h, m;
    if (d.length <= 2) {
      h = +d;
      m = 0;
    } else if (d.length === 3) {
      h = +d[0];
      m = +d.slice(1);
    } else {
      h = +d.slice(0, 2);
      m = +d.slice(2, 4);
    }
    return h === q.ans.h && m === q.ans.m;
  }
  if (q.ans.cents !== undefined) {
    if (!/\d/.test(raw)) return null;
    const v = raw.includes('.') ? Math.round(parseFloat(raw) * 100) : parseInt(raw.replace(/\D/g, ''), 10) * 100;
    return v === q.ans.cents;
  }
  const d = raw.replace(/\D/g, '');
  if (!d) return null;
  return parseInt(d, 10) === q.ans.n;
}
