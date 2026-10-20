'use strict'; var BUNDLE_MAP = [[3, "core/errlog.js"], [66, "lib/conjugate.js"], [278, "lib/numbers.js"], [443, "lib/dictation.js"], [533, "content/kana.js"], [586, "content/items.js"], [626, "lib/romaji.js"], [716, "content/items-extra.js"], [761, "core/storage.js"], [923, "core/srs.js"], [1041, "core/badges.js"], [1129, "core/backup.js"], [1220, "core/speech.js"], [1341, "ui/shell.js"], [1773, "ui/menu.js"], [1956, "ui/home.js"], [2150, "quiz/engine.js"], [2678, "quiz/input.js"], [2798, "quiz/kana.js"], [2902, "quiz/words.js"], [3092, "quiz/loan-conj.js"], [3167, "quiz/sentences.js"], [3299, "quiz/dictation-numbers.js"], [3424, "quiz/flow.js"], [3717, "quiz/speed.js"], [3885, "views/reference.js"], [3972, "views/wordlist.js"], [4165, "views/stats.js"], [4289, "quiz/modes-extra.js"], [4408, "features/shadowing.js"], [4513, "features/dialogue.js"], [4693, "views/grammar-notes.js"], [4748, "views/today.js"], [4863, "core/update.js"], [4923, "quiz/counters.js"], [5274, "quiz/polite.js"], [5323, "quiz/jp-pairs.js"], [5373, "quiz/english-grammar.js"], [5450, "quiz/made-english.js"], [5494, "quiz/hanja.js"], [5742, "quiz/ko-traps.js"], [5852, "quiz/en-traps.js"], [5921, "quiz/kansai.js"], [5962, "features/course.js"], [6839, "ui/sheet.js"], [6871, "features/share-card.js"], [7190, "ui/help.js"], [7497, "play/setup.js"], [7526, "features/sound.js"], [7587, "features/levels.js"], [7712, "play/cards.js"], [7855, "play/stamps.js"], [8049, "play/omikuji.js"], [8185, "play/rain.js"], [8399, "play/match.js"], [8527, "play/vs.js"], [8769, "play/play.js"], [8902, "features/missions.js"], [8998, "features/seasons.js"], [9053, "features/weekly.js"], [9287, "features/level-test.js"], [9535, "features/autoplay.js"], [9733, "views/wrong-notes.js"], [9806, "features/support.js"], [9903, "ui/settings.js"], [10142, "features/travel.js"], [10284, "features/writing.js"], [10451, "features/flashcards.js"], [10593, "features/share-words.js"], [10733, "views/hanja-rules.js"], [10857, "features/signs.js"], [10938, "features/trip.js"], [11098, "features/daily.js"], [11219, "features/share-more.js"], [11385, "views/weak.js"], [11509, "features/ai.js"], [11570, "features/aichat.js"], [11908, "features/diary.js"], [12047, "features/mycard.js"], [12301, "features/reader.js"], [12472, "ui/welcome.js"], [12573, "ui/search.js"], [12704, "ui/whats-new.js"], [12799, "boot.js"]];
// ---- core/errlog.js ----
'use strict';
/* ================= 오류 알림: when the app breaks on someone's phone, send what broke (never their records or text) =================
   Goes to the AI server's /log (only if js/config.js has an AI endpoint). Shows up in Cloudflare → Worker → Logs. */
const ERRLOG = { sent: new Set(), n: 0 };
function reportError(msg, src, stack) {
  try {
    const ep = (APP_CONFIG.ai || {}).endpoint || '';
    if (!/^https:\/\//.test(ep) || !location.protocol.startsWith('http')) return;
    msg = String(msg || '').slice(0, 200);
    if (
      !msg ||
      /^Script error\.?$/i.test(msg.trim()) ||
      /ResizeObserver loop|extension:\/\/|chrome-extension|safari-extension|moz-extension/i.test(msg + ' ' + src)
    )
      return;
    const key = msg + '|' + src;
    if (ERRLOG.sent.has(key) || ERRLOG.n >= 3) return; // at most 3 different errors per visit
    ERRLOG.sent.add(key);
    ERRLOG.n++;
    // app.js is one bundle: turn "app.js:1234" back into the source file name
    const at = String(src || '').replace(/^.*\/js\/app\.js[^:]*:(\d+):?(\d*)/, (m, l) => {
      const ln = +l;
      let f = 'app.js';
      if (typeof BUNDLE_MAP !== 'undefined') for (const [start, name] of BUNDLE_MAP) if (ln >= start) f = `${name}:${ln - start + 1}`;
      return f;
    });
    const ua = navigator.userAgent || '';
    const dev =
      (ua.match(/iPhone OS [\d_]+|iPad|Android [\d.]+|Windows NT [\d.]+|Mac OS X [\d_]+/) || ['기타'])[0] +
      ' · ' +
      (ua.match(/CriOS|FxiOS|EdgiOS|KAKAOTALK|Instagram|NAVER|Line|SamsungBrowser|Chrome|Safari/) || ['?'])[0];
    const body = JSON.stringify({
      msg,
      at: at.slice(0, 160),
      stack: String(stack || '')
        .split('\n')
        .slice(0, 4)
        .join(' | ')
        .slice(0, 400),
      ver: typeof APP_VERSION !== 'undefined' ? APP_VERSION : '',
      mod: typeof CUR_MOD !== 'undefined' ? CUR_MOD || 'menu' : '',
      lang: typeof S !== 'undefined' ? S.lang : '',
      dev,
      app:
        window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches)
          ? 'home-screen'
          : 'browser'
    });
    const url = ep.replace(/\/$/, '') + '/log';
    if (navigator.sendBeacon) navigator.sendBeacon(url, body);
    else fetch(url, { method: 'POST', body, keepalive: true }).catch(() => {});
  } catch (e) {}
}
window.addEventListener('error', e => {
  if (e && e.message) reportError(e.message, `${e.filename || ''}:${e.lineno || ''}:${e.colno || ''}`, e.error && e.error.stack);
});
window.addEventListener('unhandledrejection', e => {
  const r = e && e.reason;
  if (r && (r.name === 'AbortError' || /fetch|network|load failed/i.test(String(r.message || r)))) return; // offline etc. is not a bug
  reportError('promise: ' + String((r && r.message) || r), '', r && r.stack);
});

// ---- lib/conjugate.js ----
'use strict';
/* ================= pure logic: conjugation, numbers, dictation ================= */
const U_ROW = 'うくぐすつぬぶむる';
const I_E_ROW = 'いきぎしじちぢにひびぴみりえけげせぜてでねへべぺめれ';
const GODAN_EX = new Set([
  '帰る',
  '入る',
  '走る',
  '知る',
  '切る',
  '要る',
  '減る',
  '喋る',
  '滑る',
  '握る',
  '蹴る',
  '焦る',
  '限る',
  '参る',
  '散る',
  '練る',
  '照る',
  '茂る',
  '遮る',
  'しゃべる',
  'かえる',
  'はいる',
  'はしる'
]);
const TO_I = { う: 'い', く: 'き', ぐ: 'ぎ', す: 'し', つ: 'ち', ぬ: 'に', ぶ: 'び', む: 'み', る: 'り' };
const TO_A = { う: 'わ', く: 'か', ぐ: 'が', す: 'さ', つ: 'た', ぬ: 'な', ぶ: 'ば', む: 'ま', る: 'ら' };
const TE = { う: 'って', つ: 'って', る: 'って', く: 'いて', ぐ: 'いで', す: 'して', ぬ: 'んで', ぶ: 'んで', む: 'んで' };
const TO_E = { う: 'え', く: 'け', ぐ: 'げ', す: 'せ', つ: 'て', ぬ: 'ね', ぶ: 'べ', む: 'め', る: 'れ' };
const TO_O = { う: 'お', く: 'こ', ぐ: 'ご', す: 'そ', つ: 'と', ぬ: 'の', ぶ: 'ぼ', む: 'も', る: 'ろ' };
const FORMS = {
  masu: '~ます (정중형)',
  te: '~て (연결형)',
  nai: '~ない (부정형)',
  ta: '~た (과거형)',
  pot: '~える·~られる (가능형 N4)',
  vol: '~おう·~よう (의지형 N4)'
};
const FORM_SHORT = { masu: 'ます형', te: 'て형', nai: 'ない형', ta: 'た형', pot: '가능형', vol: '의지형' };
// verbs that are not used in the potential / volitional form (things that just happen)
const NO_PV = new Set([
  'ある',
  'わかる',
  '分かる',
  'できる',
  '出来る',
  '要る',
  '見える',
  '聞こえる',
  '似る',
  '違う',
  '困る',
  '疲れる',
  '晴れる',
  '曇る',
  '降る',
  '咲く',
  '光る',
  '鳴る',
  '壊れる',
  '止まる',
  '始まる',
  '終わる',
  '開く',
  '閉まる',
  '落ちる',
  '消える',
  '死ぬ',
  '空く',
  '込む',
  '混む',
  '似合う',
  '足りる',
  '冷える',
  '治る',
  '直る',
  '驚く',
  '生まれる',
  '亡くなる',
  '無くなる',
  'なくなる',
  '怒る',
  '太る',
  '痩せる',
  '割れる',
  '汚れる',
  '揺れる',
  '倒れる',
  '慌てる',
  '間に合う',
  'かかる',
  '掛かる',
  '知る'
]);
function verbGroup(w, r) {
  if (r === 'くる' && /来る$/.test(w)) return 'kuru';
  if (/する$/.test(r)) return 'suru';
  const last = r.slice(-1);
  if (!U_ROW.includes(last)) return null;
  if (last === 'る' && I_E_ROW.includes(r.slice(-2, -1)) && !GODAN_EX.has(w) && !GODAN_EX.has(r)) return 'ichi';
  return 'godan';
}
const teToTa = s => s.replace(/て$/, 'た').replace(/で$/, 'だ');
function conjOne(base, group, form, isIku, isAru) {
  const stem = base.slice(0, -1),
    last = base.slice(-1);
  if (group === 'suru') {
    const p = base.slice(0, -2);
    return p + { masu: 'します', te: 'して', nai: 'しない', ta: 'した', pot: 'できる', vol: 'しよう' }[form];
  }
  if (group === 'ichi') return stem + { masu: 'ます', te: 'て', nai: 'ない', ta: 'た', pot: 'られる', vol: 'よう' }[form];
  if (form === 'pot') return stem + TO_E[last] + 'る';
  if (form === 'vol') return stem + TO_O[last] + 'う';
  if (form === 'masu') return stem + TO_I[last] + 'ます';
  if (form === 'nai') return isAru ? 'ない' : stem + TO_A[last] + 'ない';
  const te = isIku ? stem + 'って' : stem + TE[last];
  return form === 'te' ? te : teToTa(te);
}
function conjugate(v, form) {
  const g = verbGroup(v.w, v.r);
  if (!g) return null;
  if ((form === 'pot' || form === 'vol') && (NO_PV.has(v.w) || NO_PV.has(v.r))) return null;
  if (g === 'kuru') {
    const t = {
      masu: ['来ます', 'きます'],
      te: ['来て', 'きて'],
      nai: ['来ない', 'こない'],
      ta: ['来た', 'きた'],
      pot: ['来られる', 'こられる'],
      vol: ['来よう', 'こよう']
    }[form];
    const p = v.w.slice(0, -2);
    return { w: p + t[0], r: v.r.slice(0, -2) + t[1] };
  }
  const isIku = v.r === 'いく' || /行く$/.test(v.w);
  const isAru = v.r === 'ある';
  return { w: conjOne(v.w, g, form, isIku, (isAru && v.w === 'ある') || isAru), r: conjOne(v.r, g, form, isIku, isAru) };
}
function conjWrongs(v, form) {
  const g = verbGroup(v.w, v.r);
  const out = [];
  const right = conjugate(v, form);
  const add = (w, r) => {
    if (w && r && r !== right.r && !out.some(o => o.r === r)) out.push({ w, r });
  };
  if (g === 'godan' || g === 'ichi') {
    const other = g === 'godan' ? 'ichi' : 'godan';
    if (!(other === 'godan' && !TO_I[v.r.slice(-1)]) && !(form === 'pot' && (g === 'ichi' || v.r.slice(-1) === 'る')))
      add(conjOne(v.w, other, form, false, false), conjOne(v.r, other, form, false, false));
    if ((form === 'te' || form === 'ta') && g === 'godan') {
      for (const e of ['って', 'いて', 'んで', 'して']) {
        const t = v.r.slice(0, -1) + e,
          tw = v.w.slice(0, -1) + e;
        add(form === 'te' ? tw : teToTa(tw), form === 'te' ? t : teToTa(t));
      }
    }
    if (form === 'nai' && g === 'godan') {
      add(v.w.slice(0, -1) + TO_I[v.r.slice(-1)] + 'ない', v.r.slice(0, -1) + TO_I[v.r.slice(-1)] + 'ない');
    }
    if (form === 'masu' && g === 'godan') {
      add(v.w.slice(0, -1) + 'ます', v.r.slice(0, -1) + 'ます');
    }
    if (form === 'masu' && g === 'ichi') {
      add(v.w.slice(0, -1) + 'ります', v.r.slice(0, -1) + 'ります');
    }
    if ((form === 'pot' || form === 'vol') && g === 'godan') {
      const i = TO_I[v.r.slice(-1)],
        e = form === 'pot' ? 'られる' : 'よう';
      add(v.w.slice(0, -1) + i + e, v.r.slice(0, -1) + i + e);
    }
  }
  for (const f of Object.keys(FORMS))
    if (f !== form) {
      const c = conjugate(v, f);
      if (c) add(c.w, c.r);
    }
  if (g === 'suru') {
    const p = v.w.slice(0, -2),
      pr = v.r.slice(0, -2);
    if (form === 'pot') {
      add(p + 'しられる', pr + 'しられる');
      add(p + 'する', pr + 'する');
    } else if (form === 'vol') {
      add(p + 'しろう', pr + 'しろう');
      add(p + 'すよう', pr + 'すよう');
    } else {
      add(p + 'すます', pr + 'すます');
      add(p + 'さない', pr + 'さない');
      add(p + 'すて', pr + 'すて');
    }
  }
  if (g === 'kuru') {
    if (form === 'pot') {
      add('くられる', 'くられる');
      add('きられる', 'きられる');
    } else if (form === 'vol') {
      add('くよう', 'くよう');
      add('きよう', 'きよう');
    } else {
      add('来ります', 'くります');
      add('来ない', 'くない');
      add('来って', 'くって');
    }
  }
  return out;
}

// ---- lib/numbers.js ----
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

// ---- lib/dictation.js ----
'use strict';
/* dictation */
const EN_CONTR = {
  "i'm": 'i am',
  "you're": 'you are',
  "we're": 'we are',
  "they're": 'they are',
  "he's": 'he is',
  "she's": 'she is',
  "it's": 'it is',
  "that's": 'that is',
  "what's": 'what is',
  "where's": 'where is',
  "how's": 'how is',
  "there's": 'there is',
  "here's": 'here is',
  "let's": 'let us',
  "i'll": 'i will',
  "you'll": 'you will',
  "we'll": 'we will',
  "it'll": 'it will',
  "i'd": 'i would',
  "you'd": 'you would',
  "i've": 'i have',
  "you've": 'you have',
  "we've": 'we have',
  "don't": 'do not',
  "doesn't": 'does not',
  "didn't": 'did not',
  "can't": 'cannot',
  "won't": 'will not',
  "isn't": 'is not',
  "aren't": 'are not',
  "wasn't": 'was not',
  "weren't": 'were not',
  "couldn't": 'could not',
  "wouldn't": 'would not',
  "shouldn't": 'should not',
  "haven't": 'have not',
  "hasn't": 'has not'
};
const enWords = s =>
  s
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9' ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .flatMap(w => (EN_CONTR[w] || w).split(' '))
    .map(w => (w === 'can' ? w : w))
    .join(' ')
    .replace(/\bcan not\b/g, 'cannot')
    .split(' ')
    .filter(Boolean);
function lcsMark(a, b) {
  const n = a.length,
    m = b.length,
    dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const inA = new Array(n).fill(false),
    inB = new Array(m).fill(false);
  let i = 0,
    j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      inA[i] = inB[j] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return { inA, inB };
}

const SCENES = {
  greet: '인사·소개',
  daily: '일상 대화',
  social: '친구·취미',
  food: '식당·카페',
  shop: '쇼핑',
  sight: '관광·구경',
  move: '길·교통',
  stay: '공항·호텔',
  phone: '전화·예약',
  health: '병원·약국',
  help: '곤란할 때'
};

// ---- content/kana.js ----
'use strict';
/* ================= kana ================= */
const BASIC =
  'あ a,い i,う u,え e,お o,か ka,き ki,く ku,け ke,こ ko,さ sa,し shi/si,す su,せ se,そ so,た ta,ち chi/ti,つ tsu/tu,て te,と to,な na,に ni,ぬ nu,ね ne,の no,は ha,ひ hi,ふ fu/hu,へ he,ほ ho,ま ma,み mi,む mu,め me,も mo,や ya,ゆ yu,よ yo,ら ra,り ri,る ru,れ re,ろ ro,わ wa,を wo/o,ん n/nn';
const DAKU =
  'が ga,ぎ gi,ぐ gu,げ ge,ご go,ざ za,じ ji/zi,ず zu,ぜ ze,ぞ zo,だ da,ぢ ji/di/zi,づ zu/du,で de,ど do,ば ba,び bi,ぶ bu,べ be,ぼ bo,ぱ pa,ぴ pi,ぷ pu,ぺ pe,ぽ po';
const YOON =
  'きゃ kya,きゅ kyu,きょ kyo,しゃ sha/sya,しゅ shu/syu,しょ sho/syo,ちゃ cha/tya/cya,ちゅ chu/tyu/cyu,ちょ cho/tyo/cyo,にゃ nya,にゅ nyu,にょ nyo,ひゃ hya,ひゅ hyu,ひょ hyo,みゃ mya,みゅ myu,みょ myo,りゃ rya,りゅ ryu,りょ ryo,ぎゃ gya,ぎゅ gyu,ぎょ gyo,じゃ ja/zya/jya,じゅ ju/zyu/jyu,じょ jo/zyo/jyo,びゃ bya,びゅ byu,びょ byo,ぴゃ pya,ぴゅ pyu,ぴょ pyo';
const PROMPT_OVR = { ぢ: 'di', づ: 'du' };
const parseKana = (s, set) =>
  s.split(',').map(t => {
    const [h, r] = t.split(' ');
    const alts = r.split('/');
    return { h, alts, set, prompt: PROMPT_OVR[h] || alts[0] };
  });
const KANA = [...parseKana(BASIC, 'basic'), ...parseKana(DAKU, 'daku'), ...parseKana(YOON, 'yoon')];
const SETS = { basic: '기본 46', daku: '탁음·반탁음 25', yoon: '요음 33' };
const toKata = s => s.replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));
const toHira = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
const kanaRom = c => {
  const x = KANA.find(k => k.h === toHira(c));
  return x ? x.alts[0] : '';
};
const CONF = [
  ['h', ['ぬ', 'め'], 'ぬ(nu)는 끝에 작은 고리가 있고, め(me)는 고리 없이 끝나요.'],
  ['h', ['わ', 'れ', 'ね'], '오른쪽 끝을 보세요. わ(wa)는 둥글게 닫히고, れ(re)는 바깥으로 뻗고, ね(ne)는 작은 고리로 끝나요.'],
  ['h', ['は', 'ほ'], 'ほ(ho)는 오른쪽 위에 가로획이 하나 더 있어요.'],
  ['h', ['さ', 'き', 'ち'], 'き(ki)는 가로획이 두 개, さ(sa)는 하나예요. ち(chi)는 さ를 좌우로 뒤집은 모양이에요.'],
  ['h', ['る', 'ろ'], 'る(ru)는 끝에 고리가 있고, ろ(ro)는 고리가 없어요.'],
  ['h', ['い', 'り'], 'り(ri)는 오른쪽 획이 길게 내려와요.'],
  ['h', ['こ', 'に'], 'に(ni)는 왼쪽에 세로획이 하나 더 있어요.'],
  ['h', ['あ', 'お'], 'お(o)는 오른쪽 위에 점이 있어요.'],
  ['h', ['ま', 'も'], 'ま(ma)는 세로획이 가로획을 뚫고 아래에 고리가 있고, も(mo)는 세로획이 휘어 올라가요.'],
  ['h', ['う', 'つ', 'ら'], 'つ(tsu)는 한 획이에요. う(u)는 위에 점이 있고, ら(ra)는 왼쪽에 짧은 세로획이 있어요.'],
  [
    'k',
    ['シ', 'ツ'],
    'シ(shi)는 점이 왼쪽에 세로로 놓이고 긴 획이 아래에서 위로 올라가요. ツ(tsu)는 점이 위에 나란히 놓이고 긴 획이 위에서 아래로 내려가요.'
  ],
  ['k', ['ソ', 'ン'], 'ン(n)은 긴 획이 아래에서 위로 올라가고, ソ(so)는 위에서 아래로 내려가요.'],
  ['k', ['ク', 'ケ', 'タ'], 'ケ(ke)는 가로획이 오른쪽으로 길게 나가고, タ(ta)는 ク(ku) 안에 짧은 획이 하나 더 있어요.'],
  ['k', ['ウ', 'ワ', 'フ'], 'ウ(u)는 위에 점이 있고, ワ(wa)는 왼쪽에 짧은 세로획이 있고, フ(fu)는 한 획이에요.'],
  ['k', ['ス', 'ヌ'], 'ヌ(nu)는 가운데를 가로지르는 짧은 획이 있어요.'],
  ['k', ['チ', 'テ'], 'チ(chi)는 위 획이 비스듬하고 세로획이 휘어요. テ(te)는 가로획 두 개가 평평해요.'],
  ['k', ['コ', 'ユ', 'ロ'], 'ロ(ro)는 네모가 닫혀 있고, ユ(yu)는 아래 가로획이 길게 튀어나와요.'],
  ['k', ['ノ', 'メ', 'ナ'], 'ノ(no)는 한 획, メ(me)는 짧은 획이 가로지르고, ナ(na)는 가로획에 세로획이 지나가요.'],
  ['k', ['マ', 'ア'], 'ア(a)는 왼쪽 아래로 긴 획이 내려와요.'],
  ['k', ['ル', 'レ'], 'ル(ru)는 두 획, レ(re)는 한 획이에요.'],
  ['k', ['セ', 'サ'], 'サ(sa)는 세로획이 두 개, セ(se)는 하나예요.'],
  ['k', ['ヨ', 'ヲ'], 'ヨ(yo)는 가로획 세 개, ヲ(wo)는 가로획 두 개에 비스듬한 획이 있어요.']
];

// ---- content/items.js ----
'use strict';
/* ================= content ================= */
JP_CATS.mine = ['내 단어', 'topic'];
EN_CATS.mine = ['내 단어', 'topic'];
const CATS = JP_CATS;
const catName = (cats, k) => (cats[k] ? cats[k][0] : k);
const jpWord =
  lvl =>
  ([w, r, m, n, c, ex, exr, exko]) => ({ w, r, m: m.split('/'), n, cats: c.split(','), ex, exr, exko, lvl, key: 'w:' + w + '|' + r });
const BASE_JP = [...JP_WORDS_RAW.map(jpWord(5)), ...(typeof JP_WORDS_N4_RAW !== 'undefined' ? JP_WORDS_N4_RAW : []).map(jpWord(4))];
const BASE_JP_N5 = BASE_JP.filter(w => w.lvl === 5); // fixed set for friend-challenge links
const BASE_EN = EN_WORDS_RAW.map(([w, m, alt, c, ex, exko]) => ({
  w,
  m: m.split('/'),
  alt: alt ? alt.split('/') : [],
  cats: c.split(','),
  ex,
  exko,
  key: 'ew:' + w
}));
let WORDS = BASE_JP,
  EN_WORDS = BASE_EN,
  CONJ_ITEMS = [];
const SENTS = SENTS_RAW.map(([sc, k, a, r, t, d]) => ({ sc, k, a: [a, r], t, d, key: 's:' + a }));
const EN_SENTS = EN_SENTS_RAW.map(([sc, k, a, d]) => ({ sc, k, a, d, key: 'es:' + a }));
const withKey = (arr, p, f) => arr.map(s => ({ ...s, key: p + f(s) }));
const ITEMS = {
  sent: SENTS,
  jb: withKey(SENTS, 'jb:', s => s.a[0]),
  jl: withKey(SENTS, 'jl:', s => s.a[0]),
  jd: withKey(SENTS, 'jd:', s => s.a[0]),
  es: EN_SENTS,
  eb: withKey(EN_SENTS, 'eb:', s => s.a),
  el: withKey(EN_SENTS, 'el:', s => s.a),
  ed: withKey(EN_SENTS, 'ed:', s => s.a)
};
const LOANS = LOAN_RAW.map(([k, en, ko, note]) => ({ k, en, ko, note, key: 'lw:' + k }));
const CONF_ITEMS = CONF.flatMap(([sc, g], gi) => g.map(ch => ({ ch, sc, gi, key: 'k:' + ch })));

// ---- lib/romaji.js ----
'use strict';
/* ================= romaji ================= */
const R1 = {},
  R2 = {};
for (const x of KANA) {
  (x.h.length === 1 ? R1 : R2)[x.h] = x.alts[0];
}
Object.assign(R1, { ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o', ゃ: 'ya', ゅ: 'yu', ょ: 'yo', ゎ: 'wa', ゔ: 'vu', を: 'o' });
Object.assign(R2, {
  てぃ: 'ti',
  でぃ: 'di',
  ふぁ: 'fa',
  ふぃ: 'fi',
  ふぇ: 'fe',
  ふぉ: 'fo',
  うぃ: 'wi',
  うぇ: 'we',
  うぉ: 'wo',
  しぇ: 'she',
  じぇ: 'je',
  ちぇ: 'che',
  ぢゃ: 'ja',
  ぢゅ: 'ju',
  ぢょ: 'jo',
  つぁ: 'tsa',
  ゔぁ: 'va',
  ゔぃ: 'vi',
  ゔぇ: 've',
  ゔぉ: 'vo',
  とぅ: 'tu',
  どぅ: 'du',
  いぇ: 'ye'
});
const PUNCT = { '。': '.', '、': ',', '？': '?', '！': '!', '・': ' ', '…': '…', '「': '"', '」': '"', '〜': '~' };
const SPECIAL = { は: 'wa', へ: 'e', を: 'o', では: 'dewa', には: 'niwa', とは: 'towa', こんにちは: 'konnichiwa', こんばんは: 'konbanwa' };
function conv(s) {
  s = toHira(s);
  let out = '',
    i = 0,
    soku = false;
  const push = r => {
    if (soku) {
      out += r.startsWith('ch') ? 't' : r[0];
      soku = false;
    }
    out += r;
  };
  while (i < s.length) {
    const two = s.substr(i, 2),
      one = s[i];
    if (R2[two]) {
      push(R2[two]);
      i += 2;
      continue;
    }
    if (one === 'っ') {
      soku = true;
      i++;
      continue;
    }
    if (one === 'ー') {
      const m = out.match(/[aeiou](?=[^aeiou]*$)/);
      out += m ? m[0] : '';
      i++;
      continue;
    }
    if (R1[one]) push(R1[one]);
    else out += PUNCT[one] ?? one;
    i++;
  }
  return out;
}
function romaji(str) {
  return str
    .trim()
    .split(/\s+/)
    .map(tok => {
      const m = tok.match(/^(.*?)([。、？！…]*)$/);
      const core = m[1],
        tail = m[2];
      return (SPECIAL[toHira(core)] ?? conv(core)) + conv(tail);
    })
    .join(' ')
    .replace(/\s+([.,?!])/g, '$1');
}
const stripP = s => s.replace(/[。、？！?!.,…]+$/, '').replace(/^[「"]+|[」"]+$/g, '');
const stripAll = s => s.replace(/[。、？！?!.,…・「」\s]/g, '');
let IDX = null;

// ---- content/items-extra.js ----
'use strict';
/* ================= content: particles, grammar, kanji, english extras, dialogues ================= */
const PARTICLES = ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も', 'の', 'から', 'まで', 'や'];
const P_EXCL = { は: ['が'], が: ['は'], へ: ['に'], に: ['へ'], と: ['や'], や: ['と'] };
const PART_EXP = {
  は: '주제 "은/는"',
  が: '주어 "이/가" · 好き·ある 등의 대상',
  を: '목적어 "을/를"',
  に: '시간·도착점·대상 "에/에게"',
  で: '행동 장소·수단 "에서/(으)로"',
  へ: '방향 "(으)로/에"',
  と: '함께·나열 "와/과, 하고"',
  も: '"도"',
  の: '소유·수식 "의"',
  から: '출발점·이유 "부터/에서/니까"',
  まで: '끝점 "까지"',
  や: '예시 나열 "(이)랑, 등"'
};
const PART_ITEMS = SENTS.flatMap(s => {
  const tk = s.t.split(' '),
    rk = s.a[1].split(' ');
  const out = [];
  tk.forEach((t, i) => {
    const p = stripP(t);
    if (i > 0 && PARTICLES.includes(p) && stripP(rk[i] || '') === p) out.push({ ...s, pi: i, p, key: 'pt:' + s.a[0] + '|' + i });
  });
  return out;
});
ITEMS.part = PART_ITEMS;
ITEMS.jsh = withKey(SENTS, 'sh:', s => s.a[0]);
ITEMS.esh = withKey(EN_SENTS, 'esh:', s => s.a);
const GRAM = [
  ...GRAM_RAW.map(g => ({ ...g, lvl: 5 })),
  ...(typeof GRAM_N4_RAW !== 'undefined' ? GRAM_N4_RAW : []).map(g => ({ ...g, lvl: 4 }))
];
const GRAM_ITEMS = GRAM.flatMap(g => g.q.map((q, qi) => ({ g, qi, k: q.k, a: [q.a, q.r], d: q.d, key: 'gp:' + g.id + ':' + qi })));
const KANJI = [
  ...KANJI_RAW.map(x => ({ ...x, lvl: 5, key: 'kj:' + x.k })),
  ...(typeof KANJI_N4_RAW !== 'undefined' ? KANJI_N4_RAW : []).map(x => ({ ...x, lvl: 4, key: 'kj:' + x.k }))
];
const IRR = IRR_RAW.map(([b, p, pp, ko, ex, exko]) => ({ b, p, pp, ko, ex, exko, key: 'ir:' + b }));
const MP = MP_RAW.map(([w1, k1, w2, k2, lb]) => ({ w1, k1, w2, k2, lb, key: 'mp:' + w1 + '|' + w2 }));
const DLG = { jdlg: DLG_JA.map(d => ({ ...d, key: 'dl:ja:' + d.id })), edlg: DLG_EN.map(d => ({ ...d, key: 'dl:en:' + d.id })) };

// ---- core/storage.js ----
'use strict';
/* ================= storage ================= */
const KEY = 'hanamaru-ja-v1';
const allScenes = () => Object.keys(SCENES);
const DEF_SMODE = {
  ja: { kana: 'kana', word: 'word', sent: 'sent', listen: 'jdlg', play: 'omikuji', ref: 'today' },
  en: { eword: 'ew', esent: 'es', elisten: 'edlg', eplay: 'omikuji', eref: 'today' }
};
const DEF = {
  ver: 8,
  lang: 'ja',
  tabs: { ja: 'home', en: 'home' },
  pins: { ja: [], en: [] },
  voice: { ja: '', en: '' },
  hide: { ja: [], en: [] },
  seenMod: {},
  smode: DEF_SMODE,
  stats: {},
  days: {},
  set: { round: 10, autoNext: true, autoSpeak: true, slow: false, kanji: true, wans: 'type', goal: 20, theme: 'auto', zoom: 1, sfx: true },
  kana: { dir: 'k2r', script: 'h', sets: ['basic'], input: 'pad' },
  kconf: { script: 'm' },
  word: { cats: Object.keys(CATS), fav: false, lvl: 'all' },
  kjl: { lvl: 'all' },
  grl: { lvl: 'all' },
  ew: { dir: 'e2k', cats: Object.keys(EN_CATS), fav: false },
  conj: { forms: ['masu', 'te', 'nai', 'ta'] },
  num: { ja: ['price', 'time', 'number'], en: ['price', 'time', 'number'] },
  kj: { mode: 'mix' },
  irr: { form: 'mix' },
  cnt: { kinds: ['counter', 'date'] },
  pol: { dir: 'mix' },
  jlen: { lb: null },
  course: { ja: {}, en: {} },
  courseFin: {},
  seen: { tour: 0, tips: {} },
  dlg: { rd: true, ko: false, sc: { ja: 'all', en: 'all' } },
  scenes: { ja: allScenes(), en: allScenes() },
  filt: {},
  fav: {},
  custom: { ja: [], en: [] },
  best: {},
  badges: [],
  goalDays: {}
};
const clone = o => JSON.parse(JSON.stringify(o));
function merge(a, b) {
  for (const k in b) {
    if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k]))
      merge(a[k], b[k]);
    else a[k] = b[k];
  }
  return a;
}
const dayIdx = (d = new Date()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 864e5);
function load() {
  let m = clone(DEF);
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const o = JSON.parse(raw);
      if (typeof o.smode?.ja !== 'object') delete o.smode;
      if (o.only) {
        o.filt = o.filt || {};
        for (const k in o.only) if (o.only[k]) o.filt[k] = 'weak';
        delete o.only;
      }
      m = merge(m, o);
      if ((o.ver || 1) < 3) {
        m.word.cats = Object.keys(CATS);
        m.ew.cats = Object.keys(EN_CATS);
      }
      if ((o.ver || 1) < 4) {
        m.word.cats = [...new Set([...m.word.cats, 'mine'])];
        m.ew.cats = [...new Set([...m.ew.cats, 'mine'])];
        const t = dayIdx();
        for (const s of Object.values(m.stats)) {
          if (s.d === undefined) {
            const weak = s.w > 0 && s.s < 2;
            s.iv = weak ? 0 : s.s >= 2 ? 3 : 1;
            s.d = weak ? t : t + 1;
          }
        }
      }
      if ((o.ver || 1) < 5) {
        for (const l of ['ja', 'en']) if ((m.scenes[l] || []).length >= 7) m.scenes[l] = allScenes();
      }
      if ((o.ver || 1) < 6 && o.smode) {
        m.smode = clone(DEF_SMODE);
      }
      m.ver = 8;
    }
  } catch (e) {}
  m.word.cats = m.word.cats.filter(c => CATS[c]);
  if (!m.word.cats.length) m.word.cats = Object.keys(CATS);
  m.ew.cats = m.ew.cats.filter(c => EN_CATS[c]);
  if (!m.ew.cats.length) m.ew.cats = Object.keys(EN_CATS);
  return m;
}
let S = load();
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {}
}
function rebuildWords() {
  WORDS = BASE_JP.concat(
    S.custom.ja.map(c => ({
      w: c.w,
      r: c.r,
      m: c.m.split('/'),
      n: '내가 추가한 단어',
      cats: ['mine'],
      ex: '',
      exr: '',
      exko: '',
      key: 'w:' + c.w + '|' + c.r,
      mine: true
    }))
  );
  EN_WORDS = BASE_EN.concat(
    S.custom.en.map(c => ({ w: c.w, m: c.m.split('/'), alt: [], cats: ['mine'], ex: '', exko: '', key: 'ew:' + c.w, mine: true }))
  );
  if (typeof IDX !== 'undefined') IDX = null;
  CONJ_ITEMS = WORDS.filter(v => v.cats.includes('verb') && verbGroup(v.w, v.r))
    .flatMap(v => Object.keys(FORMS).map(f => ({ v, form: f, right: conjugate(v, f), key: 'cj:' + v.w + '|' + f })))
    .filter(x => x.right);
}
rebuildWords();

const pad2 = n => String(n).padStart(2, '0');
const dayKey = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const today = () => dayKey(new Date());
function streak() {
  let n = 0;
  const d = new Date();
  if (!S.days[dayKey(d)]?.n) d.setDate(d.getDate() - 1);
  while (S.days[dayKey(d)]?.n) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
function longestStreak() {
  const ks = Object.keys(S.days)
    .filter(k => S.days[k].n > 0)
    .sort();
  let best = 0,
    cur = 0,
    prev = null;
  for (const k of ks) {
    const t = new Date(k + 'T00:00:00');
    if (prev && (t - prev) / 864e5 < 1.5) cur++;
    else cur = 1;
    best = Math.max(best, cur);
    prev = t;
  }
  return best;
}
const totalN = () => Object.values(S.days).reduce((a, d) => a + d.n, 0);

// ---- core/srs.js ----
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

// ---- core/badges.js ----
'use strict';
/* badges */
const SCENE_KEYS = arr =>
  Object.keys(SCENES)
    .map(sc => arr.filter(s => s.sc === sc).map(s => s.key))
    .filter(a => a.length);
const bestScene = arr => {
  let b = [0, 1];
  for (const ks of SCENE_KEYS(arr)) {
    const d = doneCount(ks);
    if (d / ks.length > b[0] / b[1]) b = [d, ks.length];
  }
  return b;
};
const kanaK = (f, kata) => KANA.filter(f).map(x => 'k:' + (kata ? toKata(x.h) : x.h));
const BADGES = [
  { id: 'first', name: '첫걸음', desc: '첫 문제 풀기', p: () => [Math.min(totalN(), 1), 1] },
  { id: 'hira', name: '히라가나 기본', desc: '히라가나 기본 46자 익히기', p: () => [doneCount(kanaK(x => x.set === 'basic')), 46] },
  { id: 'kata', name: '가타카나 기본', desc: '가타카나 기본 46자 익히기', p: () => [doneCount(kanaK(x => x.set === 'basic', true)), 46] },
  {
    id: 'kana_all',
    name: '가나 정복',
    desc: '탁음·요음까지 208자 모두 익히기',
    p: () => [doneCount([...kanaK(() => true), ...kanaK(() => true, true)]), 208]
  },
  {
    id: 'jw100',
    name: '일본어 단어 100',
    desc: '일본어 단어 100개 익히기',
    p: () => [Math.min(doneCount(WORDS.map(w => w.key)), 100), 100]
  },
  {
    id: 'jw300',
    name: '일본어 단어 300',
    desc: '일본어 단어 300개 익히기',
    p: () => [Math.min(doneCount(WORDS.map(w => w.key)), 300), 300]
  },
  { id: 'conj50', name: '활용 마스터', desc: '동사 활용 50개 익히기', p: () => [Math.min(doneCount(CONJ_ITEMS.map(x => x.key)), 50), 50] },
  { id: 'scene_ja', name: '일본어 상황 완주', desc: '한 상황의 일본어 문장 모두 익히기 (보기 고르기)', p: () => bestScene(SENTS) },
  { id: 'ew100', name: '영단어 100', desc: '영단어 100개 익히기', p: () => [Math.min(doneCount(EN_WORDS.map(w => w.key)), 100), 100] },
  { id: 'ew300', name: '영단어 300', desc: '영단어 300개 익히기', p: () => [Math.min(doneCount(EN_WORDS.map(w => w.key)), 300), 300] },
  { id: 'scene_en', name: '영어 상황 완주', desc: '한 상황의 영어 문장 모두 익히기 (보기 고르기)', p: () => bestScene(EN_SENTS) },
  {
    id: 'dict10',
    name: '받아 적기',
    desc: '받아쓰기 10문장 맞히기',
    p: () => [Math.min(Object.entries(S.stats).filter(([k, s]) => /^(jd|ed):/.test(k) && s.c > 0).length, 10), 10]
  },
  {
    id: 'speed20',
    name: '번개손',
    desc: '60초 도전에서 20개 이상 맞히기',
    p: () => [Math.min(Math.max(0, ...Object.values(S.best)), 20), 20]
  },
  { id: 'streak7', name: '일주일 연속', desc: '7일 연속 공부하기', p: () => [Math.min(longestStreak(), 7), 7] },
  { id: 'streak30', name: '한 달 연속', desc: '30일 연속 공부하기', p: () => [Math.min(longestStreak(), 30), 30] },
  { id: 'goal7', name: '목표 달성 7회', desc: '하루 목표 7번 달성하기', p: () => [Math.min(Object.keys(S.goalDays).length, 7), 7] },
  {
    id: 'dlg10',
    name: '수다쟁이',
    desc: '대화 연습 10개를 실수 없이 끝내기',
    p: () => [Math.min(Object.entries(S.stats).filter(([k, s]) => k.startsWith('dl:') && s.c > 0).length, 10), 10]
  },
  {
    id: 'kanji40',
    name: '한자 40',
    desc: '기초 한자 40자 익히기',
    p: () => [Math.min(doneCount(KANJI_RAW.map(x => 'kj:' + x.k)), 40), 40]
  },
  { id: 'q1000', name: '천 문제', desc: '누적 1000문제 풀기', p: () => [Math.min(totalN(), 1000), 1000] }
];
function checkBadges() {
  const fresh = [];
  for (const b of BADGES) {
    if (S.badges.includes(b.id)) continue;
    const [c, m] = b.p();
    if (c >= m) {
      S.badges.push(b.id);
      fresh.push(b.name);
    }
  }
  if (fresh.length) {
    save();
    setTimeout(() => toast(`배지 획득: ${fresh.join(', ')}`), S.set.goal && S.days[today()]?.n === S.set.goal ? 3000 : 0);
  }
}

// ---- core/backup.js ----
'use strict';
/* backup */
function b64enc(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function b64dec(b) {
  const bin = atob(b);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
function makeCode() {
  const st = Object.entries(S.stats).map(([k, v]) => [k, v.c, v.w, v.s, v.iv ?? 0, v.d ?? 0]);
  return (
    'HM2.' +
    b64enc(
      JSON.stringify({
        s: st,
        d: S.days,
        c: S.custom,
        f: Object.keys(S.fav),
        b: S.best,
        g: S.goalDays,
        bd: S.badges,
        co: S.course,
        x: S.xp,
        cd: S.cards,
        tk: S.tickets,
        om: S.omiDays,
        gb: S.gbest
      })
    )
  );
}
function readCode(code) {
  code = code.replace(/\s+/g, '');
  const m = code.match(/^HM([12])\.(.+)$/);
  if (!m) throw new Error('format');
  const o = JSON.parse(b64dec(m[2]));
  if (!Array.isArray(o.s)) throw new Error('format');
  return o;
}
function mergeBackup(o) {
  let n = 0;
  for (const [k, c, w, s, iv, d] of o.s) {
    if (typeof k !== 'string') continue;
    const cur = S.stats[k];
    if (!cur || c + w > cur.c + cur.w) {
      S.stats[k] = { c: +c || 0, w: +w || 0, s: +s || 0, iv: +iv || 0, d: d ? +d : dayIdx() };
      n++;
    }
  }
  for (const [day, v] of Object.entries(o.d || {})) {
    const cur = S.days[day];
    if (v && (!cur || v.n > cur.n)) S.days[day] = { n: +v.n || 0, c: +v.c || 0 };
  }
  if (o.c) {
    for (const c of o.c.ja || [])
      if (c && c.w && !S.custom.ja.some(x => x.w === c.w && x.r === c.r))
        S.custom.ja.push({ w: String(c.w), r: String(c.r), m: String(c.m) });
    for (const c of o.c.en || []) if (c && c.w && !S.custom.en.some(x => x.w === c.w)) S.custom.en.push({ w: String(c.w), m: String(c.m) });
  }
  for (const k of o.f || []) S.fav[k] = 1;
  for (const [k, v] of Object.entries(o.b || {})) S.best[k] = Math.max(S.best[k] || 0, +v || 0);
  Object.assign(S.goalDays, o.g || {});
  for (const b of o.bd || []) if (!S.badges.includes(b)) S.badges.push(b);
  for (const l of ['ja', 'en']) {
    if (o.x && +o.x[l] > S.xp[l]) S.xp[l] = +o.x[l];
    if (o.tk && +o.tk[l] > S.tickets[l]) S.tickets[l] = +o.tk[l];
    if (o.cd && o.cd[l]) for (const [id, n] of Object.entries(o.cd[l])) S.cards[l][id] = Math.max(S.cards[l][id] || 0, +n || 0);
    if (o.om && o.om[l]) Object.assign(S.omiDays[l], o.om[l]);
  }
  if (o.gb && typeof o.gb === 'object') for (const [k, v] of Object.entries(o.gb)) if (S.gbest[k] === undefined) S.gbest[k] = v;
  if (o.co && typeof o.co === 'object')
    for (const l of ['ja', 'en'])
      for (const [di, a] of Object.entries(o.co[l] || {})) {
        if (!Array.isArray(a)) continue;
        const cur = S.course[l][di] || (S.course[l][di] = []);
        a.forEach((v, i) => {
          if (v) cur[i] = 1;
        });
      }
  rebuildWords();
  save();
  return n;
}

// ---- core/speech.js ----
'use strict';
/* ================= speech, toast, clipboard ================= */
const hasTTS = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
const voices = { ja: null, en: null };
// Rank voices so the most natural one wins: premium/enhanced (iPhone downloads), neural/natural (Edge), Google, then known names.
function voiceScore(v, lang) {
  const n = (v.name + ' ' + v.voiceURI).toLowerCase();
  let s = 0;
  if (/premium/.test(n)) s += 60;
  if (/enhanced|natural|neural/.test(n)) s += 45;
  if (/siri/.test(n)) s += 35;
  if (/google/.test(n)) s += 25;
  if (/online/.test(n)) s += 15;
  if (
    lang === 'ja'
      ? /kyoko|o-ren|otoya|hattori|nanami|keita|haruka|ayumi/.test(n)
      : /samantha|ava|allison|nicky|aaron|zoe|evan|jenny|aria|guy/.test(n)
  )
    s += 10;
  if (lang === 'en' && /^en[-_]us/i.test(v.lang)) s += 5;
  if (
    /compact|eloquence|grandma|grandpa|bad news|bells|bubbles|jester|organ|superstar|trinoids|whisper|wobble|zarvox|albert|boing|cellos|fred|junior|ralph|rocko|shelley|sandy|flo|reed/.test(
      n
    )
  )
    s -= 40;
  return s;
}
const langVoices = lang => {
  try {
    return speechSynthesis
      .getVoices()
      .filter(v => (lang === 'ja' ? /^ja/i.test(v.lang) : /^en/i.test(v.lang)))
      .sort((a, b) => voiceScore(b, lang) - voiceScore(a, lang));
  } catch (e) {
    return [];
  }
};
function pickVoice() {
  try {
    for (const l of ['ja', 'en']) {
      const vs = langVoices(l);
      const want = S.voice && S.voice[l];
      voices[l] = (want && vs.find(v => v.voiceURI === want)) || vs[0] || null;
    }
  } catch (e) {}
}
if (hasTTS) {
  pickVoice();
  try {
    speechSynthesis.addEventListener('voiceschanged', pickVoice);
  } catch (e) {}
}
function speakSeq(texts, lang) {
  if (!hasTTS || !texts.length) return;
  try {
    speechSynthesis.cancel();
    for (const t of texts) {
      const u = new SpeechSynthesisUtterance(t);
      u.lang = lang === 'en' ? 'en-US' : 'ja-JP';
      if (voices[lang]) u.voice = voices[lang];
      u.rate = S.set.slow ? (lang === 'en' ? 0.7 : 0.6) : lang === 'en' ? 0.95 : 0.9;
      speechSynthesis.speak(u);
    }
  } catch (e) {}
}
function speak(text, lang = 'ja', slow = false) {
  if (!hasTTS || !text) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'en' ? 'en-US' : 'ja-JP';
    if (voices[lang]) u.voice = voices[lang];
    u.rate = slow || S.set.slow ? (lang === 'en' ? 0.7 : 0.6) : lang === 'en' ? 0.95 : 0.9;
    speechSynthesis.speak(u);
  } catch (e) {}
}
const SPK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>';
const PLAY_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l12.5-7.5z"/></svg>';
const spkBtn = (t, label = '발음 듣기', lang = 'ja') =>
  hasTTS ? `<button type="button" class="spk" data-speak="${esc(t)}" data-lang="${lang}">${SPK_ICON}${label}</button>` : '';
function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    t.setAttribute('role', 'status');
    document.body.appendChild(t);
  }
  t.textContent = msg;
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2800);
}
function copyText(text, okMsg, onFail) {
  try {
    navigator.clipboard.writeText(text).then(
      () => toast(okMsg),
      () => onFail()
    );
  } catch (e) {
    onFail();
  }
}
function applyLook() {
  const root = document.documentElement;
  if (S.set.theme === 'auto') {
    if (root.dataset.hmTheme) {
      root.removeAttribute('data-theme');
      delete root.dataset.hmTheme;
    }
  } else {
    root.setAttribute('data-theme', S.set.theme);
    root.dataset.hmTheme = '1';
  }
  root.style.setProperty('--zoom', S.set.zoom);
}

// ---- ui/shell.js ----
'use strict';
/* ================= shell ================= */
const view = document.getElementById('view');
const tabsEl = document.getElementById('tabs');
let advT = null;
const clearAdv = () => {
  if (advT) {
    clearTimeout(advT);
    advT = null;
  }
};
const ICO = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 10.5 12 4l8 6.5V20h-5.5v-5.5h-5V20H4z"/></svg>',
  kana: '<svg viewBox="0 0 24 24"><text x="12" y="18" text-anchor="middle" font-size="17" fill="currentColor" style="font-family:var(--f-jp)">あ</text></svg>',
  word: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="4" y="6" width="13" height="14" rx="2"/><path d="M8 3.5h10a2 2 0 0 1 2 2V17"/></svg>',
  sent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 5h16v11H10l-4 3.5V16H4z"/><path d="M8 9.5h8M8 12.5h5"/></svg>',
  listen:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3.5" y="14" width="4" height="6" rx="1.5"/><rect x="16.5" y="14" width="4" height="6" rx="1.5"/></svg>',
  ref: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M13 4h5.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H13z"/></svg>',
  eword:
    '<svg viewBox="0 0 24 24"><text x="12" y="17.5" text-anchor="middle" font-size="14" font-weight="600" fill="currentColor" style="font-family:var(--f-en)">Aa</text></svg>'
};
ICO.talk =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3.5 5h11v8H8l-3 2.5V13H3.5z"/><path d="M17 9h3.5v8H19v2.5L16 17h-5.5v-2"/></svg>';
ICO.esent = ICO.sent;
ICO.elisten = ICO.talk;
ICO.eref = ICO.ref;
ICO.play =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M7.5 7.5h9a4.5 4.5 0 0 1 4.4 5.5l-.9 4a2.3 2.3 0 0 1-4 .9L14 16h-4l-2 1.9a2.3 2.3 0 0 1-4-.9l-.9-4a4.5 4.5 0 0 1 4.4-5.5z"/><path d="M8 10.5v3M6.5 12h3"/><circle cx="15.5" cy="11" r=".6" fill="currentColor"/><circle cx="17" cy="13" r=".6" fill="currentColor"/></svg>';
ICO.eplay = ICO.play;
ICO.learn =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M4 6.5C6.5 5 9.5 5 12 6.5v13C9.5 18 6.5 18 4 19.5z"/><path d="M20 6.5C17.5 5 14.5 5 12 6.5v13c2.5-1.5 5.5-1.5 8 0z"/></svg>';
ICO.talk2 =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M3.5 5h11v8H8l-3 2.5V13H3.5z"/><path d="M17 9h3.5v8H19v2.5L16 17h-5.5v-2"/></svg>';
const TAB_ICON = { listen: 'talk', elearn: 'learn', talk: 'talk2', etalk: 'talk2' };
const TABS = {
  ja: [
    ['home', '홈'],
    ['learn', '배우기'],
    ['talk', '회화·여행'],
    ['play', '놀이'],
    ['ref', '자료']
  ],
  en: [
    ['home', '홈'],
    ['elearn', '배우기'],
    ['etalk', '회화·여행'],
    ['eplay', '놀이'],
    ['eref', '자료']
  ]
};
// tab names from older versions (and older code paths) → where those modes live now
const OLD_TAB = { kana: 'learn', word: 'learn', sent: 'learn', listen: 'talk', eword: 'elearn', esent: 'elearn', elisten: 'etalk' };
// Each tab shows a menu of cards in these groups; the flat TAB_MODES list is derived from it.
const MENU = {
  learn: [
    ['문자', ['kana', 'kwrite', 'kconf', 'kanji']],
    ['단어', ['word', 'flash', 'conj', 'cnt', 'loan']],
    ['문장', ['sent', 'jb', 'part', 'gram', 'pol']],
    ['한국인 맞춤', ['hj', 'hjw', 'hjr', 'kpart', 'wasei']],
    ['도전', ['kspeed', 'wspeed']]
  ],
  talk: [
    ['여행', ['jtrav', 'mycard', 'trip', 'sign', 'reader', 'koexp', 'kansai']],
    ['대화·듣기', ['aichat', 'diary', 'jdlg', 'jl', 'jd', 'jsh', 'jn']],
    ['발음', ['jlen', 'jauto']]
  ],
  play: [['놀이', ['omikuji', 'cards', 'stamps', 'rain', 'match', 'vs']]],
  ref: [
    ['복습', ['weak', 'wrongs', 'today']],
    ['자료', ['course', 'chart', 'jlist', 'gnote']],
    ['기록', ['stats', 'badges']]
  ],
  elearn: [
    ['단어', ['ew', 'eflash', 'irr']],
    ['한국인 맞춤', ['etrap', 'kong']],
    ['문장', ['es', 'eb', 'eprep', 'etense', 'ephr']],
    ['도전', ['espeed']]
  ],
  etalk: [
    ['여행', ['etrav', 'emycard', 'etrip']],
    ['대화·듣기', ['eaichat', 'ediary', 'edlg', 'el', 'ed', 'esh', 'enn']],
    ['발음', ['mp', 'eauto']]
  ],
  eplay: [['놀이', ['omikuji', 'cards', 'stamps', 'rain', 'match', 'vs']]],
  eref: [
    ['복습', ['weak', 'wrongs', 'today']],
    ['자료', ['course', 'elist']],
    ['기록', ['stats', 'badges']]
  ]
};
const TAB_MODES = Object.fromEntries(Object.entries(MENU).map(([t, gs]) => [t, gs.flatMap(g => g[1])]));
const MODE_LABEL = {
  mycard: '나만의 여행 카드',
  emycard: '나만의 여행 카드',
  reader: '붙여넣기 해석기',
  aichat: 'AI 회화',
  eaichat: 'AI 회화',
  diary: 'AI 한 줄 일기',
  ediary: 'AI 한 줄 일기',
  kansai: '간사이벤',
  weak: '약점 리포트',
  kpart: '조사 함정',
  koexp: '한국어 표현',
  sign: '메뉴판·간판',
  trip: '여행 D-day',
  etrip: '여행 D-day',
  hj: '한국음 한자',
  hjw: '한자어',
  hjr: '한국음 규칙',
  kwrite: '따라 쓰기',
  flash: '플래시카드',
  eflash: '플래시카드',
  wasei: '일본식 영어',
  kong: '콩글리시',
  etrap: '한국인이 틀리는 영어',
  jtrav: '여행 카드',
  etrav: '여행 카드',
  wrongs: '오답 노트',
  jauto: '연속 듣기',
  eauto: '연속 듣기',
  eprep: '전치사',
  etense: '시제',
  ephr: '구동사',
  cnt: '조수사·날짜',
  pol: '반말↔존댓말',
  jlen: '소리 구별',
  course: '학습 코스',
  kanji: '기초 한자',
  part: '조사 빈칸',
  gram: '문법',
  jdlg: '대화 연습',
  jsh: '따라 말하기',
  today: '오늘 요약',
  gnote: '문법 노트',
  irr: '불규칙 동사',
  edlg: '대화 연습',
  esh: '따라 말하기',
  mp: '발음 구별',
  kana: '문자 퀴즈',
  kconf: '헷갈리는 글자',
  kspeed: '60초 도전',
  word: '단어 퀴즈',
  loan: '외래어',
  conj: '동사 활용',
  wspeed: '60초 도전',
  sent: '보기 고르기',
  jb: '문장 조립',
  jl: '문장 듣기',
  jd: '받아쓰기',
  jn: '숫자 듣기',
  chart: '50음도',
  jlist: '단어장',
  stats: '학습 기록',
  badges: '배지',
  ew: '단어 퀴즈',
  espeed: '60초 도전',
  es: '보기 고르기',
  eb: '문장 조립',
  el: '문장 듣기',
  ed: '받아쓰기',
  enn: '숫자 듣기',
  elist: '단어장'
};
const DUE_LABEL = {
  kansai: '간사이벤',
  kpart: '조사 함정',
  sign: '메뉴판·간판',
  hj: '한국음 한자',
  hjw: '한자어',
  wasei: '일본식 영어',
  kong: '콩글리시',
  etrap: '한국인이 틀리는 영어',
  eprep: '전치사',
  etense: '시제',
  ephr: '구동사',
  cnt: '조수사·날짜',
  pol: '반말↔존댓말',
  jlen: '소리 구별',
  kanji: '한자',
  part: '조사',
  gram: '문법',
  irr: '불규칙 동사',
  mp: '발음 구별',
  kana: '문자',
  word: '단어',
  loan: '외래어',
  conj: '동사 활용',
  sent: '문장 고르기',
  jb: '문장 조립',
  jl: '문장 듣기',
  jd: '받아쓰기',
  ew: '단어',
  es: '문장 고르기',
  eb: '문장 조립',
  el: '문장 듣기',
  ed: '받아쓰기'
};
const NEEDS_TTS = new Set(['jl', 'jd', 'jn', 'el', 'ed', 'enn', 'jsh', 'esh', 'mp', 'jlen', 'jauto', 'eauto']);
const VIEWS = new Set(['chart', 'jlist', 'elist', 'stats', 'badges', 'today', 'gnote', 'course', 'wrongs']);
const DLGM = new Set(['jdlg', 'edlg']);
const SPEED = new Set(['kspeed', 'wspeed', 'espeed']);
const SCENE_MODS = new Set(['sent', 'jb', 'jl', 'jd', 'es', 'eb', 'el', 'ed', 'part', 'jsh', 'esh']);
const BUILD = new Set(['jb', 'eb']);
const LISTEN = new Set(['jl', 'el']);
const DICT = new Set(['jd', 'ed']);
const NUMS = new Set(['jn', 'enn']);
const JA_MODS = new Set([
  'diary',
  'mycard',
  'reader',
  'aichat',
  'kansai',
  'kpart',
  'koexp',
  'sign',
  'trip',
  'hj',
  'hjw',
  'hjr',
  'kwrite',
  'flash',
  'wasei',
  'jtrav',
  'kana',
  'kconf',
  'kspeed',
  'word',
  'loan',
  'conj',
  'wspeed',
  'sent',
  'jb',
  'jl',
  'jd',
  'jn',
  'chart',
  'jlist',
  'kanji',
  'part',
  'gram',
  'jdlg',
  'jsh',
  'gnote',
  'cnt',
  'pol',
  'jlen',
  'jauto'
]);
const modLang = m =>
  JA_MODS.has(m)
    ? 'ja'
    : ['stats', 'badges', 'today', 'course', 'wrongs', 'weak', 'omikuji', 'cards', 'stamps', 'rain', 'match', 'vs'].includes(m)
      ? S.lang
      : 'en';
const SRS_MODS = {
  ja: [
    'kansai',
    'kana',
    'word',
    'kanji',
    'hj',
    'hjw',
    'sign',
    'kpart',
    'loan',
    'wasei',
    'conj',
    'cnt',
    'sent',
    'jb',
    'part',
    'gram',
    'pol',
    'jl',
    'jd',
    'jlen'
  ],
  en: ['ew', 'irr', 'etrap', 'kong', 'es', 'eb', 'eprep', 'etense', 'ephr', 'el', 'ed', 'mp']
};
const srsMods = () => SRS_MODS[S.lang].filter(m => hasTTS || !NEEDS_TTS.has(m));
const tabModes = t => (TAB_MODES[OLD_TAB[t] || t] || []).filter(m => hasTTS || !NEEDS_TTS.has(m));
// modes the person chose to hide (settings → 메뉴 편집) are left out of menus
const menuModes = t => tabModes(t).filter(m => !(S.hide[S.lang] || []).includes(m) && (!/aichat$|diary$/.test(m) || aiOn()));
const tabList = () => TABS[S.lang].filter(([t]) => t === 'home' || tabModes(t).length);
function curTab() {
  const t = OLD_TAB[S.tabs[S.lang]] || S.tabs[S.lang];
  return tabList().some(x => x[0] === t) ? t : 'home';
}
let CUR_MOD = null; // the mode on screen, or null when a tab menu (or home) is showing
function activeMod() {
  return curTab() === 'home' ? null : CUR_MOD;
}
const modTab = m =>
  tabList()
    .map(x => x[0])
    .find(t => t !== 'home' && TAB_MODES[t].includes(m));
function renderTabs() {
  const list = tabList();
  tabsEl.style.gridTemplateColumns = `repeat(${list.length},1fr)`;
  tabsEl.innerHTML = list.map(([t, l]) => `<button class="tab" data-tab="${t}">${ICO[TAB_ICON[t] || t]}${l}</button>`).join('');
  document.querySelectorAll('#langSeg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === S.lang));
}
function stopAll() {
  clearAdv();
  stopSpeed();
  stopGames();
  stopAutoplay();
  LT = null;
  if (typeof recRelease === 'function') recRelease();
  if (hasTTS) {
    try {
      speechSynthesis.cancel();
    } catch (e) {}
  }
}
function markTab(tab) {
  for (const b of tabsEl.children) {
    if (b.dataset.tab === tab) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  }
}
// a tab shows its menu; startMod opens one practice inside it
function go(tab) {
  tab = OLD_TAB[tab] || tab;
  if (tab !== 'home' && !tabList().some(x => x[0] === tab)) tab = 'home';
  stopAll();
  CUR_MOD = null;
  S.tabs[S.lang] = tab;
  save();
  markTab(tab);
  if (tab === 'home') renderHome();
  else renderMenu(tab);
  dailyBar();
  window.scrollTo(0, 0);
}
function startMod(mod) {
  const t = modTab(mod);
  if (!t) return;
  stopAll();
  S.tabs[S.lang] = t;
  S.smode[S.lang][t] = mod;
  if (!S.seenMod[mod]) S.seenMod[mod] = 1;
  save();
  markTab(t);
  CUR_MOD = mod;
  renderMod(mod);
  dailyBar();
  window.scrollTo(0, 0);
}
const CUSTOM = {}; // modes that draw their own screen (registered by feature files)
function renderMod(mod) {
  view.onclick = null;
  CUR_MOD = mod;
  if (VIEWS.has(mod)) renderView(mod);
  else if (SPEED.has(mod)) renderSpeed(mod);
  else if (DLGM.has(mod)) renderDialogue(mod);
  else if (CUSTOM[mod]) CUSTOM[mod](mod);
  else if (PLAY.has(mod)) renderPlay(mod);
  else renderModule(mod);
  addTip(mod);
}
// Header of a practice screen: ← back to the tab menu, the title, and a ☆ to pin it.
// (keeps the old name: every screen calls modeSeg/bindModes)
function modeSeg(mod) {
  const t = modTab(mod);
  const tl = (tabList().find(x => x[0] === t) || [, ''])[1];
  return `<div class="mhead modes"><button type="button" class="mback" data-back aria-label="${tl} 메뉴로">${BACK_ICO}<span>${tl}</span></button><b class="mtitle">${esc(modeLabel(mod))}</b>${pinBtn(mod)}</div>`;
}
const BACK_ICO =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
const isPinned = m => (S.pins[S.lang] || []).includes(m);
const pinBtn = m =>
  `<button type="button" class="pin" data-pin="${m}" aria-pressed="${isPinned(m)}" aria-label="${isPinned(m) ? '고정 풀기' : '자주 쓰는 연습으로 고정'}">${isPinned(m) ? '★' : '☆'}</button>`;
function togglePin(m) {
  const l = S.pins[S.lang] || (S.pins[S.lang] = []);
  if (l.includes(m)) l.splice(l.indexOf(m), 1);
  else l.unshift(m);
  save();
  toast(isPinned(m) ? `'${modeLabel(m)}'을 홈과 메뉴 맨 위에 고정했어요` : '고정을 풀었어요');
  document.querySelectorAll(`[data-pin="${m}"]`).forEach(b => (b.outerHTML = pinBtn(m)));
  if (!CUR_MOD && curTab() !== 'home' && !document.getElementById('sheet')) renderMenu(curTab());
}
function bindModes() {}
document.addEventListener(
  'click',
  e => {
    const p = e.target.closest('[data-pin]');
    if (p) {
      e.stopPropagation();
      togglePin(p.dataset.pin);
      return;
    }
    if (e.target.closest('[data-back]')) {
      e.stopPropagation();
      go(curTab());
    }
  },
  true
);
tabsEl.addEventListener('click', e => {
  const b = e.target.closest('.tab');
  if (b) go(b.dataset.tab);
});
// any [data-mode] button (menu cards, home shortcuts, search results) opens that practice
document.addEventListener('click', e => {
  const b = e.target.closest('[data-mode]');
  if (b && !e.defaultPrevented) startMod(b.dataset.mode);
});
document.getElementById('langSeg').addEventListener('click', e => {
  const b = e.target.closest('[data-lang]');
  if (!b || b.dataset.lang === S.lang) return;
  S.lang = b.dataset.lang;
  save();
  renderTabs();
  go(curTab());
});
document.addEventListener('focusin', e => {
  if (e.target.matches('input[type=text],input[type=search],textarea')) document.body.classList.add('typing');
});
document.addEventListener('focusout', e => {
  if (e.target.matches('input[type=text],input[type=search],textarea')) document.body.classList.remove('typing');
});
document.addEventListener('click', e => {
  const b = e.target.closest('[data-speak]');
  if (b) {
    e.preventDefault();
    speak(b.dataset.speak, b.dataset.lang || 'ja');
  }
});

// ---- ui/menu.js ----
'use strict';
/* ================= tab menus: grouped cards with a one-line description, ☆ pins, "new" badges ================= */

const MENU_DESC = {
  kana: '히라가나·가타카나 읽기와 쓰기',
  kwrite: '획순 번호 보며 손가락으로 따라 쓰기',
  kconf: 'シ/ツ, ソ/ン처럼 닮은 글자 구별',
  kanji: '기초 한자의 뜻과 읽는 법',
  word: '뜻 고르기 · 직접 쓰기',
  flash: '넘기면서 알아요 / 몰라요',
  conj: 'ます형·て형·た형… 동사 바꾸기',
  cnt: '~개, ~명, 날짜 읽기',
  loan: 'コーヒー처럼 영어에서 온 말',
  sent: '한국어 문장에 맞는 일본어 고르기',
  jb: '블록을 눌러 문장 만들기',
  part: 'は·が·を·に 빈칸 채우기',
  gram: '문형을 써서 문장 고르기',
  pol: '반말과 존댓말 바꿔 말하기',
  hj: '한국 한자음으로 음독 맞히기',
  hjw: '학교 → がっこう 한자어 읽기',
  hjr: '받침 ㄱ→く 같은 규칙 정리와 사전',
  kpart: '친구를 만나다 → 友達に会う',
  wasei: 'サラリーマン은 영어로?',
  kspeed: '60초 동안 글자 많이 맞히기',
  wspeed: '60초 동안 단어 많이 맞히기',
  jtrav: '화면 가득 보여 주고 읽어 주는 문장',
  trip: '출발일까지 하루치씩 벼락치기',
  sign: '메뉴판·역·편의점 글자 읽기',
  koexp: "'수고하세요'는 일본어로?",
  mycard: '호텔 주소·알레르기를 넣어 보여 주는 카드',
  emycard: '호텔 주소·알레르기를 넣어 보여 주는 카드',
  reader: '찍어서 복사한 일본어에 읽는 법·뜻 달기',
  aichat: 'AI 점원·친구와 자유롭게 대화하고 첨삭',
  eaichat: 'AI 점원·친구와 자유롭게 대화하고 첨삭',
  diary: '하루 한 문장 쓰면 AI가 고쳐 줘요',
  ediary: '하루 한 문장 쓰면 AI가 고쳐 줘요',
  kansai: '오사카 사투리 おおきに·なんでやねん',
  jdlg: '상황별 대화를 직접 주고받기',
  jl: '듣고 맞는 문장 고르기',
  jd: '듣고 그대로 받아쓰기',
  jsh: '듣고 따라 말하기',
  jn: '가격·시간·숫자 알아듣기',
  jlen: '장음·촉음·탁음, が/か 구별',
  jauto: '화면 안 보고 계속 듣기',
  omikuji: '하루 한 번 운세 뽑기',
  cards: '모은 뽑기권으로 단어 카드 뽑기',
  stamps: '공부할수록 채워지는 여행 지도',
  rain: '떨어지는 글자 맞히기 게임',
  match: '짝 맞추기 게임',
  vs: '친구와 같은 문제로 대결',
  weak: '어디가 약한지 정답률로 짚어 줘요',
  wrongs: '틀린 문제만 모아서 다시',
  today: '오늘 공부한 내용 한눈에',
  course: '하루 15분 단계별 코스',
  chart: '50음도 표',
  jlist: '단어 찾기·내 단어 추가·공유',
  gnote: '문법 정리 노트',
  stats: '날짜별 기록과 정답률',
  badges: '모은 배지',
  ew: '영단어 뜻 고르기 · 쓰기',
  eflash: '넘기면서 알아요 / 몰라요',
  irr: 'go-went-gone 불규칙 동사',
  kong: '핸드폰은 영어로?',
  etrap: 'married with him? 한국어 직역 함정',
  es: '한국어 문장에 맞는 영어 고르기',
  eb: '단어 블록으로 문장 만들기',
  eprep: 'in·on·at 전치사',
  etense: '시제 고르기',
  ephr: 'pick up 같은 구동사',
  espeed: '60초 동안 단어 많이 맞히기',
  etrav: '화면 가득 보여 주고 읽어 주는 문장',
  etrip: '출발일까지 하루치씩 벼락치기',
  edlg: '상황별 대화를 직접 주고받기',
  el: '듣고 맞는 문장 고르기',
  ed: '듣고 그대로 받아쓰기',
  esh: '듣고 따라 말하기',
  enn: '가격·시간·숫자 알아듣기',
  mp: 'ship / sheep 소리 구별',
  eauto: '화면 안 보고 계속 듣기',
  elist: '단어 찾기·내 단어 추가·공유'
};
// modes added recently get a "새로" badge until opened once
const NEW_MODS = new Set([
  'etrap',
  'diary',
  'ediary',
  'mycard',
  'emycard',
  'reader',
  'aichat',
  'eaichat',
  'kansai',
  'weak',
  'kwrite',
  'flash',
  'eflash',
  'wasei',
  'kong',
  'jtrav',
  'etrav',
  'hj',
  'hjw',
  'hjr',
  'kpart',
  'koexp',
  'sign',
  'trip',
  'etrip'
]);
const TAB_LEAD = {
  learn: '문자 · 단어 · 문장, 그리고 한국인에게 딱 맞춘 연습',
  talk: '여행에서 바로 쓰는 것과 듣기 · 말하기',
  play: '쉬어 가며 즐기는 놀이',
  ref: '복습과 정리 자료, 내 기록',
  elearn: '단어와 문장, 그리고 한국인이 자주 틀리는 영어',
  etalk: '여행 영어와 듣기 · 말하기',
  eplay: '쉬어 가며 즐기는 놀이',
  eref: '복습과 정리 자료, 내 기록'
};

function menuCard(m) {
  let badge = '';
  if (NEW_MODS.has(m) && !S.seenMod[m]) badge = '<i class="mc-new">새로</i>';
  else if (srsMods().includes(m)) {
    const n = dueCount(m);
    if (n) badge = `<i class="mc-due num">복습 ${n > 99 ? '99+' : n}</i>`;
  }
  return `<div class="mcard"><button type="button" class="mc-go" data-mode="${m}"><b>${esc(modeLabel(m))}${badge}</b><small>${esc(MENU_DESC[m] || '')}</small></button>${pinBtn(m)}</div>`;
}
function renderMenu(tab) {
  view.onclick = null;
  const vis = new Set(menuModes(tab));
  const pinned = (S.pins[S.lang] || []).filter(m => vis.has(m));
  const groups = MENU[tab].map(([g, ms]) => [g, ms.filter(m => vis.has(m))]).filter(([, ms]) => ms.length);
  const tl = (tabList().find(x => x[0] === tab) || [, ''])[1];
  const hidden = tabModes(tab).length - vis.size;
  view.innerHTML = `<section class="menu">
    <header class="menu-h"><h1>${tl}</h1><p>${TAB_LEAD[tab] || ''}</p></header>
    ${pinned.length ? `<h2 class="menu-g">★ 고정</h2><div class="mcards">${pinned.map(menuCard).join('')}</div>` : ''}
    ${groups.map(([g, ms]) => `<h2 class="menu-g">${g}</h2><div class="mcards">${ms.map(menuCard).join('')}</div>`).join('')}
    <p class="note menu-foot">☆를 누르면 홈과 메뉴 맨 위에 고정돼요.${hidden ? ` 숨긴 연습 ${hidden}개는` : ' 안 쓰는 연습은'} <button type="button" class="link" data-settings="menu">설정 → 메뉴 편집</button>에서 ${hidden ? '다시 켤 수 있어요' : '숨길 수 있어요'}.</p>
  </section>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('.menu [data-settings]');
  if (b) openSettings(b.dataset.settings);
});

// ---- settings: show / hide modes ----
function menuEditHTML() {
  const tabs = tabList().filter(([t]) => t !== 'home');
  return tabs
    .map(
      ([t, l]) =>
        `<div class="me-tab"><b>${l}</b><div class="chips">${tabModes(t)
          .map(
            m =>
              `<button type="button" class="chip" data-mhide="${m}" aria-pressed="${!(S.hide[S.lang] || []).includes(m)}">${esc(modeLabel(m))}</button>`
          )
          .join('')}</div></div>`
    )
    .join('');
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-mhide]');
  if (!b) return;
  const m = b.dataset.mhide,
    l = S.hide[S.lang] || (S.hide[S.lang] = []);
  if (l.includes(m)) l.splice(l.indexOf(m), 1);
  else l.push(m);
  save();
  b.setAttribute('aria-pressed', !l.includes(m));
  if (!CUR_MOD && curTab() !== 'home') renderMenu(curTab());
});

// ---- home: pinned shortcuts ----
function pinsHomeHTML() {
  const ms = (S.pins[S.lang] || []).filter(m => modTab(m));
  if (!ms.length) return '';
  return `<section><h2 class="sec-title">자주 쓰는 연습</h2><div class="pin-row">${ms.map(m => `<button type="button" class="pin-go" data-mode="${m}">${esc(modeLabel(m))}</button>`).join('')}</div></section>`;
}

// ---- ui/home.js ----
'use strict';
/* ================= home: level, season, today, to-do list, study areas ================= */

function modStats(keys) {
  let done = 0,
    weak = 0;
  for (const k of keys) {
    if (k.startsWith('dl:') ? S.stats[k]?.c > 0 : isDone(k)) done++;
    if (isWeak(k)) weak++;
  }
  return { done, weak, total: keys.length };
}
const kanaKeys = () => KANA.flatMap(x => ['k:' + x.h, 'k:' + toKata(x.h)]);
function dueCount(mod) {
  return basePool(mod, true).filter(p => isDue(p.key)).length;
}
function dueList() {
  return srsMods()
    .map(m => [m, dueCount(m)])
    .filter(x => x[1] > 0);
}
function startDue(mod) {
  S.filt[mod] = 'due';
  R[mod] = null;
  save();
  startMod(mod);
}
const isStandalone = () => window.navigator.standalone === true || !!window.matchMedia?.('(display-mode: standalone)').matches;

/* ---------- pieces ---------- */
function todayBoxHTML() {
  const d = S.days[today()] || { n: 0, c: 0 };
  const goal = S.set.goal,
    gDone = goal && d.n >= goal,
    pct = goal ? Math.min(100, (d.n / goal) * 100) : 0;
  const now = new Date();
  const dstr = `${now.getMonth() + 1}월 ${now.getDate()}일 ${'일월화수목금토'[now.getDay()]}요일`;
  return `<section class="today-box" data-done="${!!gDone}">
    ${goal ? `<svg viewBox="0 0 60 60" aria-hidden="true"><circle class="bg" cx="30" cy="30" r="25"/><circle class="fg" cx="30" cy="30" r="25" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${100 - pct}"/></svg>` : ''}
    <div class="tb-main"><span class="lbl">${dstr}</span><b class="num">${goal ? `${d.n} / ${goal}문제` : `${d.n}문제`}</b><small>${goal ? (gDone ? '오늘 목표 달성! 하나마루' : `목표까지 ${goal - d.n}문제`) : '오늘 푼 문제'}</small></div>
    <div class="tb-side"><div><b class="num">${d.n ? Math.round((d.c / d.n) * 100) + '%' : '–'}</b><span>정답률</span></div><div><b class="num">${streak()}일</b><span>연속</span></div></div>
  </section>`;
}

function todoRow({ act, ico, title, sub, right, done, cls }) {
  return `<li class="todo-i ${cls || ''}" data-done="${!!done}"><button type="button" ${act}><span class="ck" aria-hidden="true">${done ? CHECK_SVG : ico || ''}</span><span class="tl">${title}${sub ? `<small>${sub}</small>` : ''}</span><span class="go">${right || ''}</span></button></li>`;
}

function courseTodo(lang) {
  const n = COURSE[lang].length,
    cd = curDay(lang);
  if (cd >= n)
    return todoRow({
      act: 'data-gocourse',
      title: '코스를 모두 끝냈어요',
      sub: '오늘의 복습으로 잊기 전에 다시 봐요',
      done: true,
      right: '코스 보기'
    });
  const day = COURSE[lang][cd];
  const justFin = cd > 0 && S.courseFin[lang + (cd - 1)] === today();
  const head = `<li class="todo-h"><span>${stageOf(lang, cd)} · <b>${cd + 1}일차</b> ${esc(day.t)}</span><button type="button" class="link" data-gocourse>전체 보기</button></li>`;
  const fin = justFin
    ? `<li class="todo-note"><b>오늘 ${cd}일차를 끝냈어요!</b> 내일 이어서 하거나, 바로 ${cd + 1}일차를 해도 좋아요. <button type="button" class="link" data-share>결과 카드</button></li>`
    : '';
  return (
    head +
    fin +
    dayTasks(lang, cd)
      .map(({ t, ti }) => {
        const d = cDone(lang, cd, ti);
        return todoRow({
          act: `data-ctask="${lang}:${cd}:${ti}"`,
          title: esc(taskLabel(t)),
          sub: esc(MODE_LABEL[t.m] || ''),
          done: d,
          right: d ? '다시' : '시작',
          ico: '<i class="dot"></i>'
        });
      })
      .join('')
  );
}

function todoHTML() {
  const lang = S.lang,
    rows = [];
  const fresh = !Object.keys(S.course[lang]).length && totalN() < 30 && !(S.ltest && S.ltest[lang]);
  if (fresh)
    rows.push(
      todoRow({
        act: 'data-ltest',
        ico: '<i class="dot ai"></i>',
        title: '처음이라면: 레벨 테스트',
        sub: '20문제로 시작할 날을 추천받아요',
        right: '시작'
      })
    );
  rows.push(courseTodo(lang));
  const dl = dueList(),
    dueN = dl.reduce((a, x) => a + x[1], 0);
  rows.push(`<li class="todo-h"><span>오늘의 복습과 미션</span></li>`);
  rows.push(
    dueN
      ? todoRow({
          act: `data-duestart="${dl[0][0]}"`,
          ico: `<i class="badge-n num">${dueN > 99 ? '99+' : dueN}</i>`,
          title: `복습할 때가 된 문제 ${dueN}개`,
          sub: dl
            .map(([m, n]) => `${DUE_LABEL[m]} ${n}`)
            .slice(0, 4)
            .join(' · '),
          right: '복습'
        })
      : todoRow({ act: 'data-noop', title: '오늘 복습할 문제가 없어요', sub: '맞힌 문제는 1·3·7·14·30일 뒤에 다시 나와요', done: true })
  );
  rows.push(missionsHTML());
  const o = S.omi[lang];
  if (!(o && o.d === today()))
    rows.push(
      todoRow({
        act: 'data-goplay="omikuji"',
        ico: `<i class="badge-n ${lang === 'ja' ? 'jp' : ''}">${lang === 'ja' ? '籤' : '운'}</i>`,
        title: lang === 'ja' ? '오늘의 오미쿠지' : '오늘의 포춘 쿠키',
        sub: '하루 한 번 운세 뽑기',
        right: '뽑기'
      })
    );
  if (S.tickets[lang] > 0)
    rows.push(
      todoRow({
        act: 'data-goplay="cards"',
        ico: `<i class="badge-n num">${S.tickets[lang]}</i>`,
        title: `카드 뽑기권 ${S.tickets[lang]}장`,
        sub: '단어 카드를 뽑아 보세요',
        right: '뽑기'
      })
    );
  return `<section><ul class="todo">${rows.join('')}</ul></section>`;
}

function renderHome() {
  const ja = S.lang === 'ja';
  const bk = backupTodoHTML();
  view.innerHTML = `<div class="home">
    ${tripHomeHTML()}
    ${todayBoxHTML()}
    ${heroHTML()}
    ${bk ? `<ul class="todo">${bk}</ul>` : ''}
    ${courseLineHTML()}
    ${pinsHomeHTML()}
    <details class="home-more"><summary>오늘 할 일 · 복습 · 미션 자세히</summary>${todoHTML(true)}</details>
    <details class="home-more"><summary>레벨 · 이벤트 · 주간 리포트</summary>${levelHTML()}${seasonBannerHTML()}${weeklyHomeHTML()}</details>
    <section class="home-links">
      <button class="btn" data-today>오늘 공부한 내용</button><button class="btn" data-gowrong>오답 노트</button>
      <button class="btn" data-share>결과 카드</button><button class="btn" data-help>사용 안내</button>
    </section>
    ${donateHomeHTML()}
    ${isStandalone() ? '' : `<button class="install-tip" data-settings="install"><b>아이폰 홈 화면에 추가하기</b><span>Safari 공유 버튼 → '홈 화면에 추가'. 앱처럼 바로 열려요 →</span></button>`}
  </div>`;
  view.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (dailyClick(b) || homeExtraClick(b) || playClick(b) || weeklyClick(b) || backupClick(b) || tripClick(b)) return;
    if ('today' in b.dataset) startMod('today');
    else if ('gowrong' in b.dataset) startMod('wrongs');
    else if ('gotrav' in b.dataset) startMod(S.lang === 'ja' ? 'jtrav' : 'etrav');
    else if ('ltest' in b.dataset) startLevelTest();
    else if (b.dataset.settings) openSettings(b.dataset.settings);
    else if (b.dataset.gotab) {
      for (const m of tabModes(b.dataset.gotab))
        if (S.filt[m] === 'due') {
          S.filt[m] = 'all';
          R[m] = null;
        }
      go(b.dataset.gotab);
    } else if (b.dataset.review) {
      S.filt[b.dataset.review] = 'weak';
      R[b.dataset.review] = null;
      startMod(b.dataset.review);
    } else if (b.dataset.duestart) startDue(b.dataset.duestart);
    else if (b.dataset.goscene) {
      S.scenes[S.lang] = [b.dataset.goscene];
      for (const m of SCENE_MODS) {
        R[m] = null;
        if (modLang(m) === S.lang && S.filt[m] !== 'all') S.filt[m] = 'all';
      }
      save();
      startMod(ja ? 'sent' : 'es');
    }
  };
}

// ---- quiz/engine.js ----
'use strict';
/* ================= quiz modules ================= */
const PENDING = {}; // items for the next round (course tasks, retry lists)
// registries that newer quiz types fill in, so the engine needs no per-type edits
const POOLS = {},
  SHOWS = {},
  SETUPS = {},
  PREP = {},
  LABELS = {};
const R = {};
const setupOpen = {};
const CHEV = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m4 6 4 4 4-4"/></svg>';
const seg = (path, opts, cur) =>
  `<div class="seg" role="group">${opts.map(([v, l]) => `<button data-set="${path}" data-val="${v}" aria-pressed="${String(cur) === String(v)}">${l}</button>`).join('')}</div>`;
const catSum = (sel, cats) =>
  Object.keys(cats).every(c => sel.includes(c) || c === 'mine') ? '전체' : sel.map(c => catName(cats, c)).join('·');
function catChips(path, cats, sel, favKey, favN) {
  const hasMine = (path === 'word.cats' ? S.custom.ja : S.custom.en).length > 0;
  const keys = Object.keys(cats).filter(k => k !== 'mine' || hasMine);
  const all = keys.every(k => sel.includes(k));
  const ent = keys.map(k => [k, cats[k]]);
  const chip = ([v, [l]]) =>
    `<button class="chip" data-multi="${path}" data-val="${v}" aria-pressed="${!all && sel.includes(v)}">${l}</button>`;
  return `<div class="setup-row"><label>주제</label><div class="chips"><button class="chip" data-allcats aria-pressed="${all && !S[favKey].fav}">전체</button>${ent
    .filter(e => e[1][1] === 'topic')
    .map(chip)
    .join('')}</div></div>
    <div class="setup-row"><label>상황</label><div class="chips">${ent
      .filter(e => e[1][1] === 'scene')
      .map(chip)
      .join('')}</div></div>
    <div class="setup-row"><label>즐겨찾기</label><div class="chips"><button class="chip" data-favonly="${favKey}" aria-pressed="${S[favKey].fav}">★ 즐겨찾기만 ${favN}</button></div></div>`;
}
function sceneChips(lang) {
  const sel = S.scenes[lang];
  const all = sel.length === Object.keys(SCENES).length;
  const items = lang === 'ja' ? SENTS : EN_SENTS;
  return `<div class="setup-row"><label>상황</label><div class="chips"><button class="chip" data-allscenes aria-pressed="${all}">전체</button>${Object.entries(
    SCENES
  )
    .map(
      ([v, l]) =>
        `<button class="chip" data-scene="${v}" aria-pressed="${!all && sel.includes(v)}">${l} ${items.filter(s => s.sc === v).length}</button>`
    )
    .join('')}</div></div>`;
}
const ansRow = () =>
  `<div class="setup-row"><label>답 방식</label>${seg(
    'set.wans',
    [
      ['type', '직접 쓰기'],
      ['choice', '4지선다']
    ],
    S.set.wans
  )}</div>`;
const kanjiRow = lbl =>
  `<div class="setup-row"><label>${lbl}</label>${seg(
    'set.kanji',
    [
      ['true', '한자+가나'],
      ['false', '가나만']
    ],
    S.set.kanji
  )}</div>`;
const inputRow = () =>
  `<div class="setup-row"><label>입력 방식</label>${seg(
    'kana.input',
    [
      ['pad', '앱 키패드'],
      ['sys', '아이폰 일본어 키보드']
    ],
    S.kana.input
  )}<p class="note">웹앱은 아이폰 키보드 언어를 자동으로 바꿀 수 없어요. 앱 키패드는 설정 없이 바로 쓸 수 있고, 아이폰 키보드를 쓰려면 지구본 키로 일본어를 골라 주세요.</p></div>`;
const filt = m => S.filt[m] || 'all';
const favCount = lang => (lang === 'ja' ? WORDS : EN_WORDS).filter(w => S.fav[w.key]).length;

const lvlRow = (path, cur) =>
  `<div class="setup-row"><label>급수</label>${seg(
    path,
    [
      ['all', '전체'],
      ['5', 'N5'],
      ['4', 'N4']
    ],
    cur
  )}</div>`;
const byLvl = (arr, l) => (!l || l === 'all' ? arr : arr.filter(x => String(x.lvl || (x.g && x.g.lvl)) === l));
function setupHTML(mod) {
  let sum = '',
    body = '';
  const lang = modLang(mod);
  if (SETUPS[mod]) [sum, body] = SETUPS[mod](lang);
  else if (mod === 'kana') {
    const k = S.kana;
    sum = [
      { h: 'ひらがな', k: 'カタカナ', m: 'ひらがな+カタカナ' }[k.script],
      k.dir === 'k2r' ? '문자→발음' : '발음→문자',
      k.sets.map(s => SETS[s].split(' ')[0]).join('·')
    ].join(' · ');
    body = `<div class="setup-row"><label>문제 방향</label>${seg(
      'kana.dir',
      [
        ['k2r', '문자 보고 발음 쓰기'],
        ['r2k', '발음 보고 문자 쓰기']
      ],
      k.dir
    )}</div>
      <div class="setup-row"><label>문자</label>${seg(
        'kana.script',
        [
          ['h', 'ひらがな'],
          ['k', 'カタカナ'],
          ['m', '섞기']
        ],
        k.script
      )}</div>
      <div class="setup-row"><label>범위</label><div class="chips">${Object.entries(SETS)
        .map(([v, l]) => `<button class="chip" data-multi="kana.sets" data-val="${v}" aria-pressed="${k.sets.includes(v)}">${l}</button>`)
        .join('')}</div></div>
      ${k.dir === 'r2k' ? inputRow() : ''}`;
  } else if (mod === 'kconf') {
    sum = { h: 'ひらがな', k: 'カタカナ', m: 'ひらがな+カタカナ' }[S.kconf.script] + ' · 모양이 비슷한 글자';
    body = `<div class="setup-row"><label>문자</label>${seg(
      'kconf.script',
      [
        ['h', 'ひらがな'],
        ['k', 'カタカナ'],
        ['m', '섞기']
      ],
      S.kconf.script
    )}</div><p class="note">シ/ツ, ソ/ン, ぬ/め처럼 헷갈리는 글자끼리 묶어서 출제해요. 기록은 문자 퀴즈와 함께 쌓여요.</p>`;
  } else if (mod === 'word') {
    sum = [
      S.word.lvl && S.word.lvl !== 'all' ? 'N' + S.word.lvl : '',
      S.word.fav ? '★ 즐겨찾기' : catSum(S.word.cats, CATS),
      S.set.wans === 'choice' ? '4지선다' : '직접 쓰기',
      S.set.kanji ? '한자+가나' : '가나만'
    ].join(' · ');
    body =
      lvlRow('word.lvl', S.word.lvl || 'all') +
      catChips('word.cats', CATS, S.word.cats, 'word', favCount('ja')) +
      ansRow() +
      kanjiRow('표기');
    sum = sum.replace(/^ · /, '');
  } else if (mod === 'loan') {
    sum = `외래어 ${LOANS.length}개 · 원래 영어 고르기`;
    body = `<p class="note">가타카나로 쓰는 외래어를 읽고 원래 영어 단어를 골라요. 일본에서 만든 영어(일본식 영어)는 설명이 함께 나와요.</p>`;
  } else if (mod === 'conj') {
    sum = S.conj.forms.map(f => FORM_SHORT[f]).join('·') + ' · ' + (S.set.kanji ? '한자+가나' : '가나만');
    body =
      `<div class="setup-row"><label>활용형</label><div class="chips">${Object.keys(FORMS)
        .map(
          f =>
            `<button class="chip" data-multi="conj.forms" data-val="${f}" aria-pressed="${S.conj.forms.includes(f)}">${FORMS[f]}</button>`
        )
        .join('')}</div></div>` +
      kanjiRow('표기') +
      `<p class="note">1그룹(う동사)은 끝소리를 바꾸고, 2그룹(る동사)은 る를 떼고 붙이고, する·来る는 불규칙이에요.</p>`;
  } else if (mod === 'kanji') {
    sum = `한자 ${byLvl(KANJI, S.kjl.lvl).length}자 · ` + { mix: '뜻·읽기 섞기', mean: '뜻 고르기', read: '읽기 고르기' }[S.kj.mode];
    body =
      lvlRow('kjl.lvl', S.kjl.lvl) +
      `<div class="setup-row"><label>문제 종류</label>${seg(
        'kj.mode',
        [
          ['mix', '섞기'],
          ['mean', '뜻 고르기'],
          ['read', '읽기 고르기']
        ],
        S.kj.mode
      )}</div><p class="note">뜻 고르기는 한자를 보고 훈음(예: 날 일)을, 읽기 고르기는 한자 단어를 보고 읽는 법을 골라요.</p>`;
  } else if (mod === 'gram') {
    sum = `${S.grl.lvl === 'all' ? 'N5·N4' : 'N' + S.grl.lvl} 문법 ${byLvl(GRAM, S.grl.lvl).length}개 · 퀴즈 ${byLvl(GRAM_ITEMS, S.grl.lvl).length}문제 · ${S.set.kanji ? '한자+가나' : '가나만'}`;
    body =
      lvlRow('grl.lvl', S.grl.lvl) +
      kanjiRow('보기 표기') +
      `<p class="note">문법 설명과 예문은 자료 탭의 '문법 노트'에서 볼 수 있어요.</p>`;
  } else if (mod === 'cnt') {
    const K = { counter: '조수사', date: '날짜·월·요일' };
    sum = S.cnt.kinds.map(k => K[k]).join('·') + ' · 읽기·고르기';
    body = `<div class="setup-row"><label>종류</label><div class="chips">${Object.entries(K)
      .map(
        ([v, l]) => `<button class="chip" data-multi="cnt.kinds" data-val="${v}" aria-pressed="${S.cnt.kinds.includes(v)}">${l}</button>`
      )
      .join(
        ''
      )}</div></div><p class="note">本(자루)·枚(장)·匹(마리)처럼 일본어는 물건에 따라 세는 말이 달라요. 3本 さんぼん, 6本 ろっぽん처럼 소리가 바뀌는 곳을 집중해서 연습해요.</p>`;
  } else if (mod === 'pol') {
    sum =
      { mix: '양방향', p2c: '존댓말 → 반말', c2p: '반말 → 존댓말' }[S.pol.dir] +
      ` · ${POL.length}문장 · ` +
      (S.set.kanji ? '한자+가나' : '가나만');
    body =
      `<div class="setup-row"><label>방향</label>${seg(
        'pol.dir',
        [
          ['mix', '섞기'],
          ['p2c', '존댓말 → 반말'],
          ['c2p', '반말 → 존댓말']
        ],
        S.pol.dir
      )}</div>` +
      kanjiRow('표기') +
      `<p class="note">친구·가족에게는 반말(사전형·た형), 처음 만난 사람이나 윗사람에게는 です·ます를 써요.</p>`;
  } else if (mod === 'jlen') {
    sum = (S.jlen.lb.length === JM_LABELS.length ? '전체' : S.jlen.lb.join('·')) + ` · ${basePool('jlen', false).length}쌍`;
    body = `<div class="setup-row"><label>종류</label><div class="chips">${JM_LABELS.map(l => `<button class="chip" data-multi="jlen.lb" data-val="${esc(l)}" aria-pressed="${S.jlen.lb.includes(l)}">${esc(l)} ${JMP.filter(x => x.lb === l).length}</button>`).join('')}</div></div><p class="note">일본어는 소리 길이(おばさん/おばあさん)와 っ(きて/きって)가 다르면 뜻이 달라져요. 이어폰을 쓰면 더 잘 들려요.</p>`;
  } else if (mod === 'irr') {
    sum = `불규칙 동사 ${IRR.length}개 · ` + { mix: '과거형·과거분사', past: '과거형', pp: '과거분사' }[S.irr.form];
    body = `<div class="setup-row"><label>문제 종류</label>${seg(
      'irr.form',
      [
        ['mix', '섞기'],
        ['past', '과거형'],
        ['pp', '과거분사']
      ],
      S.irr.form
    )}</div>`;
  } else if (mod === 'mp') {
    sum = `발음이 비슷한 단어 ${MP.length}쌍`;
    body = `<p class="note">ship/sheep, light/right처럼 한국 사람이 헷갈리기 쉬운 발음을 듣고 구별해요. 이어폰을 쓰면 더 잘 들려요.</p>`;
  } else if (mod === 'ew') {
    sum = [
      S.ew.dir === 'e2k' ? '영어→뜻' : '뜻→영어',
      S.ew.fav ? '★ 즐겨찾기' : catSum(S.ew.cats, EN_CATS),
      S.set.wans === 'choice' ? '4지선다' : '직접 쓰기'
    ].join(' · ');
    body =
      `<div class="setup-row"><label>문제 방향</label>${seg(
        'ew.dir',
        [
          ['e2k', '영어 보고 뜻'],
          ['k2e', '뜻 보고 영어']
        ],
        S.ew.dir
      )}</div>` +
      catChips('ew.cats', EN_CATS, S.ew.cats, 'ew', favCount('en')) +
      ansRow();
  } else if (NUMS.has(mod)) {
    const sel = S.num[lang];
    const L = { price: '가격', time: '시간', number: '숫자' };
    sum = sel.map(t => L[t]).join('·') + ' 듣고 숫자로 쓰기';
    body = `<div class="setup-row"><label>종류</label><div class="chips">${Object.entries(L)
      .map(([v, l]) => `<button class="chip" data-numt="${v}" aria-pressed="${sel.includes(v)}">${l}</button>`)
      .join(
        ''
      )}</div></div><p class="note">문제가 매번 새로 만들어져서 끝없이 연습할 수 있어요. 시간은 6시 30분이면 630처럼 숫자만 써도 돼요.</p>`;
  } else {
    const sel = S.scenes[lang];
    sum =
      (sel.length === Object.keys(SCENES).length ? '모든 상황' : sel.map(s => SCENES[s]).join('·')) +
      (lang === 'ja' && !DICT.has(mod) && !LISTEN.has(mod) ? ' · ' + (S.set.kanji ? '한자+가나' : '가나만') : '');
    body =
      sceneChips(lang) +
      (lang === 'ja' && !LISTEN.has(mod) && !DICT.has(mod) && mod !== 'jsh'
        ? kanjiRow(BUILD.has(mod) ? '블록 표기' : mod === 'part' ? '문장 표기' : '보기 표기')
        : '') +
      (mod === 'jd' ? inputRow() : '');
    if (mod === 'jsh' || mod === 'esh')
      body += `<p class="note">녹음은 아이폰 Safari나 홈 화면 앱에서 마이크 권한을 허용하면 쓸 수 있어요. 녹음은 저장되지 않아요.</p>`;
    if (mod === 'part')
      body += `<p class="note">문장 속 조사 하나를 비워 두고 맞는 조사를 고르게 해요. 뜻이 비슷한 は/が, に/へ는 같은 보기에 함께 나오지 않아요.</p>`;
    if (LISTEN.has(mod) || DICT.has(mod))
      body += `<p class="note">문제가 나오면 문장이 바로 재생돼요. 안 들리면 재생 버튼을 누르세요. 무음 모드에서는 소리가 나지 않아요.</p>`;
    if (mod === 'jd') body += `<p class="note">가타카나 단어도 히라가나로 써도 정답이에요. 조사 は·へ·を는 わ·え·お로 써도 돼요.</p>`;
    if (mod === 'ed') body += `<p class="note">대소문자와 문장부호는 채점하지 않아요. I'm과 I am처럼 줄임말은 둘 다 정답이에요.</p>`;
    if (BUILD.has(mod)) body += `<p class="note">필요 없는 블록이 하나 섞여 있어요. 놓은 블록을 누르면 다시 빠져요.</p>`;
  }
  if (srsMods().includes(mod) || mod === 'kconf' || mod === 'jsh' || mod === 'esh') {
    const f = filt(mod);
    const wc = basePool(mod, false).filter(p => isWeak(p.key)).length;
    if (f !== 'all') sum = (f === 'due' ? '오늘 복습 · ' : '오답 복습 · ') + sum;
    body += `<div class="setup-row"><label>출제</label><div class="chips"><button class="chip" data-filt="all" aria-pressed="${f === 'all'}">전체에서 출제</button><button class="chip warn" data-filt="weak" aria-pressed="${f === 'weak'}">틀린 것만 ${wc}</button>${mod !== 'kconf' ? `<button class="chip warn" data-filt="due" aria-pressed="${f === 'due'}">오늘 복습 ${dueCount(mod)}</button>` : ''}</div><p class="note">틀린 문제는 다시 맞힐 때까지 더 자주 나와요.</p></div>`;
  }
  const open = !!setupOpen[mod];
  return `<div class="setup" data-open="${open}"><button class="setup-sum" aria-expanded="${open}"><span>${esc(sum)}</span>${CHEV}</button><div class="setup-body" ${open ? '' : 'hidden'}>${body}</div></div>`;
}

function basePool(mod, full) {
  if (POOLS[mod]) return POOLS[mod](full);
  const lang = modLang(mod);
  const inScene = s => S.scenes[lang].includes(s.sc);
  if (mod === 'kana') {
    if (full)
      return KANA.flatMap(x =>
        ['h', 'k'].map(sc => {
          const ch = sc === 'h' ? x.h : toKata(x.h);
          return { ...x, ch, sc, key: 'k:' + ch };
        })
      );
    const k = S.kana;
    const scripts = k.script === 'm' ? ['h', 'k'] : [k.script];
    return KANA.filter(x => k.sets.includes(x.set)).flatMap(x =>
      scripts.map(sc => {
        const ch = sc === 'h' ? x.h : toKata(x.h);
        return { ...x, ch, sc, key: 'k:' + ch };
      })
    );
  }
  if (mod === 'kconf') return CONF_ITEMS.filter(x => S.kconf.script === 'm' || x.sc === S.kconf.script);
  if (mod === 'word')
    return full
      ? WORDS
      : WORDS.filter(
          w =>
            (S.word.fav ? S.fav[w.key] : w.cats.some(c => S.word.cats.includes(c))) &&
            (!S.word.lvl || S.word.lvl === 'all' || w.mine || String(w.lvl) === S.word.lvl)
        );
  if (mod === 'ew') return full ? EN_WORDS : EN_WORDS.filter(w => (S.ew.fav ? S.fav[w.key] : w.cats.some(c => S.ew.cats.includes(c))));
  if (mod === 'loan') return LOANS;
  if (mod === 'conj') return full ? CONJ_ITEMS : CONJ_ITEMS.filter(x => S.conj.forms.includes(x.form));
  if (mod === 'kanji') return full ? KANJI : byLvl(KANJI, S.kjl.lvl);
  if (mod === 'gram') return full ? GRAM_ITEMS : byLvl(GRAM_ITEMS, S.grl.lvl);
  if (mod === 'irr') return IRR;
  if (mod === 'mp') return MP;
  if (mod === 'cnt') return full ? CNT_ITEMS : CNT_ITEMS.filter(x => S.cnt.kinds.includes(x.kind));
  if (mod === 'pol') return POL;
  if (mod === 'jlen') return full ? JMP : JMP.filter(x => S.jlen.lb.includes(x.lb));
  if (ITEMS[mod]) return full ? ITEMS[mod] : ITEMS[mod].filter(inScene);
  return [];
}
function buildPool(mod) {
  const f = filt(mod);
  if (f === 'due') return basePool(mod, true).filter(p => isDue(p.key));
  const p = basePool(mod, false);
  return f === 'weak' ? p.filter(x => isWeak(x.key)) : p;
}
function newRound(mod, items) {
  clearAdv();
  let qs;
  if (NUMS.has(mod)) {
    const lang = modLang(mod);
    const types = S.num[lang];
    qs = Array.from({ length: S.set.round }, () => genNumQ(lang, types[(Math.random() * types.length) | 0]));
  } else qs = items ? shuffle(items) : pickN(buildPool(mod), S.set.round);
  if (mod === 'kconf') qs = qs.map(q => ({ ...q, dir: Math.random() < 0.5 ? 'g2r' : 'r2g' }));
  if (mod === 'kanji')
    qs = qs.map(q => ({
      ...q,
      dir: S.kj.mode === 'mix' ? (Math.random() < 0.5 ? 'mean' : 'read') : S.kj.mode,
      exi: (Math.random() * q.ex.length) | 0
    }));
  if (mod === 'irr') qs = qs.map(q => ({ ...q, form: S.irr.form === 'mix' ? (Math.random() < 0.5 ? 'past' : 'pp') : S.irr.form }));
  if (mod === 'mp') qs = qs.map(q => ({ ...q, tg: Math.random() < 0.5 ? q.w1 : q.w2 }));
  if (mod === 'jlen') qs = qs.map(q => ({ ...q, tg: Math.random() < 0.5 ? 1 : 2 }));
  if (PREP[mod]) qs = qs.map(PREP[mod]);
  if (mod === 'pol') qs = qs.map(q => ({ ...q, dir: S.pol.dir === 'mix' ? (Math.random() < 0.5 ? 'p2c' : 'c2p') : S.pol.dir }));
  if (mod === 'cnt')
    qs = qs.map(q => ({
      ...q,
      dir: q.id === '曜' ? 'pick' : q.kind === 'date' || q.id === 'つ' ? 'read' : Math.random() < 0.6 ? 'read' : 'pick',
      noun: q.def ? q.def.nouns[(Math.random() * q.def.nouns.length) | 0] : null
    }));
  R[mod] = { qs, i: 0, res: [], answered: false, done: false, empty: qs.length === 0, due: filt(mod) === 'due' };
  if (CRUN && CRUN.mod === mod) {
    R[mod].course = CRUN;
    R[mod].due = false;
    CRUN = null;
  }
  padVal = '';
}
function renderModule(mod) {
  view.innerHTML = `<section class="mod">${modeSeg(mod)}${setupHTML(mod)}
    <div class="prog"><div class="prog-bar"><i id="pfill"></i></div><span id="ptext" class="num"></span><span class="score num" id="pscore"></span></div>
    <div id="stage"></div></section>`;
  bindModes();
  bindSetup(mod);
  if (PENDING[mod]) {
    newRound(mod, PENDING[mod]);
    delete PENDING[mod];
  } else if (!R[mod]) newRound(mod);
  showQ(mod, false);
}
function bindSetup(mod) {
  const el = view.querySelector('.setup');
  if (!el) return;
  el.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.classList.contains('setup-sum')) {
      setupOpen[mod] = !setupOpen[mod];
      el.dataset.open = setupOpen[mod];
      b.setAttribute('aria-expanded', setupOpen[mod]);
      el.querySelector('.setup-body').hidden = !setupOpen[mod];
      return;
    }
    const lang = modLang(mod);
    const resetScene = () => {
      for (const m of SCENE_MODS) if (modLang(m) === lang) R[m] = null;
    };
    if (b.dataset.set) {
      const [g, k] = b.dataset.set.split('.');
      let v = b.dataset.val;
      if (v === 'true' || v === 'false') v = v === 'true';
      S[g][k] = v;
      if (g === 'set') for (const m in R) R[m] = null;
    } else if (b.dataset.multi) {
      const [g, k] = b.dataset.multi.split('.');
      const v = b.dataset.val;
      let arr = S[g][k];
      if (g === 'word' || g === 'ew') {
        const cats = g === 'ew' ? EN_CATS : CATS;
        if (Object.keys(cats).every(c => arr.includes(c) || c === 'mine')) arr = [v];
        else if (arr.includes(v)) {
          if (arr.length > 1) arr = arr.filter(x => x !== v);
        } else arr = [...arr, v];
        S[g].fav = false;
      } else {
        if (arr.includes(v)) {
          if (arr.length > 1) arr = arr.filter(x => x !== v);
        } else arr = [...arr, v];
      }
      if (g === 'kana') arr = Object.keys(SETS).filter(s => arr.includes(s));
      if (g === 'conj') arr = Object.keys(FORMS).filter(s => arr.includes(s));
      if (g === 'cnt') arr = ['counter', 'date'].filter(s => arr.includes(s));
      if (g === 'jlen') arr = JM_LABELS.filter(s => arr.includes(s));
      S[g][k] = arr;
    } else if ('allcats' in b.dataset) {
      if (mod === 'ew') {
        S.ew.cats = Object.keys(EN_CATS);
        S.ew.fav = false;
      } else {
        S.word.cats = Object.keys(CATS);
        S.word.fav = false;
      }
    } else if (b.dataset.favonly) {
      const g = b.dataset.favonly;
      S[g].fav = !S[g].fav;
    } else if (b.dataset.scene) {
      const v = b.dataset.scene;
      let arr = S.scenes[lang];
      if (arr.length === Object.keys(SCENES).length) arr = [v];
      else if (arr.includes(v)) {
        if (arr.length > 1) arr = arr.filter(x => x !== v);
      } else arr = [...arr, v];
      S.scenes[lang] = arr;
      resetScene();
    } else if ('allscenes' in b.dataset) {
      S.scenes[lang] = allScenes();
      resetScene();
    } else if (b.dataset.numt) {
      const v = b.dataset.numt;
      let arr = S.num[lang];
      if (arr.includes(v)) {
        if (arr.length > 1) arr = arr.filter(x => x !== v);
      } else arr = [...arr, v];
      S.num[lang] = ['price', 'time', 'number'].filter(t => arr.includes(t));
    } else if (b.dataset.filt) {
      S.filt[mod] = b.dataset.filt;
    } else return;
    save();
    R[mod] = null;
    renderModule(mod);
  });
}
function updateProg(mod) {
  const r = R[mod];
  const n = r.qs.length;
  const c = r.res.filter(x => x.ok).length,
    w = r.res.length - c;
  const pf = document.getElementById('pfill');
  if (!pf) return;
  pf.style.width = (n ? (r.res.length / n) * 100 : 0) + '%';
  document.getElementById('ptext').textContent = n ? `${Math.min(r.i + 1, n)} / ${n}` : '';
  document.getElementById('pscore').innerHTML = r.res.length ? `<span class="o">○ ${c}</span><span>× ${w}</span>` : '';
}
const MARKS = `<svg class="mark o" viewBox="0 0 200 200" aria-hidden="true"><path pathLength="1" d="M108 24C158 22 184 62 178 108 172 152 132 180 92 176 48 172 20 140 24 96 28 56 62 30 104 30"/></svg><svg class="mark x" viewBox="0 0 200 200" aria-hidden="true"><path pathLength="1" d="M48 158 158 44"/></svg>`;
function ensureStage() {
  const st = document.getElementById('stage');
  if (!document.getElementById('card'))
    st.innerHTML = `<div class="card" id="card"></div><div class="zone" id="zone"></div><div class="fb" id="fb"></div>`;
  return { card: document.getElementById('card'), zone: document.getElementById('zone'), fb: document.getElementById('fb') };
}
function showQ(mod, focus) {
  const r = R[mod];
  const st = document.getElementById('stage');
  if (!st) return;
  updateProg(mod);
  if (r.empty) {
    const f = filt(mod);
    st.innerHTML =
      f !== 'all'
        ? `<div class="empty"><p style="margin:0;font-weight:600">${f === 'due' ? '오늘 복습할 문제가 없어요' : '복습할 오답이 없어요'}</p><p class="note">${f === 'due' ? '복습할 때가 된 문제를 모두 끝냈어요.' : '지금 범위에서 틀린 문제를 모두 다시 맞혔어요.'}</p><button class="btn primary" data-act="allmode">전체에서 출제하기</button></div>`
        : `<div class="empty"><p style="margin:0;font-weight:600">출제할 문제가 없어요</p><p class="note">위의 설정에서 범위를 골라 주세요.</p></div>`;
    st.onclick = e => {
      if (e.target.closest('[data-act=allmode]')) {
        S.filt[mod] = 'all';
        save();
        R[mod] = null;
        renderModule(mod);
      }
    };
    return;
  }
  if (r.done) return summary(mod);
  const q = r.qs[r.i];
  const { card, zone, fb } = ensureStage();
  card.dataset.mark = r.mark || '';
  fb.innerHTML = r.fb || '';
  (
    ({
      kana: showKana,
      kconf: showConf,
      word: showWord,
      ew: showEW,
      loan: showLoan,
      conj: showConj,
      kanji: showKanji,
      part: showPart,
      gram: showGram,
      irr: showIrr,
      mp: showMP,
      jsh: showShadow,
      esh: showShadow,
      cnt: showCnt,
      pol: showPol,
      jlen: showJM
    })[mod] ||
    SHOWS[mod] ||
    (BUILD.has(mod) ? showBuild : DICT.has(mod) ? showDict : NUMS.has(mod) ? showNum : showChoice)
  )(mod, q, card, zone, r, focus);
  st.onclick = e => stageClick(mod, e);
  st.onmousedown = e => {
    if (e.target.closest('[data-act],.k,.pad-fn button')) e.preventDefault();
  };
}

// ---- quiz/input.js ----
'use strict';
/* ---------- typed answer form ---------- */
function answerForm(zone, type, attrs, mod, cls) {
  if (zone.dataset.type === type) return;
  zone.dataset.type = type;
  zone.innerHTML = `<form class="ans-form" id="ansForm" autocomplete="off"><input id="ans" type="text" ${cls ? `class="${cls}"` : ''} ${attrs} autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" aria-label="답 입력"><button class="btn primary" type="submit" data-act="submit">확인</button></form>
    <div class="sub-actions"><button type="button" class="btn quiet" data-act="skip">모르겠어요</button></div>`;
  zone.querySelector('form').addEventListener('submit', e => {
    e.preventDefault();
    formEnter(mod);
  });
}
function prepInput(zone, r, focus) {
  const inp = zone.querySelector('#ans');
  if (!inp) return;
  if (!r.answered) {
    inp.value = '';
    inp.removeAttribute('data-state');
  }
  if (focus) inp.focus();
}
function resultBody(ok, skip, given, info) {
  return ok
    ? `<div class="fb-head"><span class="badge">〇</span>정답</div>${info}`
    : `<div class="fb-head"><span class="badge">×</span>${skip ? '정답 확인' : '오답'}</div>${given && !skip ? `<p class="fb-sub given">입력: <s>${esc(given)}</s></p>` : ''}${info}`;
}

/* ---------- kana keypad ---------- */
let padVal = '';
let padMax = 4;
const PAD_COLS = [
  'あいうえお',
  'かきくけこ',
  'さしすせそ',
  'たちつてと',
  'なにぬねの',
  'はひふへほ',
  'まみむめも',
  'や_ゆ_よ',
  'らりるれろ',
  'わ___を'
];
function padHTML(sc) {
  const cv = sc === 'k' ? toKata : x => x;
  const keys = PAD_COLS.join('')
    .split('')
    .map(c =>
      c === '_' ? '<span class="k blank"></span>' : `<button type="button" class="k" data-k="${cv(c)}" lang="ja">${cv(c)}</button>`
    )
    .join('');
  return `<div class="pad"><div class="pad-out" id="padOut"><span id="padTxt" lang="ja"></span><i class="caret"></i></div>
    <div class="pad-grid">${keys}</div>
    <div class="pad-fn"><button type="button" class="fn" data-f="daku" aria-label="탁점">゛</button><button type="button" class="fn" data-f="han" aria-label="반탁점">゜</button><button type="button" class="fn" data-f="small" aria-label="작은 글자">小</button><button type="button" data-k="${cv('ん')}" lang="ja">${cv('ん')}</button><button type="button" data-k="ー" lang="ja">ー</button><button type="button" class="fn" data-f="del" aria-label="지우기">⌫</button><button type="button" class="pad-ok" data-f="ok">확인</button></div>
    <div class="sub-actions"><button type="button" class="btn quiet" data-act="skip">모르겠어요</button></div></div>`;
}
function renderPad(state) {
  const t = document.getElementById('padTxt');
  if (!t) return;
  t.textContent = padVal;
  const o = document.getElementById('padOut');
  if (state) o.dataset.state = state;
  else o.removeAttribute('data-state');
}
const DK = {
  か: 'が',
  き: 'ぎ',
  く: 'ぐ',
  け: 'げ',
  こ: 'ご',
  さ: 'ざ',
  し: 'じ',
  す: 'ず',
  せ: 'ぜ',
  そ: 'ぞ',
  た: 'だ',
  ち: 'ぢ',
  つ: 'づ',
  て: 'で',
  と: 'ど',
  は: 'ば',
  ひ: 'び',
  ふ: 'ぶ',
  へ: 'べ',
  ほ: 'ぼ',
  う: 'ゔ'
};
const HN = { は: 'ぱ', ひ: 'ぴ', ふ: 'ぷ', へ: 'ぺ', ほ: 'ぽ' };
const SM = { あ: 'ぁ', い: 'ぃ', う: 'ぅ', え: 'ぇ', お: 'ぉ', や: 'ゃ', ゆ: 'ゅ', よ: 'ょ', つ: 'っ', わ: 'ゎ' };
const inv = o => Object.fromEntries(Object.entries(o).map(([a, b]) => [b, a]));
const DKi = inv(DK),
  HNi = inv(HN),
  SMi = inv(SM);
function modify(f) {
  if (!padVal) return;
  const last = padVal.slice(-1);
  const kata = last !== toHira(last);
  let h = toHira(last),
    n = null;
  if (f === 'daku') n = DK[h] || DKi[h] || (HNi[h] ? DK[HNi[h]] : null);
  else if (f === 'han') n = HN[h] || HNi[h] || (DKi[h] && HN[DKi[h]] ? HN[DKi[h]] : null);
  else if (f === 'small') n = SM[h] || SMi[h];
  if (n) padVal = padVal.slice(0, -1) + (kata ? toKata(n) : n);
}
function padKey(mod, btn) {
  const r = R[mod];
  if (r.answered) {
    if (btn.dataset.f === 'ok') next(mod);
    return;
  }
  if (btn.dataset.k) {
    if ([...padVal].length < padMax) padVal += btn.dataset.k;
  } else if (btn.dataset.f === 'del') padVal = padVal.slice(0, -1);
  else if (btn.dataset.f === 'ok') {
    if (padVal) CHECK[mod](padVal);
    return;
  } else modify(btn.dataset.f);
  renderPad('');
}

// ---- quiz/kana.js ----
'use strict';
/* ---------- kana ---------- */
function acceptFor(q) {
  const conv = q.sc === 'h' ? x => x : toKata;
  return KANA.filter(x => x.prompt === q.prompt || x.alts[0] === q.prompt).map(x => conv(x.h));
}
function showKana(mod, q, card, zone, r, focus) {
  const k2r = S.kana.dir === 'k2r';
  const scName = q.sc === 'h' ? '히라가나' : '가타카나';
  card.innerHTML =
    (k2r
      ? `<div class="tz"><span class="glyph ${q.ch.length > 1 ? 'two' : ''}" lang="ja">${q.ch}</span></div><p class="cap">${scName} · 발음을 알파벳으로 입력</p>`
      : `<div class="tz"><span class="roma">${q.prompt}</span></div><p class="cap">${scName}로 써 보세요</p>`) + MARKS;
  padMax = 4;
  if (k2r || S.kana.input === 'sys') {
    answerForm(
      zone,
      k2r ? 'roman' : 'ja',
      k2r ? 'lang="en" inputmode="email" placeholder="예: ka, shi"' : 'lang="ja" placeholder="일본어 키보드로 입력"',
      'kana',
      k2r ? 'roman' : 'ja'
    );
    prepInput(zone, r, focus);
  } else {
    const type = 'pad-' + q.sc;
    if (zone.dataset.type !== type) {
      zone.dataset.type = type;
      zone.innerHTML = padHTML(q.sc);
    }
    if (!r.answered) padVal = '';
    renderPad(r.answered ? (r.lastOk ? 'ok' : 'ng') : '');
  }
}
function checkKana(val, skip) {
  const r = R.kana,
    q = r.qs[r.i];
  if (r.answered) return;
  const k2r = S.kana.dir === 'k2r';
  let ok = false,
    hint = '';
  const given = (val || '').trim();
  if (!skip) {
    if (k2r) {
      const v = given.toLowerCase().replace(/[\s']/g, '');
      if (!v) return;
      ok = q.alts.includes(v);
    } else {
      const v = given.replace(/\s/g, '').normalize('NFC');
      if (!v) return;
      const acc = acceptFor(q);
      ok = acc.includes(v);
      if (!ok) {
        const o = q.sc === 'h' ? toHira(v) : toKata(v);
        if (o !== v && acc.includes(o))
          hint = q.sc === 'h' ? '가타카나로 썼어요. 히라가나로 써야 해요.' : '히라가나로 썼어요. 가타카나로 써야 해요.';
      }
    }
  }
  const other = q.sc === 'h' ? toKata(q.h) : q.h;
  const ans = k2r ? `<span class="mono">${q.alts.join(' / ')}</span>` : `<span class="jp" lang="ja">${q.ch}</span>`;
  const extra = `<div class="fb-line"><span class="jp" lang="ja">${q.ch}</span><span class="mono">${q.alts[0]}</span><span class="fb-sub">${q.sc === 'h' ? '가타카나' : '히라가나'} <span class="jp" lang="ja">${other}</span></span>${spkBtn(q.ch)}</div>`;
  const body = ok
    ? `<div class="fb-head"><span class="badge">〇</span>정답</div>${extra}${!k2r && given !== q.ch ? `<p class="fb-sub">같은 소리 글자 ${esc(given)}도 정답으로 처리했어요.</p>` : ''}`
    : `<div class="fb-head"><span class="badge">×</span>${skip ? '정답 확인' : '오답'} · 정답은 ${ans}</div>${given && !skip ? `<p class="fb-sub given">입력: <s>${esc(given)}</s></p>` : ''}${hint ? `<p class="fb-sub">${hint}</p>` : ''}${extra}`;
  finish('kana', q, ok, given, body);
  const inp = document.getElementById('ans');
  if (inp) inp.dataset.state = ok ? 'ok' : 'ng';
  renderPad(ok ? 'ok' : 'ng');
  if (S.set.autoSpeak) speak(q.ch);
  if (ok && S.set.autoNext) advT = setTimeout(() => next('kana'), 900);
}

/* ---------- confusable kana ---------- */
function showConf(mod, q, card, zone, r) {
  const g = CONF[q.gi];
  const scName = q.sc === 'h' ? '히라가나' : '가타카나';
  if (!r.order) r.order = shuffle(g[1]);
  card.innerHTML =
    (q.dir === 'g2r'
      ? `<div class="tz"><span class="glyph" lang="ja">${q.ch}</span></div><p class="cap">이 글자의 발음을 고르세요</p>`
      : `<div class="tz"><span class="roma">${kanaRom(q.ch)}</span></div><p class="cap">이 소리의 ${scName}를 고르세요</p>`) + MARKS;
  zone.dataset.type = 'conf';
  zone.innerHTML = `<div class="opts grid2">${r.order
    .map((c, i) => {
      const st = r.answered ? (c === q.ch ? 'ok' : i === r.chosen ? 'ng' : 'dim') : '';
      return `<button type="button" class="opt" data-opt="${i}" ${st ? `data-state="${st}"` : ''}>${q.dir === 'g2r' ? `<span class="mono-opt">${kanaRom(c)}</span>` : `<span class="glyph-opt" lang="ja">${c}</span>`}${r.answered ? `<span class="tr ${q.dir === 'g2r' ? 'jp' : 'mono'}">${q.dir === 'g2r' ? c : kanaRom(c)}</span>` : ''}</button>`;
    })
    .join('')}</div>`;
}
function checkConf(i) {
  const r = R.kconf,
    q = r.qs[r.i];
  if (r.answered) return;
  r.chosen = i;
  const ok = r.order[i] === q.ch;
  const g = CONF[q.gi];
  const body = `<div class="fb-head"><span class="badge">${ok ? '〇' : '×'}</span>${ok ? '정답' : '오답'}</div><div class="conf">${g[1].map(c => `<span><b lang="ja">${c}</b><small>${kanaRom(c)}</small></span>`).join('')}</div><p class="fb-sub">${esc(g[2])}</p><div>${spkBtn(q.ch)}</div>`;
  finish('kconf', q, ok, r.order[i], body);
  showConf('kconf', q, document.getElementById('card'), document.getElementById('zone'), r);
  if (S.set.autoSpeak) speak(q.ch);
  if (ok && S.set.autoNext) advT = setTimeout(() => next('kconf'), 1100);
}

// ---- quiz/words.js ----
'use strict';
/* ---------- words (shared) ---------- */
const kNorm = s =>
  s
    .normalize('NFC')
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[\s.,!?~·・'"“”‘’\-…]/g, '');
const kStem = s => s.replace(/(입니다|이에요|예요|해요|요|다)$/, '');
function meaningOk(input, ms) {
  const a = kNorm(input);
  if (!a) return false;
  return ms.some(m => {
    const b = kNorm(m);
    return a === b || (kStem(a) === kStem(b) && kStem(a).length > 0);
  });
}
function markWord(text, cands, ci) {
  const list = [];
  for (const c of cands) {
    if (!c) continue;
    list.push(c);
    if ([...c].length >= 3) list.push(c.slice(0, -1));
  }
  for (const c of list) {
    const idx = ci ? text.toLowerCase().indexOf(c.toLowerCase()) : text.indexOf(c);
    if (idx >= 0)
      return esc(text.slice(0, idx)) + '<mark>' + esc(text.slice(idx, idx + c.length)) + '</mark>' + esc(text.slice(idx + c.length));
  }
  return esc(text);
}
function wordOptions(q, all, mode, lang) {
  const qm = new Set(q.m.map(kNorm));
  const label = x => (mode === 'en' ? x.w : x.m.slice(0, 2).join(', '));
  const ql = label(q);
  const okx = x => x !== q && !x.m.some(m => qm.has(kNorm(m))) && label(x) !== ql && x.w !== q.w;
  let c = shuffle(all.filter(x => okx(x) && x.cats.some(k => q.cats.includes(k))));
  if (c.length < 3) c = c.concat(shuffle(all.filter(x => okx(x) && !c.includes(x))));
  const sub = x => (mode === 'en' ? x.m.slice(0, 2).join(', ') : lang === 'ja' ? (x.w !== x.r ? `${x.w} · ${x.r}` : x.w) : x.w);
  const mk = (x, ok) => ({
    t: label(x),
    ok,
    sub: sub(x),
    cls: mode === 'en' ? 'en' : 'ko-opt',
    lang: mode === 'en' ? 'en' : '',
    subCls: mode === 'en' ? '' : lang === 'ja' ? 'jp' : 'en',
    subLang: mode === 'en' ? '' : lang
  });
  return shuffle([mk(q, true), ...c.slice(0, 3).map(x => mk(x, false))]);
}
function optsHTML(r, attr = 'data-wopt') {
  return `<div class="opts">${r.order
    .map((o, i) => {
      const st = r.answered ? (o.ok ? 'ok' : i === r.chosen ? 'ng' : 'dim') : '';
      return `<button type="button" class="opt" ${attr}="${i}" ${st ? `data-state="${st}"` : ''} ${r.answered ? 'aria-disabled="true"' : ''}><span class="n">${i + 1}</span><span class="${o.cls}" ${o.lang ? `lang="${o.lang}"` : ''}>${esc(o.t)}</span>${r.answered && o.sub ? `<span class="tr ${o.subCls || ''}" ${o.subLang ? `lang="${o.subLang}"` : ''}>${esc(o.sub)}</span>` : ''}</button>`;
    })
    .join('')}</div>
    <div class="sub-actions"><button type="button" class="btn quiet" data-act="skip">${r.answered ? '다음' : '모르겠어요'}</button></div>`;
}
const favBtn = k =>
  `<button type="button" class="spk" data-act="fav" data-key="${esc(k)}" aria-pressed="${!!S.fav[k]}">${S.fav[k] ? '★ 즐겨찾기됨' : '☆ 즐겨찾기'}</button>`;

/* ---------- japanese words ---------- */
const wordSize = t => {
  const n = [...t].length;
  return n <= 2 ? 76 : n <= 4 ? 60 : n <= 6 ? 46 : n <= 8 ? 36 : 30;
};
function wordReading(q) {
  const disp = S.set.kanji ? q.w : q.r;
  const parts = [];
  if (disp !== q.r) parts.push(`<span class="jp" lang="ja">${esc(q.r)}</span>`);
  if (!S.set.kanji && q.w !== q.r) parts.push(`<span class="jp" lang="ja">${esc(q.w)}</span>`);
  parts.push(`<span class="mono">${romaji(q.r)}</span>`);
  return parts.join('') + spkBtn(q.r);
}
function showWord(mod, q, card, zone, r, focus) {
  const disp = S.set.kanji ? q.w : q.r;
  const open = r.revealed || r.answered;
  card.innerHTML = `<span class="cat">${esc(catName(CATS, q.cats.find(c => S.word.cats.includes(c)) || q.cats[0]))}</span><button type="button" class="qbtn" data-act="reveal" aria-expanded="${!!open}" aria-label="읽는 법 보기">?</button>
    <div class="tz wide"><span class="word" lang="ja" style="font-size:${wordSize(disp)}px">${esc(disp)}</span></div>
    <div class="reading" id="rd" ${open ? '' : 'hidden'}>${wordReading(q)}</div>${MARKS}`;
  if (S.set.wans === 'choice') {
    if (!r.order) r.order = wordOptions(q, WORDS, 'ko', 'ja');
    zone.dataset.type = 'wchoice';
    zone.innerHTML = optsHTML(r);
    return;
  }
  answerForm(zone, 'word', 'lang="ko" placeholder="뜻을 한국어로"', 'word');
  prepInput(zone, r, focus);
}
function wordInfoJP(q) {
  return `<div class="fb-line"><span class="jp" lang="ja">${esc(q.w)}</span>${q.w !== q.r ? `<span class="jp" lang="ja" style="font-size:17px">${esc(q.r)}</span>` : ''}<span class="mono">${romaji(q.r)}</span>${spkBtn(q.r)}</div>
    <p class="fb-sub">뜻: ${q.m.map(esc).join(', ')}${q.n ? ` · ${esc(q.n)}` : ''}</p>
    ${q.ex ? `<div class="ex"><p class="ex-jp" lang="ja">${markWord(q.ex, [q.w, q.r])}</p><p class="ex-rd" lang="ja">${esc(q.exr)}</p><p class="ex-ro mono">${esc(romaji(q.exr))}</p><p class="ex-ko">${esc(q.exko)}</p>${spkBtn(q.ex, '예문 듣기')}</div>` : ''}
    <div>${favBtn(q.key)}</div>`;
}
function checkWord(val, skip) {
  const r = R.word,
    q = r.qs[r.i];
  if (r.answered) return;
  const given = (val || '').trim();
  if (!skip && !given) return;
  gradeWord(q, !skip && meaningOk(given, q.m), given, skip);
}
function gradeWord(q, ok, given, skip) {
  const typed = S.set.wans !== 'choice';
  finish('word', q, ok, given, resultBody(ok, skip, given, wordInfoJP(q)), typed && !ok && !skip);
  const inp = document.getElementById('ans');
  if (inp) inp.dataset.state = ok ? 'ok' : 'ng';
  const rd = document.getElementById('rd');
  if (rd) rd.hidden = false;
  if (!typed) document.getElementById('zone').innerHTML = optsHTML(R.word);
  if (S.set.autoSpeak) speak(q.r);
  if (ok && S.set.autoNext) advT = setTimeout(() => next('word'), q.ex ? 2600 : 1500);
}

/* ---------- english words ---------- */
const enSize = t => {
  const n = t.length;
  return n <= 6 ? 54 : n <= 10 ? 42 : n <= 14 ? 34 : 28;
};
const enNorm = s =>
  s
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[.!?,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
function patHTML(w, mode) {
  return w
    .split(' ')
    .map(
      word =>
        `<span class="pw">${[...word].map((c, ci) => `<i>${mode === 'full' || (mode === 'hint' && ci === 0) ? esc(c) : ''}</i>`).join('')}</span>`
    )
    .join('');
}
function showEW(mod, q, card, zone, r, focus) {
  const e2k = S.ew.dir === 'e2k';
  const open = r.revealed || r.answered;
  const cat = `<span class="cat">${esc(catName(EN_CATS, q.cats.find(c => S.ew.cats.includes(c)) || q.cats[0]))}</span>`;
  const choice = S.set.wans === 'choice';
  if (e2k)
    card.innerHTML = `${cat}<button type="button" class="qbtn" data-act="reveal" aria-expanded="${!!open}" aria-label="발음 듣기">?</button><div class="tz wide"><span class="eword" lang="en" style="font-size:${enSize(q.w)}px">${esc(q.w)}</span></div><div class="reading" id="rd" ${open ? '' : 'hidden'}>${spkBtn(q.w, '발음 다시 듣기', 'en')}</div><p class="cap">${choice ? '알맞은 뜻을 고르세요' : '뜻을 한국어로 입력'} · ? 를 누르면 발음</p>${MARKS}`;
  else
    card.innerHTML = `${cat}<button type="button" class="qbtn" data-act="reveal" aria-expanded="${!!open}" aria-label="힌트 보기">?</button><p class="ko">${esc(q.m.join(', '))}</p><div class="pat" id="pat" aria-label="${q.w.replace(/ /g, '').length}글자">${patHTML(q.w, r.answered ? 'full' : open ? 'hint' : '')}</div><div class="reading" id="rd" ${open ? '' : 'hidden'}>${spkBtn(q.w, '발음 듣기', 'en')}</div><p class="cap">${choice ? '알맞은 영어를 고르세요' : '영어로 입력'} · ? 를 누르면 첫 글자와 발음</p>${MARKS}`;
  if (choice) {
    if (!r.order) r.order = wordOptions(q, EN_WORDS, e2k ? 'ko' : 'en', 'en');
    zone.dataset.type = 'wchoice';
    zone.innerHTML = optsHTML(r);
    return;
  }
  answerForm(
    zone,
    'ew-' + S.ew.dir,
    e2k ? 'lang="ko" placeholder="뜻을 한국어로"' : 'lang="en" inputmode="email" placeholder="영어로 입력"',
    'ew',
    e2k ? '' : 'roman'
  );
  prepInput(zone, r, focus);
}
function wordInfoEN(q) {
  return `<div class="fb-line"><span class="en" lang="en" style="font-size:24px;font-weight:600">${esc(q.w)}</span>${q.alt.length ? `<span class="fb-sub">(${esc(q.alt.join(', '))})</span>` : ''}${spkBtn(q.w, '발음 듣기', 'en')}</div><p class="fb-sub">뜻: ${q.m.map(esc).join(', ')}</p>
    ${q.ex ? `<div class="ex"><p class="ex-en" lang="en">${markWord(q.ex, [q.w, ...q.alt], true)}</p><p class="ex-ko">${esc(q.exko)}</p>${spkBtn(q.ex, '예문 듣기', 'en')}</div>` : ''}
    <div>${favBtn(q.key)}</div>`;
}
function checkEW(val, skip) {
  const r = R.ew,
    q = r.qs[r.i];
  if (r.answered) return;
  const e2k = S.ew.dir === 'e2k';
  const given = (val || '').trim();
  if (!skip && !given) return;
  gradeEW(q, !skip && (e2k ? meaningOk(given, q.m) : [q.w, ...q.alt].some(x => enNorm(x) === enNorm(given))), given, skip);
}
function gradeEW(q, ok, given, skip) {
  const typed = S.set.wans !== 'choice';
  finish('ew', q, ok, given, resultBody(ok, skip, given, wordInfoEN(q)), typed && !ok && !skip);
  const inp = document.getElementById('ans');
  if (inp) inp.dataset.state = ok ? 'ok' : 'ng';
  const rd = document.getElementById('rd');
  if (rd) rd.hidden = false;
  const p = document.getElementById('pat');
  if (p) p.innerHTML = patHTML(q.w, 'full');
  if (!typed) document.getElementById('zone').innerHTML = optsHTML(R.ew);
  if (S.set.autoSpeak) speak(q.w, 'en');
  if (ok && S.set.autoNext) advT = setTimeout(() => next('ew'), q.ex ? 2600 : 1500);
}

// ---- quiz/loan-conj.js ----
'use strict';
/* ---------- loanwords ---------- */
function showLoan(mod, q, card, zone, r) {
  if (!r.order) {
    const others = shuffle(LOANS.filter(x => x !== q && x.en !== q.en)).slice(0, 3);
    r.order = shuffle(
      [q, ...others].map(x => ({ t: x.en, ok: x === q, cls: 'en', lang: 'en', sub: `${x.k} · ${x.ko}`, subCls: 'jp', subLang: 'ja' }))
    );
  }
  card.innerHTML = `<span class="cat">외래어</span><div class="tz wide"><span class="word" lang="ja" style="font-size:${wordSize(q.k)}px">${q.k}</span></div><p class="cap">원래 영어 단어를 고르세요</p>${MARKS}`;
  zone.dataset.type = 'loan';
  zone.innerHTML = optsHTML(r);
}
function checkLoan(i, skip) {
  const r = R.loan,
    q = r.qs[r.i];
  if (r.answered) return;
  if (!skip) r.chosen = i;
  const ok = !skip && r.order[i].ok;
  const info = `<div class="fb-line"><span class="jp" lang="ja">${q.k}</span><span class="mono">${romaji(q.k)}</span>${spkBtn(q.k)}</div><p class="fb-sub"><span class="en" style="font-size:17px;color:var(--ink)">${esc(q.en)}</span> · ${esc(q.ko)}</p>${q.note ? `<p class="fb-sub">${esc(q.note)}</p>` : ''}`;
  finish('loan', q, ok, skip ? '' : r.order[i].t, resultBody(ok, skip, '', info));
  document.getElementById('zone').innerHTML = optsHTML(r);
  if (S.set.autoSpeak) speak(q.k);
  if (ok && S.set.autoNext) advT = setTimeout(() => next('loan'), 1500);
}

/* ---------- verb conjugation ---------- */
const GROUP_NAME = {
  godan: '1그룹 (う동사) · 끝소리를 바꿔요',
  ichi: '2그룹 (る동사) · る를 떼고 붙여요',
  suru: '3그룹 (する동사) · 불규칙',
  kuru: '3그룹 (来る) · 불규칙'
};
function showConj(mod, q, card, zone, r) {
  const kanji = S.set.kanji;
  const disp = x => (kanji ? x.w : x.r);
  if (!r.order) {
    const wr = shuffle(conjWrongs(q.v, q.form)).slice(0, 3);
    r.order = shuffle([{ x: q.right, ok: true }, ...wr.map(x => ({ x, ok: false }))]).map(o => ({
      t: disp(o.x),
      ok: o.ok,
      cls: 'jp',
      lang: 'ja',
      sub: kanji && o.x.w !== o.x.r ? o.x.r : '',
      subCls: 'jp',
      subLang: 'ja'
    }));
  }
  const vd = disp(q.v);
  card.innerHTML = `<span class="cat">동사 활용</span><div class="tz wide" style="min-height:96px"><span class="big-word" lang="ja" style="font-size:${Math.min(56, wordSize(vd))}px">${esc(vd)}</span></div><p class="cap">${kanji && q.v.w !== q.v.r ? esc(q.v.r) + ' · ' : ''}${esc(q.v.m[0])}</p><span class="target">${FORMS[q.form]}</span>${MARKS}`;
  zone.dataset.type = 'conj';
  zone.innerHTML = optsHTML(r);
}
function checkConj(i, skip) {
  const r = R.conj,
    q = r.qs[r.i];
  if (r.answered) return;
  if (!skip) r.chosen = i;
  const ok = !skip && r.order[i].ok;
  const g = verbGroup(q.v.w, q.v.r);
  const tbl = Object.keys(FORMS)
    .filter(f => conjugate(q.v, f))
    .map(f => {
      const c = conjugate(q.v, f);
      return `<span class="${f === q.form ? 'cur' : ''}">${FORM_SHORT[f]}</span><span class="jp ${f === q.form ? 'cur' : ''}" lang="ja">${esc(c.w)}${c.w !== c.r ? ` <small style="color:var(--muted)">${esc(c.r)}</small>` : ''}</span>`;
    })
    .join('');
  const info = `<div class="fb-line"><span class="jp" lang="ja">${esc(q.right.w)}</span>${q.right.w !== q.right.r ? `<span class="jp" lang="ja" style="font-size:17px">${esc(q.right.r)}</span>` : ''}<span class="mono">${romaji(q.right.r)}</span>${spkBtn(q.right.r)}</div><p class="fb-sub">${GROUP_NAME[g]}</p><div class="form-tbl">${tbl}</div>`;
  finish('conj', q, ok, skip ? '' : r.order[i].t, resultBody(ok, skip, '', info));
  document.getElementById('zone').innerHTML = optsHTML(r);
  if (S.set.autoSpeak) speak(q.right.r);
  if (ok && S.set.autoNext) advT = setTimeout(() => next('conj'), 1800);
}

// ---- quiz/sentences.js ----
'use strict';
/* ---------- sentence choice & listening ---------- */
function choiceItems(mod, q) {
  if (mod === 'sent') return [{ t: q.a[0], rd: q.a[1], ko: q.k, ok: true }, ...q.d.map(d => ({ t: d[0], rd: d[1], ko: d[2], ok: false }))];
  if (mod === 'jl') return [{ t: q.k, ko: q.a[0], ok: true }, ...q.d.map(d => ({ t: d[2], ko: d[0], ok: false }))];
  if (mod === 'es') return [{ t: q.a, ko: q.k, ok: true }, ...q.d.map(d => ({ t: d[0], ko: d[1], ok: false }))];
  return [{ t: q.k, ko: q.a, ok: true }, ...q.d.map(d => ({ t: d[1], ko: d[0], ok: false }))];
}
const sentText = (mod, q) => (modLang(mod) === 'ja' ? q.a[0] : q.a);
const playBox = extra =>
  `<div class="listen"><button type="button" class="play" data-act="play" aria-label="문장 듣기">${PLAY_ICON}</button><button type="button" class="spk" data-act="playslow">${SPK_ICON}천천히 듣기</button></div>${extra || ''}`;
function showChoice(mod, q, card, zone, r) {
  const fresh = !r.order;
  if (fresh) r.order = shuffle(choiceItems(mod, q));
  const open = r.revealed || r.answered;
  const lang = modLang(mod);
  if (mod === 'sent')
    card.innerHTML = `<span class="cat">${SCENES[q.sc] || ''} · 한국어 → 일본어</span>${S.set.kanji ? `<button type="button" class="qbtn" data-act="reveal" aria-expanded="${!!open}" aria-label="보기 읽는 법">?</button>` : ''}<p class="ko">${esc(q.k)}</p><p class="cap">알맞은 일본어를 고르세요</p>`;
  else if (mod === 'es')
    card.innerHTML = `<span class="cat">${SCENES[q.sc] || ''} · 한국어 → 영어</span><p class="ko">${esc(q.k)}</p><p class="cap">알맞은 영어 문장을 고르세요</p>`;
  else
    card.innerHTML = `<span class="cat">${SCENES[q.sc] || ''} · 듣기</span>${playBox(r.answered ? (lang === 'ja' ? `<p class="ko" lang="ja" style="font-family:var(--f-jp);font-weight:500">${q.a[0]}</p>` : `<p class="ko en" lang="en">${esc(q.a)}</p>`) : '')}<p class="cap">들은 문장의 뜻을 고르세요</p>`;
  zone.dataset.type = mod;
  zone.innerHTML = `<div class="opts">${r.order
    .map((o, i) => {
      const st = r.answered ? (o.ok ? 'ok' : i === r.chosen ? 'ng' : 'dim') : '';
      const hid = r.answered ? '' : 'hidden';
      let main,
        sub = '',
        tr;
      if (mod === 'sent') {
        main = `<span class="jp" lang="ja">${S.set.kanji ? o.t : o.rd}</span>`;
        if (S.set.kanji) sub = `<span class="rd" lang="ja" ${open ? '' : 'hidden'}>${o.rd}</span>`;
        tr = `<span class="tr" ${hid}>${esc(o.ko)}</span>`;
      } else if (mod === 'es') {
        main = `<span class="en" lang="en">${esc(o.t)}</span>`;
        tr = `<span class="tr" ${hid}>${esc(o.ko)}</span>`;
      } else {
        main = `<span class="ko-opt">${esc(o.t)}</span>`;
        tr =
          lang === 'ja'
            ? `<span class="tr jp" lang="ja" ${hid}>${esc(o.ko)}</span>`
            : `<span class="tr en" lang="en" ${hid}>${esc(o.ko)}</span>`;
      }
      return `<button type="button" class="opt" data-opt="${i}" ${st ? `data-state="${st}"` : ''} ${r.answered ? 'aria-disabled="true"' : ''}><span class="n">${i + 1}</span>${main}${sub}${tr}</button>`;
    })
    .join('')}</div>`;
  if (LISTEN.has(mod) && fresh && !r.answered) speak(sentText(mod, q), lang);
}
function sentFeedback(mod, q) {
  return modLang(mod) === 'ja'
    ? `<p class="fb-big" lang="ja">${q.a[0]}</p><p class="fb-sub" lang="ja" style="font-family:var(--f-jp);font-size:16px">${q.a[1]}</p><p class="fb-sub mono">${esc(romaji(q.a[1]))}</p><p class="fb-sub">${esc(q.k)}</p><div>${spkBtn(q.a[0], '문장 듣기')}</div>`
    : `<p class="fb-big en" lang="en">${esc(q.a)}</p><p class="fb-sub">${esc(q.k)}</p><div>${spkBtn(q.a, '문장 듣기', 'en')}</div>`;
}
function checkChoice(mod, i) {
  const r = R[mod],
    q = r.qs[r.i];
  if (r.answered) return;
  const o = r.order[i];
  r.chosen = i;
  const ok = o.ok;
  finish(
    mod,
    q,
    ok,
    o.t,
    `<div class="fb-head"><span class="badge">${ok ? '〇' : '×'}</span>${ok ? '정답' : '오답'}</div>${sentFeedback(mod, q)}`
  );
  showChoice(mod, q, document.getElementById('card'), document.getElementById('zone'), r);
  if (S.set.autoSpeak) speak(sentText(mod, q), modLang(mod));
}

/* ---------- sentence building ---------- */
function buildTokens(mod, s) {
  if (mod === 'jb') {
    const tk = s.t.split(' '),
      rk = s.a[1].split(' ');
    return tk.map((k, i) => ({ k: stripP(k), r: stripP(rk[i] || k) })).filter(x => x.k);
  }
  return s.a
    .split(' ')
    .map(w => ({ k: stripP(w), r: stripP(w) }))
    .filter(x => x.k);
}
function decoyFor(mod, q, ans) {
  const pool = mod === 'jb' ? SENTS : EN_SENTS;
  const used = new Set(ans.map(x => x.k.toLowerCase()));
  for (let tries = 0; tries < 40; tries++) {
    const s = pool[(Math.random() * pool.length) | 0];
    if (s.k === q.k) continue;
    const toks = buildTokens(mod, s).filter(x => !used.has(x.k.toLowerCase()) && [...x.k].length > 1);
    if (toks.length) return toks[(Math.random() * toks.length) | 0];
  }
  return null;
}
function showBuild(mod, q, card, zone, r) {
  const jp = mod === 'jb';
  if (!r.bank) {
    const ans = buildTokens(mod, q);
    r.ans = ans;
    const dec = decoyFor(mod, q, ans);
    r.bank = shuffle([...ans, ...(dec ? [dec] : [])].map((x, i) => ({ ...x, id: i })));
    r.built = [];
  }
  const disp = x => (jp && !S.set.kanji ? x.r : x.k);
  const cls = jp ? 'jp' : 'en',
    lg = jp ? 'ja' : 'en';
  card.innerHTML = `<span class="cat">${SCENES[q.sc] || ''} · 문장 조립</span><p class="ko">${esc(q.k)}</p><p class="cap">블록을 순서대로 눌러 ${jp ? '일본어' : '영어'} 문장을 만드세요</p>`;
  zone.dataset.type = 'build';
  const st = r.answered ? (r.lastOk ? 'ok' : 'ng') : '';
  const byId = id => r.bank.find(b => b.id === id);
  zone.innerHTML = `<div class="build"><div class="build-line" id="bline" ${st ? `data-state="${st}"` : ''}>${r.built.map((id, pos) => `<button type="button" class="blk ${cls}" data-u="${pos}" lang="${lg}">${esc(disp(byId(id)))}</button>`).join('')}</div><div class="bank">${r.bank.map(x => `<button type="button" class="blk ${cls}${r.built.includes(x.id) ? ' used' : ''}" data-b="${x.id}" lang="${lg}">${esc(disp(x))}</button>`).join('')}</div>
    ${r.answered ? '' : `<div class="row"><button type="button" class="btn" data-act="bclear">다시 놓기</button><button type="button" class="btn primary" data-act="bcheck">확인</button></div>`}
    <div class="sub-actions"><button type="button" class="btn quiet" data-act="skip">${r.answered ? '다음' : '모르겠어요'}</button></div></div>`;
}
function checkBuild(mod, skip) {
  const r = R[mod],
    q = r.qs[r.i];
  if (r.answered) return;
  if (!skip && !r.built.length) return;
  const jp = mod === 'jb';
  const byId = id => r.bank.find(b => b.id === id);
  const got = r.built.map(byId);
  const ok = !skip && got.length === r.ans.length && got.every((x, i) => x.k.toLowerCase() === r.ans[i].k.toLowerCase());
  const shown = got.map(x => (jp && !S.set.kanji ? x.r : x.k)).join(jp ? '' : ' ');
  const body = `<div class="fb-head"><span class="badge">${ok ? '〇' : '×'}</span>${ok ? '정답' : skip ? '정답 확인' : '오답'}</div>${!ok && !skip ? `<p class="fb-sub given">만든 문장: <s>${esc(shown)}</s></p>` : ''}${sentFeedback(mod, q)}`;
  finish(mod, q, ok, shown, body, !ok && !skip);
  showBuild(mod, q, document.getElementById('card'), document.getElementById('zone'), r);
  if (S.set.autoSpeak) speak(sentText(mod, q), modLang(mod));
}

// ---- quiz/dictation-numbers.js ----
'use strict';
/* ---------- dictation ---------- */
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PART = { は: '(?:は|わ)', へ: '(?:へ|え)', を: '(?:を|お)', では: '(?:では|でわ)', には: '(?:には|にわ)' };
function showDict(mod, q, card, zone, r, focus) {
  const ja = mod === 'jd';
  const fresh = !r.started;
  r.started = true;
  card.innerHTML = `<span class="cat">${SCENES[q.sc] || ''} · 받아쓰기</span><button type="button" class="qbtn" data-act="reveal" aria-expanded="${!!(r.revealed || r.answered)}" aria-label="뜻 보기">?</button>${playBox(`<p class="cap" id="rd" ${r.revealed || r.answered ? '' : 'hidden'}>뜻: ${esc(q.k)}</p>`)}<p class="cap">${ja ? '들은 문장을 가나로 쓰세요' : '들은 문장을 영어로 쓰세요'} · ? 를 누르면 뜻</p>`;
  if (ja && S.kana.input === 'pad') {
    padMax = 60;
    if (zone.dataset.type !== 'pad-h') {
      zone.dataset.type = 'pad-h';
      zone.innerHTML = padHTML('h');
    }
    if (!r.answered) padVal = '';
    renderPad(r.answered ? (r.lastOk ? 'ok' : 'ng') : '');
  } else {
    answerForm(
      zone,
      'dict-' + mod,
      ja ? 'lang="ja" placeholder="일본어로 입력"' : 'lang="en" placeholder="들은 문장을 입력"',
      mod,
      ja ? 'ja' : ''
    );
    prepInput(zone, r, focus);
  }
  if (fresh && !r.answered) speak(sentText(mod, q), ja ? 'ja' : 'en');
}
function checkDict(mod, val, skip) {
  const r = R[mod],
    q = r.qs[r.i];
  if (r.answered) return;
  const given = (val || '').trim();
  if (!skip && !given) return;
  const ja = mod === 'jd';
  let ok = false,
    diff = '';
  if (ja) {
    const toks = q.a[1]
      .split(' ')
      .map(t => toHira(stripAll(t)))
      .filter(Boolean);
    const re = new RegExp('^' + toks.map(t => PART[t] || reEsc(t)).join('') + '$');
    const u = toHira(stripAll(given));
    ok = !skip && re.test(u);
    if (!ok && !skip) {
      const tgt = [...toks.join('')],
        uc = [...u];
      const { inA, inB } = lcsMark(uc, tgt);
      diff = `<p class="fb-sub diff">내 답: <span class="jp" style="font-size:17px;color:var(--ink)">${uc.map((c, i) => (inA[i] ? esc(c) : `<span class="bad">${esc(c)}</span>`)).join('')}</span></p><p class="fb-sub diff">빠진 글자: <span class="jp" style="font-size:17px;color:var(--ink)">${tgt.map((c, i) => (inB[i] ? esc(c) : `<span class="miss">${esc(c)}</span>`)).join('')}</span></p>`;
    }
  } else {
    const u = enWords(given),
      t = enWords(q.a);
    ok = !skip && u.join(' ') === t.join(' ');
    if (!ok && !skip) {
      const { inA, inB } = lcsMark(u, t);
      diff = `<p class="fb-sub diff">내 답: <span style="color:var(--ink)">${u.map((w, i) => (inA[i] ? esc(w) : `<span class="bad">${esc(w)}</span>`)).join(' ')}</span></p><p class="fb-sub diff">정답과 비교: <span style="color:var(--ink)">${t.map((w, i) => (inB[i] ? esc(w) : `<span class="miss">${esc(w)}</span>`)).join(' ')}</span></p>`;
    }
  }
  const body = `<div class="fb-head"><span class="badge">${ok ? '〇' : '×'}</span>${ok ? '정답' : skip ? '정답 확인' : '오답'}</div>${diff}${sentFeedback(mod, q)}`;
  finish(mod, q, ok, given, body, !ok && !skip);
  const inp = document.getElementById('ans');
  if (inp) inp.dataset.state = ok ? 'ok' : 'ng';
  renderPad(ok ? 'ok' : 'ng');
  const rd = document.getElementById('rd');
  if (rd) rd.hidden = false;
}

/* ---------- numbers ---------- */
function showNum(mod, q, card, zone, r, focus) {
  const ja = mod === 'jn';
  const fresh = !r.started;
  r.started = true;
  const L = { price: '가격', time: '시간', number: '숫자' };
  const ph = q.type === 'time' ? '예: 6시 30분 → 630' : q.type === 'price' && !ja ? '예: 12.99' : '숫자만 입력';
  card.innerHTML = `<span class="cat">${L[q.type]} 듣기</span>${playBox(r.answered ? `<p class="ko ${ja ? '' : 'en'}" ${ja ? 'lang="ja" style="font-family:var(--f-jp);font-weight:500"' : 'lang="en"'}>${esc(q.show)}</p>` : '')}<p class="cap">들은 ${L[q.type]}을 숫자로 쓰세요</p>`;
  answerForm(
    zone,
    'num-' + q.type + (q.type === 'price' && !ja ? 'd' : ''),
    `inputmode="${q.type === 'price' && !ja ? 'decimal' : 'numeric'}" placeholder="${ph}"`,
    mod,
    'roman'
  );
  prepInput(zone, r, focus);
  if (fresh && !r.answered) speak(q.say, ja ? 'ja' : 'en');
}
function checkNumQ(mod, val, skip) {
  const r = R[mod],
    q = r.qs[r.i];
  if (r.answered) return;
  const res = skip ? false : checkNum(q, val);
  if (res === null) return;
  const ja = mod === 'jn';
  const info = `<p class="fb-big ${ja ? '' : 'en'}" ${ja ? 'lang="ja"' : 'lang="en"'}>${esc(q.show)}</p><p class="fb-sub ${ja ? '' : 'en'}" ${ja ? 'lang="ja" style="font-family:var(--f-jp);font-size:16px"' : ''}>${esc(q.read)}</p>${ja ? `<p class="fb-sub mono">${esc(romaji(q.read))}</p>` : ''}<div>${spkBtn(q.say, '다시 듣기', ja ? 'ja' : 'en')}</div>`;
  finish(mod, q, res, (val || '').trim(), resultBody(res, skip, (val || '').trim(), info));
  const inp = document.getElementById('ans');
  if (inp) inp.dataset.state = res ? 'ok' : 'ng';
  showNum(mod, q, document.getElementById('card'), document.getElementById('zone'), r, false);
}

const CHECK = {
  kana: checkKana,
  word: checkWord,
  ew: checkEW,
  jb: (v, s) => checkBuild('jb', s),
  eb: (v, s) => checkBuild('eb', s),
  jd: (v, s) => checkDict('jd', v, s),
  ed: (v, s) => checkDict('ed', v, s),
  jn: (v, s) => checkNumQ('jn', v, s),
  enn: (v, s) => checkNumQ('enn', v, s),
  loan: (v, s) => checkLoan(-1, s),
  conj: (v, s) => checkConj(-1, s),
  kanji: (v, s) => genericChoice('kanji', -1, s),
  part: (v, s) => genericChoice('part', -1, s),
  gram: (v, s) => genericChoice('gram', -1, s),
  irr: (v, s) => genericChoice('irr', -1, s),
  mp: (v, s) => genericChoice('mp', -1, s),
  cnt: (v, s) => genericChoice('cnt', -1, s),
  pol: (v, s) => genericChoice('pol', -1, s),
  jlen: (v, s) => genericChoice('jlen', -1, s)
};

// ---- quiz/flow.js ----
'use strict';
/* ---------- generic 4-choice helpers ---------- */
const INFO = {},
  SPEAKQ = {},
  AUTO = { kanji: 1600, part: 1800, gram: 0, irr: 1600, mp: 0 };
function genericChoice(mod, i, skip) {
  const r = R[mod],
    q = r.qs[r.i];
  if (r.answered) return;
  if (!skip) r.chosen = i;
  const ok = !skip && r.order[i].ok;
  finish(mod, q, ok, skip ? '' : r.order[i].t, resultBody(ok, skip, '', INFO[mod](q)));
  document.getElementById('zone').innerHTML = optsHTML(r);
  const sp = SPEAKQ[mod] && SPEAKQ[mod](q);
  if (S.set.autoSpeak && sp) speak(sp[0], sp[1]);
  if (ok && S.set.autoNext && AUTO[mod]) advT = setTimeout(() => next(mod), AUTO[mod]);
}

/* ---------- shared flow ---------- */
function reportText(mod, q, given) {
  let p = '',
    a = '';
  if (mod === 'kana') {
    p = q.ch;
    a = q.alts[0];
  } else if (mod === 'kconf') {
    p = q.ch;
    a = kanaRom(q.ch);
  } else if (mod === 'word') {
    p = `${q.w} (${q.r})`;
    a = q.m.join(', ');
  } else if (mod === 'ew') {
    p = q.w;
    a = q.m.join(', ');
  } else if (mod === 'loan') {
    p = q.k;
    a = q.en;
  } else if (mod === 'conj') {
    p = `${q.v.w} → ${FORM_SHORT[q.form]}`;
    a = q.right.w;
  } else if (NUMS.has(mod)) {
    p = q.say;
    a = q.show;
  } else if (LABELS[mod] || ['kanji', 'irr', 'mp', 'part', 'cnt', 'pol', 'jlen'].includes(mod)) {
    [p, a] = itemLabel(mod, q);
  } else {
    p = q.k;
    a = modLang(mod) === 'ja' ? q.a[0] : q.a;
  }
  return `[하나마루 문제 신고]\n종류: ${MODE_LABEL[mod]}\n문제: ${p}\n정답: ${a}\n내 답: ${given || '-'}\n이상한 점: `;
}
function finish(mod, q, ok, given, body, canOverride) {
  const r = R[mod];
  const prev = record(q.key, ok);
  setTimeout(() => onAnswer(ok), 0);
  r.answered = true;
  r.lastOk = ok;
  r.mark = ok ? 'ok' : 'ng';
  r.res.push({ q, ok, given, prev });
  const last = r.i === r.qs.length - 1;
  r.fb = `<div class="fb-box ${ok ? 'ok' : 'ng'}">${body}</div><div class="fb-actions">${canOverride ? `<button type="button" class="btn" data-act="override">맞은 걸로 처리</button>` : ''}<button type="button" class="btn primary" data-act="next">${last ? '결과 보기' : '다음 문제'}</button></div><div class="fb-more"><button type="button" class="link" data-act="report">문제가 이상해요</button></div>`;
  document.getElementById('card').dataset.mark = r.mark;
  document.getElementById('fb').innerHTML = r.fb;
  updateProg(mod);
}
function override(mod) {
  const r = R[mod];
  const last = r.res[r.res.length - 1];
  if (!last || last.ok) return;
  forceCorrect(last.q.key, last.prev);
  last.ok = true;
  r.lastOk = true;
  r.mark = 'ok';
  r.fb = r.fb
    .replace('fb-box ng', 'fb-box ok')
    .replace(/<span class="badge">×<\/span>오답/, '<span class="badge">〇</span>정답으로 바꿨어요')
    .replace(/<button type="button" class="btn" data-act="override">.*?<\/button>/, '');
  document.getElementById('card').dataset.mark = 'ok';
  document.getElementById('fb').innerHTML = r.fb;
  const inp = document.getElementById('ans');
  if (inp) inp.dataset.state = 'ok';
  if (BUILD.has(mod)) showBuild(mod, last.q, document.getElementById('card'), document.getElementById('zone'), r);
  else renderPad('ok');
  updateProg(mod);
}
function next(mod) {
  clearAdv();
  const r = R[mod];
  if (!r || !r.answered) return;
  r.i++;
  r.answered = false;
  r.fb = '';
  r.mark = '';
  r.revealed = false;
  r.chosen = null;
  r.order = null;
  r.bank = null;
  r.built = null;
  r.ans = null;
  r.started = false;
  if (r.i >= r.qs.length) r.done = true;
  if (activeMod() === mod) showQ(mod, true);
}
function formEnter(mod) {
  const r = R[mod];
  const inp = document.getElementById('ans');
  if (r.answered) {
    next(mod);
    return;
  }
  CHECK[mod](inp.value);
}
function stageClick(mod, e) {
  const b = e.target.closest('button');
  if (!b || b.dataset.speak) return;
  const act = b.dataset.act;
  const r = R[mod];
  const q = r && !r.done && r.qs[r.i];
  const card = () => document.getElementById('card'),
    zone = () => document.getElementById('zone');
  if (act === 'next') next(mod);
  else if (act === 'skip') {
    if (r.answered) next(mod);
    else if (CHECK[mod]) CHECK[mod]('', true);
  } else if (act === 'override') override(mod);
  else if (act === 'report') {
    const txt = reportText(mod, q, r.res[r.res.length - 1]?.given);
    if (openReportForm(txt)) return;
    copyText(txt, '신고 내용을 복사했어요. 카톡으로 앱 만든 사람에게 보내 주세요.', () => {
      const fb = document.getElementById('fb');
      if (fb && !fb.querySelector('#rpt')) {
        fb.insertAdjacentHTML(
          'beforeend',
          `<textarea id="rpt" style="width:100%;min-height:110px;font-size:16px;border:1px solid var(--line);border-radius:10px;padding:10px;background:var(--paper);color:var(--ink)" readonly>${esc(txt)}</textarea><p class="note">위 내용을 길게 눌러 복사한 뒤 보내 주세요.</p>`
        );
        const t = fb.querySelector('#rpt');
        t.focus();
        t.select();
      }
    });
  } else if (act === 'fav') {
    const k = b.dataset.key;
    if (S.fav[k]) delete S.fav[k];
    else S.fav[k] = 1;
    save();
    const on = !!S.fav[k];
    b.setAttribute('aria-pressed', on);
    b.textContent = on ? '★ 즐겨찾기됨' : '☆ 즐겨찾기';
    r.fb = document.getElementById('fb').innerHTML;
  } else if (act === 'reveal') {
    r.revealed = !r.revealed || r.answered;
    b.setAttribute('aria-expanded', r.revealed);
    if (mod === 'word' || mod === 'pol' || DICT.has(mod)) {
      document.getElementById('rd').hidden = !r.revealed;
    } else if (mod === 'ew') {
      document.getElementById('rd').hidden = !r.revealed;
      const p = document.getElementById('pat');
      if (p && !r.answered) p.innerHTML = patHTML(q.w, r.revealed ? 'hint' : '');
      if (r.revealed && S.ew.dir === 'e2k') speak(q.w, 'en');
    } else document.querySelectorAll('.opt .rd').forEach(x => (x.hidden = !r.revealed));
  } else if (act === 'play' || act === 'playslow') {
    if (q)
      speak(
        NUMS.has(mod) ? q.say : mod === 'mp' ? q.tg : mod === 'jlen' ? q['r' + q.tg] : sentText(mod, q),
        modLang(mod),
        act === 'playslow'
      );
  } else if (act === 'retry') {
    newRound(mod, uniqueMissed(mod));
    showQ(mod, false);
  } else if (act === 'again') {
    newRound(mod);
    showQ(mod, false);
  } else if (act === 'duecont') {
    S.filt[mod] = 'due';
    newRound(mod);
    showQ(mod, false);
  } else if (act === 'duenext') startDue(b.dataset.mod);
  else if (act === 'course') go('home');
  else if (act === 'recstart') recStart();
  else if (act === 'recstop') recStop();
  else if (act === 'recplay') recPlay();
  else if (act === 'shok' || act === 'shno') rateShadow(mod, act === 'shok');
  else if (act === 'bclear') {
    if (!r.answered) {
      r.built = [];
      showBuild(mod, q, card(), zone(), r);
    }
  } else if (act === 'bcheck') checkBuild(mod, false);
  else if (b.dataset.b !== undefined) {
    if (!r.answered) {
      const id = +b.dataset.b;
      if (!r.built.includes(id)) r.built.push(id);
      showBuild(mod, q, card(), zone(), r);
    }
  } else if (b.dataset.u !== undefined) {
    if (!r.answered) {
      r.built.splice(+b.dataset.u, 1);
      showBuild(mod, q, card(), zone(), r);
    }
  } else if (b.dataset.wopt !== undefined) {
    if (r.answered) return;
    const i = +b.dataset.wopt;
    if (mod === 'loan') checkLoan(i);
    else if (mod === 'conj') checkConj(i);
    else if (INFO[mod]) genericChoice(mod, i);
    else {
      r.chosen = i;
      const ok = r.order[i].ok;
      if (mod === 'word') gradeWord(q, ok, '', false);
      else gradeEW(q, ok, '', false);
    }
  } else if (b.dataset.opt !== undefined) {
    if (r.answered) return;
    if (mod === 'kconf') checkConf(+b.dataset.opt);
    else checkChoice(mod, +b.dataset.opt);
  } else if (b.classList.contains('k') || b.closest('.pad-fn')) padKey(mod, b);
}
function uniqueMissed(mod) {
  const seen = new Set();
  return R[mod].res
    .filter(x => !x.ok)
    .map(x => x.q)
    .filter(q => NUMS.has(mod) || (!seen.has(q.key) && seen.add(q.key)));
}
function summary(mod) {
  const r = R[mod];
  const st = document.getElementById('stage');
  if (r.course && !r.course.marked) {
    r.course.marked = true;
    courseMark(r.course);
  }
  const n = r.res.length,
    c = r.res.filter(x => x.ok).length,
    pct = n ? Math.round((c / n) * 100) : 0;
  const missed = r.res.filter(x => !x.ok);
  if (pct === 100 && n >= 5 && !r.perfectSent) {
    r.perfectSent = true;
    missionEvent('perfect');
  }
  const msg =
    pct === 100
      ? '전부 맞혔어요. 하나마루!'
      : pct >= 80
        ? '잘했어요. 틀린 것만 한 번 더 보면 확실해져요.'
        : pct >= 50
          ? '절반 넘게 맞혔어요. 틀린 문제를 다시 풀어 보세요.'
          : '처음엔 다 어려워요. 틀린 것부터 천천히 다시 해 봐요.';
  const item = x => {
    const q = x.q;
    if (mod === 'kana' || mod === 'kconf')
      return `<li><span class="jp" lang="ja">${q.ch}</span><span class="mono">${kanaRom(q.ch)}</span>${x.given ? `<span class="s given">입력 <s>${esc(x.given)}</s></span>` : ''}</li>`;
    if (mod === 'word')
      return `<li><span class="jp" lang="ja">${esc(q.w)}</span><span class="s" lang="ja">${q.w !== q.r ? esc(q.r) + ' · ' : ''}${esc(q.m[0])}</span></li>`;
    if (mod === 'ew')
      return `<li><span class="en" lang="en" style="font-size:19px;font-weight:600">${esc(q.w)}</span><span class="s">${esc(q.m.join(', '))}</span></li>`;
    if (mod === 'loan') return `<li><span class="jp" lang="ja">${q.k}</span><span class="s">${esc(q.en)} · ${esc(q.ko)}</span></li>`;
    if (mod === 'conj')
      return `<li><span class="jp" lang="ja">${esc(q.v.w)}</span><span class="s">${FORM_SHORT[q.form]} → <span class="jp" lang="ja">${esc(q.right.w)}</span></span></li>`;
    if (LABELS[mod] || ['kanji', 'irr', 'mp', 'part', 'cnt', 'pol', 'jlen'].includes(mod)) {
      const [a, b2] = itemLabel(mod, q);
      return `<li><span class="${['kanji', 'cnt', 'pol', 'jlen'].includes(mod) ? 'jp' : mod === 'part' ? '' : 'en'}" style="font-size:18px">${esc(a)}</span><span class="s ${mod === 'cnt' || mod === 'pol' ? 'jp' : ''}">${esc(b2)}</span></li>`;
    }
    if (NUMS.has(mod))
      return `<li><span class="${mod === 'jn' ? 'jp' : 'en'}">${esc(q.show)}</span><span class="s">${esc(q.read)}</span>${x.given ? `<span class="s given">입력 <s>${esc(x.given)}</s></span>` : ''}</li>`;
    if (modLang(mod) === 'en')
      return `<li style="display:grid;gap:2px"><span>${esc(q.k)}</span><span class="en" lang="en" style="font-size:17px">${esc(q.a)}</span></li>`;
    return `<li style="display:grid;gap:2px"><span>${esc(q.k)}</span><span class="jp" lang="ja" style="font-size:17px">${q.a[0]}</span></li>`;
  };
  let dueRow = '';
  if (r.due) {
    const left = dueCount(mod);
    const nx = dueList().find(([m]) => m !== mod);
    dueRow = left
      ? `<button class="btn primary" data-act="duecont">이어서 복습 ${left}개</button>`
      : nx
        ? `<button class="btn primary" data-act="duenext" data-mod="${nx[0]}">다음 복습: ${DUE_LABEL[nx[0]]} ${nx[1]}개</button>`
        : `<p class="sum-msg" style="color:var(--ok);font-weight:600">오늘 복습을 모두 끝냈어요!</p>`;
  }
  st.innerHTML = `<div class="sum">
    <div class="sum-score">${pct >= 80 ? `<svg viewBox="0 0 200 200" aria-hidden="true"><path pathLength="1" d="M108 18C162 16 190 60 184 108 178 156 134 186 92 182 44 178 14 142 18 96 22 52 60 24 106 26M110 64c24 2 38 20 36 42-2 22-22 38-44 36-20-2-34-20-32-40 2-18 18-30 36-28 16 2 26 14 24 28"/></svg>` : ''}<b class="num">${c}</b><span class="num">/ ${n}</span></div>
    <p class="sum-msg">${msg}</p>
    ${dueRow ? `<div class="row">${dueRow}</div>` : ''}
    ${r.course ? `<div class="row"><button class="btn primary" data-act="course">코스로 돌아가기</button></div>` : ''}
    ${missed.length ? `<div><p class="lbl" style="margin:0 0 6px">틀린 문제</p><ul class="miss">${missed.map(item).join('')}</ul></div>` : ''}
    <div class="row">${missed.length ? `<button class="btn ${dueRow ? '' : 'primary'}" data-act="retry">틀린 ${uniqueMissed(mod).length}개 다시</button>` : ''}<button class="btn ${missed.length || dueRow ? '' : 'primary'}" data-act="again">새 라운드</button></div>
  </div>`;
  st.onclick = e => stageClick(mod, e);
  updateProg(mod);
  document.getElementById('ptext').textContent = '완료';
}

// ---- quiz/speed.js ----
'use strict';
/* ================= 60-second challenge ================= */
let SP = null;
function stopSpeed() {
  if (SP) {
    if (SP.timer) {
      clearInterval(SP.timer);
      SP.timer = null;
    }
    if (SP.lockT) clearTimeout(SP.lockT);
    SP.running = false;
  }
}
function speedQ(mod) {
  if (mod === 'kspeed') {
    const k = S.kana;
    const pool = KANA.filter(x => k.sets.includes(x.set));
    const x = pool[(Math.random() * pool.length) | 0];
    const sc = k.script === 'm' ? (Math.random() < 0.5 ? 'h' : 'k') : k.script;
    const ch = sc === 'h' ? x.h : toKata(x.h);
    const others = shuffle(pool.filter(y => y !== x && y.alts[0] !== x.alts[0])).slice(0, 3);
    return {
      show: ch,
      cls: 'glyph',
      lang: 'ja',
      order: shuffle([{ t: x.alts[0], ok: true, cls: 'mono-opt' }, ...others.map(y => ({ t: y.alts[0], ok: false, cls: 'mono-opt' }))])
    };
  }
  const all = mod === 'wspeed' ? WORDS : EN_WORDS;
  const q = all[(Math.random() * all.length) | 0];
  return {
    show: mod === 'wspeed' ? (S.set.kanji ? q.w : q.r) : q.w,
    cls: mod === 'wspeed' ? 'word' : 'eword',
    lang: mod === 'wspeed' ? 'ja' : 'en',
    order: wordOptions(q, all, 'ko', mod === 'wspeed' ? 'ja' : 'en')
  };
}
function renderSpeed(mod) {
  const best = S.best[mod] || 0;
  const setup =
    mod === 'kspeed'
      ? `<div class="setup-row"><label>문자</label>${seg(
          'kana.script',
          [
            ['h', 'ひらがな'],
            ['k', 'カタカナ'],
            ['m', '섞기']
          ],
          S.kana.script
        )}</div><div class="setup-row"><label>범위</label><div class="chips">${Object.entries(SETS)
          .map(
            ([v, l]) =>
              `<button class="chip" data-multi="kana.sets" data-val="${v}" aria-pressed="${S.kana.sets.includes(v)}">${l}</button>`
          )
          .join('')}</div></div>`
      : mod === 'wspeed'
        ? kanjiRow('표기')
        : '';
  const what = mod === 'kspeed' ? '글자를 보고 발음을' : '단어를 보고 뜻을';
  view.innerHTML = `<section class="mod">${modeSeg(mod)}<div id="stage"><div class="empty" style="text-align:left;justify-items:stretch">
    <p style="margin:0;font-weight:700;font-size:18px">60초 도전</p>
    <p class="note">60초 동안 ${what} 최대한 많이 고르세요. 틀려도 바로 다음 문제로 넘어가요.</p>
    <div class="due-n"><b class="num">${best}</b><span>최고 기록</span></div>
    ${setup}
    <button class="btn primary" data-sp="start">시작</button>
  </div></div></section>`;
  bindModes();
  view.onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.closest('.modes')) return;
    if (b.dataset.sp === 'start') startSpeed(mod);
    else if (b.dataset.set) {
      const [g, k] = b.dataset.set.split('.');
      let v = b.dataset.val;
      if (v === 'true' || v === 'false') v = v === 'true';
      S[g][k] = v;
      save();
      renderSpeed(mod);
    } else if (b.dataset.multi) {
      const v = b.dataset.val;
      let arr = S.kana.sets;
      if (arr.includes(v)) {
        if (arr.length > 1) arr = arr.filter(x => x !== v);
      } else arr = [...arr, v];
      S.kana.sets = Object.keys(SETS).filter(s => arr.includes(s));
      save();
      renderSpeed(mod);
    }
  };
}
function startSpeed(mod) {
  stopSpeed();
  SP = { mod, running: true, end: Date.now() + 60000, score: 0, total: 0, lock: false };
  const st = document.getElementById('stage');
  st.innerHTML = `<div class="speed-top"><span class="num" id="spT">60</span><div class="speed-bar"><i id="spBar"></i></div><b class="num" id="spS">0</b></div><div class="card" id="spCard"></div><div class="zone" id="spZone"></div>`;
  SP.timer = setInterval(() => {
    if (!SP || !SP.running) return;
    const left = Math.max(0, SP.end - Date.now());
    const t = document.getElementById('spT'),
      bar = document.getElementById('spBar');
    if (t) t.textContent = Math.ceil(left / 1000);
    if (bar) bar.style.width = left / 600 + '%';
    if (left <= 0) endSpeed();
  }, 100);
  view.onclick = e => {
    const b = e.target.closest('button[data-sopt]');
    if (b) answerSpeed(+b.dataset.sopt);
    else {
      const s = e.target.closest('button[data-sp]');
      if (s) speedEndClick(s);
    }
  };
  nextSpeed();
}
function nextSpeed() {
  if (!SP || !SP.running) return;
  SP.q = speedQ(SP.mod);
  SP.lock = false;
  const q = SP.q;
  const size = q.cls === 'word' ? wordSize(q.show) : q.cls === 'eword' ? enSize(q.show) : null;
  document.getElementById('spCard').innerHTML =
    q.cls === 'glyph'
      ? `<div class="tz"><span class="glyph ${q.show.length > 1 ? 'two' : ''}" lang="ja">${q.show}</span></div>`
      : `<div class="tz wide"><span class="${q.cls}" lang="${q.lang}" style="font-size:${size}px">${esc(q.show)}</span></div>`;
  document.getElementById('spZone').innerHTML =
    `<div class="opts ${q.cls === 'glyph' ? 'grid2' : ''}">${q.order.map((o, i) => `<button type="button" class="opt" data-sopt="${i}"><span class="${o.cls}">${esc(o.t)}</span></button>`).join('')}</div>`;
}
function answerSpeed(i) {
  if (!SP || !SP.running || SP.lock) return;
  SP.lock = true;
  const o = SP.q.order[i];
  SP.total++;
  if (o.ok) SP.score++;
  record(null, o.ok);
  sfx(o.ok ? 'pop' : 'ng');
  document.getElementById('spS').textContent = SP.score;
  const btns = [...document.querySelectorAll('[data-sopt]')];
  btns[i].dataset.state = o.ok ? 'ok' : 'ng';
  if (!o.ok) btns[SP.q.order.findIndex(x => x.ok)].dataset.state = 'ok';
  SP.lockT = setTimeout(nextSpeed, o.ok ? 220 : 750);
}
function endSpeed() {
  if (!SP) return;
  stopSpeed();
  const mod = SP.mod;
  if (SPEED_C && SPEED_C.mod === mod) {
    courseMark(SPEED_C);
    SPEED_C = null;
  }
  const prev = S.best[mod] || 0;
  const isNew = SP.score > prev;
  if (isNew) S.best[mod] = SP.score;
  save();
  checkBadges();
  const name = { kspeed: '가나', wspeed: '일본어 단어', espeed: '영단어' }[mod];
  missionEvent('speed');
  SP.share = `하나마루 60초 도전 · ${name} ${SP.score}개 맞힘! (${SP.total}문제 중)`;
  document.getElementById('stage').innerHTML =
    `<div class="sum"><div class="sum-score">${isNew && SP.score > 0 ? `<svg viewBox="0 0 200 200" aria-hidden="true"><path pathLength="1" d="M108 18C162 16 190 60 184 108 178 156 134 186 92 182 44 178 14 142 18 96 22 52 60 24 106 26M110 64c24 2 38 20 36 42-2 22-22 38-44 36-20-2-34-20-32-40 2-18 18-30 36-28 16 2 26 14 24 28"/></svg>` : ''}<b class="num">${SP.score}</b><span>개</span></div>
    <p class="sum-msg">${isNew ? '최고 기록이에요!' : `최고 기록 ${prev}개`} · ${SP.total}문제 중 ${SP.score}개 정답</p>
    <div class="row"><button class="btn" data-sp="share">결과 복사</button><button class="btn primary" data-sp="again">다시 도전</button></div></div>`;
}
function speedEndClick(b) {
  if (b.dataset.sp === 'again') startSpeed(SP.mod);
  else if (b.dataset.sp === 'share') copyText(SP.share, '결과를 복사했어요. 친구에게 보내 보세요.', () => toast(SP.share));
}

// ---- views/reference.js ----
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

// ---- views/wordlist.js ----
'use strict';
/* word lists */
const LS = { ja: { q: '', cat: 'all', add: false, msg: '' }, en: { q: '', cat: 'all', add: false, msg: '' } };
function renderWordList(lang) {
  const vb = document.getElementById('vbody');
  const ls = LS[lang];
  const cats = lang === 'ja' ? CATS : EN_CATS;
  const ja = lang === 'ja';
  const chips = [
    ['all', '전체'],
    ['fav', '★ 즐겨찾기'],
    ...(ja
      ? [
          ['n5', 'N5'],
          ['n4', 'N4']
        ]
      : []),
    ...((ja ? S.custom.ja : S.custom.en).length ? [['mine', '내 단어']] : []),
    ...Object.entries(cats)
      .filter(([k]) => k !== 'mine')
      .map(([k, [l]]) => [k, l])
  ];
  vb.innerHTML = `<div class="chart">
    <input type="search" class="wl-search" id="wlq" placeholder="${ja ? '단어, 읽기, 로마자, 뜻으로 검색' : '단어나 뜻으로 검색'}" value="${esc(ls.q)}" aria-label="단어 검색" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
    <div class="chips" id="wlc">${chips.map(([k, l]) => `<button class="chip" data-wc="${k}" aria-pressed="${ls.cat === k}">${l}</button>`).join('')}</div>
    <div>
      <div class="row wl-tools"><button class="btn" data-addtoggle>${ls.add ? '닫기' : '+ 내 단어 추가'}</button><button class="btn" data-wlshare>단어장 공유</button></div>
      ${
        ls.add
          ? `<form class="add-form" id="addForm" style="margin-top:8px" autocomplete="off">
        ${
          ja
            ? `<input id="aw" type="text" lang="ja" placeholder="단어 (예: 猫, ねこ)" aria-label="단어"><input id="ar" type="text" lang="ja" placeholder="읽기 – 히라가나 (예: ねこ)" aria-label="읽기"><input id="am" type="text" lang="ko" placeholder="뜻 – 여러 개면 쉼표로 (예: 고양이)" aria-label="뜻">`
            : `<input id="aw" type="text" lang="en" inputmode="email" placeholder="영어 단어나 표현" aria-label="단어"><input id="am" type="text" lang="ko" placeholder="뜻 – 여러 개면 쉼표로" aria-label="뜻">`
        }
        <button class="btn primary" type="submit">추가하기</button>${ls.msg ? `<p class="note" style="color:var(--ink)">${esc(ls.msg)}</p>` : ''}</form>`
          : ''
      }
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><p class="note" id="wlcount"></p>${LEGEND}</div>
    <div class="wl" id="wl"></div>
  </div>`;
  const draw = () => {
    const all = ja ? WORDS : EN_WORDS;
    const qq = ls.q.trim().toLowerCase();
    let list = all.filter(
      w =>
        ls.cat === 'all' ||
        (ls.cat === 'fav' ? S.fav[w.key] : ls.cat === 'n5' ? w.lvl === 5 : ls.cat === 'n4' ? w.lvl === 4 : w.cats.includes(ls.cat))
    );
    if (qq)
      list = list.filter(
        w =>
          w.w.toLowerCase().includes(qq) ||
          w.m.some(m => m.includes(qq)) ||
          (ja && (w.r.includes(qq) || toHira(w.r).includes(toHira(qq)) || romaji(w.r).includes(qq)))
      );
    document.getElementById('wlcount').textContent =
      `${list.length}개${list.length > 300 ? ' · 처음 300개만 보여요. 검색이나 분류로 좁혀 보세요.' : ''}`;
    document.getElementById('wl').innerHTML = list
      .slice(0, 300)
      .map(
        w => `<div class="wl-i" data-key="${esc(w.key)}" data-st="${itemStatus(w.key)}">
      <button class="wl-main" data-open><span class="w ${ja ? 'jp' : 'en'}" lang="${lang}">${esc(w.w)}</span>${ja && w.w !== w.r ? `<span class="s jp" lang="ja">${esc(w.r)}</span>` : ''}<span class="s">${esc(w.m.join(', '))}</span>${w.lvl === 4 ? '<span class="lv-tag">N4</span>' : ''}</button>
      <button class="star" data-star aria-pressed="${!!S.fav[w.key]}" aria-label="즐겨찾기">${S.fav[w.key] ? '★' : '☆'}</button>
      <div class="wl-ex" hidden>${ja ? `<span class="mono s">${romaji(w.r)}</span>` : ''}${w.ex ? (ja ? `<span class="ex-jp" lang="ja" style="font-size:16px">${markWord(w.ex, [w.w, w.r])}</span><span class="ex-rd" lang="ja">${esc(w.exr)}</span><span class="ex-ko">${esc(w.exko)}</span>` : `<span class="ex-en" lang="en" style="font-size:16px">${markWord(w.ex, [w.w, ...w.alt], true)}</span><span class="ex-ko">${esc(w.exko)}</span>`) : ''}
        <div class="row" style="margin-top:4px">${w.ex ? spkBtn(w.ex, '예문 듣기', lang) : ''}${w.mine ? `<button class="spk" data-del>삭제</button>` : ''}</div></div></div>`
      )
      .join('');
  };
  draw();
  document.getElementById('wlq').addEventListener('input', e => {
    ls.q = e.target.value;
    draw();
  });
  const form = document.getElementById('addForm');
  if (form)
    form.addEventListener('submit', e => {
      e.preventDefault();
      const w = document.getElementById('aw').value.trim(),
        m = document
          .getElementById('am')
          .value.trim()
          .split(/[,，/]/)
          .map(x => x.trim())
          .filter(Boolean)
          .join('/');
      if (ja) {
        const r = toHira(document.getElementById('ar').value.trim().replace(/\s/g, ''));
        const ww = w || r;
        if (!ww || !r || !m) {
          ls.msg = '단어, 읽기, 뜻을 모두 입력해 주세요.';
          return renderWordList(lang);
        }
        if (!/^[ぁ-ゖー]+$/.test(r)) {
          ls.msg = '읽기는 히라가나로 입력해 주세요.';
          return renderWordList(lang);
        }
        if (WORDS.some(x => x.w === ww && x.r === r)) {
          ls.msg = '이미 있는 단어예요.';
          return renderWordList(lang);
        }
        S.custom.ja.push({ w: ww, r, m });
      } else {
        if (!w || !m) {
          ls.msg = '단어와 뜻을 모두 입력해 주세요.';
          return renderWordList(lang);
        }
        if (EN_WORDS.some(x => x.w.toLowerCase() === w.toLowerCase())) {
          ls.msg = '이미 있는 단어예요.';
          return renderWordList(lang);
        }
        S.custom.en.push({ w, m });
      }
      rebuildWords();
      if (ja) {
        S.word.cats = [...new Set([...S.word.cats, 'mine'])];
        R.word = null;
      } else {
        S.ew.cats = [...new Set([...S.ew.cats, 'mine'])];
        R.ew = null;
      }
      save();
      ls.msg = '추가했어요. 단어 퀴즈에도 나와요.';
      ls.cat = 'mine';
      renderWordList(lang);
    });
  vb.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.wc) {
      ls.cat = b.dataset.wc;
      vb.querySelectorAll('[data-wc]').forEach(x => x.setAttribute('aria-pressed', x === b));
      draw();
      return;
    }
    if ('wlshare' in b.dataset) {
      openWordShare(lang);
      return;
    }
    if ('addtoggle' in b.dataset) {
      ls.add = !ls.add;
      ls.msg = '';
      renderWordList(lang);
      return;
    }
    const row = b.closest('.wl-i');
    if (!row) return;
    const key = row.dataset.key;
    if ('star' in b.dataset) {
      if (S.fav[key]) delete S.fav[key];
      else S.fav[key] = 1;
      save();
      const on = !!S.fav[key];
      b.setAttribute('aria-pressed', on);
      b.textContent = on ? '★' : '☆';
      return;
    }
    if ('del' in b.dataset) {
      if (b.dataset.confirm) {
        const arr = ja ? S.custom.ja : S.custom.en;
        const i = arr.findIndex(c => (ja ? 'w:' + c.w + '|' + c.r : 'ew:' + c.w) === key);
        if (i >= 0) arr.splice(i, 1);
        delete S.fav[key];
        rebuildWords();
        R.word = null;
        R.ew = null;
        save();
        draw();
      } else {
        b.dataset.confirm = '1';
        b.textContent = '정말 삭제';
      }
      return;
    }
    if ('open' in b.dataset) {
      const ex = row.querySelector('.wl-ex');
      const show = ex.hidden;
      vb.querySelectorAll('.wl-i.hit').forEach(x => {
        x.classList.remove('hit');
        x.querySelector('.wl-ex').hidden = true;
      });
      if (show) {
        row.classList.add('hit');
        ex.hidden = false;
        const w = (ja ? WORDS : EN_WORDS).find(x => x.key === key);
        if (w) speak(ja ? w.r : w.w, lang);
      }
    }
  };
}

// ---- views/stats.js ----
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

// ---- quiz/modes-extra.js ----
'use strict';
/* ================= extra quiz types: kanji, particles, grammar, irregular verbs, minimal pairs ================= */
const regPast = b => (/e$/.test(b) ? b + 'd' : /[^aeiou]y$/.test(b) ? b.slice(0, -1) + 'ied' : b + 'ed');
/* ---------- kanji ---------- */
function showKanji(mod, q, card, zone, r) {
  const w = q.ex[q.exi || 0];
  if (!r.order) {
    if (q.dir === 'mean') {
      const others = shuffle(KANJI.filter(x => x !== q && x.hun !== q.hun)).slice(0, 3);
      r.order = shuffle([q, ...others].map(x => ({ t: x.hun, ok: x === q, cls: 'ko-opt', sub: x.k, subCls: 'jp', subLang: 'ja' })));
    } else {
      const pool = KANJI.flatMap(x => x.ex).filter(e => e[1] !== w[1] && e[0] !== w[0]);
      const near = shuffle(pool.filter(e => Math.abs(e[1].length - w[1].length) <= 1));
      const pick = [];
      for (const e of near.concat(shuffle(pool))) {
        if (pick.length >= 3) break;
        if (!pick.some(p => p[1] === e[1])) pick.push(e);
      }
      r.order = shuffle([
        { t: w[1], ok: true, cls: 'jp', lang: 'ja', sub: `${w[0]} · ${w[2]}` },
        ...pick.map(e => ({ t: e[1], ok: false, cls: 'jp', lang: 'ja', sub: `${e[0]} · ${e[2]}` }))
      ]);
    }
  }
  card.innerHTML =
    q.dir === 'mean'
      ? `<span class="cat">기초 한자</span><div class="tz"><span class="glyph" lang="ja">${q.k}</span></div><p class="cap">이 한자의 뜻과 음을 고르세요</p>${MARKS}`
      : `<span class="cat">기초 한자 · 읽기</span><div class="tz wide"><span class="word" lang="ja" style="font-size:${wordSize(w[0])}px">${esc(w[0])}</span></div><p class="cap">이 단어의 읽는 법을 고르세요</p>${MARKS}`;
  zone.dataset.type = 'kanji';
  zone.innerHTML = optsHTML(r);
}
INFO.kanji = q =>
  `<div class="fb-line"><span class="jp" lang="ja" style="font-size:36px">${q.k}</span><b>${esc(q.hun)}</b><span class="fb-sub">${esc(q.mean)}</span></div><p class="fb-sub">음독 <span class="jp">${esc(q.on || '–')}</span> · 훈독 <span class="jp">${esc(q.kun || '–')}</span></p><div class="form-tbl">${q.ex.map(e => `<span class="jp" lang="ja">${esc(e[0])}</span><span><span class="jp" lang="ja">${esc(e[1])}</span> · ${esc(e[2])}</span>`).join('')}</div><div>${spkBtn(q.ex[q.exi || 0][1], '단어 듣기')}</div>`;
SPEAKQ.kanji = q => [q.ex[q.exi || 0][1], 'ja'];

/* ---------- particles ---------- */
function partSentence(q, reveal) {
  const kj = S.set.kanji;
  const toks = (kj ? q.t : q.a[1]).split(' ');
  return toks
    .map((t, i) => (i === q.pi ? esc(t).replace(esc(q.p), `<span class="blank">${reveal ? esc(q.p) : '？'}</span>`) : esc(t)))
    .join(kj ? '' : ' ');
}
function showPart(mod, q, card, zone, r) {
  if (!r.order) {
    const ex = P_EXCL[q.p] || [];
    const pool = shuffle(
      ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も', 'の', 'から', 'まで'].filter(p => p !== q.p && !ex.includes(p))
    ).slice(0, 3);
    r.order = shuffle([q.p, ...pool].map(p => ({ t: p, ok: p === q.p, cls: 'jp', lang: 'ja', sub: PART_EXP[p] })));
  }
  card.innerHTML = `<span class="cat">${SCENES[q.sc] || ''} · 조사 빈칸</span><p class="ko" style="font-size:17px;font-weight:500;color:var(--muted);margin-top:22px">${esc(q.k)}</p><p class="psent" lang="ja">${partSentence(q, r.answered)}</p><p class="cap">빈칸에 들어갈 조사를 고르세요</p>${MARKS}`;
  zone.dataset.type = 'part';
  zone.innerHTML = optsHTML(r);
}
INFO.part = q =>
  `<p class="fb-big" lang="ja">${partSentence({ ...q }, true)}</p><p class="fb-sub" lang="ja" style="font-family:var(--f-jp);font-size:16px">${esc(q.a[1])}</p><p class="fb-sub mono">${esc(romaji(q.a[1]))}</p><p class="fb-sub"><b class="jp" style="color:var(--ink)">${q.p}</b> · ${esc(PART_EXP[q.p])}</p><div>${spkBtn(q.a[0], '문장 듣기')}</div>`;
SPEAKQ.part = q => [q.a[0], 'ja'];

/* ---------- grammar ---------- */
function showGram(mod, q, card, zone, r) {
  const kj = S.set.kanji;
  if (!r.order)
    r.order = shuffle([
      { t: kj ? q.a[0] : q.a[1], ok: true, cls: 'jp', lang: 'ja', sub: (kj ? q.a[1] + ' · ' : '') + q.k, subCls: '', subLang: '' },
      ...q.d.map(d => ({ t: kj ? d[0] : d[1], ok: false, cls: 'jp', lang: 'ja', sub: (kj ? d[1] + ' · ' : '') + d[2] }))
    ]);
  card.innerHTML = `<span class="cat">문법 · <span class="jp">${esc(q.g.p)}</span></span><p class="ko">${esc(q.k)}</p><p class="cap">${esc(q.g.name)} 표현을 써서 알맞은 일본어를 고르세요</p>${MARKS}`;
  zone.dataset.type = 'gram';
  zone.innerHTML = optsHTML(r);
}
const gramBox = g =>
  `<div class="ex"><p><b class="jp">${esc(g.p)}</b> · ${esc(g.name)}</p><p class="fb-sub">${esc(g.form)}</p><p class="fb-sub" style="color:var(--ink)">${esc(g.exp)}</p>${g.ex.map(e => `<p class="ex-jp" lang="ja">${esc(e[0])}</p><p class="ex-ko">${esc(e[2])}</p>`).join('')}</div>`;
INFO.gram = q =>
  `<p class="fb-big" lang="ja">${esc(q.a[0])}</p><p class="fb-sub" lang="ja" style="font-family:var(--f-jp);font-size:16px">${esc(q.a[1])}</p><p class="fb-sub mono">${esc(romaji(q.a[1]))}</p><div>${spkBtn(q.a[0], '문장 듣기')}</div>${gramBox(q.g)}`;
SPEAKQ.gram = q => [q.a[0], 'ja'];

/* ---------- irregular verbs ---------- */
function showIrr(mod, q, card, zone, r) {
  const right = q.form === 'past' ? q.p : q.pp;
  const ok = right.split('/');
  if (!r.order) {
    const cands = [regPast(q.b), q.form === 'past' ? q.pp : q.p, q.b, q.b + 'en', (q.form === 'past' ? q.p : q.pp).split('/')[0] + 'ed'];
    for (const x of shuffle(IRR)) {
      if (x !== q) cands.push((q.form === 'past' ? x.p : x.pp).split('/')[0]);
    }
    const wr = [];
    for (const c of cands) {
      if (wr.length >= 3) break;
      if (!ok.includes(c) && c !== right && !wr.includes(c) && !right.split('/').includes(c)) wr.push(c);
    }
    r.order = shuffle([{ t: right, ok: true, cls: 'en', lang: 'en' }, ...wr.map(t => ({ t, ok: false, cls: 'en', lang: 'en' }))]);
  }
  card.innerHTML = `<span class="cat">불규칙 동사</span><div class="tz wide" style="min-height:90px"><span class="eword" lang="en" style="font-size:48px">${esc(q.b)}</span></div><p class="cap">${esc(q.ko)}</p><span class="target">${q.form === 'past' ? '과거형' : '과거분사 (p.p.)'}</span>${MARKS}`;
  zone.dataset.type = 'irr';
  zone.innerHTML = optsHTML(r);
}
INFO.irr =
  q => `<div class="form-tbl"><span>원형</span><span class="en" style="font-size:18px">${esc(q.b)}</span><span class="${q.form === 'past' ? 'cur' : ''}">과거형</span><span class="en ${q.form === 'past' ? 'cur' : ''}" style="font-size:18px">${esc(q.p)}</span><span class="${q.form === 'pp' ? 'cur' : ''}">과거분사</span><span class="en ${q.form === 'pp' ? 'cur' : ''}" style="font-size:18px">${esc(q.pp)}</span></div>
  <div class="ex"><p class="ex-en" lang="en">${markWord(q.ex, q.p.split('/'), true)}</p><p class="ex-ko">${esc(q.exko)}</p>${spkBtn(q.ex, '예문 듣기', 'en')}</div>`;
SPEAKQ.irr = q => [`${q.b}, ${q.p.split('/')[0]}, ${q.pp.split('/')[0]}`, 'en'];

/* ---------- minimal pairs ---------- */
function showMP(mod, q, card, zone, r) {
  const fresh = !r.order;
  if (fresh)
    r.order = [
      { t: q.w1, ok: q.tg === q.w1, cls: 'en', lang: 'en', sub: q.k1 },
      { t: q.w2, ok: q.tg === q.w2, cls: 'en', lang: 'en', sub: q.k2 }
    ];
  card.innerHTML = `<span class="cat">발음 구별 · ${esc(q.lb)}</span>${playBox()}<p class="cap">들린 단어를 고르세요</p>${MARKS}`;
  zone.dataset.type = 'mp';
  zone.innerHTML = optsHTML(r).replace('<div class="opts">', '<div class="opts grid2">');
  if (fresh && !r.answered) speak(q.tg, 'en');
}
INFO.mp = q =>
  `<p class="fb-sub">들린 단어: <b class="en" style="font-size:20px;color:var(--ink)">${esc(q.tg)}</b></p><div class="row">${spkBtn(q.w1, q.w1 + ' 듣기', 'en')}${spkBtn(q.w2, q.w2 + ' 듣기', 'en')}</div><p class="fb-sub">두 단어를 번갈아 들으며 차이를 비교해 보세요.</p>`;

// ---- features/shadowing.js ----
'use strict';
/* ---------- shadowing ---------- */
const canRec = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
let REC = { stream: null, mr: null, url: null, chunks: [], on: false, err: '' };
function recRelease() {
  try {
    if (REC.mr && REC.mr.state === 'recording') REC.mr.stop();
  } catch (e) {}
  if (REC.stream) {
    REC.stream.getTracks().forEach(t => t.stop());
    REC.stream = null;
  }
  REC.on = false;
}
async function recStart() {
  REC.err = '';
  try {
    REC.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    REC.chunks = [];
    const mr = new MediaRecorder(REC.stream);
    REC.mr = mr;
    mr.ondataavailable = e => {
      if (e.data && e.data.size) REC.chunks.push(e.data);
    };
    mr.onstop = () => {
      if (REC.url) URL.revokeObjectURL(REC.url);
      REC.url = URL.createObjectURL(new Blob(REC.chunks, { type: mr.mimeType || 'audio/mp4' }));
      REC.on = false;
      if (REC.stream) {
        REC.stream.getTracks().forEach(t => t.stop());
        REC.stream = null;
      }
      refreshShadow();
    };
    if (hasTTS) {
      try {
        speechSynthesis.cancel();
      } catch (e) {}
    }
    mr.start();
    REC.on = true;
  } catch (e) {
    REC.err = '마이크를 쓸 수 없어요. 홈 화면 앱이나 Safari에서 마이크 권한을 허용해 주세요. 녹음 없이 소리 내어 따라 해도 좋아요.';
    REC.on = false;
  }
  refreshShadow();
}
function recStop() {
  try {
    if (REC.mr && REC.mr.state === 'recording') REC.mr.stop();
  } catch (e) {}
}
function recPlay() {
  if (REC.url) {
    try {
      const a = new Audio(REC.url);
      a.play().catch(() => {});
    } catch (e) {}
  }
}
function shadowZone(r) {
  const rec = canRec
    ? `<div class="row">${REC.on ? `<button type="button" class="btn rec-on" data-act="recstop">■ 녹음 멈추기</button>` : `<button type="button" class="btn" data-act="recstart">● 내 목소리 녹음</button>`}<button type="button" class="btn" data-act="recplay" ${REC.url && !REC.on ? '' : 'disabled'}>▶ 내 녹음 듣기</button></div>`
    : `<p class="note">이 화면에서는 녹음을 쓸 수 없어요. 원어민 발음을 듣고 소리 내어 따라 해 보세요.</p>`;
  return `<div class="shadow"><ol class="steps"><li>재생 버튼으로 원어민 발음을 들어요.</li><li>소리 내어 따라 말해요.${canRec ? ' 녹음해서 원어민 발음과 번갈아 들어 보세요.' : ''}</li><li>스스로 평가하고 다음 문장으로 넘어가요.</li></ol>${rec}${REC.err ? `<p class="note" style="color:var(--ng)">${esc(REC.err)}</p>` : ''}
    ${r.answered ? '' : `<div class="row"><button type="button" class="btn" data-act="shno">한 번 더 연습할래요</button><button type="button" class="btn primary" data-act="shok">잘 따라 했어요</button></div>`}</div>`;
}
function refreshShadow() {
  const m = activeMod();
  if ((m === 'jsh' || m === 'esh') && R[m] && !R[m].done) {
    const z = document.getElementById('zone');
    if (z) z.innerHTML = shadowZone(R[m]);
  }
}
function showShadow(mod, q, card, zone, r) {
  const ja = mod === 'jsh';
  const fresh = !r.started;
  r.started = true;
  if (fresh) {
    if (REC.url) {
      URL.revokeObjectURL(REC.url);
      REC.url = null;
    }
    REC.err = '';
  }
  card.innerHTML = `<span class="cat">${SCENES[q.sc] || ''} · 따라 말하기</span>${ja ? `<p class="fb-big" lang="ja" style="text-align:center;margin-top:26px">${esc(q.a[0])}</p><p class="cap" lang="ja" style="font-family:var(--f-jp);font-size:15px">${esc(q.a[1])}</p><p class="cap mono">${esc(romaji(q.a[1]))}</p>` : `<p class="ko en" lang="en">${esc(q.a)}</p>`}<p class="cap">${esc(q.k)}</p>${playBox()}`;
  zone.dataset.type = 'shadow';
  zone.innerHTML = shadowZone(r);
  if (fresh) speak(ja ? q.a[0] : q.a, ja ? 'ja' : 'en');
}
function rateShadow(mod, ok) {
  const r = R[mod],
    q = r.qs[r.i];
  if (r.answered) return;
  finish(
    mod,
    q,
    ok,
    '',
    `<div class="fb-head"><span class="badge">${ok ? '〇' : '△'}</span>${ok ? '좋아요! 다음 문장으로 가요' : '괜찮아요. 이 문장은 나중에 다시 나와요'}</div>`
  );
  document.getElementById('zone').innerHTML = shadowZone(r);
}

// ---- features/dialogue.js ----
'use strict';
/* ---------- dialogues ---------- */
let DG = null;
function dlgList(mod) {
  const lang = modLang(mod);
  const sc = S.dlg.sc[lang] || 'all';
  return DLG[mod].filter(d => sc === 'all' || d.sc === sc);
}
function renderDialogue(mod) {
  if (DG && DG.mod === mod) return renderDlgPlay();
  renderDlgList(mod);
}
function renderDlgList(mod) {
  const lang = modLang(mod);
  const all = DLG[mod];
  const sc = S.dlg.sc[lang] || 'all';
  const st = d => {
    const s = S.stats[d.key];
    return !s ? '' : s.c > 0 ? 'done' : 'learn';
  };
  const doneN = all.filter(d => S.stats[d.key]?.c > 0).length;
  view.innerHTML = `<section class="mod">${modeSeg(mod)}<div class="chart">
    <p class="note">상대의 말을 듣고, 내 차례에는 목표에 맞는 말을 골라 대화를 이어 가요. 실수 없이 끝내면 완료로 표시돼요. (${doneN} / ${all.length} 완료)</p>
    <div class="chips">${[['all', '전체'], ...Object.entries(SCENES)]
      .filter(([v]) => v === 'all' || all.some(d => d.sc === v))
      .map(
        ([v, l]) =>
          `<button class="chip" data-dsc="${v}" aria-pressed="${sc === v}">${l}${v === 'all' ? '' : ' ' + all.filter(d => d.sc === v).length}</button>`
      )
      .join('')}</div>
    <button class="btn primary" data-drand>${sc === 'all' ? '아무 대화나 시작' : SCENES[sc] + ' 대화 시작'}</button>
    <div class="wl">${dlgList(mod)
      .map(
        d =>
          `<div class="wl-i" data-st="${st(d)}"><button class="wl-main" data-dstart="${esc(d.id)}"><span class="w" style="font-size:16px;font-weight:600">${esc(d.title)}</span><span class="s">${SCENES[d.sc] || ''} · 상대: ${esc(d.role)} · 내 차례 ${d.lines.filter(l => l.who === 'me').length}번</span></button><span></span></div>`
      )
      .join('')}</div>
    <div style="display:flex;justify-content:flex-end">${LEGEND.replace('연습 중', '완료(실수 있음)').replace('<span><i style="background:var(--ng)"></i>복습 필요</span>', '')}</div>
  </div></section>`;
  bindModes();
  view.onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.closest('.modes')) return;
    if (b.dataset.dsc) {
      S.dlg.sc[lang] = b.dataset.dsc;
      save();
      renderDlgList(mod);
    } else if ('drand' in b.dataset) {
      const l = dlgList(mod);
      const fresh = l.filter(d => !(S.stats[d.key]?.c > 0));
      const pool = fresh.length ? fresh : l;
      if (pool.length) startDlg(mod, pool[(Math.random() * pool.length) | 0]);
    } else if (b.dataset.dstart) {
      const d = DLG[mod].find(x => x.id === b.dataset.dstart);
      if (d) startDlg(mod, d);
    }
  };
}
function startDlg(mod, d, course) {
  stopAll();
  DG = { mod, d, i: 0, log: [], mist: 0, wrong: [], order: null, done: false, recorded: false, course: course || null };
  const more = collectThem();
  speakSeq(more, modLang(mod));
  renderDlgPlay();
  window.scrollTo(0, 0);
}
function collectThem() {
  const L = DG.d.lines;
  const texts = [];
  while (DG.i < L.length && L[DG.i].who === 'them') {
    DG.log.push({ ...L[DG.i] });
    texts.push(L[DG.i].a);
    DG.i++;
  }
  if (DG.i >= L.length) {
    DG.done = true;
    if (!DG.recorded) {
      DG.recorded = true;
      const first = !S.stats[DG.d.key];
      record(DG.d.key, DG.mist === 0);
      onDialogueDone(DG.mod, DG.d, first, DG.mist === 0);
      sfx('combo');
    }
    if (DG.course && !DG.course.marked) {
      DG.course.marked = true;
      courseMark(DG.course);
    }
  } else {
    const l = L[DG.i];
    const ja = modLang(DG.mod) === 'ja';
    DG.order = shuffle([
      { t: l.a, r: l.r, k: l.k, ok: true },
      ...l.d.map(x => (ja ? { t: x[0], r: x[1], k: x[2], ok: false } : { t: x[0], k: x[1], ok: false }))
    ]);
    DG.wrong = [];
  }
  return texts;
}
function pickDlg(i, giveUp) {
  if (!DG || DG.done) return;
  const o = DG.order[i];
  if (!giveUp && !o.ok) {
    if (!DG.wrong.includes(i)) {
      DG.wrong.push(i);
      DG.mist++;
    }
    sfx('ng');
    renderDlgPlay();
    return;
  }
  if (!giveUp) sfx('ok');
  if (giveUp) DG.mist++;
  const l = DG.d.lines[DG.i];
  DG.log.push({ ...l, who: 'me', hint: giveUp });
  DG.i++;
  const more = collectThem();
  speakSeq([l.a, ...more], modLang(DG.mod));
  renderDlgPlay();
}
function renderDlgPlay() {
  const d = DG.d,
    ja = modLang(DG.mod) === 'ja',
    lg = ja ? 'ja' : 'en',
    cls = ja ? 'jp' : 'en';
  const bub = l =>
    `<div class="bub ${l.who}"><span class="who">${l.who === 'me' ? '나' : esc(d.role)}${l.hint ? ' · 정답 보기' : ''}</span><span class="t ${cls}" lang="${lg}">${esc(l.a)}</span>${ja && S.dlg.rd && l.r ? `<span class="rd" lang="ja">${esc(l.r)}</span>` : ''}${S.dlg.ko ? `<span class="kr">${esc(l.k)}</span>` : ''}${hasTTS ? `<button type="button" class="bub-spk" data-speak="${esc(l.a)}" data-lang="${lg}" aria-label="듣기">${SPK_ICON}</button>` : ''}</div>`;
  let bottom;
  if (DG.done) {
    const list = dlgList(DG.mod);
    const idx = list.indexOf(d);
    bottom = `<div class="sum dlg-bottom"><div class="sum-score">${DG.mist === 0 ? `<svg viewBox="0 0 200 200" aria-hidden="true"><path pathLength="1" d="M108 18C162 16 190 60 184 108 178 156 134 186 92 182 44 178 14 142 18 96 22 52 60 24 106 26M110 64c24 2 38 20 36 42-2 22-22 38-44 36-20-2-34-20-32-40 2-18 18-30 36-28 16 2 26 14 24 28"/></svg>` : ''}<b class="num">${DG.mist}</b><span>번 실수</span></div>
      <p class="sum-msg">${DG.mist === 0 ? '실수 없이 대화를 끝냈어요. 하나마루!' : '대화를 끝까지 이어 갔어요. 한 번 더 하면 더 자연스러워져요.'}</p>
      <div class="row"><button class="btn" data-dagain>다시 하기</button>${DG.course ? `<button class="btn primary" data-dcourse>코스로 돌아가기</button>` : list.length > 1 || idx < 0 ? `<button class="btn primary" data-dnext>다음 대화</button>` : ''}</div></div>`;
  } else {
    const l = d.lines[DG.i];
    bottom = `<div class="goal-box dlg-bottom"><span class="lbl">내 차례 · 이렇게 말해 보세요</span><b>${esc(l.goal || '')}</b><div class="opts">${DG.order
      .map((o, i) => {
        const w = DG.wrong.includes(i);
        return `<button type="button" class="opt" data-dpick="${i}" ${w ? 'data-state="ng" aria-disabled="true"' : ''}><span class="n">${i + 1}</span><span class="${cls}" lang="${lg}" style="font-size:18px;padding-right:20px">${esc(o.t)}</span>${ja && S.dlg.rd && o.r ? `<span class="rd" lang="ja">${esc(o.r)}</span>` : ''}${w ? `<span class="tr">"${esc(o.k)}"라는 뜻이라 지금은 맞지 않아요</span>` : ''}</button>`;
      })
      .join('')}</div>
      <button type="button" class="btn quiet" data-dhint>모르겠어요 · 정답 보기</button></div>`;
  }
  view.innerHTML = `<section class="mod">${modeSeg(DG.mod)}<div class="dlg">
    <div class="dlg-bar"><button class="btn quiet" data-dback style="flex:none">← 목록</button><div class="chips">${ja ? `<button class="chip" data-dtog="rd" aria-pressed="${S.dlg.rd}">읽는 법</button>` : ''}<button class="chip" data-dtog="ko" aria-pressed="${S.dlg.ko}">해석</button></div></div>
    <div class="dlg-head"><b>${esc(d.title)}</b><span class="note">${SCENES[d.sc] || ''} · ${esc(d.setting)}</span></div>
    <div class="chat">${DG.log.map(bub).join('')}</div>${bottom}</div></section>`;
  bindModes();
  view.onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.closest('.modes') || b.dataset.speak) return;
    if ('dback' in b.dataset) {
      stopAll();
      const m = DG.mod;
      DG = null;
      renderDlgList(m);
    } else if (b.dataset.dtog) {
      S.dlg[b.dataset.dtog] = !S.dlg[b.dataset.dtog];
      save();
      renderDlgPlay();
    } else if (b.dataset.dpick !== undefined) pickDlg(+b.dataset.dpick);
    else if ('dhint' in b.dataset) {
      const i = DG.order.findIndex(o => o.ok);
      pickDlg(i, true);
    } else if ('dagain' in b.dataset) startDlg(DG.mod, DG.d);
    else if ('dcourse' in b.dataset) {
      DG = null;
      go('home');
    } else if ('dnext' in b.dataset) {
      const list = dlgList(DG.mod);
      const i = list.indexOf(DG.d);
      const n = list[(i + 1) % list.length] || DLG[DG.mod][0];
      startDlg(DG.mod, n);
    }
  };
  const bt = view.querySelector('.dlg-bottom');
  if (bt && DG.log.length > 1) bt.scrollIntoView({ block: 'end', behavior: 'smooth' });
}

// ---- views/grammar-notes.js ----
'use strict';
/* ---------- grammar notes ---------- */
let GN_LVL = '5';
function renderGNote() {
  const vb = document.getElementById('vbody');
  const list = GRAM.filter(g => String(g.lvl) === GN_LVL);
  vb.innerHTML = `<div class="chart"><div class="seg" role="group" aria-label="급수">${[
    ['5', 'N5'],
    ['4', 'N4']
  ]
    .map(
      ([v, l]) =>
        `<button data-gnl="${v}" aria-pressed="${GN_LVL === v}">${l} 문법 ${GRAM.filter(g => String(g.lvl) === v).length}</button>`
    )
    .join('')}</div><p class="note">눌러서 만드는 법과 예문을 보고, 바로 그 문법 퀴즈를 풀 수 있어요.</p><div class="wl">${list
    .map(g => {
      const gi = GRAM.indexOf(g);
      const ks = GRAM_ITEMS.filter(x => x.g === g).map(x => x.key);
      const d = doneCount(ks);
      return `<div class="wl-i" data-st="${d === ks.length && d ? 'done' : ks.some(k => S.stats[k]) ? 'learn' : ''}"><button class="wl-main" data-gopen><span class="w jp" lang="ja">${esc(g.p)}</span><span class="s">${esc(g.name)}</span></button><span></span>
    <div class="wl-ex" hidden><p class="fb-sub" style="margin:0">${esc(g.form)}</p><p class="fb-sub" style="margin:0;color:var(--ink)">${esc(g.exp)}</p>${g.ex.map(e => `<span class="ex-jp" lang="ja" style="font-size:16px">${esc(e[0])}</span><span class="ex-rd" lang="ja">${esc(e[1])}</span><span class="ex-ko">${esc(e[2])}</span>`).join('')}
      <div class="row" style="margin-top:6px">${spkBtn(g.ex.map(e => e[0]).join(' '), '예문 듣기')}<button class="btn" data-gquiz="${gi}">이 문법 퀴즈</button></div></div></div>`;
    })
    .join('')}</div></div>`;
  vb.onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.dataset.speak) return;
    if (b.dataset.gnl) {
      GN_LVL = b.dataset.gnl;
      renderGNote();
      return;
    }
    if (b.dataset.gquiz !== undefined) {
      const g = GRAM[+b.dataset.gquiz];
      PENDING.gram = GRAM_ITEMS.filter(x => x.g === g);
      R.gram = null;
      S.filt.gram = 'all';
      startMod('gram');
    } else if ('gopen' in b.dataset) {
      const row = b.closest('.wl-i');
      const ex = row.querySelector('.wl-ex');
      const show = ex.hidden;
      vb.querySelectorAll('.wl-i.hit').forEach(x => {
        x.classList.remove('hit');
        x.querySelector('.wl-ex').hidden = true;
      });
      if (show) {
        row.classList.add('hit');
        ex.hidden = false;
      }
    }
  };
}

// ---- views/today.js ----
'use strict';
/* ---------- today summary ---------- */
function itemIndex() {
  if (IDX) return IDX;
  IDX = new Map();
  const mods = [
    'kana',
    'word',
    'loan',
    'conj',
    'kanji',
    'cnt',
    'sent',
    'jb',
    'part',
    'gram',
    'pol',
    'jl',
    'jd',
    'jsh',
    'jlen',
    'ew',
    'irr',
    'es',
    'eb',
    'el',
    'ed',
    'esh',
    'mp'
  ];
  for (const m of [...mods, ...Object.keys(POOLS).filter(x => !mods.includes(x))])
    for (const it of basePool(m, true)) if (!IDX.has(it.key)) IDX.set(it.key, { mod: m, it });
  for (const m of ['jdlg', 'edlg']) for (const d of DLG[m]) IDX.set(d.key, { mod: m, it: d });
  return IDX;
}
function itemLabel(mod, q) {
  if (LABELS[mod]) return LABELS[mod](q);
  if (mod === 'kana' || mod === 'kconf') return [q.ch, kanaRom(q.ch)];
  if (mod === 'word') return [q.w, (q.w !== q.r ? q.r + ' · ' : '') + q.m[0]];
  if (mod === 'ew') return [q.w, q.m[0]];
  if (mod === 'loan') return [q.k, q.en];
  if (mod === 'conj') return [`${q.v.w} → ${FORM_SHORT[q.form]}`, q.right.w];
  if (mod === 'kanji') return [q.k, q.hun];
  if (mod === 'irr') return [q.b, `${q.p} · ${q.pp}`];
  if (mod === 'mp') return [`${q.w1} / ${q.w2}`, q.lb];
  if (mod === 'jdlg' || mod === 'edlg') return [q.title, SCENES[q.sc] || ''];
  if (mod === 'part') return [q.k, q.p];
  if (mod === 'cnt') return [q.disp, q.ok[0]];
  if (mod === 'pol') return [q.p, q.c];
  if (mod === 'jlen') return [`${q.r1} / ${q.r2}`, q.lb];
  return [q.k, modLang(mod) === 'ja' ? q.a[0] : q.a];
}
function renderToday() {
  const vb = document.getElementById('vbody');
  const t = dayIdx();
  const idx = itemIndex();
  const d = S.days[today()] || { n: 0, c: 0 };
  const groups = {},
    fresh = {};
  let newN = 0,
    wrongN = 0;
  for (const [k, s] of Object.entries(S.stats)) {
    const e = idx.get(k);
    if (!e) continue;
    if (modLang(e.mod) !== S.lang) continue;
    if (s.f === t) {
      newN++;
      fresh[e.mod] = (fresh[e.mod] || 0) + 1;
    }
    if (s.lw === t) {
      wrongN++;
      (groups[e.mod] = groups[e.mod] || []).push(e.it);
    }
  }
  const label = m => MODE_LABEL[m] || m;
  vb.innerHTML = `<div class="chart">
    <div class="kpis" style="margin-top:0"><div class="kpi"><b class="num">${d.n}</b><span>오늘 푼 문제</span></div><div class="kpi"><b class="num">${newN}</b><span>처음 본 문제</span></div><div class="kpi"><b class="num">${wrongN}</b><span>오늘 틀린 문제</span></div></div>
    ${d.n ? '' : `<div class="empty"><p style="margin:0;font-weight:600">오늘은 아직 공부 기록이 없어요</p><p class="note">문제를 풀면 오늘 틀린 문제와 새로 본 문제가 여기에 모여요.</p></div>`}
    ${
      Object.keys(fresh).length
        ? `<section class="chart-box"><h2 class="sec-title">오늘 새로 본 것</h2><p class="note" style="color:var(--ink)">${Object.entries(
            fresh
          )
            .map(([m, n]) => `${label(m)} ${n}`)
            .join(' · ')}</p></section>`
        : ''
    }
    ${Object.entries(groups)
      .map(
        ([
          m,
          items
        ]) => `<section class="chart-box"><div class="cal-head"><h2 class="sec-title" style="margin:0">${label(m)} · 틀린 ${items.length}개</h2>${m === 'jdlg' || m === 'edlg' ? '' : `<button class="btn primary" data-retoday="${m}" style="min-height:38px;padding:6px 14px">다시 풀기</button>`}</div>
      <ul class="miss">${items
        .slice(0, 12)
        .map(q => {
          const [a, b] = itemLabel(m, q);
          return `<li><span class="${modLang(m) === 'ja' && !['jdlg', 'part'].includes(m) ? 'jp' : ''}" style="font-size:17px">${esc(a)}</span><span class="s">${esc(b)}</span></li>`;
        })
        .join('')}${items.length > 12 ? `<li><span class="s">외 ${items.length - 12}개</span></li>` : ''}</ul></section>`
      )
      .join('')}
  </div>`;
  vb.onclick = e => {
    const b = e.target.closest('[data-retoday]');
    if (!b) return;
    const m = b.dataset.retoday;
    PENDING[m] = groups[m];
    R[m] = null;
    S.filt[m] = 'all';
    startMod(m);
  };
}

// ---- core/update.js ----
'use strict';
/* ---------- update banner ---------- */
const APP_VERSION = '20261020105027';
// Versions are build timestamps (YYYYMMDDhhmmss), so a plain string compare tells which is newer.
// Only a NEWER server version shows the banner: a stale version.json left on the server must never nag forever.
function checkUpdate() {
  if (APP_VERSION.startsWith('__')) return;
  try {
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        const v = j && String(j.v || '');
        if (!/^\d{14}$/.test(v) || v <= APP_VERSION || document.getElementById('upd')) return;
        // already tried this exact version and the page did not change: the server is still half-updated, so stay quiet
        if (sessionStorage.getItem('hm-upd-tried') === v) return;
        document.body.insertAdjacentHTML(
          'beforeend',
          `<div class="upd" id="upd" role="status"><span>새 버전이 나왔어요</span><button type="button" class="btn primary" id="updBtn">업데이트</button></div>`
        );
        document.getElementById('updBtn').addEventListener('click', () => updateNow(v));
      })
      .catch(() => {});
  } catch (e) {}
}
// Fetch the new service worker first, then load the page with a fresh URL so no cache can hand back the old one.
function updateNow(v) {
  const b = document.getElementById('updBtn');
  if (b) {
    b.disabled = true;
    b.textContent = '받는 중…';
  }
  try {
    sessionStorage.setItem('hm-upd-tried', v);
  } catch (e) {}
  const go = () => location.replace(location.pathname + '?u=' + v);
  const reg = 'serviceWorker' in navigator ? navigator.serviceWorker.getRegistration() : Promise.resolve(null);
  let done = false;
  const finish = () => {
    if (!done) {
      done = true;
      go();
    }
  };
  setTimeout(finish, 4000);
  reg
    .then(r => (r ? r.update().catch(() => {}) : null))
    .then(() => setTimeout(finish, 600))
    .catch(finish);
}
// drop the ?u= marker from the address bar after an update
if (/[?&]u=\d+/.test(location.search)) {
  try {
    history.replaceState(null, '', location.pathname + location.hash);
  } catch (e) {}
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkUpdate();
});

// ---- quiz/counters.js ----
'use strict';

/* ---------- counters & dates ---------- */
const CNT_DEF = [
  {
    id: '本',
    base: 'ほん',
    desc: '가늘고 긴 것',
    r: ['なんぼん', 'いっぽん', 'にほん', 'さんぼん', 'よんほん', 'ごほん', 'ろっぽん', 'ななほん', 'はっぽん', 'きゅうほん', 'じゅっぽん'],
    nouns: [
      ['鉛筆', '연필', '자루'],
      ['傘', '우산', '개'],
      ['バナナ', '바나나', '개']
    ],
    sv: ['ほん', 'ぼん', 'ぽん']
  },
  {
    id: '枚',
    base: 'まい',
    desc: '얇고 평평한 것',
    r: ['なんまい', 'いちまい', 'にまい', 'さんまい', 'よんまい', 'ごまい', 'ろくまい', 'ななまい', 'はちまい', 'きゅうまい', 'じゅうまい'],
    nouns: [
      ['紙', '종이', '장'],
      ['シャツ', '셔츠', '장'],
      ['切手', '우표', '장']
    ],
    sv: ['まい']
  },
  {
    id: '匹',
    base: 'ひき',
    desc: '작은 동물',
    r: ['なんびき', 'いっぴき', 'にひき', 'さんびき', 'よんひき', 'ごひき', 'ろっぴき', 'ななひき', 'はっぴき', 'きゅうひき', 'じゅっぴき'],
    nouns: [
      ['猫', '고양이', '마리'],
      ['犬', '개', '마리'],
      ['魚', '물고기', '마리']
    ],
    sv: ['ひき', 'びき', 'ぴき']
  },
  {
    id: '個',
    base: 'こ',
    desc: '작은 물건',
    r: ['なんこ', 'いっこ', 'にこ', 'さんこ', 'よんこ', 'ごこ', 'ろっこ', 'ななこ', 'はっこ', 'きゅうこ', 'じゅっこ'],
    nouns: [
      ['卵', '달걀', '개'],
      ['りんご', '사과', '개'],
      ['消しゴム', '지우개', '개']
    ],
    sv: ['こ']
  },
  {
    id: '冊',
    base: 'さつ',
    desc: '책·공책',
    r: ['なんさつ', 'いっさつ', 'にさつ', 'さんさつ', 'よんさつ', 'ごさつ', 'ろくさつ', 'ななさつ', 'はっさつ', 'きゅうさつ', 'じゅっさつ'],
    nouns: [
      ['本', '책', '권'],
      ['ノート', '공책', '권'],
      ['雑誌', '잡지', '권']
    ],
    sv: ['さつ']
  },
  {
    id: '台',
    base: 'だい',
    desc: '기계·탈것',
    r: ['なんだい', 'いちだい', 'にだい', 'さんだい', 'よんだい', 'ごだい', 'ろくだい', 'ななだい', 'はちだい', 'きゅうだい', 'じゅうだい'],
    nouns: [
      ['車', '자동차', '대'],
      ['自転車', '자전거', '대'],
      ['パソコン', '컴퓨터', '대']
    ],
    sv: ['だい']
  },
  {
    id: '杯',
    base: 'はい',
    desc: '잔·그릇',
    r: ['なんばい', 'いっぱい', 'にはい', 'さんばい', 'よんはい', 'ごはい', 'ろっぱい', 'ななはい', 'はっぱい', 'きゅうはい', 'じゅっぱい'],
    nouns: [
      ['コーヒー', '커피', '잔'],
      ['ご飯', '밥', '공기'],
      ['水', '물', '잔']
    ],
    sv: ['はい', 'ばい', 'ぱい']
  },
  {
    id: '足',
    base: 'そく',
    desc: '신발·양말',
    r: ['なんぞく', 'いっそく', 'にそく', 'さんぞく', 'よんそく', 'ごそく', 'ろくそく', 'ななそく', 'はっそく', 'きゅうそく', 'じゅっそく'],
    nouns: [
      ['靴', '신발', '켤레'],
      ['靴下', '양말', '켤레']
    ],
    sv: ['そく', 'ぞく']
  },
  {
    id: '人',
    base: 'にん',
    desc: '사람',
    r: [
      'なんにん',
      'ひとり',
      'ふたり',
      'さんにん',
      'よにん',
      'ごにん',
      'ろくにん',
      'ななにん/しちにん',
      'はちにん',
      'きゅうにん',
      'じゅうにん'
    ],
    nouns: [['', '', '명']],
    sv: ['にん']
  },
  {
    id: '回',
    base: 'かい',
    desc: '횟수',
    r: ['なんかい', 'いっかい', 'にかい', 'さんかい', 'よんかい', 'ごかい', 'ろっかい', 'ななかい', 'はっかい', 'きゅうかい', 'じゅっかい'],
    nouns: [['', '', '번']],
    sv: ['かい']
  },
  {
    id: '階',
    base: 'かい',
    desc: '건물 층',
    r: [
      'なんがい/なんかい',
      'いっかい',
      'にかい',
      'さんがい/さんかい',
      'よんかい',
      'ごかい',
      'ろっかい',
      'ななかい',
      'はっかい/はちかい',
      'きゅうかい',
      'じゅっかい'
    ],
    nouns: [['', '', '층']],
    sv: ['かい', 'がい']
  },
  {
    id: '歳',
    base: 'さい',
    desc: '나이',
    r: ['なんさい', 'いっさい', 'にさい', 'さんさい', 'よんさい', 'ごさい', 'ろくさい', 'ななさい', 'はっさい', 'きゅうさい', 'じゅっさい'],
    nouns: [['', '', '살']],
    sv: ['さい']
  },
  {
    id: 'つ',
    base: 'つ',
    desc: '물건 (일반)',
    r: ['いくつ', 'ひとつ', 'ふたつ', 'みっつ', 'よっつ', 'いつつ', 'むっつ', 'ななつ', 'やっつ', 'ここのつ', 'とお'],
    nouns: [['', '', '개']],
    sv: []
  }
];
const CNT_BY = Object.fromEntries(CNT_DEF.map(d => [d.id, d]));
const KAN_NUM = ['何', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const CNT_STD = ['なん', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう', 'じゅう'];
const PFX = {
  0: ['なん'],
  1: ['いち', 'いっ'],
  2: ['に'],
  3: ['さん'],
  4: ['よん', 'よ', 'し'],
  5: ['ご'],
  6: ['ろく', 'ろっ'],
  7: ['なな'],
  8: ['はち', 'はっ'],
  9: ['きゅう', 'く'],
  10: ['じゅう', 'じゅっ']
};
const DATE_D = [
  [1, 'ついたち'],
  [2, 'ふつか'],
  [3, 'みっか'],
  [4, 'よっか'],
  [5, 'いつか'],
  [6, 'むいか'],
  [7, 'なのか'],
  [8, 'ようか'],
  [9, 'ここのか'],
  [10, 'とおか'],
  [14, 'じゅうよっか'],
  [20, 'はつか'],
  [24, 'にじゅうよっか']
];
const DATE_CONF = {
  1: [5],
  2: [20],
  3: [6],
  4: [8, 14],
  5: [1],
  6: [3],
  7: [8],
  8: [4],
  9: [10],
  10: [9],
  14: [4, 24],
  20: [2, 10],
  24: [14, 4]
};
const DATE_NAIVE = { 14: 'じゅうよんにち', 20: 'にじゅうにち', 24: 'にじゅうよんにち' };
const MONTH_R = [
  '',
  'いちがつ',
  'にがつ',
  'さんがつ',
  'しがつ',
  'ごがつ',
  'ろくがつ',
  'しちがつ',
  'はちがつ',
  'くがつ',
  'じゅうがつ',
  'じゅういちがつ',
  'じゅうにがつ'
];
const WEEK = [
  ['月', 'げつようび', '월요일'],
  ['火', 'かようび', '화요일'],
  ['水', 'すいようび', '수요일'],
  ['木', 'もくようび', '목요일'],
  ['金', 'きんようび', '금요일'],
  ['土', 'どようび', '토요일'],
  ['日', 'にちようび', '일요일']
];
const cDisp = (d, n) => (d.id === 'つ' ? (n === 10 ? '十' : KAN_NUM[n] + 'つ') : (n === 0 ? '何' : n) + d.id);
const CNT_ITEMS = [
  ...CNT_DEF.flatMap(d =>
    d.r
      .map((rd, n) => ({ kind: 'counter', id: d.id, def: d, n, disp: cDisp(d, n), ok: rd.split('/'), key: 'ct:' + d.id + '|' + n }))
      .filter(x => !(x.id === 'つ' && x.n === 0))
  ),
  ...DATE_D.map(([n, rd]) => ({ kind: 'date', id: '日', n, disp: n + '日', ok: [rd], ko: n + '일', key: 'ct:日|' + n })),
  ...MONTH_R.slice(1).map((rd, i) => ({
    kind: 'date',
    id: '月',
    n: i + 1,
    disp: i + 1 + '月',
    ok: [rd],
    ko: i + 1 + '월',
    key: 'ct:月|' + (i + 1)
  })),
  ...WEEK.map(([k, rd, ko]) => ({ kind: 'date', id: '曜', n: k, disp: k + '曜日', ok: [rd], ko, key: 'ct:曜|' + k }))
];
function cntKo(q) {
  if (q.kind === 'date') return q.ko;
  const [jw, ko, c] = q.noun;
  const num = q.n === 0 ? '몇 ' : q.n;
  return (ko ? ko + ' ' : '') + num + c;
}
const VOICE = { か: 'が', き: 'ぎ', こ: 'ご', さ: 'ざ', そ: 'ぞ', た: 'だ', だ: 'た', は: 'ばぱ', ひ: 'びぴ', ほ: 'ぼぽ' };
const voiceVar = b => [...(VOICE[b[0]] || '')].map(c => c + b.slice(1));
function cntReadWrongs(q) {
  const acc = new Set(q.ok);
  const out = [];
  const first = q.ok[0];
  const add = c => {
    if (!c || acc.has(c) || out.includes(c)) return;
    if (/^しち/.test(c)) return;
    if (q.n === 8 && first.startsWith('はっ') && c.startsWith('はち')) return;
    if (q.n === 6 && first.startsWith('ろっ') && c.startsWith('ろく')) return;
    if (/^じっ/.test(c)) return;
    out.push(c);
  };
  if (q.id === '日') {
    add(q.n <= 10 ? CNT_STD[q.n] + 'にち' : DATE_NAIVE[q.n]);
    for (const n of shuffle(DATE_CONF[q.n] || [])) add(DATE_D.find(x => x[0] === n)[1]);
    for (const x of shuffle(DATE_D)) add(x[1]);
  } else if (q.id === '月') {
    for (const p of shuffle(PFX[q.n] || [])) add(p + 'がつ');
    for (const r of shuffle(MONTH_R.slice(1))) add(r);
  } else {
    const d = q.def;
    if (d.id === '人' || d.id === 'つ') {
      add(CNT_STD[q.n] + d.base);
      if (q.n === 1) add(d.id === '人' ? 'ひとにん' : 'いちつ');
      if (q.n === 2) add(d.id === '人' ? 'ふたにん' : 'につ');
      const near = [q.n - 1, q.n + 1, q.n === 4 ? 8 : q.n === 8 ? 4 : q.n === 3 ? 6 : q.n === 6 ? 3 : -1].filter(n => n >= 1 && n <= 10);
      for (const n of shuffle(near)) add(d.r[n].split('/')[0]);
    } else {
      const c = [];
      const sv = [...new Set([...d.sv, ...voiceVar(d.base)])];
      for (const p of PFX[q.n] || []) for (const s of sv) c.push(p + s);
      shuffle(c).forEach(add);
    }
    for (const o of shuffle(CNT_DEF.filter(x => x !== d && x.id !== 'つ'))) add(o.r[q.n].split('/')[0]);
  }
  return out.slice(0, 3);
}
function showCnt(mod, q, card, zone, r) {
  if (!r.order) {
    if (q.dir === 'pick') {
      if (q.id === '曜') {
        const ws = shuffle(WEEK.filter(w => w[0] !== q.n)).slice(0, 3);
        r.order = shuffle([
          { t: q.disp, ok: true, cls: 'jp', lang: 'ja', sub: q.ok[0] },
          ...ws.map(w => ({ t: w[0] + '曜日', ok: false, cls: 'jp', lang: 'ja', sub: w[1] + ' · ' + w[2] }))
        ]);
      } else {
        const others = shuffle(CNT_DEF.filter(x => x !== q.def && x.id !== 'つ')).slice(0, 3);
        r.order = shuffle(
          [q.def, ...others].map(d => ({
            t: cDisp(d, q.n),
            ok: d === q.def,
            cls: 'jp',
            lang: 'ja',
            sub: d.r[q.n].split('/')[0] + ' · ' + d.desc
          }))
        );
      }
    } else
      r.order = shuffle([
        { t: q.ok[0], ok: true, cls: 'jp', lang: 'ja' },
        ...cntReadWrongs(q).map(t => ({ t, ok: false, cls: 'jp', lang: 'ja' }))
      ]);
  }
  const ko = cntKo(q);
  const tag = q.kind === 'date' ? '날짜·요일' : '조수사 · ' + q.def.desc;
  if (q.dir === 'pick')
    card.innerHTML = `<span class="cat">${tag}</span><p class="ko">${esc(ko)}</p><p class="cap">알맞은 일본어를 고르세요</p>${MARKS}`;
  else
    card.innerHTML = `<span class="cat">${tag}</span><div class="tz wide"><span class="word" lang="ja" style="font-size:${Math.min(64, wordSize(q.disp))}px">${esc(q.disp)}</span></div><p class="cap">${q.noun && q.noun[0] ? `<span class="jp" lang="ja">${esc(q.noun[0])}</span> · ` : ''}${esc(ko)} · 읽는 법을 고르세요</p>${MARKS}`;
  zone.dataset.type = 'cnt';
  zone.innerHTML = optsHTML(r);
}
function cntTable(q) {
  if (q.id === '日')
    return `<div class="cnt-tbl">${DATE_D.map(([n, rd]) => `<span class="${n === q.n ? 'cur' : ''}"><b>${n}日</b><span class="jp" lang="ja">${rd}</span></span>`).join('')}</div><p class="fb-sub">1~10일, 14·20·24일은 읽는 법이 특별해요. 나머지는 じゅういちにち처럼 숫자+にち예요.</p>`;
  if (q.id === '月') return `<p class="fb-sub">4월 しがつ, 7월 しちがつ, 9월 くがつ만 조심하면 나머지는 숫자+がつ예요.</p>`;
  if (q.id === '曜')
    return `<div class="cnt-tbl">${WEEK.map(w => `<span class="${w[0] === q.n ? 'cur' : ''}"><b>${w[2]}</b><span class="jp" lang="ja">${w[0]}曜日</span></span>`).join('')}</div>`;
  const d = q.def;
  return `<div class="cnt-tbl">${d.r.map((rd, n) => (n === 0 && d.id === 'つ' ? '' : `<span class="${n === q.n ? 'cur' : ''}"><b class="jp" lang="ja">${cDisp(d, n)}</b><span class="jp" lang="ja">${rd.split('/')[0]}</span></span>`)).join('')}</div>
    <p class="fb-sub"><b class="jp" style="color:var(--ink)">${d.id}</b> · ${esc(d.desc)}을 셀 때${d.nouns[0][0] ? ` (예: ${d.nouns.map(n => `<span class="jp" lang="ja">${n[0]}</span> ${n[1]}`).join(', ')})` : ''}</p>`;
}
INFO.cnt = q =>
  `<div class="fb-line"><span class="jp" lang="ja">${esc(q.disp)}</span><span class="jp" lang="ja" style="font-size:19px">${esc(q.ok.join(' / '))}</span><span class="mono">${romaji(q.ok[0])}</span>${spkBtn(q.ok[0])}</div>${cntTable(q)}`;
SPEAKQ.cnt = q => [q.ok[0], 'ja'];
AUTO.cnt = 1700;

// ---- quiz/polite.js ----
'use strict';
/* ---------- polite ↔ casual ---------- */
const POL = (typeof POL_RAW !== 'undefined' ? POL_RAW : []).map(o => ({ ...o, key: 'pl:' + o.p }));
const POL_TYPES = {
  'verb-present': '동사 현재',
  'verb-negative': '동사 부정',
  'verb-past': '동사 과거',
  'verb-past-negative': '과거 부정',
  'i-adj': 'い형용사',
  'na-adj-noun': 'な형용사·명사',
  question: '의문문',
  'te-iru': '〜ている',
  tai: '〜たい',
  invite: '권유',
  request: '부탁',
  'aru-iru': 'ある·いる',
  special: '특수'
};
function showPol(mod, q, card, zone, r) {
  const kj = S.set.kanji;
  const p2c = q.dir === 'p2c';
  const src = p2c ? { w: q.p, r: q.pr, k: q.kp } : { w: q.c, r: q.cr, k: q.kc };
  if (!r.order) {
    const tw = p2c ? [q.c, q.cr] : [q.p, q.pr];
    const wr = (p2c ? q.dc : q.dp) || [];
    r.order = shuffle([
      { t: kj ? tw[0] : tw[1], ok: true, cls: 'jp', lang: 'ja', sub: kj ? tw[1] : '', subCls: 'jp', subLang: 'ja' },
      ...wr
        .slice(0, 3)
        .map(x => ({ t: kj ? x[0] : x[1], ok: false, cls: 'jp', lang: 'ja', sub: kj ? x[1] : '', subCls: 'jp', subLang: 'ja' }))
    ]);
  }
  const open = r.revealed || r.answered;
  card.innerHTML = `<span class="cat">${p2c ? '존댓말 → 반말' : '반말 → 존댓말'}</span>${kj ? `<button type="button" class="qbtn" data-act="reveal" aria-expanded="${!!open}" aria-label="읽는 법 보기">?</button>` : ''}
    <p class="fb-big" lang="ja" style="text-align:center;margin-top:26px">${esc(kj ? src.w : src.r)}</p><p class="cap rd" id="rd" lang="ja" style="font-family:var(--f-jp);font-size:15px" ${open && kj ? '' : 'hidden'}>${esc(src.r)}</p><p class="cap">${esc(src.k)}</p>
    <span class="target">${p2c ? '친구에게 반말로 하면?' : '윗사람에게 존댓말로 하면?'}</span>${MARKS}`;
  zone.dataset.type = 'pol';
  zone.innerHTML = optsHTML(r);
}
INFO.pol = q => {
  const p2c = q.dir === 'p2c';
  const t = p2c ? { w: q.c, r: q.cr, k: q.kc } : { w: q.p, r: q.pr, k: q.kp };
  return `<p class="fb-big" lang="ja">${esc(t.w)}</p><p class="fb-sub" lang="ja" style="font-family:var(--f-jp);font-size:16px">${esc(t.r)}</p><p class="fb-sub mono">${esc(romaji(t.r))}</p><p class="fb-sub">${esc(t.k)}</p><div>${spkBtn(t.w, '문장 듣기')}</div>
  <div class="ex"><p style="margin:0"><b>${esc(q.n || '')}</b></p><div class="form-tbl"><span>존댓말</span><span class="jp" lang="ja">${esc(q.p)}</span><span>반말</span><span class="jp" lang="ja">${esc(q.c)}</span></div></div>`;
};
SPEAKQ.pol = q => [q.dir === 'p2c' ? q.c : q.p, 'ja'];
AUTO.pol = 0;

// ---- quiz/jp-pairs.js ----
'use strict';
/* ---------- japanese minimal pairs ---------- */
const JMP = (typeof MPJ_RAW !== 'undefined' ? MPJ_RAW : []).map(([w1, r1, k1, w2, r2, k2, lb]) => ({
  w1,
  r1,
  k1,
  w2,
  r2,
  k2,
  lb,
  key: 'jm:' + r1 + '|' + r2
}));
const JM_LABELS = [...new Set(JMP.map(x => x.lb))];
const JM_TIP = {
  장음: '모음을 한 박자 더 길게 끌어요. 일본어는 소리 길이가 다르면 다른 단어가 돼요.',
  촉음: 'っ 자리에서 한 박자 멈췄다가 다음 소리를 내요. 멈춤도 한 박자예요.',
  탁음: '첫소리의 k/g, t/d 차이예요. 한국어 귀에는 둘 다 ㄱ·ㄷ처럼 들리기 쉬워요. が는 목이 울리고, か는 숨이 살짝 나가요.',
  요음: '작은 ゃゅょ는 앞 글자와 합쳐 한 박자, 큰 やゆよ는 따로 한 박자예요.',
  '발음 ん': 'ん도 한 박자예요. 짧게 삼키지 말고 한 박자를 채워요.',
  'ざ·じ (z 소리)': "한국어에는 z 소리가 없어서 ざ·ず·ぜ·ぞ를 じゃ·じゅ처럼 내기 쉬워요. 혀끝을 윗니 뒤에 대고 '즈'를 울리듯 내 보세요.",
  'つ 소리': "つ는 '쯔'에 가까워요. す(스)나 ちゅ(츄)와 헷갈리지 않게, 혀끝을 윗니 뒤에 붙였다 떼며 내요."
};
function showJM(mod, q, card, zone, r) {
  const fresh = !r.order;
  if (fresh)
    r.order = [1, 2].map(i => ({
      t: q['r' + i],
      ok: q.tg === i,
      cls: 'jp',
      lang: 'ja',
      sub: (q['w' + i] !== q['r' + i] ? q['w' + i] + ' · ' : '') + q['k' + i]
    }));
  card.innerHTML = `<span class="cat">소리 구별 · ${esc(q.lb)}</span>${playBox()}<p class="cap">들린 단어를 고르세요</p>${MARKS}`;
  zone.dataset.type = 'jlen';
  zone.innerHTML = optsHTML(r).replace('<div class="opts">', '<div class="opts grid2">');
  if (fresh && !r.answered) speak(q['r' + q.tg], 'ja');
}
INFO.jlen = q =>
  `<p class="fb-sub">들린 단어: <b class="jp" lang="ja" style="font-size:20px;color:var(--ink)">${esc(q['w' + q.tg])}</b> <span class="jp" lang="ja">${esc(q['r' + q.tg])}</span> · ${esc(q['k' + q.tg])}</p><div class="row">${spkBtn(q.r1, q.r1 + ' 듣기')}${spkBtn(q.r2, q.r2 + ' 듣기')}</div><p class="fb-sub">${esc(JM_TIP[q.lb] || '두 단어를 번갈아 들으며 차이를 비교해 보세요.')}</p>`;
AUTO.jlen = 0;
if (!S.jlen || !Array.isArray(S.jlen.lb) || !S.jlen.lb.some(l => JM_LABELS.includes(l))) S.jlen = { lb: [...JM_LABELS] };
else S.jlen.lb = S.jlen.lb.filter(l => JM_LABELS.includes(l));
// labels added in later versions start switched on for people who already had a saved selection
{
  const known = S.jlen.known || ['장음', '촉음', '탁음', '요음', '발음 ん'];
  for (const l of JM_LABELS) if (!known.includes(l) && !S.jlen.lb.includes(l)) S.jlen.lb.push(l);
  S.jlen.known = [...JM_LABELS];
}

// ---- quiz/english-grammar.js ----
'use strict';
/* ================= English grammar: prepositions, tenses, phrasal verbs (fill the blank) ================= */

const EG = {
  eprep: {
    raw: typeof EN_PREP_RAW !== 'undefined' ? EN_PREP_RAW : [],
    key: 'ep:',
    label: '전치사',
    ask: '빈칸에 알맞은 전치사를 고르세요',
    note: 'in/on/at, for/during/since처럼 한국 사람이 자주 헷갈리는 전치사를 문장 속에서 골라요.'
  },
  etense: {
    raw: typeof EN_TENSE_RAW !== 'undefined' ? EN_TENSE_RAW : [],
    key: 'et:',
    label: '시제',
    ask: '빈칸에 알맞은 형태를 고르세요',
    note: 'yesterday, already, every day 같은 시간 표현을 보고 알맞은 시제와 동사 형태를 골라요.'
  },
  ephr: {
    raw: typeof EN_PHR_RAW !== 'undefined' ? EN_PHR_RAW : [],
    key: 'eph:',
    label: '구동사',
    ask: '빈칸에 알맞은 구동사를 고르세요',
    note: 'pick up, find out, get along with처럼 회화에서 자주 쓰는 구동사를 골라요.'
  }
};
for (const [mod, g] of Object.entries(EG)) {
  g.items = g.raw.map(o => ({ ...o, key: g.key + o.s }));
  const topics = [...new Set(g.items.map(x => x.t))];
  POOLS[mod] = full => (full || !S.eg[mod] || !S.eg[mod].length ? g.items : g.items.filter(x => S.eg[mod].includes(x.t)));
  SHOWS[mod] = showEG;
  SETUPS[mod] = () => {
    const sel = S.eg[mod] || [];
    const all = !sel.length;
    return [
      `${g.label} ${g.items.length}문제 · ${all ? '전체' : sel.join('·')}`,
      `<div class="setup-row"><label>주제</label><div class="chips"><button class="chip" data-egt="${mod}:" aria-pressed="${all}">전체</button>${topics.map(t => `<button class="chip" data-egt="${mod}:${esc(t)}" aria-pressed="${!all && sel.includes(t)}">${esc(t)} ${g.items.filter(x => x.t === t).length}</button>`).join('')}</div></div><p class="note">${g.note}</p>`
    ];
  };
  LABELS[mod] = q => [q.s.replace('___', q.a), q.a];
  INFO[mod] = q => {
    const full = q.s.replace('___', q.a);
    return `<p class="fb-big en" lang="en">${esc(q.s).replace('___', `<mark>${esc(q.a)}</mark>`)}</p><p class="fb-sub">${esc(q.k)}</p>
      <p class="fb-sub"><b style="color:var(--ink)">${esc(q.m || q.n || '')}</b></p>${q.m && q.n ? `<p class="fb-sub">${esc(q.n)}</p>` : ''}<div>${spkBtn(full, '문장 듣기', 'en')}</div>`;
  };
  SPEAKQ[mod] = q => [q.s.replace('___', q.a), 'en'];
  AUTO[mod] = 1900;
  CHECK[mod] = (v, s) => genericChoice(mod, -1, s);
}
if (!S.eg || typeof S.eg !== 'object') S.eg = {};

function showEG(mod, q, card, zone, r) {
  const g = EG[mod];
  if (!r.order)
    r.order = shuffle([{ t: q.a, ok: true, cls: 'en', lang: 'en' }, ...q.o.map(t => ({ t, ok: false, cls: 'en', lang: 'en' }))]);
  const sent = esc(q.s).replace('___', `<span class="blank">${r.answered ? esc(q.a) : '？'}</span>`);
  card.innerHTML = `<span class="cat">${g.label} · ${esc(q.t || '')}</span><p class="psent en" lang="en" style="font-family:var(--f-en)">${sent}</p><p class="cap">${esc(q.k)}</p><p class="cap">${g.ask}</p>${MARKS}`;
  zone.dataset.type = 'eg';
  zone.innerHTML = optsHTML(r);
}

// topic chips (setup panel) — handled here so the engine stays generic
document.addEventListener('click', e => {
  const b = e.target.closest('[data-egt]');
  if (!b) return;
  const [mod, t] = b.dataset.egt.split(':');
  let sel = S.eg[mod] || [];
  if (!t) sel = [];
  else if (sel.includes(t)) sel = sel.filter(x => x !== t);
  else sel = [...sel, t];
  S.eg[mod] = sel;
  save();
  R[mod] = null;
  renderModule(mod);
});

// ---- quiz/made-english.js ----
'use strict';
/* ================= "made-in-Korea/Japan English": Konglish (English) and 和製英語 (Japanese) ================= */

const ME = {
  kong: {
    items: (typeof KONGLISH_RAW !== 'undefined' ? KONGLISH_RAW : []).map(o => ({ ...o, key: 'kg:' + o.ko })),
    label: '콩글리시',
    note: '핸드폰, 아이쇼핑처럼 한국에서 만든 영어를 원어민이 실제로 쓰는 말로 바꿔요.'
  },
  wasei: {
    items: (typeof WASEI_RAW !== 'undefined' ? WASEI_RAW : []).map(o => ({ ...o, key: 'wa:' + o.k })),
    label: '일본식 영어',
    note: 'サラリーマン, コンセント처럼 일본에서 만든 영어(和製英語)가 영어권에서는 뭐라고 하는지 맞혀요.'
  }
};
for (const [mod, g] of Object.entries(ME)) {
  POOLS[mod] = () => g.items;
  SETUPS[mod] = () => [`${g.label} ${g.items.length}문제`, `<p class="note">${g.note}</p>`];
  LABELS[mod] = q => (mod === 'kong' ? [q.ko, q.a] : [q.k, q.a]);
  SHOWS[mod] = showME;
  INFO[mod] = q => {
    const alt = (q.alt || []).length ? ` <span class="fb-sub">(${esc(q.alt.join(', '))}도 OK)</span>` : '';
    const head =
      mod === 'kong'
        ? `<p class="fb-sub">${esc(q.ko)}${q.kong ? ` <s>${esc(q.kong)}</s>` : ''} →</p>`
        : `<p class="fb-sub"><span class="jp" lang="ja" style="font-size:18px;color:var(--ink)">${esc(q.k)}</span> · ${esc(q.ko || '')} →</p>`;
    return `${head}<p class="fb-big en" lang="en">${esc(q.a)}${alt}</p><p class="fb-sub">${esc(q.n || '')}</p><div class="row">${spkBtn(q.a, '영어 듣기', 'en')}${mod === 'wasei' ? spkBtn(q.k, '일본어 듣기', 'ja') : ''}</div>`;
  };
  SPEAKQ[mod] = q => [q.a, 'en'];
  AUTO[mod] = 2200;
  CHECK[mod] = (v, s) => genericChoice(mod, -1, s);
}
function showME(mod, q, card, zone, r) {
  if (!r.order)
    r.order = shuffle([{ t: q.a, ok: true, cls: 'en', lang: 'en' }, ...q.o.map(t => ({ t, ok: false, cls: 'en', lang: 'en' }))]);
  card.innerHTML =
    mod === 'kong'
      ? `<span class="cat">콩글리시</span><div class="tz wide"><span class="word" style="font-size:${Math.min(56, wordSize(q.ko))}px">${esc(q.ko)}</span></div><p class="cap">원어민은 뭐라고 할까요?</p>${MARKS}`
      : `<span class="cat">일본식 영어</span><div class="tz wide"><span class="word" lang="ja" style="font-size:${Math.min(56, wordSize(q.k))}px">${esc(q.k)}</span></div><p class="cap">${r.answered ? esc(q.ko || '') + ' · ' : ''}영어권에서는 뭐라고 할까요?</p>${MARKS}`;
  zone.dataset.type = 'me';
  zone.innerHTML = optsHTML(r);
}

// ---- quiz/hanja.js ----
'use strict';
/* ================= 한국 한자음 → 일본 음독: guess the Japanese reading from the Korean one =================
   Data: KANJIDIC2 (© EDRDG, CC BY-SA 4.0) Korean + on'yomi readings, built by tools/build_data.py */

const HJ_DATA = typeof HJ_KANJI !== 'undefined' ? HJ_KANJI : [];
const HJ_WORD_LIST = typeof HJ_WORDS !== 'undefined' ? HJ_WORDS : [];
const HJ_DIFF_LIST = typeof HJ_DIFF !== 'undefined' ? HJ_DIFF : [];
if (!S.hj || typeof S.hj !== 'object') S.hj = { lv: '1', wlv: '1' };

// ---- Hangul + kana helpers ----
const hjDec = h => {
  const c = h.charCodeAt(0) - 0xac00;
  return c < 0 || c > 11171 ? null : [Math.floor(c / 588), Math.floor((c % 588) / 28), c % 28];
};
const HJ_CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const HJ_JONG = [
  '',
  'ㄱ',
  'ㄲ',
  'ㄳ',
  'ㄴ',
  'ㄵ',
  'ㄶ',
  'ㄷ',
  'ㄹ',
  'ㄺ',
  'ㄻ',
  'ㄼ',
  'ㄽ',
  'ㄾ',
  'ㄿ',
  'ㅀ',
  'ㅁ',
  'ㅂ',
  'ㅄ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ'
];
// ending class of an on'yomi: k (く/き) · t (つ/ち) · n (ん) · long (う/い) · none
function hjEnd(o) {
  const z = o[o.length - 1];
  if (z === 'ん') return 'n';
  if (z === 'く' || z === 'き') return 'k';
  if (z === 'つ' || z === 'ち') return 't';
  if (o.length > 1 && (z === 'う' || z === 'い') && !/^[あい]$/.test(o)) return 'long';
  return 'none';
}
// what the Korean final consonant predicts
const HJ_RULES = [
  { id: 'k', jong: [1], from: '받침 ㄱ', to: 'く · き', ends: ['k'], ex: ['学', '国', '駅'] },
  { id: 'n', jong: [4, 16], from: '받침 ㄴ · ㅁ', to: 'ん', ends: ['n'], ex: ['安', '三', '新'] },
  { id: 't', jong: [8], from: '받침 ㄹ', to: 'つ · ち', ends: ['t'], ex: ['一', '発', '月'] },
  { id: 'ng', jong: [21], from: '받침 ㅇ', to: '길게 (う · い)', ends: ['long'], ex: ['東', '生', '京'] },
  { id: 'p', jong: [17], from: '받침 ㅂ', to: '길게 (う), 가끔 つ', ends: ['long', 't'], ex: ['合', '入', '雑'] },
  { id: '0', jong: [0], from: '받침 없음', to: '짧게, 또는 길게', ends: ['none', 'long'], ex: ['火', '家', '時'] }
];
const hjRuleOf = h => {
  const d = hjDec(h);
  return d ? HJ_RULES.find(r => r.jong.includes(d[2])) || null : null;
};
const HJ_ROWS = [
  ['あいうえお', 'あ'],
  ['かきくけこ', 'か'],
  ['がぎぐげご', 'が'],
  ['さしすせそ', 'さ'],
  ['ざじずぜぞ', 'ざ'],
  ['たちつてと', 'た'],
  ['だぢづでど', 'だ'],
  ['なにぬねの', 'な'],
  ['はひふへほ', 'は'],
  ['ばびぶべぼ', 'ば'],
  ['まみむめも', 'ま'],
  ['やゆよ', 'や'],
  ['らりるれろ', 'ら'],
  ['わ', 'わ']
];
const hjRow = o => (HJ_ROWS.find(([s]) => s.includes(o[0])) || ['', o[0]])[1];
// first consonant → which kana row (for the rules page)
const HJ_CHO_RULES = [
  { c: ['ㄱ', 'ㅋ'], to: 'か · が', ex: ['国', '金'] },
  { c: ['ㅎ'], to: 'か · が', ex: ['学', '韓', '花'], star: true },
  { c: ['ㅂ', 'ㅍ'], to: 'は · ば', ex: ['方', '便'] },
  { c: ['ㅁ'], to: 'ま · ば', ex: ['毎', '文'] },
  { c: ['ㄷ', 'ㅌ'], to: 'た · だ', ex: ['東', '大'] },
  { c: ['ㄹ'], to: 'ら', ex: ['料', '旅'] },
  { c: ['ㅅ', 'ㅈ', 'ㅊ'], to: 'さ · ざ (ㅈ·ㅊ은 가끔 た)', ex: ['山', '自', '茶'] },
  { c: ['ㅇ'], to: 'あ · や · が', ex: ['安', '有', '外'] },
  { c: ['ㄴ'], to: 'な · だ', ex: ['内', '男'] }
];

// ---- kanji items ----
const HJ_ITEMS = HJ_DATA.map(([k, hun, on, g, f]) => {
  const parts = hun.split(' ');
  const h = parts.length > 1 ? parts[parts.length - 1] : hun.split('/')[0];
  return { k, hun: parts.length > 1 ? hun : '', h, hs: parts.length > 1 ? [h] : hun.split('/'), on, o: on[0], g, f, key: 'hj:' + k };
});
const HJ_BY_K = new Map(HJ_ITEMS.map(x => [x.k, x]));
const HJ_LV = { 1: [2, '기초 (초1~2 한자)'], 2: [4, '중급 (초1~4)'], 3: [6, '교육한자 전체'] };

// Wrong options that break the 받침 rule: same start, different ending (がく → がん / がつ / がう)
function hjWrongEnds(o, real) {
  const end = hjEnd(o);
  const stem = end === 'none' ? o : o.slice(0, -1);
  if (!stem) return [];
  const last = stem[stem.length - 1];
  const eRow = 'えけげせぜてでねへべぺめれ'.includes(last),
    aRow = 'あかがさざただなはばぱまやら'.includes(last);
  const small = /[ゃゅょ]$/.test(stem);
  // after きょ/ちゅ… only endings that really occur (しゅつ, じゅん are fine; ちゅつ, きょん are not)
  const tails = small ? ['く', 'う', ...(/^[しじ]ゅ$/.test(stem) ? ['つ', 'ん'] : [])] : ['く', 'つ', 'ん', eRow ? 'い' : 'う'];
  if (aRow) tails.push('い');
  if (!/[ゃゅょ]$/.test(stem) && stem.length > 0) tails.push('');
  const out = new Set();
  for (const t of tails) {
    const v = stem + t;
    if (v && v !== o && !real.includes(v) && hjEnd(v) !== end) out.add(v);
  }
  return [...out];
}
const hjVoice = o => {
  const A = 'かきくけこさしすせそたちつてとはひふへほ',
    B = 'がぎぐげござじずぜぞだじずでどばびぶべぼ';
  const i = A.indexOf(o[0]),
    j = B.indexOf(o[0]);
  return i >= 0 ? B[i] + o.slice(1) : j >= 0 ? A[j] + o.slice(1) : null;
};
function hjKanjiOpts(q) {
  let wrong = shuffle(hjWrongEnds(q.o, q.on));
  const v = hjVoice(q.o);
  if (v && !q.on.includes(v)) wrong.splice(1, 0, v);
  if (wrong.length < 3) {
    const same = shuffle(HJ_ITEMS.filter(x => x.k !== q.k && hjRow(x.o) === hjRow(q.o)).map(x => x.o));
    wrong = wrong.concat(same);
  }
  return [...new Set(wrong.filter(x => !q.on.includes(x)))].slice(0, 3);
}

// ---- word items ----
const HJW_ITEMS = HJ_WORD_LIST.map(w => ({ ...w, key: 'hw:' + w.k }));
function hjWordOpts(q) {
  const out = new Set();
  const plain = q.s.map(x => x[2]).join('');
  if (plain !== q.r) out.add(plain); // forgot the sound change (がくこう)
  for (const step of shuffle(q.s.map((_, i) => i))) {
    const x = q.s[step];
    const real = (HJ_BY_K.get(x[0]) || { on: [x[2]] }).on;
    for (const alt of shuffle(hjWrongEnds(x[2], real))) {
      const r = q.s.map((y, i) => (i === step ? alt : y[3])).join('');
      if (r !== q.r) out.add(r);
    }
  }
  const arr = shuffle([...out]);
  // keep the "forgot the change" option when there is one, it is the most useful mistake
  if (plain !== q.r) arr.sort((a, b) => (b === plain) - (a === plain));
  return arr.slice(0, 3);
}

// ---- registry ----
POOLS.hj = full => (full ? HJ_ITEMS : HJ_ITEMS.filter(x => x.g <= (HJ_LV[S.hj.lv] || HJ_LV[1])[0]));
POOLS.hjw = full => (full ? HJW_ITEMS : HJW_ITEMS.filter(x => x.lv <= +(S.hj.wlv || 1)));
PREP.hj = q => ({ ...q, opts: hjKanjiOpts(q) });
PREP.hjw = q => ({ ...q, opts: hjWordOpts(q) });
SETUPS.hj = () => [
  `${HJ_LV[S.hj.lv][1]} · ${POOLS.hj().length}자`,
  `<div class="setup-row"><label>범위</label>${seg(
    'hj.lv',
    Object.entries(HJ_LV).map(([v, [, l]]) => [v, l.split(' ')[0]]),
    S.hj.lv
  )}</div>
   <p class="note">한국 한자음을 보고 일본어 음독을 골라요. 받침 규칙만 알아도 절반은 맞힐 수 있어요. <button type="button" class="link" data-gorule>규칙 먼저 보기</button></p>`
];
SETUPS.hjw = () => [
  `한자어 ${POOLS.hjw().length}개 · ${['', '기초', '기초+중급', '전체'][S.hj.wlv || 1]}`,
  `<div class="setup-row"><label>범위</label>${seg(
    'hj.wlv',
    [
      ['1', '기초'],
      ['2', '+중급'],
      ['3', '전체']
    ],
    S.hj.wlv || '1'
  )}</div>
   <p class="note">학교 → がっこう처럼 한국어와 한자가 같은 단어예요. 한자 하나하나의 음을 이어 붙이고, 소리가 바뀌는 곳(촉음·탁음)만 조심하면 돼요. <button type="button" class="link" data-gorule>규칙 보기</button></p>`
];
LABELS.hj = q => [q.k + ' ' + q.h, q.o];
LABELS.hjw = q => [q.k + ' ' + q.ko, q.r];
SPEAKQ.hj = q => [q.o, 'ja'];
SPEAKQ.hjw = q => [q.r, 'ja'];
AUTO.hj = 1900;
AUTO.hjw = 2100;
CHECK.hj = (v, s) => genericChoice('hj', -1, s);
CHECK.hjw = (v, s) => genericChoice('hjw', -1, s);

function hjRuleNote(h, o) {
  const r = hjRuleOf(h);
  if (!r) return '';
  const ok = r.ends.includes(hjEnd(o));
  return `<span class="hj-rule ${ok ? 'ok' : 'ex'}">${r.from} → ${r.to} ${ok ? '규칙대로' : '예외'}</span>`;
}
const hjWordsWith = k => HJW_ITEMS.filter(w => w.k.includes(k)).slice(0, 3);

SHOWS.hj = (mod, q, card, zone, r) => {
  if (!r.order)
    r.order = shuffle([{ t: q.o, ok: true, cls: 'jp', lang: 'ja' }, ...q.opts.map(t => ({ t, ok: false, cls: 'jp', lang: 'ja' }))]);
  card.innerHTML = `<span class="cat">한국음 → 음독</span><div class="tz"><span class="word" lang="ja" style="font-size:72px">${esc(q.k)}</span></div>
    <p class="hj-hun">${q.hun ? esc(q.hun) : `한국음 <b>${esc(q.h)}</b>`}</p><p class="cap">일본어 음독은?</p>${MARKS}`;
  zone.dataset.type = 'hj';
  zone.innerHTML = optsHTML(r);
};
INFO.hj = q => {
  const ws = hjWordsWith(q.k);
  return `<p class="fb-big"><span class="jp" lang="ja">${esc(q.k)}</span> <span class="hj-arrow">${esc(q.h)} → </span><span class="jp" lang="ja">${esc(q.o)}</span></p>
    <p class="fb-sub">${hjRuleNote(q.h, q.o)}${q.on.length > 1 ? ` 다른 음독: <span class="jp" lang="ja">${esc(q.on.slice(1).join('・'))}</span>` : ''}</p>
    ${ws.length ? `<p class="fb-sub">${ws.map(w => `<span class="jp" lang="ja">${esc(w.k)}</span> ${esc(w.r)} (${esc(w.ko)})`).join(' · ')}</p>` : ''}
    <div>${spkBtn(q.o, '듣기')}</div>`;
};

SHOWS.hjw = (mod, q, card, zone, r) => {
  if (!r.order)
    r.order = shuffle([{ t: q.r, ok: true, cls: 'jp', lang: 'ja' }, ...q.opts.map(t => ({ t, ok: false, cls: 'jp', lang: 'ja' }))]);
  card.innerHTML = `<span class="cat">한자어 · 같은 한자, 비슷한 소리</span><div class="tz wide"><span class="word" style="font-size:${Math.min(60, wordSize(q.ko))}px">${esc(q.ko)}</span></div>
    <p class="hj-kan jp" lang="ja">${esc(q.k)}</p><p class="cap">일본어로 어떻게 읽을까요?</p>${MARKS}`;
  zone.dataset.type = 'hjw';
  zone.innerHTML = optsHTML(r);
};
INFO.hjw = q => {
  const rows = q.s
    .map(
      ([k, h, o, v, t]) =>
        `<tr><td class="jp" lang="ja">${esc(k)}</td><td>${esc(h)}</td><td class="jp" lang="ja">${esc(o)}${v !== o ? ` → <b>${esc(v)}</b>` : ''}</td><td>${t ? `<span class="hj-chg">${t}</span>` : hjRuleNote(h, o)}</td></tr>`
    )
    .join('');
  return `<p class="fb-big"><span class="jp" lang="ja">${esc(q.k)}</span> <span class="jp" lang="ja">${esc(q.r)}</span></p>
    <table class="hj-split">${rows}</table><div class="row">${spkBtn(q.r, '듣기')}<button type="button" class="link" data-share-hj="${esc(q.k)}">친구에게 카드로 보내기</button></div>`;
};

document.addEventListener('click', e => {
  if (e.target.closest('[data-gorule]')) startMod('hjr');
});

// ---- quiz/ko-traps.js ----
'use strict';
/* ================= 한국인이라서 틀리는 것: particle traps (kpart) and the Korean-expression dictionary (koexp) ================= */

// ---- 조사 함정: 친구를 만나다 → 友達に会う ----
const KP_ITEMS = (typeof KP_RAW !== 'undefined' ? KP_RAW : []).map(o => ({ ...o, key: 'kp:' + o.s }));
const KP_PATTERNS = [...new Set(KP_ITEMS.map(x => x.g))];
if (!Array.isArray(S.kp)) S.kp = [];

POOLS.kpart = full => (full || !S.kp.length ? KP_ITEMS : KP_ITEMS.filter(x => S.kp.includes(x.g)));
SETUPS.kpart = () => {
  const all = !S.kp.length;
  return [
    `조사 함정 ${POOLS.kpart().length}문제 · ${all ? '전체' : S.kp.join('·')}`,
    `<div class="setup-row"><label>패턴</label><div class="chips"><button class="chip" data-kpg="" aria-pressed="${all}">전체</button>${KP_PATTERNS.map(
      g => `<button class="chip jp" lang="ja" data-kpg="${esc(g)}" aria-pressed="${!all && S.kp.includes(g)}">${esc(g)}</button>`
    ).join('')}</div></div>
    <p class="note">한국어 조사를 그대로 옮기면 틀리는 곳만 모았어요. '친구를 만나다'는 友達<b>に</b>会う, '전철을 타다'는 電車<b>に</b>乗る.</p>`
  ];
};
LABELS.kpart = q => [q.s.replace('___', q.a), q.ko];
SPEAKQ.kpart = q => [q.r.replace(/\s/g, ''), 'ja'];
AUTO.kpart = 0;
CHECK.kpart = (v, s) => genericChoice('kpart', -1, s);
SHOWS.kpart = (mod, q, card, zone, r) => {
  if (!r.order)
    r.order = shuffle(
      [q.a, ...q.o].map(p => ({ t: p, ok: p === q.a, cls: 'jp', lang: 'ja', sub: p === q.lit ? '한국어 그대로 옮기면' : '' }))
    );
  const sent = esc(q.s).replace('___', `<span class="blank">${r.answered ? esc(q.a) : '？'}</span>`);
  card.innerHTML = `<span class="cat">조사 함정 · <span class="jp">${esc(q.g)}</span></span><p class="ko" style="font-size:18px;margin-top:20px">${esc(q.ko)}</p>
    <p class="psent" lang="ja">${sent}</p><p class="cap">빈칸에 들어갈 조사는?</p>${MARKS}`;
  zone.dataset.type = 'kpart';
  zone.innerHTML = optsHTML(r);
};
INFO.kpart = q =>
  `<p class="fb-big" lang="ja">${esc(q.s).replace('___', `<mark>${esc(q.a)}</mark>`)}</p><p class="fb-sub jp" lang="ja" style="font-size:16px">${esc(q.r)}</p>
   <p class="fb-sub"><span class="kp-trap">한국어 직역 <b class="jp">${esc(q.lit)}</b> ✕</span> <span class="kp-ok">일본어 <b class="jp">${esc(q.a)}</b></span></p>
   <p class="fb-sub" style="color:var(--ink)">${esc(q.n)}</p><div>${spkBtn(q.r.replace(/\s/g, ''), '문장 듣기')}</div>`;
document.addEventListener('click', e => {
  const b = e.target.closest('[data-kpg]');
  if (!b) return;
  const g = b.dataset.kpg;
  if (!g) S.kp = [];
  else S.kp = S.kp.includes(g) ? S.kp.filter(x => x !== g) : [...S.kp, g];
  save();
  R.kpart = null;
  renderModule('kpart');
});

// ---- 번역 안 되는 한국어 표현 사전 ----
const KX = typeof KOEXP_RAW !== 'undefined' ? KOEXP_RAW : [];
const KX_V = { 있음: ['ok', '비슷한 말 있음'], 상황따라: ['mid', '상황 따라 달라요'], 없음: ['no', '일본에선 잘 안 해요'] };
let KX_CAT = '전체',
  KX_Q = '';

function renderKoExp(mod) {
  const cats = ['전체', ...new Set(KX.map(x => x.c))];
  view.innerHTML = `<section class="mod">${modeSeg(mod)}<div class="chart kx">
    <p class="note">'수고하세요', '화이팅'처럼 일본어로 딱 옮겨지지 않는 한국어 표현이에요. 일본에서는 그럴 때 뭐라고 하는지 정리했어요.</p>
    <input type="search" id="kxQ" class="wl-search" placeholder="한국어 표현 찾기 (예: 수고)" value="${esc(KX_Q)}" lang="ko" autocomplete="off" aria-label="표현 찾기">
    <div class="chips">${cats.map(c => `<button class="chip" data-kxc="${esc(c)}" aria-pressed="${KX_CAT === c}">${esc(c)}</button>`).join('')}</div>
    <div id="kxList" class="kx-list"></div></div></section>`;
  bindModes();
  const q = document.getElementById('kxQ');
  q.addEventListener('input', () => {
    KX_Q = q.value.trim();
    kxList();
  });
  kxList();
  view.onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.closest('.modes') || b.dataset.speak) return;
    if (b.dataset.kxc) {
      KX_CAT = b.dataset.kxc;
      view.querySelectorAll('[data-kxc]').forEach(x => x.setAttribute('aria-pressed', x === b));
      kxList();
    } else if (b.dataset.kxshare !== undefined) kxShare(KX[+b.dataset.kxshare]);
  };
}
function kxCard(x) {
  const i = KX.indexOf(x),
    [cls, vl] = KX_V[x.v] || ['mid', x.v];
  return `<article class="kx-card">
    <div class="kx-top"><b class="kx-ko">${esc(x.ko)}</b><span class="kx-v ${cls}">${vl}</span></div>
    <p class="kx-sum">${esc(x.sum)}</p>
    ${(x.ja || []).map(([j, r, w]) => `<div class="kx-ja"><div><b class="jp" lang="ja">${esc(j)}</b>${r && r !== j ? ` <span class="jp kx-r" lang="ja">${esc(r)}</span>` : ''}</div><span class="kx-when">${esc(w)}</span>${spkBtn(r || j, '')}</div>`).join('')}
    ${x.no ? `<p class="kx-no">${esc(x.no)}</p>` : ''}
    ${x.ex && x.ex[0] ? `<div class="kx-ex"><p class="jp" lang="ja">${esc(x.ex[0])}</p><p class="kx-exk">${esc(x.ex[2])}</p>${spkBtn(x.ex[1].replace(/\s/g, ''), '예문 듣기')}</div>` : ''}
    <button class="link kx-share" data-kxshare="${i}">친구에게 보내기</button>
  </article>`;
}
function kxList() {
  const box = document.getElementById('kxList');
  if (!box) return;
  const q = KX_Q.replace(/\s/g, '');
  const xs = KX.filter(
    x => (KX_CAT === '전체' || x.c === KX_CAT) && (!q || x.ko.replace(/\s/g, '').includes(q) || (x.ja || []).some(j => j[0].includes(q)))
  );
  box.innerHTML = xs.length ? xs.map(kxCard).join('') : '<p class="note">찾는 표현이 없어요.</p>';
}
function kxShare(x) {
  if (!x) return;
  const base = location.protocol.startsWith('http') ? location.href.split('#')[0] : '';
  const txt = `'${x.ko}'를 일본어로? ${x.sum}${(x.ja || []).length ? '\n' + x.ja.map(j => `· ${j[0]} (${j[2]})`).join('\n') : ''}${base ? '\n\n하나마루 ' + base : ''}`;
  if (navigator.share) navigator.share({ text: txt }).catch(() => {});
  else copyText(txt, '복사했어요. 친구에게 붙여넣어 보내 주세요.', () => toast('복사하지 못했어요.'));
}
CUSTOM.koexp = renderKoExp;

// ---- quiz/en-traps.js ----
'use strict';
/* ================= 한국인이 틀리는 영어 (etrap): Korean said word for word turns into wrong English ================= */
const ET_ITEMS = (typeof ETRAP_RAW !== 'undefined' ? ETRAP_RAW : []).map(o => ({ ...o, key: 'xt:' + o.s + '|' + o.a }));
const ET_GROUPS = [...new Set(ET_ITEMS.map(x => x.g))];
const ET_NONE = '(없음)';
if (!Array.isArray(S.xt)) S.xt = [];

// the sentence with the blank filled in; "(없음)" means nothing goes there
const etFill = (s, a) =>
  a === ET_NONE
    ? s
        .replace(/\s*___\s*/, ' ')
        .replace(/\s{2,}/g, ' ')
        .replace(/ ([.,?!])/g, '$1')
    : s.replace('___', a);
const etSpeak = (s, a) =>
  etFill(s, a)
    .replace(/\s*\([^)]*[가-힣][^)]*\)\s*$/, '')
    .replace(/\s*—\s*/g, ' ');

POOLS.etrap = full => (full || !S.xt.length ? ET_ITEMS : ET_ITEMS.filter(x => S.xt.includes(x.g)));
SETUPS.etrap = () => {
  const all = !S.xt.length;
  return [
    `한국인이 틀리는 영어 ${POOLS.etrap().length}문제 · ${all ? '전체' : S.xt.join('·')}`,
    `<div class="setup-row"><label>주제</label><div class="chips"><button class="chip" data-xtg="" aria-pressed="${all}">전체</button>${ET_GROUPS.map(
      g => `<button class="chip" data-xtg="${esc(g)}" aria-pressed="${!all && S.xt.includes(g)}">${esc(g)}</button>`
    ).join('')}</div></div>
    <p class="note">한국어를 그대로 옮기면 틀리는 곳만 모았어요. '그와 결혼했어요'는 married <b>with</b> him이 아니라 married him, '배 안 고파요?'에 안 고프면 <b>No</b>.</p>`
  ];
};
LABELS.etrap = q => [etFill(q.s, q.a), q.ko];
SPEAKQ.etrap = q => [etSpeak(q.s, q.a), 'en'];
AUTO.etrap = 0;
CHECK.etrap = (v, s) => genericChoice('etrap', -1, s);
SHOWS.etrap = (mod, q, card, zone, r) => {
  if (!r.order)
    r.order = shuffle(
      [q.a, ...q.o].map(p => ({
        t: p,
        ok: p === q.a,
        cls: p === ET_NONE ? '' : 'en',
        lang: p === ET_NONE ? 'ko' : 'en',
        sub: p === q.lit ? '한국어 그대로 옮기면' : ''
      }))
    );
  const fill = r.answered ? (q.a === ET_NONE ? '<s>　</s>' : esc(q.a)) : '？';
  const sent = esc(q.s).replace('___', `<span class="blank">${fill}</span>`);
  card.innerHTML = `<span class="cat">한국인이 틀리는 영어 · ${esc(q.g)}</span><p class="ko" style="font-size:18px;margin-top:20px">${esc(q.ko)}</p>
    <p class="psent en" lang="en">${sent}</p><p class="cap">빈칸에 들어갈 말은? 아무것도 안 들어가면 (없음)</p>${MARKS}`;
  zone.dataset.type = 'etrap';
  zone.innerHTML = optsHTML(r);
};
INFO.etrap = q =>
  `<p class="fb-big en" lang="en">${q.a === ET_NONE ? esc(etFill(q.s, q.a)) : esc(q.s).replace('___', `<mark>${esc(q.a)}</mark>`)}</p>
   <p class="fb-sub"><span class="kp-trap">한국어 직역 <b>${esc(q.lit)}</b> ✕</span> <span class="kp-ok">영어 <b>${esc(q.a)}</b></span></p>
   <p class="fb-sub" style="color:var(--ink)">${esc(q.n)}</p><div>${spkBtn(etSpeak(q.s, q.a), '문장 듣기', 'en')}</div>`;
document.addEventListener('click', e => {
  const b = e.target.closest('[data-xtg]');
  if (!b) return;
  const g = b.dataset.xtg;
  if (!g) S.xt = [];
  else S.xt = S.xt.includes(g) ? S.xt.filter(x => x !== g) : [...S.xt, g];
  save();
  R.etrap = null;
  renderModule('etrap');
});

// ---- quiz/kansai.js ----
'use strict';
/* ================= 간사이벤 (오사카 사투리): hear it in Osaka, know what it means ================= */
const KS_CATS = ['인사', '맞장구·리액션', '감정', '일상', '가게·여행', '문법(어미)'];
const KS_ITEMS = (typeof KANSAI_RAW !== 'undefined' ? KANSAI_RAW : []).map(o => ({ ...o, key: 'ks:' + o.w }));

POOLS.kansai = () => KS_ITEMS;
SETUPS.kansai = () => [
  `간사이벤 ${KS_ITEMS.length}개`,
  `<p class="note">오사카·교토에서 자주 듣는 사투리예요. 뜻을 맞히고 표준어와 비교해 봐요. 발음은 표준어 억양으로 나와요. <button type="button" class="link" data-kslist>전체 목록 보기</button></p>`
];
LABELS.kansai = q => [q.w, q.m];
SPEAKQ.kansai = q => [q.r, 'ja'];
AUTO.kansai = 0;
CHECK.kansai = (v, s) => genericChoice('kansai', -1, s);
SHOWS.kansai = (mod, q, card, zone, r) => {
  if (!r.order) r.order = shuffle([q.m, ...q.o].map(t => ({ t, ok: t === q.m, cls: '', lang: 'ko' })));
  card.innerHTML = `<span class="cat">간사이벤 · ${esc(q.c)}</span><div class="tz wide"><span class="word" lang="ja" style="font-size:${Math.min(56, wordSize(q.w))}px">${esc(q.w)}</span></div>
    <p class="cap">${r.answered ? `표준어 <span class="jp" lang="ja">${esc(q.std)}</span> · ` : ''}무슨 뜻일까요?</p>${MARKS}`;
  zone.dataset.type = 'kansai';
  zone.innerHTML = optsHTML(r);
};
INFO.kansai = q =>
  `<p class="fb-big"><span class="jp" lang="ja">${esc(q.w)}</span> = <span class="jp" lang="ja" style="color:var(--muted)">${esc(q.std)}</span></p>
   <p class="fb-sub" style="color:var(--ink)"><b>${esc(q.m)}</b> · ${esc(q.n || '')}</p>
   ${q.ex ? `<p class="fb-sub jp" lang="ja" style="font-size:17px;color:var(--ink)">${esc(q.ex)}</p><p class="fb-sub">${esc(q.exko || '')}</p>` : ''}
   <div class="row">${spkBtn(q.r, '듣기')}${q.ex ? spkBtn(q.exr.replace(/\s/g, ''), '예문 듣기') : ''}</div>`;
document.addEventListener('click', e => {
  if (!e.target.closest('[data-kslist]')) return;
  openSheet(
    `<div class="sheet-h"><b>간사이벤 모아 보기</b><button type="button" class="icon-btn" data-close aria-label="닫기">${XICON}</button></div>
    <div class="h-scroll">${KS_CATS.map(c => {
      const xs = KS_ITEMS.filter(x => x.c === c);
      return xs.length
        ? `<h3 class="hjr-h">${c}</h3><div class="sr-list">${xs.map(x => `<button type="button" class="sr-i" data-speak="${esc(x.r)}" data-lang="ja"><b class="jp" lang="ja">${esc(x.w)} <small style="color:var(--muted)">= ${esc(x.std)}</small></b><small>${esc(x.m)} · ${esc(x.n || '')}</small><span class="sr-go">${SPK_ICON}</span></button>`).join('')}</div>`
        : '';
    }).join('')}</div>`,
    'help'
  );
});

// ---- features/course.js ----
'use strict';
/* ---------- 30-day course ---------- */
const ROWS = {
  あ: 'あいうえお',
  か: 'かきくけこ',
  さ: 'さしすせそ',
  た: 'たちつてと',
  な: 'なにぬねの',
  は: 'はひふへほ',
  ま: 'まみむめも',
  や: 'やゆよ',
  ら: 'らりるれろ',
  わ: 'わをん'
};
const cK = (sc, rows) => () => {
  const cv = sc === 'k' ? toKata : x => x;
  const want = new Set([...rows].flatMap(r => [...ROWS[r]]).map(cv));
  return basePool('kana', true).filter(x => x.sc === sc && want.has(x.ch));
};
const cKS = (sc, sets) => () => basePool('kana', true).filter(x => x.sc === sc && sets.includes(x.set));
const cW = (cat, a, b) => () => WORDS.filter(w => w.cats.includes(cat)).slice(a, b);
const cEW = (cat, a, b) => () => EN_WORDS.filter(w => w.cats.includes(cat)).slice(a, b);
const cSN = (mod, sc, a, b) => () => (ITEMS[mod] || []).filter(s => s.sc === sc).slice(a, b);
const cG =
  (...ids) =>
  () =>
    GRAM_ITEMS.filter(x => ids.includes(x.g.id));
const cKJ = (a, b) => () => KANJI.slice(a, b);
const cCJ =
  (...f) =>
  () =>
    CONJ_ITEMS.filter(x => f.includes(x.form));
const cCN =
  (...ids) =>
  () =>
    CNT_ITEMS.filter(x => ids.includes(x.id));
const cPL =
  (...t) =>
  () =>
    POL.filter(x => t.includes(x.t));
const cJM =
  (...l) =>
  () =>
    JMP.filter(x => l.includes(x.lb));
const cLO = (a, b) => () => LOANS.slice(a, b);
const cCF = sc => () => CONF_ITEMS.filter(x => x.sc === sc);
const cIR = (a, b) => () => IRR.slice(a, b);
const cMP = (a, b) => () => MP.slice(a, b);
const COURSE = {
  ja: [
    {
      t: '히라가나 첫걸음',
      d: 'あ·か·さ행과 첫인사',
      k: [
        { m: 'chart', l: '50음도 훑어보기' },
        { m: 'kana', l: '히라가나 あ·か·さ행', f: cK('h', 'あかさ') },
        { m: 'sent', l: '인사 문장 고르기', f: cSN('sent', 'greet', 0, 8) }
      ]
    },
    {
      t: '히라가나 た·な·は행',
      d: '15자 더 배우고 섞어서 복습',
      k: [
        { m: 'kana', l: '히라가나 た·な·は행', f: cK('h', 'たなは') },
        { m: 'kana', l: 'あ~は행 섞어서', f: cK('h', 'あかさたなは') },
        { m: 'sent', l: '인사 문장 고르기 2', f: cSN('sent', 'greet', 8, 16) }
      ]
    },
    {
      t: '히라가나 ま~わ행',
      d: '기본 글자 마지막 줄과 첫 대화',
      k: [
        { m: 'kana', l: '히라가나 ま·や·ら·わ행', f: cK('h', 'まやらわ') },
        { m: 'jdlg', dl: ['greet', 0] }
      ]
    },
    {
      t: '히라가나 46자 완성',
      d: '기본 글자 전체와 헷갈리는 글자',
      k: [
        { m: 'kana', l: '히라가나 기본 46자', f: cKS('h', ['basic']) },
        { m: 'kconf', l: '헷갈리는 히라가나', f: cCF('h') }
      ]
    },
    {
      t: '탁음·반탁음',
      d: 'が·ざ·だ·ば·ぱ와 인사 단어',
      k: [
        { m: 'kana', l: '히라가나 탁음·반탁음', f: cKS('h', ['daku']) },
        { m: 'word', l: '인사·표현 단어', f: cW('greet', 0, 15) }
      ]
    },
    {
      t: '요음과 소리 길이',
      d: 'きゃ·しゅ·ちょ, 장음·촉음 듣기',
      k: [
        { m: 'kana', l: '히라가나 요음', f: cKS('h', ['yoon']) },
        { m: 'jlen', l: '장음·촉음 구별', f: cJM('장음', '촉음') },
        { m: 'sent', l: '인사 문장 고르기 3', f: cSN('sent', 'greet', 16, 30) }
      ]
    },
    {
      t: '가타카나 ア~ナ',
      d: '가타카나 앞 25자와 외래어',
      k: [
        { m: 'kana', l: '가타카나 ア·カ·サ·タ·ナ행', f: cK('k', 'あかさたな') },
        { m: 'loan', l: '외래어 읽기 1', f: cLO(0, 12) }
      ]
    },
    {
      t: '가타카나 ハ~ン',
      d: '가타카나 나머지와 외래어',
      k: [
        { m: 'kana', l: '가타카나 ハ·マ·ヤ·ラ·ワ행', f: cK('k', 'はまやらわ') },
        { m: 'loan', l: '외래어 읽기 2', f: cLO(12, 24) }
      ]
    },
    {
      t: '가타카나 완성',
      d: '기본 46자와 シ/ツ·ソ/ン',
      k: [
        { m: 'kana', l: '가타카나 기본 46자', f: cKS('k', ['basic']) },
        { m: 'kconf', l: '헷갈리는 가타카나', f: cCF('k') }
      ]
    },
    {
      t: '가타카나 탁음·요음',
      d: 'ガ·ジャ와 숫자 단어',
      k: [
        { m: 'kana', l: '가타카나 탁음·요음', f: cKS('k', ['daku', 'yoon']) },
        { m: 'word', l: '숫자·세기 단어', f: cW('num', 0, 15) }
      ]
    },
    {
      t: '숫자와 세는 말',
      d: '가격 듣기, ひとつ·ひとり',
      k: [
        { m: 'jn', l: '숫자·가격 듣기' },
        { m: 'cnt', l: '조수사: つ · 人', f: cCN('つ', '人') }
      ]
    },
    {
      t: '첫 문법 です',
      d: '〜は〜です, 〜の와 사람 단어',
      k: [
        { m: 'gram', l: '문법: です · の', f: cG('desu', 'no') },
        { m: 'word', l: '사람·가족 단어', f: cW('people', 0, 15) }
      ]
    },
    {
      t: '동사 ます형',
      d: '정중하게 말하는 기본형',
      k: [
        { m: 'gram', l: '문법: 〜ます', f: cG('masu') },
        { m: 'conj', l: '동사 ます형 만들기', f: cCJ('masu') },
        { m: 'word', l: '동사 단어', f: cW('verb', 0, 15) }
      ]
    },
    {
      t: '일상 대화',
      d: '날씨와 하루 이야기',
      k: [
        { m: 'sent', l: '일상 문장 고르기', f: cSN('sent', 'daily', 0, 10) },
        { m: 'jdlg', dl: ['daily', 0] }
      ]
    },
    {
      t: '조사 익히기',
      d: 'は·が·を·に·で를 문장 속에서',
      k: [
        { m: 'part', l: '조사 빈칸: 일상', f: cSN('part', 'daily', 0, 15) },
        { m: 'jb', l: '문장 조립: 일상', f: cSN('jb', 'daily', 0, 10) }
      ]
    },
    {
      t: '식당에서',
      d: '주문하고 계산하기',
      k: [
        { m: 'word', l: '식당 단어', f: cW('s_food', 0, 15) },
        { m: 'sent', l: '식당 문장 고르기', f: cSN('sent', 'food', 0, 10) },
        { m: 'jdlg', dl: ['food', 0] }
      ]
    },
    {
      t: '날짜와 요일',
      d: 'ついたち·ふつか, 월·요일',
      k: [
        { m: 'cnt', l: '날짜·월·요일 읽기', f: cCN('日', '月', '曜') },
        { m: 'word', l: '시간·날짜 단어', f: cW('time', 0, 15) }
      ]
    },
    {
      t: '쇼핑',
      d: '몇 개·몇 장 세며 사기',
      k: [
        { m: 'cnt', l: '조수사: 個 · 枚 · 本', f: cCN('個', '枚', '本') },
        { m: 'sent', l: '쇼핑 문장 고르기', f: cSN('sent', 'shop', 0, 10) },
        { m: 'jdlg', dl: ['shop', 0] }
      ]
    },
    {
      t: '한자 첫걸음',
      d: '숫자·요일 한자, あります·います',
      k: [
        { m: 'kanji', l: '기초 한자 1~20', f: cKJ(0, 20) },
        { m: 'gram', l: '문법: あります · います', f: cG('arimasu_imasu') }
      ]
    },
    {
      t: '길 찾기',
      d: '역·버스·택시',
      k: [
        { m: 'word', l: '길·교통 단어', f: cW('s_move', 0, 15) },
        { m: 'jl', l: '문장 듣기: 길·교통', f: cSN('jl', 'move', 0, 8) },
        { m: 'jdlg', dl: ['move', 0] }
      ]
    },
    {
      t: 'て형',
      d: '〜てください, 〜ています',
      k: [
        { m: 'conj', l: '동사 て형 만들기', f: cCJ('te') },
        { m: 'gram', l: '문법: 〜てください · 〜ています', f: cG('tekudasai', 'teimasu') }
      ]
    },
    {
      t: '반말 시작',
      d: '친구에게 말하는 법',
      k: [
        { m: 'pol', l: '반말↔존댓말: 동사 현재·부정', f: cPL('verb-present', 'verb-negative') },
        { m: 'jdlg', dl: ['social', 0] }
      ]
    },
    {
      t: '과거형',
      d: '했어요 / 안 했어요',
      k: [
        { m: 'conj', l: '동사 た형·ない형', f: cCJ('ta', 'nai') },
        { m: 'gram', l: '문법: い형용사 과거', f: cG('i_adj_past') },
        { m: 'pol', l: '반말↔존댓말: 과거', f: cPL('verb-past', 'verb-past-negative') }
      ]
    },
    {
      t: '공항·호텔',
      d: '체크인부터 방 문제까지',
      k: [
        { m: 'word', l: '호텔 단어', f: cW('s_hotel', 0, 15) },
        { m: 'sent', l: '공항·호텔 문장', f: cSN('sent', 'stay', 0, 10) },
        { m: 'jdlg', dl: ['stay', 0] }
      ]
    },
    {
      t: '하고 싶어요',
      d: '〜たい, 〜ましょう, 〜ませんか',
      k: [
        { m: 'gram', l: '문법: たい · ましょう · ませんか', f: cG('tai', 'mashou', 'masenka') },
        { m: 'pol', l: '반말↔존댓말: 희망·권유', f: cPL('tai', 'invite', 'request') }
      ]
    },
    {
      t: '한자 두 번째',
      d: '시간·방향 한자와 받아쓰기',
      k: [
        { m: 'kanji', l: '기초 한자 21~45', f: cKJ(20, 45) },
        { m: 'jd', l: '받아쓰기: 인사', f: cSN('jd', 'greet', 0, 6) }
      ]
    },
    {
      t: '전화·예약',
      d: '식당 예약과 따라 말하기',
      k: [
        { m: 'sent', l: '전화 문장 고르기', f: cSN('sent', 'phone', 0, 10) },
        { m: 'jdlg', dl: ['phone', 0] },
        { m: 'jsh', l: '따라 말하기: 전화', f: cSN('jsh', 'phone', 0, 5) }
      ]
    },
    {
      t: '병원·약국',
      d: '아픈 곳 말하기',
      k: [
        { m: 'word', l: '몸·건강 단어', f: cW('body', 0, 15) },
        { m: 'sent', l: '병원 문장 고르기', f: cSN('sent', 'health', 0, 10) },
        { m: 'jdlg', dl: ['health', 1] }
      ]
    },
    {
      t: '곤란할 때',
      d: '분실·길 잃음, 탁음 듣기',
      k: [
        { m: 'jdlg', dl: ['help', 0] },
        { m: 'sent', l: '곤란할 때 문장', f: cSN('sent', 'help', 0, 10) },
        { m: 'jlen', l: '탁음·요음·ん 구별', f: cJM('탁음', '요음', '발음 ん') }
      ]
    },
    {
      t: '마무리 도전',
      d: '이유·생각 말하기와 60초 도전',
      k: [
        { m: 'gram', l: '문법: から · けど · と思います', f: cG('kara', 'kedo', 'toomoimasu') },
        { m: 'jdlg', dl: ['food', 5] },
        { m: 'wspeed', l: '60초 단어 도전' }
      ]
    }
  ],
  en: [
    {
      t: '첫인사',
      d: '인사 표현과 문장',
      k: [
        { m: 'ew', l: '회화 표현 단어', f: cEW('talk', 0, 15) },
        { m: 'es', l: '인사 문장 고르기', f: cSN('es', 'greet', 0, 8) }
      ]
    },
    {
      t: '인사 대화',
      d: '처음 만나 인사하기',
      k: [
        { m: 'edlg', dl: ['greet', 0] },
        { m: 'eb', l: '문장 조립: 인사', f: cSN('eb', 'greet', 0, 8) }
      ]
    },
    {
      t: '기초 동사',
      d: '자주 쓰는 동사와 발음',
      k: [
        { m: 'ew', l: '기초 동사 1', f: cEW('verb', 0, 15) },
        { m: 'mp', l: '발음 구별 1', f: cMP(0, 12) }
      ]
    },
    {
      t: '일상 대화',
      d: '날씨와 하루 이야기',
      k: [
        { m: 'es', l: '일상 문장 고르기', f: cSN('es', 'daily', 0, 10) },
        { m: 'edlg', dl: ['daily', 0] }
      ]
    },
    {
      t: '생활 명사',
      d: '단어와 듣기',
      k: [
        { m: 'ew', l: '생활 명사 1', f: cEW('noun', 0, 15) },
        { m: 'el', l: '문장 듣기: 일상', f: cSN('el', 'daily', 0, 8) }
      ]
    },
    {
      t: '숫자와 시간',
      d: '가격·시간 듣기',
      k: [
        { m: 'enn', l: '숫자·가격 듣기' },
        { m: 'ew', l: '시간·빈도 단어', f: cEW('time', 0, 15) }
      ]
    },
    {
      t: '불규칙 동사 1',
      d: 'go - went - gone',
      k: [
        { m: 'irr', l: '불규칙 동사 1~15', f: cIR(0, 15) },
        { m: 'es', l: '친구 문장 고르기', f: cSN('es', 'social', 0, 8) }
      ]
    },
    {
      t: '친구·취미',
      d: '취미 이야기',
      k: [
        { m: 'edlg', dl: ['social', 0] },
        { m: 'eb', l: '문장 조립: 친구', f: cSN('eb', 'social', 0, 8) }
      ]
    },
    {
      t: '형용사',
      d: '형용사와 발음',
      k: [
        { m: 'ew', l: '형용사 1', f: cEW('adj', 0, 15) },
        { m: 'mp', l: '발음 구별 2', f: cMP(12, 26) }
      ]
    },
    {
      t: '식당에서',
      d: '주문하기',
      k: [
        { m: 'ew', l: '식당 단어', f: cEW('s_food', 0, 15) },
        { m: 'es', l: '식당 문장 고르기', f: cSN('es', 'food', 0, 8) },
        { m: 'edlg', dl: ['food', 0] }
      ]
    },
    {
      t: '불규칙 동사 2',
      d: '받아쓰기 시작',
      k: [
        { m: 'irr', l: '불규칙 동사 16~30', f: cIR(15, 30) },
        { m: 'ed', l: '받아쓰기: 일상', f: cSN('ed', 'daily', 0, 6) }
      ]
    },
    {
      t: '쇼핑',
      d: '사이즈·가격 묻기',
      k: [
        { m: 'ew', l: '쇼핑 단어', f: cEW('s_shop', 0, 15) },
        { m: 'es', l: '쇼핑 문장 고르기', f: cSN('es', 'shop', 0, 8) },
        { m: 'edlg', dl: ['shop', 0] }
      ]
    },
    {
      t: '동사구',
      d: 'pick up, look for',
      k: [
        { m: 'ew', l: '동사구 1', f: cEW('phr', 0, 15) },
        { m: 'eb', l: '문장 조립: 쇼핑', f: cSN('eb', 'shop', 0, 8) }
      ]
    },
    {
      t: '관광',
      d: '표 사고 사진 부탁하기',
      k: [
        { m: 'es', l: '관광 문장 고르기', f: cSN('es', 'sight', 0, 10) },
        { m: 'edlg', dl: ['sight', 0] }
      ]
    },
    {
      t: '따라 말하기',
      d: '소리 내어 말하기',
      k: [
        { m: 'esh', l: '따라 말하기: 인사', f: cSN('esh', 'greet', 0, 5) },
        { m: 'mp', l: '발음 구별 3', f: cMP(26, 40) }
      ]
    },
    {
      t: '길·교통',
      d: '길 묻기',
      k: [
        { m: 'ew', l: '길·교통 단어', f: cEW('s_move', 0, 15) },
        { m: 'el', l: '문장 듣기: 길·교통', f: cSN('el', 'move', 0, 8) },
        { m: 'edlg', dl: ['move', 0] }
      ]
    },
    {
      t: '불규칙 동사 3',
      d: '동사 더 늘리기',
      k: [
        { m: 'irr', l: '불규칙 동사 31~45', f: cIR(30, 45) },
        { m: 'ew', l: '기초 동사 2', f: cEW('verb', 15, 30) }
      ]
    },
    {
      t: '공항·호텔',
      d: '체크인하기',
      k: [
        { m: 'ew', l: '공항 단어', f: cEW('s_air', 0, 15) },
        { m: 'es', l: '공항·호텔 문장', f: cSN('es', 'stay', 0, 10) },
        { m: 'edlg', dl: ['stay', 0] }
      ]
    },
    {
      t: '전화',
      d: '예약 전화',
      k: [
        { m: 'edlg', dl: ['phone', 0] },
        { m: 'es', l: '전화 문장 고르기', f: cSN('es', 'phone', 0, 8) },
        { m: 'ed', l: '받아쓰기: 전화', f: cSN('ed', 'phone', 0, 6) }
      ]
    },
    {
      t: '병원',
      d: '증상 말하기',
      k: [
        { m: 'es', l: '병원 문장 고르기', f: cSN('es', 'health', 0, 10) },
        { m: 'edlg', dl: ['health', 1] }
      ]
    },
    {
      t: '곤란할 때',
      d: '분실 신고',
      k: [
        { m: 'es', l: '곤란할 때 문장', f: cSN('es', 'help', 0, 10) },
        { m: 'edlg', dl: ['help', 0] }
      ]
    },
    {
      t: '회화 표현',
      d: '자주 쓰는 말',
      k: [
        { m: 'ew', l: '회화 표현 2', f: cEW('talk', 15, 35) },
        { m: 'eb', l: '문장 조립: 일상', f: cSN('eb', 'daily', 0, 8) }
      ]
    },
    {
      t: '불규칙 동사 4',
      d: '발음까지 같이',
      k: [
        { m: 'irr', l: '불규칙 동사 46~60', f: cIR(45, 60) },
        { m: 'mp', l: '발음 구별 4', f: cMP(40, 55) }
      ]
    },
    {
      t: '약속 잡기',
      d: '친구와 계획 세우기',
      k: [
        { m: 'edlg', dl: ['social', 1] },
        { m: 'esh', l: '따라 말하기: 친구', f: cSN('esh', 'social', 0, 5) }
      ]
    },
    {
      t: '식당 2',
      d: '제대로 주문하기',
      k: [
        { m: 'edlg', dl: ['food', 1] },
        { m: 'eb', l: '문장 조립: 식당', f: cSN('eb', 'food', 0, 8) },
        { m: 'el', l: '문장 듣기: 식당', f: cSN('el', 'food', 0, 8) }
      ]
    },
    {
      t: '쇼핑 2',
      d: '반품하기',
      k: [
        { m: 'edlg', dl: ['shop', 1] },
        { m: 'ed', l: '받아쓰기: 쇼핑', f: cSN('ed', 'shop', 0, 6) }
      ]
    },
    {
      t: '불규칙 동사 5',
      d: '형용사 더하기',
      k: [
        { m: 'irr', l: '불규칙 동사 61~80', f: cIR(60, 80) },
        { m: 'ew', l: '형용사 2', f: cEW('adj', 15, 30) }
      ]
    },
    {
      t: '여행 2',
      d: '입국 심사와 지하철',
      k: [
        { m: 'edlg', dl: ['stay', 1] },
        { m: 'edlg', dl: ['move', 1] }
      ]
    },
    {
      t: '전화·병원 2',
      d: '예약 변경과 진료 예약',
      k: [
        { m: 'edlg', dl: ['phone', 1] },
        { m: 'edlg', dl: ['phone', 2] }
      ]
    },
    {
      t: '마무리 도전',
      d: '마지막 동사와 60초 도전',
      k: [
        { m: 'irr', l: '불규칙 동사 81~101', f: cIR(80, 101) },
        { m: 'edlg', dl: ['help', 3] },
        { m: 'espeed', l: '60초 영단어 도전' }
      ]
    }
  ]
};

/* ---------- second stage: N4 (Japanese) / 실전 (English), days 31–60 ---------- */
const COURSE_STAGES = {
  ja: [
    [0, '기초 30일'],
    [30, 'N4 30일']
  ],
  en: [
    [0, '기초 30일'],
    [30, '실전 30일']
  ]
};
const stageOf = (lang, di) => {
  let n = COURSE_STAGES[lang][0][1];
  for (const [from, name] of COURSE_STAGES[lang]) if (di >= from) n = name;
  return n;
};
const cGL =
  (...ids) =>
  () =>
    GRAM_ITEMS.filter(x => ids.includes(x.g.id));
const cWN4 = (a, b) => () => N4_WORDS_ORDER.slice(a, b);
const cKJ4 = (a, b) => () => KANJI.filter(k => k.lvl === 4).slice(a, b);
const cPLt =
  (...t) =>
  () =>
    POL.filter(x => t.includes(x.t));
const cEGt = (mod, a, b) => () => EG[mod].items.slice(a, b);
const N4_CAT_ORDER = [
  'verb',
  'adj',
  'adv',
  'school',
  'time',
  'place',
  'thing',
  'people',
  'body',
  'food',
  'nature',
  'greet',
  'num',
  'ask',
  's_move',
  's_hotel',
  's_air',
  's_food',
  's_shop'
];
const N4_WORDS_ORDER = BASE_JP.filter(w => w.lvl === 4).sort((a, b) => N4_CAT_ORDER.indexOf(a.cats[0]) - N4_CAT_ORDER.indexOf(b.cats[0]));
(function buildN4Days() {
  const G4 = GRAM.filter(g => g.lvl === 4);
  if (!G4.length) return;
  const third = [
    { m: 'conj', l: '동사 가능형 만들기', f: cCJ('pot') },
    { m: 'kanji', l: 'N4 한자 1~10', f: cKJ4(0, 10) },
    { m: 'jdlg', dl: ['greet', 1] },
    { m: 'conj', l: '동사 의지형 만들기', f: cCJ('vol') },
    { m: 'kanji', l: 'N4 한자 11~20', f: cKJ4(10, 20) },
    { m: 'jdlg', dl: ['daily', 1] },
    { m: 'pol', l: '반말↔존댓말: 의문문', f: cPLt('question') },
    { m: 'kanji', l: 'N4 한자 21~30', f: cKJ4(20, 30) },
    { m: 'jdlg', dl: ['social', 1] },
    { m: 'pol', l: '반말↔존댓말: 형용사·명사', f: cPLt('i-adj', 'na-adj-noun') },
    { m: 'kanji', l: 'N4 한자 31~40', f: cKJ4(30, 40) },
    { m: 'jdlg', dl: ['food', 1] },
    { m: 'jd', l: '받아쓰기: 일상', f: cSN('jd', 'daily', 0, 6) },
    { m: 'kanji', l: 'N4 한자 41~50', f: cKJ4(40, 50) },
    { m: 'jdlg', dl: ['shop', 1] },
    { m: 'pol', l: '반말↔존댓말: ている·ある/いる', f: cPLt('te-iru', 'aru-iru') },
    { m: 'kanji', l: 'N4 한자 51~60', f: cKJ4(50, 60) },
    { m: 'jdlg', dl: ['sight', 1] },
    { m: 'jsh', l: '따라 말하기: 쇼핑', f: cSN('jsh', 'shop', 0, 5) },
    { m: 'kanji', l: 'N4 한자 61~70', f: cKJ4(60, 70) },
    { m: 'jdlg', dl: ['move', 1] },
    { m: 'pol', l: '반말↔존댓말: 특수 표현', f: cPLt('special') },
    { m: 'kanji', l: 'N4 한자 71~80', f: cKJ4(70, 80) },
    { m: 'jdlg', dl: ['stay', 1] },
    { m: 'jl', l: '문장 듣기: 곤란할 때', f: cSN('jl', 'help', 0, 8) },
    { m: 'jdlg', dl: ['phone', 1] },
    { m: 'jdlg', dl: ['health', 2] },
    { m: 'jdlg', dl: ['help', 1] },
    { m: 'cnt', l: '조수사·날짜 총복습' },
    { m: 'wspeed', l: '60초 단어 도전' }
  ];
  const per = Math.ceil(N4_WORDS_ORDER.length / 28);
  for (let i = 0; i < 30; i++) {
    const gs = i < 15 ? [G4[2 * i], G4[2 * i + 1]].filter(Boolean) : i === 15 && G4[30] ? [G4[30]] : [];
    const k = [];
    if (gs.length)
      k.push({ m: 'gram', l: '문법: ' + gs.map(g => g.p.replace(/\s*\(.*?\)/g, '')).join(' · '), f: cGL(...gs.map(g => g.id)) });
    else k.push({ m: 'gram', l: 'N4 문법 복습', f: () => GRAM_ITEMS.filter(x => x.g.lvl === 4) });
    if (i < 28)
      k.push({ m: 'word', l: `N4 단어 ${i * per + 1}~${Math.min(N4_WORDS_ORDER.length, (i + 1) * per)}`, f: cWN4(i * per, (i + 1) * per) });
    k.push(third[i]);
    const title = gs.length ? gs[0].name.replace(/\s*\(.*?\)/g, '') : i < 29 ? 'N4 실력 다지기' : 'N4 마무리';
    COURSE.ja.push({ t: title, d: gs.length ? gs.map(g => g.p.replace(/\s*\(.*?\)/g, '')).join(' · ') : '배운 것 섞어서 복습', k });
  }
})();
(function buildEnPart2() {
  if (!EG.eprep.items.length) return;
  const dlgs = [
    ['greet', 1],
    ['daily', 1],
    ['social', 2],
    ['food', 2],
    ['shop', 2],
    ['sight', 1],
    ['move', 2],
    ['stay', 2],
    ['phone', 3],
    ['health', 0],
    ['help', 1],
    ['greet', 2],
    ['daily', 2],
    ['social', 3],
    ['food', 3],
    ['shop', 3],
    ['sight', 2],
    ['move', 3],
    ['stay', 3],
    ['health', 2],
    ['help', 2],
    ['greet', 3],
    ['daily', 3],
    ['food', 4],
    ['sight', 3],
    ['stay', 4],
    ['health', 3],
    ['food', 5],
    ['stay', 5],
    ['help', 1]
  ];
  const kinds = [
    ['eprep', '전치사'],
    ['etense', '시제'],
    ['ephr', '구동사']
  ];
  const third = i =>
    [
      { m: 'eb', l: '문장 조립: ' + SCENES[dlgs[i][0]], f: cSN('eb', dlgs[i][0], 8, 16) },
      { m: 'ed', l: '받아쓰기: ' + SCENES[dlgs[i][0]], f: cSN('ed', dlgs[i][0], 6, 12) },
      { m: 'esh', l: '따라 말하기: ' + SCENES[dlgs[i][0]], f: cSN('esh', dlgs[i][0], 5, 10) },
      { m: 'el', l: '문장 듣기: ' + SCENES[dlgs[i][0]], f: cSN('el', dlgs[i][0], 8, 16) },
      { m: 'mp', l: '발음 구별', f: cMP(55, 76) },
      { m: 'ew', l: '동사구 단어', f: cEW('phr', 15, 45) }
    ][i % 6];
  for (let i = 0; i < 30; i++) {
    const [mod, name] = kinds[i % 3];
    const items = EG[mod].items;
    const per = Math.ceil(items.length / 10);
    const c = Math.floor(i / 3);
    const sl = items.slice(c * per, (c + 1) * per);
    const topics = [...new Set(sl.map(x => x.t))].join('·');
    COURSE.en.push({
      t: `${name}: ${topics}`,
      d: `${SCENES[dlgs[i][0]]} 대화와 함께`,
      k: [
        { m: mod, l: `${name} ${c * per + 1}~${Math.min(items.length, (c + 1) * per)}`, f: cEGt(mod, c * per, (c + 1) * per) },
        { m: 'edlg', dl: dlgs[i] },
        third(i)
      ]
    });
  }
})();

const taskDlg = t => {
  const l = DLG[t.m].filter(d => d.sc === t.dl[0]);
  return l[t.dl[1]] || l[0] || DLG[t.m][0];
};
const taskLabel = t => (t.dl ? '대화: ' + taskDlg(t).title : t.l);
const taskOK = t => hasTTS || !NEEDS_TTS.has(t.m);
let CRUN = null,
  SPEED_C = null;
if (!S.course || typeof S.course !== 'object') S.course = { ja: {}, en: {} };
for (const l of ['ja', 'en']) if (!S.course[l] || typeof S.course[l] !== 'object') S.course[l] = {};
if (!S.courseFin) S.courseFin = {};
const cDone = (lang, di, ti) => !!(S.course[lang][di] && S.course[lang][di][ti]);
const dayTasks = (lang, di) => COURSE[lang][di].k.map((t, ti) => ({ t, ti })).filter(x => taskOK(x.t));
const dayDone = (lang, di) => dayTasks(lang, di).every(x => cDone(lang, di, x.ti));
const daysDone = lang => COURSE[lang].filter((_, di) => dayDone(lang, di)).length;
function curDay(lang) {
  const i = COURSE[lang].findIndex((_, di) => !dayDone(lang, di));
  return i < 0 ? COURSE[lang].length : i;
}
function courseMark(c) {
  const { lang, di, ti } = c;
  const a = S.course[lang][di] || (S.course[lang][di] = []);
  if (a[ti]) return;
  a[ti] = 1;
  gainXP(20, lang);
  missionEvent('course');
  if (dayDone(lang, di)) {
    S.courseFin[lang + di] = today();
    gainXP(50, lang);
    grantTicket(lang, `${di + 1}일차 완료`);
    save();
    checkBadges();
    setTimeout(
      () =>
        toast(
          di === COURSE[lang].length - 1
            ? '코스를 모두 끝냈어요! 하나마루'
            : di === 29
              ? `${stageOf(lang, 0)} 완주! 이제 ${stageOf(lang, 30)}가 열려요`
              : `${di + 1}일차 완료! 하나마루`
        ),
      400
    );
  } else {
    save();
    setTimeout(() => toast('코스 과제를 끝냈어요'), 400);
  }
}
function startTask(lang, di, ti) {
  const t = COURSE[lang][di].k[ti];
  const c = { lang, di, ti, mod: t.m };
  if (S.lang !== lang) {
    S.lang = lang;
    save();
    renderTabs();
  }
  stopAll();
  if (VIEWS.has(t.m)) {
    courseMark(c);
    startMod(t.m);
    return;
  }
  if (SPEED.has(t.m)) {
    SPEED_C = c;
    startMod(t.m);
    return;
  }
  if (DLGM.has(t.m)) {
    DG = null;
    startMod(t.m);
    startDlg(t.m, taskDlg(t), c);
    return;
  }
  let items = t.f ? t.f() : null;
  if (items && !items.length) items = basePool(t.m, true);
  if (items) PENDING[t.m] = pickN(items, Math.min(items.length, 20));
  CRUN = c;
  R[t.m] = null;
  S.filt[t.m] = 'all';
  save();
  startMod(t.m);
}
function taskRow(lang, di, { t, ti }) {
  const d = cDone(lang, di, ti);
  return `<li data-done="${d}"><button type="button" class="ctask" data-ctask="${lang}:${di}:${ti}"><span class="ck" aria-hidden="true">${d ? '<svg viewBox="0 0 20 20"><path d="M4 10.5 8 14l8-8.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}</span><span class="tl">${esc(taskLabel(t))}<small>${esc(MODE_LABEL[t.m] || '')}</small></span><span class="go">${d ? '다시' : '시작'}</span></button></li>`;
}
function courseHomeHTML() {
  const lang = S.lang;
  const n = COURSE[lang].length;
  const cd = curDay(lang);
  const fin = daysDone(lang);
  const head = `<div class="cc-prog"><div class="meter"><i style="width:${(fin / n) * 100}%"></i></div><span class="num">${fin} / ${n}일</span></div>`;
  if (cd >= n)
    return `<section><h2 class="sec-title">30일 코스</h2><div class="course-card">${head}<p style="margin:0;font-weight:700">30일 코스를 모두 끝냈어요. 하나마루!</p><p class="note">이제 홈의 '오늘의 복습'으로 잊기 전에 다시 보면 돼요.</p><div class="row"><button class="btn" data-share>결과 카드 만들기</button><button class="btn quiet" data-gocourse>코스 다시 보기</button></div></div></section>`;
  const day = COURSE[lang][cd];
  const justFin = cd > 0 && S.courseFin[lang + (cd - 1)] === today();
  return `<section><h2 class="sec-title">30일 코스</h2><div class="course-card">${head}
    ${justFin ? `<div class="cc-done"><b>오늘 ${cd}일차를 끝냈어요!</b><span>내일 이어서 하거나, 지금 바로 ${cd + 1}일차를 시작해도 돼요.</span><button class="btn" data-share style="min-height:38px;padding:6px 12px">결과 카드</button></div>` : ''}
    <div class="cc-head"><span class="cc-day num">${cd + 1}일차</span><div><b>${esc(day.t)}</b><small>${esc(day.d)}</small></div></div>
    <ul class="cc-tasks">${dayTasks(lang, cd)
      .map(x => taskRow(lang, cd, x))
      .join('')}</ul>
    <button class="btn quiet" data-gocourse style="justify-self:start;padding-left:2px">코스 전체 보기 →</button></div></section>`;
}
let courseOpen = null;
function renderCourse() {
  const vb = document.getElementById('vbody');
  const lang = S.lang;
  const cd = curDay(lang);
  if (courseOpen === null || courseOpen >= COURSE[lang].length) courseOpen = Math.min(cd, COURSE[lang].length - 1);
  vb.innerHTML = `<div class="chart"><div class="lt-cta"><div><b>어디부터 시작할지 모르겠다면</b><span class="note">20문제 레벨 테스트로 시작할 날을 추천받아요.</span></div><button class="btn" data-ltest>레벨 테스트</button></div><p class="note">하루 2~3개 과제로 ${lang === 'ja' ? '글자부터 대화, N4까지' : '단어부터 대화, 문법까지'} 순서대로 익혀요. 과제를 끝까지 풀면 체크돼요. 날짜에 매이지 않고 내 속도로 해도 괜찮아요. (${daysDone(lang)} / ${COURSE[lang].length}일 완료)</p>
    <div class="cdays">${COURSE[lang]
      .map((d, di) => {
        const stage = COURSE_STAGES[lang].find(x => x[0] === di);
        const done = dayDone(lang, di);
        const tasks = dayTasks(lang, di);
        const nd = tasks.filter(x => cDone(lang, di, x.ti)).length;
        const open = di === courseOpen;
        return `${stage ? `<h2 class="sec-title cstage">${stage[1]}</h2>` : ''}<div class="cday" data-st="${done ? 'done' : di === cd ? 'cur' : ''}"><button type="button" class="cday-h" data-cday="${di}" aria-expanded="${open}"><span class="num cd-n">${di + 1}</span><span class="cd-t"><b>${esc(d.t)}</b><small>${esc(d.d)}</small></span><span class="num cd-p">${done ? '완료' : nd + ' / ' + tasks.length}</span></button>
        ${open ? `<ul class="cc-tasks">${tasks.map(x => taskRow(lang, di, x)).join('')}</ul>` : ''}</div>`;
      })
      .join('')}</div></div>`;
  vb.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.cday !== undefined) {
      const i = +b.dataset.cday;
      courseOpen = courseOpen === i ? -1 : i;
      renderCourse();
    } else if (b.dataset.ctask) {
      const [l, di, ti] = b.dataset.ctask.split(':');
      startTask(l, +di, +ti);
    } else if ('ltest' in b.dataset) startLevelTest(lang);
  };
}
BADGES.push(
  {
    id: 'course7',
    name: '코스 일주일',
    desc: '코스 7일차까지 끝내기',
    p: () => [Math.min(Math.max(daysDone('ja'), daysDone('en')), 7), 7]
  },
  {
    id: 'course30',
    name: '기초 코스 완주',
    desc: '기초 30일 코스 끝내기',
    p: () => [Math.min(30, Math.max(daysDone('ja'), daysDone('en'))), 30]
  },
  {
    id: 'course60',
    name: '코스 마스터',
    desc: '60일 코스(기초 + N4·실전) 모두 끝내기',
    p: () => [Math.min(60, Math.max(daysDone('ja'), daysDone('en'))), 60]
  }
);

// ---- ui/sheet.js ----
'use strict';
/* ---------- sheets (modal) ---------- */
function openSheet(html, cls) {
  closeSheet();
  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.id = 'sheet';
  bg.innerHTML = `<div class="sheet ${cls || ''}" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(bg);
  document.body.classList.add('sheet-open');
  bg.addEventListener('click', e => {
    if (e.target === bg || e.target.closest('[data-close]')) closeSheet();
  });
  requestAnimationFrame(() => bg.classList.add('show'));
  return bg.firstElementChild;
}
function closeSheet() {
  const s = document.getElementById('sheet');
  if (s) s.remove();
  document.body.classList.remove('sheet-open');
}
document.addEventListener(
  'keydown',
  e => {
    if (e.key === 'Escape' && document.getElementById('sheet')) closeSheet();
  },
  true
);
const XICON =
  '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5 5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

// ---- features/share-card.js ----
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
    H = 1640;
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
  drawQRFooter(x, W, H, '한국인을 위한 일본어·영어 회화 앱');
  return cv;
}
async function shareCard() {
  await Promise.all([loadCardFonts(), ensureQR()]);
  shareImage(drawShareCard(), `하나마루 · 오늘 ${(S.days[today()] || { n: 0 }).n}문제 · ${streak()}일 연속`, '결과 카드');
}

// ---- QR code on share cards (qrcode-generator by Kazuhiko Arase, MIT; loaded only when a card is made) ----
const cardUrl = () =>
  (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.site) || (location.protocol.startsWith('http') ? location.href.split(/[?#]/)[0] : '');
let QR_LOADING = null;
function ensureQR() {
  if (typeof qrcode === 'function') return Promise.resolve();
  if (!QR_LOADING)
    QR_LOADING = new Promise(ok => {
      const sc = document.createElement('script');
      sc.src = 'js/vendor/qrcode/qrcode.js';
      sc.onload = sc.onerror = () => ok();
      document.head.appendChild(sc);
      setTimeout(ok, 4000);
    });
  return QR_LOADING;
}
function drawQR(x, X, Y, size, text) {
  if (typeof qrcode !== 'function' || !text) return false;
  try {
    const q = qrcode(0, 'M');
    q.addData(text);
    q.make();
    const n = q.getModuleCount(),
      cell = Math.max(2, Math.floor((size * 0.88) / n)),
      off = Math.round((size - cell * n) / 2);
    roundRect(x, X, Y, size, size, 16, '#FFFFFF');
    x.fillStyle = '#000000';
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) if (q.isDark(r, c)) x.fillRect(X + off + c * cell, Y + off + r * cell, cell, cell);
    return true;
  } catch (e) {
    return false;
  }
}
// bottom band: app name + address on the left, QR code on the right
function drawQRFooter(x, W, H, line) {
  const url = cardUrl(),
    size = 150,
    Y = H - size - 50;
  x.strokeStyle = SHARE_COLORS.line;
  x.lineWidth = 2;
  x.beginPath();
  x.moveTo(64, Y - 26);
  x.lineTo(W - 64, Y - 26);
  x.stroke();
  const hasQR = drawQR(x, W - 64 - size, Y, size, url);
  x.textAlign = 'left';
  x.fillStyle = SHARE_COLORS.ink;
  x.font = `700 40px ${SHARE_FONT}`;
  x.fillText('하나마루', 64, Y + 48);
  x.fillStyle = SHARE_COLORS.muted;
  const maxW = W - 64 - size - 40 - 64;
  let ls = 28;
  x.font = `500 ${ls}px ${SHARE_FONT}`;
  while (ls > 20 && x.measureText(line).width > maxW) x.font = `500 ${--ls}px ${SHARE_FONT}`;
  while (line.length > 4 && x.measureText(line).width > maxW) line = line.slice(0, -2) + '…';
  x.fillText(line, 64, Y + 92);
  if (url) {
    let fs = 28;
    const u = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    x.font = `600 ${fs}px ${SHARE_FONT}`;
    while (fs > 18 && x.measureText(u).width > maxW) x.font = `600 ${--fs}px ${SHARE_FONT}`;
    x.fillStyle = SHARE_COLORS.ai;
    x.fillText(u, 64, Y + 134);
  }
  if (hasQR) {
    x.textAlign = 'right';
    x.fillStyle = SHARE_COLORS.muted;
    x.font = `500 20px ${SHARE_FONT}`;
    x.fillText('카메라로 찍으면 열려요', W - 64, Y + size + 32);
    x.textAlign = 'left';
  }
}

// ---- ui/help.js ----
'use strict';
/* ---------- help, tutorial, first-visit tips ---------- */
const MODE_HELP = {
  mycard: '택시 목적지·알레르기·예약 이름처럼 빈칸을 채워 나만의 카드를 만들고, 화면 가득 보여 줘요.',
  emycard: '택시 목적지·알레르기·예약 이름처럼 빈칸을 채워 나만의 카드를 만들고, 화면 가득 보여 줘요.',
  reader: '아이폰 텍스트 인식으로 복사한 일본어를 붙여넣으면 후리가나·단어 뜻·한국음을 달아 줘요.',
  diary: '주제를 보고 일본어로 한 문장을 써요. AI가 틀린 곳을 고치고, 더 자연스러운 표현과 이유를 한국어로 알려 줘요. 하루 3번까지.',
  ediary: '주제를 보고 영어로 한 문장을 써요. AI가 틀린 곳을 고치고, 더 자연스러운 표현과 이유를 한국어로 알려 줘요. 하루 3번까지.',
  aichat: 'AI가 점원·친구 역할을 맡아 실제처럼 대화해요. 힌트와 대화 후 첨삭도 받을 수 있어요.',
  eaichat: 'AI가 점원·친구 역할을 맡아 실제처럼 대화해요. 힌트와 대화 후 첨삭도 받을 수 있어요.',
  kansai: '오사카·교토에서 자주 듣는 사투리(간사이벤)의 뜻을 맞히고 표준어와 비교해요.',
  weak: '연습별·세부 영역별 정답률을 보여 주고, 약한 곳만 골라 바로 연습할 수 있어요.',
  kpart: "'친구를 만나다'는 友達に会う처럼, 한국어 조사를 그대로 옮기면 틀리는 곳만 모았어요.",
  koexp: "'수고하세요', '화이팅'처럼 일본어로 딱 옮겨지지 않는 한국어 표현을 일본에서는 어떻게 말하는지 정리했어요.",
  sign: '일본 여행에서 보는 메뉴판·간판·역 안내를 읽어요. 실제 간판 모양으로 보여 줘요.',
  trip: '출발 날짜를 넣으면 여행 문장과 간판을 하루치씩 나눠 줘요. 홈 화면에 D-day가 떠요.',
  etrip: '출발 날짜를 넣으면 여행 영어 문장을 하루치씩 나눠 줘요. 홈 화면에 D-day가 떠요.',
  hj: '한국 한자음을 보고 일본어 음독을 골라요. 받침 ㄱ→く, ㄴ·ㅁ→ん, ㄹ→つ, ㅇ→장음 규칙만 알아도 많이 맞혀요.',
  hjw: '학교 → がっこう처럼 한국어와 한자가 같은 단어의 일본어 읽기를 맞혀요. 소리가 바뀌는 곳(っ, 탁음)을 조심하세요.',
  hjr: '한국 한자음과 일본어 음독 사이의 규칙을 실제 비율과 함께 정리했어요. 한국음으로 한자를 찾아볼 수도 있어요.',
  kwrite: '히라가나·가타카나를 흐린 견본 위에 손가락으로 따라 써요. 번호 순서가 획순이에요. 채점은 없어요.',
  flash: '단어 카드를 뒤집어 보고 알아요 / 몰라요만 눌러요. 몰라요는 복습에 다시 나와요.',
  eflash: '영단어 카드를 뒤집어 보고 알아요 / 몰라요만 눌러요. 몰라요는 복습에 다시 나와요.',
  wasei: 'サラリーマン처럼 일본에서 만든 영어가 영어권에서는 뭐라고 하는지 맞혀요.',
  etrap: "'그와 결혼했어요'를 married with him으로, '배 안 고파요?'에 Yes라고 하기 쉬워요. 한국어를 그대로 옮기면 틀리는 곳만 모았어요.",
  kong: '핸드폰, 아이쇼핑처럼 한국에서 만든 영어를 원어민이 쓰는 말로 바꿔요.',
  jtrav: '여행에서 바로 쓰는 문장 카드예요. 보여주기를 누르면 화면 가득 띄우고 읽어 줘요.',
  etrav: '여행에서 바로 쓰는 영어 문장 카드예요. 보여주기를 누르면 화면 가득 띄우고 읽어 줘요.',
  kana: '히라가나·가타카나를 보고 발음을 알파벳으로 쓰거나, 발음을 보고 글자를 써요. 위의 설정 줄을 누르면 방향과 범위를 바꿀 수 있어요.',
  kconf: 'シ/ツ, ぬ/め처럼 모양이 비슷한 글자끼리 묶어서 구별해요.',
  kanji: '기초 한자 95자의 뜻(훈음)과, 그 한자가 들어간 단어의 읽는 법을 골라요.',
  kspeed: '60초 동안 글자를 보고 발음을 최대한 많이 골라요. 최고 기록이 남아요.',
  word: '일본어 단어를 보고 뜻을 한국어로 써요. 설정에서 4지선다로 바꿀 수 있고, ? 버튼을 누르면 읽는 법이 보여요.',
  loan: '가타카나로 쓴 외래어를 읽고 원래 영어 단어를 골라요.',
  conj: '동사를 ます형·て형·ない형·た형으로 바꿔요. 틀린 보기는 흔한 실수로 만들었어요.',
  cnt: '本·枚·匹처럼 물건마다 달라지는 세는 말과 날짜·월·요일 읽기를 연습해요. 3本(さんぼん)처럼 소리가 바뀌는 곳이 핵심이에요.',
  wspeed: '60초 동안 일본어 단어 뜻을 최대한 많이 골라요.',
  sent: '한국어 문장을 보고 알맞은 일본어를 3개 중에서 골라요. ? 버튼으로 보기의 읽는 법을 볼 수 있어요.',
  jb: '블록을 순서대로 눌러 일본어 문장을 만들어요. 필요 없는 블록이 하나 섞여 있어요.',
  part: '문장 속 빈칸에 들어갈 조사(は·が·を·に…)를 골라요.',
  gram: 'N5 핵심 문법을 쓴 문장을 골라요. 설명은 자료 탭의 문법 노트에 있어요.',
  pol: '존댓말(です·ます)을 친구에게 쓰는 반말로, 반말을 존댓말로 바꿔요. 설정에서 방향을 고를 수 있어요.',
  jdlg: '상황별 대화를 이어 가요. 상대의 말을 듣고, 내 차례에는 목표에 맞는 말을 3개 중에서 골라요.',
  jl: '일본어 문장을 듣고 뜻을 골라요. 아이폰 무음 모드에서는 소리가 나지 않아요.',
  jd: '일본어 문장을 듣고 그대로 받아써요. 앱 키패드나 아이폰 일본어 키보드로 입력해요.',
  jsh: '문장을 듣고 소리 내어 따라 말해요. 녹음해서 원어민 발음과 번갈아 들어 볼 수 있어요.',
  jn: '가격·시간·숫자를 듣고 숫자로 써요. 문제가 계속 새로 만들어져요.',
  jlen: 'おばさん/おばあさん, きて/きって처럼 소리 길이·っ·탁음만 다른 단어를 듣고 구별해요. 이어폰을 쓰면 더 잘 들려요.',
  today: '오늘 푼 문제, 처음 본 문제, 틀린 문제를 모아 보여 줘요. 틀린 것만 바로 다시 풀 수 있어요.',
  course: '하루 2~3개 과제로 기초 30일, 이어서 N4·실전 30일을 순서대로 익히는 코스예요. 레벨 테스트로 시작할 날을 추천받을 수 있어요.',
  wrongs: '최근 7일·30일 동안 틀린 문제를 많이 틀린 순서로 모았어요. 종류별로 바로 다시 풀 수 있어요.',
  jauto: '문장을 일본어 → 한국어 순서로 계속 읽어 줘요. 이동할 때 틀어 두고 들어 보세요.',
  eauto: '문장을 영어 → 한국어 순서로 계속 읽어 줘요. 이동할 때 틀어 두고 들어 보세요.',
  eprep: 'in/on/at처럼 헷갈리는 전치사를 문장 속 빈칸에서 골라요.',
  etense: '시간 표현을 보고 알맞은 시제와 동사 형태를 골라요.',
  ephr: 'pick up, find out 같은 구동사를 문장 속 빈칸에서 골라요.',
  chart: '50음도 표예요. 글자를 누르면 발음을 듣고, 익힌 정도를 색으로 볼 수 있어요.',
  jlist: '전체 단어를 검색하고 즐겨찾기하거나 내 단어를 추가할 수 있어요.',
  elist: '전체 영단어를 검색하고 즐겨찾기하거나 내 단어를 추가할 수 있어요.',
  gnote: 'N5 문법 32개의 만드는 법과 예문이에요. 그 문법 퀴즈를 바로 풀 수 있어요.',
  stats: '달력, 최근 7일 그래프, 영역별로 익힌 정도를 보여 줘요. 결과 카드도 여기서 만들어요.',
  badges: '목표를 채우면 배지를 받아요. 진행 정도가 막대로 보여요.',
  ew: '영어 단어를 보고 뜻을 쓰거나, 뜻을 보고 영어를 써요. 4지선다로 바꿀 수도 있어요.',
  irr: '불규칙 동사의 과거형과 과거분사를 골라요.',
  espeed: '60초 동안 영단어 뜻을 최대한 많이 골라요.',
  es: '한국어 문장을 보고 알맞은 영어 문장을 골라요.',
  eb: '단어 블록을 순서대로 눌러 영어 문장을 만들어요.',
  edlg: '상황별 영어 대화를 이어 가요. 내 차례에는 목표에 맞는 말을 골라요.',
  el: '영어 문장을 듣고 뜻을 골라요.',
  ed: '영어 문장을 듣고 받아써요. 대소문자와 문장부호는 채점하지 않아요.',
  esh: '영어 문장을 듣고 따라 말해요. 녹음해서 비교할 수 있어요.',
  enn: '가격·시간·숫자를 영어로 듣고 숫자로 써요.',
  mp: 'ship/sheep처럼 비슷한 영어 발음을 듣고 구별해요.'
};
if (!S.seen || typeof S.seen !== 'object') S.seen = { tour: 0, tips: {} };
if (!S.seen.tips) S.seen.tips = {};
function addTip(mod) {
  if (S.seen.tips[mod] || !MODE_HELP[mod]) return;
  const sec = view.querySelector('section.mod');
  if (!sec) return;
  const anchor = sec.querySelector('.modes');
  const el = document.createElement('div');
  el.className = 'tip';
  el.setAttribute('role', 'note');
  el.innerHTML = `<span class="tip-i" aria-hidden="true">i</span><p>${esc(MODE_HELP[mod])}</p><div class="tip-a"><button type="button" class="btn quiet" data-tiphelp>사용 안내</button><button type="button" class="btn" data-tipok>알겠어요</button></div>`;
  if (anchor) anchor.after(el);
  else sec.prepend(el);
  el.addEventListener('click', e => {
    e.stopPropagation();
    const b = e.target.closest('button');
    if (!b) return;
    if ('tiphelp' in b.dataset) {
      openHelp('modes');
      return;
    }
    S.seen.tips[mod] = 1;
    save();
    el.remove();
  });
}
const TAB_HELP = {
  home: "'오늘 공부 시작' 버튼 하나로 복습 → 코스 → 단어 카드를 이어서 해요. 코스 진행, 고정한 연습도 여기 있어요.",
  learn: '문자·단어·문장 연습, 그리고 한국음 한자·조사 함정 같은 한국인 맞춤 연습',
  talk: '여행 카드·여행 D-day·메뉴판 읽기·한국어 표현, 대화와 듣기·발음 연습',
  play: '오미쿠지·카드 뽑기·스탬프 지도·게임·친구 대결',
  ref: '오답 노트·오늘 요약·코스·50음도·단어장·문법 노트·기록',
  elearn: '영단어·불규칙 동사·콩글리시, 문장·전치사·시제·구동사',
  etalk: '여행 카드·여행 D-day, 대화와 듣기·발음 연습',
  eplay: '포춘 쿠키·카드 뽑기·스탬프 지도·게임·친구 대결',
  eref: '오답 노트·오늘 요약·코스·단어장·기록'
};
function helpHTML() {
  const tabs = tabList().filter(([t]) => t !== 'home');
  const modeList = tabs
    .map(
      ([t, l]) =>
        `<div class="h-tab"><b>${l} 탭</b>${tabModes(t)
          .map(m => `<p><span class="h-m">${MODE_LABEL[m]}</span>${esc(MODE_HELP[m] || '')}</p>`)
          .join('')}</div>`
    )
    .join('');
  const sec = (id, title, body, open) =>
    `<details class="h-sec" id="h-${id}" ${open ? 'open' : ''}><summary>${title}</summary><div class="h-body">${body}</div></details>`;
  return `<div class="sheet-h"><b>사용 안내</b><button type="button" class="icon-btn" data-close aria-label="닫기">${XICON}</button></div>
  <div class="h-scroll">
  <div class="h-quick"><button type="button" class="btn primary" data-h="tour">튜토리얼 다시 보기</button><button type="button" class="btn" data-h="course">30일 코스 보기</button></div>
  ${sec('start', '처음이라면 이렇게 시작하세요', `<ol class="steps"><li>이미 조금 안다면 <b>레벨 테스트</b>(20문제)로 시작할 날을 추천받아요. 처음이라면 홈의 <b>오늘 공부 시작</b>을 누르세요. 코스 1일차부터 알아서 이어져요. 하루 15~20분이면 충분해요.</li><li>하루 목표(기본 20문제)를 채우면 빨간 동그라미(하나마루)가 생겨요.</li><li>다음 날부터도 <b>오늘 공부 시작</b> 하나면 돼요. 복습할 문제와 코스 다음 분량을 알아서 섞어 줘요.</li><li>아이폰이라면 <b>홈 화면에 추가</b>해서 앱처럼 쓰세요. (아래 '설치·업데이트' 참고)</li></ol><p>설정(목표·효과음·테마·백업)은 맨 위 <b>톱니바퀴</b> 버튼에 있어요.</p>`, true)}
  ${sec(
    'screen',
    '화면 구성',
    `<p>맨 위 오른쪽에서 <b>일본어 / 영어</b>를 바꿔요. 기록은 언어별로 따로 쌓여요.</p><p>맨 아래 탭을 누르면 연습 목록이 카드로 나와요. 카드를 누르면 그 연습이 열리고, 왼쪽 위 <b>‹</b>로 목록에 돌아가요. 카드의 <b>☆</b>를 누르면 홈과 목록 맨 위에 고정돼요. 맨 위 <b>돋보기</b>로 단어·문법·표현·간판·한자를 한 번에 찾을 수 있어요.</p><div class="h-tabs">${tabList()
      .map(([t, l]) => `<p><span class="h-m">${l}</span>${esc(TAB_HELP[t] || '')}</p>`)
      .join('')}</div><p>문제 위의 회색 요약 줄을 누르면 범위·방향·표기(한자+가나 / 가나만) 같은 설정이 펼쳐져요.</p>`
  )}
  ${sec('solve', '문제 푸는 법', `<ul class="h-list"><li><b>?</b> 버튼: 읽는 법이나 힌트를 보여 줘요. 처음엔 숨겨져 있어요.</li><li><b>모르겠어요</b>: 정답을 바로 보여 주고, 그 문제는 나중에 다시 나와요.</li><li><b>맞은 걸로 처리</b>: 직접 쓴 답이 사실상 맞는데 오답 처리됐을 때 눌러요.</li><li><b>문제가 이상해요</b>: 신고 내용이 복사돼요. 카톡으로 앱 만든 사람에게 보내 주세요.</li><li>일본어 입력 문제에는 <b>앱 키패드</b>가 나와요. ゛는 탁점(か→が), ゜는 반탁점(は→ぱ), 小는 작은 글자(つ→っ, や→ゃ)예요.</li><li>맞히면 자동으로 다음 문제로 넘어가요. 홈의 설정에서 끌 수 있어요.</li></ul>`)}
  ${sec('modes', '연습 방식 한눈에 보기', modeList)}
  ${sec('review', '복습은 이렇게 돌아가요', `<p>틀린 문제는 바로 다시 나오고, 맞힌 문제는 <b>1일 → 3일 → 7일 → 14일 → 30일</b> 뒤에 다시 나와요. 잊어버릴 때쯤 다시 보는 방식이에요.</p><p>홈의 <b>오늘의 복습</b>에 오늘 다시 볼 문제 수가 나와요. 각 연습의 설정에서 '틀린 것만', '오늘 복습'을 고를 수도 있어요.</p><p>두 번 연속 맞히면 '익힘'으로 세요. 자료 탭의 <b>오늘 요약</b>에서 오늘 틀린 문제만 모아 다시 풀 수 있어요.</p>`)}
  ${sec('course', '학습 코스 · 레벨 테스트', `<p>${S.lang === 'ja' ? '기초 30일(히라가나 → 가타카나 → 단어·문법 → 상황별 대화)과 N4 30일(N4 문법·단어·한자, 가능형·의지형)' : '기초 30일(단어 → 문장 → 불규칙 동사 → 상황별 대화)과 실전 30일(전치사·시제·구동사와 대화)'}, 모두 60일 코스예요. 하루 2~3개 과제로 이어져요. 과제를 끝까지 풀면 체크되고, 하루치를 다 끝내면 다음 날 과제가 홈에 나와요.</p><p>날짜를 놓쳐도 괜찮아요. 하루에 여러 날치를 해도 되고, 끝낸 과제를 다시 해도 돼요. 일본어와 영어 코스는 따로 진행돼요.</p><p><b>레벨 테스트</b>는 코스 화면이나 설정에서 할 수 있어요. 추천받은 날부터 시작하면 그 앞의 과제는 끝낸 것으로 표시돼요.</p>`)}
  ${sec('today', '오늘 할 일 · 미션 · 오답 노트', `<p>홈의 <b>오늘 할 일</b>에 코스 과제, 복습할 문제, 오늘의 미션 3개가 모여 있어요. 미션을 하나 끝낼 때마다 경험치 30, 3개를 모두 끝내면 카드 뽑기권을 받아요.</p><p><b>오답 노트</b>(자료 탭)에는 최근 7일·30일 동안 틀린 문제가 많이 틀린 순서로 모여요. 종류별로 바로 다시 풀 수 있어요.</p><p>월요일부터 수요일까지는 홈에 <b>지난주 리포트</b>가 떠요. 지지난주와 비교한 문제 수, 정답률, 많이 공부한 것을 보여 주고 이미지로 공유할 수 있어요.</p><p>설날·벚꽃·여름 축제·할로윈·가을·크리스마스 기간에는 <b>시즌 이벤트</b>가 열려서 한정 카드와 특별 운세가 나와요.</p>`)}
  ${sec('sound', '소리가 안 나거나 녹음이 안 될 때', `<ul class="h-list"><li>아이폰 옆의 <b>무음 스위치</b>가 켜져 있으면 소리가 나지 않아요.</li><li>발음은 아이폰에 들어 있는 음성을 써요. 설정 → 손쉬운 사용 → 읽기 및 말하기 → 음성에서 일본어(Kyoko 등)를 받아 두면 더 자연스러워요.</li><li>너무 빠르면 홈의 설정에서 <b>천천히 발음</b>을 켜세요.</li><li>따라 말하기 녹음은 Safari나 홈 화면 앱에서 마이크 권한을 허용해야 해요. 녹음은 기기에 저장되지 않아요.</li></ul>`)}
  ${sec('backup', '기록 저장과 백업', `<p>학습 기록은 <b>이 기기의 이 브라우저</b>에만 저장돼요. 다른 사람과 섞이지 않고, 서버로 보내지 않아요.</p><p>휴대폰을 바꾸거나 Safari 데이터를 지우기 전에, 홈 맨 아래 <b>백업 코드 복사</b>를 눌러 메모 앱이나 '카톡 나에게 보내기'에 보관하세요. 새 기기에서 <b>코드로 복원</b>에 붙여 넣으면 돼요.</p><p>Safari로 연 것과 홈 화면 앱은 저장 공간이 따로일 수 있어요. 홈 화면 앱으로 옮길 때도 백업 코드를 쓰면 돼요.</p>`)}
  ${sec('install', '설치·업데이트', `<ol class="steps"><li>Safari에서 앱 주소를 열어요.</li><li>아래쪽 공유 버튼(네모에 위쪽 화살표)을 눌러요.</li><li>'홈 화면에 추가'를 누르면 앱 아이콘이 생겨요.</li></ol><p>새 버전이 나오면 화면 아래에 <b>"새 버전이 나왔어요 · 업데이트"</b>가 떠요. 눌러도 기록은 그대로예요.</p>`)}
  ${sec('play', '레벨·놀이 탭', `<p>문제를 맞히면 <b>경험치 10</b>, 틀려도 3이 쌓여요. 대화를 끝내거나 코스 과제를 마치면 더 받아요. 레벨이 오르면 칭호가 바뀌고 카드 뽑기권을 받아요. 레벨은 일본어·영어 따로 쌓여요.</p><p>연속으로 맞히면 <b>콤보</b>가 쌓이고, 10콤보마다 보너스 경험치를 받아요. 효과음은 홈의 설정에서 끌 수 있어요.</p><ul class="h-list"><li><b>${S.lang === 'ja' ? '오미쿠지' : '포춘 쿠키'}</b>: 하루 한 번 운세를 뽑고 운세 문장 뜻을 맞혀요.</li><li><b>단어 카드</b>: 뽑기권으로 재미있는 표현 카드를 뽑아 도감을 채워요. 뽑기권은 하루 목표·레벨 업·코스 하루치 완료로 받아요.</li><li><b>여행 도장</b>: 대화 연습을 끝까지 하면 그 도시에 도장이 찍혀요.</li><li><b>${S.lang === 'ja' ? '가나 비' : '단어 비'} · 짝 맞추기</b>: 짧게 즐기는 미니게임이에요.</li><li><b>친구 대결</b>: 같은 10문제를 링크로 보내 친구와 점수를 겨뤄요.</li></ul>`)}
  ${sec(
    'voice',
    '발음을 더 자연스럽게 (고음질 목소리 받기)',
    `<p>발음은 휴대폰에 들어 있는 목소리로 나와요. 아이폰은 <b>고음질 목소리</b>를 따로 받을 수 있어요(무료).</p>
    <ol class="steps"><li>아이폰 <b>설정</b> 앱 → <b>손쉬운 사용</b> → <b>읽기 및 말하기</b> → <b>음성</b>으로 가요.</li><li><b>일본어</b>를 누르고 <b>Kyoko</b>나 <b>O-ren</b> 같은 목소리에서 <b>(향상됨)</b>이나 <b>(고품질)</b>을 골라 내려받아요. 영어는 <b>영어</b> → Ava, Samantha 등.</li><li>하나마루를 완전히 닫았다가 다시 열고, <b>설정 → 발음 목소리</b>에서 '고음질' 표시가 붙은 목소리를 골라요. '자동'이면 가장 좋은 목소리를 알아서 골라요.</li></ol>
    <p class="note">메뉴 이름은 iOS 버전에 따라 조금 다를 수 있어요. 안드로이드는 설정 → 텍스트 음성 변환에서 Google 음성 데이터를 받으면 돼요.</p>`
  )}
  ${sec(
    'remind',
    '매일 공부 알림 만들기 (아이폰)',
    `<p>웹앱은 스스로 알림을 보낼 수 없어서, 아이폰 <b>단축어</b> 앱으로 매일 같은 시간에 알림이 뜨게 만들어요. 한 번만 설정하면 돼요.</p>
    <div class="ios-steps">
      <div class="ios-step"><span class="n">1</span><div class="ios-mock"><div class="ios-bar">단축어</div><div class="ios-tabs"><i>단축어</i><i class="on">자동화</i><i>갤러리</i></div></div><p><b>단축어</b> 앱을 열고 아래쪽 <b>자동화</b> 탭을 눌러요.</p></div>
      <div class="ios-step"><span class="n">2</span><div class="ios-mock"><div class="ios-bar">새로운 자동화</div><div class="ios-row on">특정 시간</div><div class="ios-row">알람</div><div class="ios-row">수면</div></div><p><b>+</b>(새로운 자동화)를 누르고 <b>특정 시간</b>을 골라요.</p></div>
      <div class="ios-step"><span class="n">3</span><div class="ios-mock"><div class="ios-bar">언제</div><div class="ios-row">시간 <b>오후 9:00</b></div><div class="ios-row">반복 <b>매일</b></div><div class="ios-row on">즉시 실행</div></div><p>공부할 시간을 정하고 <b>매일</b>, <b>즉시 실행</b>을 고른 뒤 <b>다음</b>을 눌러요.</p></div>
      <div class="ios-step"><span class="n">4</span><div class="ios-mock"><div class="ios-bar">동작</div><div class="ios-row">알림</div><div class="ios-row on">알림 보기</div></div><p><b>새로운 빈 자동화</b> → <b>동작 추가</b>에서 '알림'을 검색해 <b>알림 보기</b>를 골라요.</p></div>
      <div class="ios-step"><span class="n">5</span><div class="ios-mock"><div class="ios-bar">알림 보기</div><div class="ios-note">하나마루 공부할 시간! 오늘의 미션 확인하기</div></div><p>알림 문구를 적고 <b>완료</b>. 이제 매일 그 시간에 알림이 떠요.</p></div>
    </div>
    <p class="note">메뉴 이름은 iOS 버전에 따라 조금 다를 수 있어요. 알림을 누르면 단축어 앱이 열리니, 하나마루는 홈 화면 아이콘으로 열어 주세요. 더 간단하게는 <b>미리 알림</b> 앱에 '하나마루'를 매일 반복으로 등록해도 돼요.</p>`
  )}
  ${sec('privacy', '개인정보 · 앱 응원', `${privacyHTML()}${donateLinks().length ? `<p>앱이 도움이 됐다면 설정(톱니바퀴)의 <b>앱 응원하기</b>에서 후원할 수 있어요. 후원과 상관없이 모든 기능은 무료예요.</p>` : ''}`)}
  ${sec('friends', '친구와 함께 쓰기', `<p>홈의 <b>결과 카드</b>를 누르면 오늘 푼 문제, 연속 학습, 최근 7일 기록이 담긴 이미지가 만들어져요. 길게 눌러 저장하거나 공유 버튼으로 카톡에 보내세요.</p><p>60초 도전 결과는 '결과 복사'로 글로 보낼 수 있어요.</p>`)}
  <p class="note" style="text-align:center;padding:8px 0 4px">하나마루 · 버전 ${esc(APP_VERSION.startsWith('__') ? '미리보기' : APP_VERSION.slice(0, 8))}</p>
  </div>`;
}
function openHelp(section) {
  const el = openSheet(helpHTML(), 'help');
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-h]');
    if (!b) return;
    if (b.dataset.h === 'tour') {
      closeSheet();
      openTour();
    } else if (b.dataset.h === 'course') {
      closeSheet();
      startMod('course');
    }
  });
  if (section) {
    const d = el.querySelector('#h-' + section);
    if (d) {
      d.open = true;
      setTimeout(() => {
        try {
          d.scrollIntoView({ block: 'start' });
        } catch (e) {}
      }, 30);
    }
  }
}
const TOUR = [
  {
    h: '하나마루에 오신 걸 환영해요',
    p: '일본어·영어 회화 기초를 하루 15분씩 익히는 앱이에요. 맞히면 선생님이 그려 주는 빨간 동그라미, <b>하나마루</b>가 생겨요.',
    art: 'mark'
  },
  {
    h: '언어와 탭',
    p: '맨 위에서 <b>일본어 / 영어</b>를 바꿔요. 맨 아래 탭을 누르면 연습 목록이 카드로 나오고, 카드를 누르면 시작해요. <b>☆</b>로 자주 쓰는 연습을 고정하고, <b>돋보기</b>로 무엇이든 찾을 수 있어요.',
    art: 'tabs'
  },
  {
    h: '문제 풀 때 알아 두면 좋아요',
    p: '<b>?</b> 버튼은 읽는 법·힌트, <b>모르겠어요</b>는 정답 보기예요. 직접 쓴 답이 맞는데 틀렸다고 나오면 <b>맞은 걸로 처리</b>를 누르세요.',
    art: 'card'
  },
  {
    h: '복습은 앱이 챙겨요',
    p: '틀린 문제는 바로 다시, 맞힌 문제는 1·3·7일 뒤에 다시 나와요. 홈의 <b>오늘 공부 시작</b> 버튼이 복습까지 알아서 챙겨 줘요. 기록은 이 기기에만 저장되니 가끔 <b>백업 코드</b>를 복사해 두세요.',
    art: 'cal'
  },
  {
    h: '코스로 시작해 볼까요?',
    p: '무엇부터 할지 고민할 필요 없이, 홈의 <b>오늘 공부 시작</b>만 누르면 코스 과제와 복습이 이어서 나와요. 사용법은 언제든 위쪽의 <b>?</b> 버튼에서 다시 볼 수 있어요.',
    art: 'course',
    last: true
  }
];
const TOUR_ART = {
  mark: `<svg viewBox="0 0 120 120" class="t-mark" aria-hidden="true"><path d="M60 13c28 0 47 20 46 47-1 26-22 46-47 45C33 104 13 84 14 58 15 32 34 14 62 15M61.5 36c13.5.7 22.5 10.9 21.4 23.6-1.1 12.4-11.6 21.7-24 20.6-12-1.1-20.2-11.2-19.1-22.9 1.1-10.1 9.4-16.5 18.7-15.7 8.6.7 13.9 7.5 13.1 15.4-.7 6.4-6 10.9-12 10.1" fill="none" stroke="var(--shu)" stroke-width="5" stroke-linecap="round"/></svg>`,
  tabs: `<div class="t-tabs"><div class="t-top"><span>하나마루</span><span class="t-seg"><i>일본어</i><i>영어</i></span></div><div class="t-modes"><i class="on">단어 퀴즈 ☆</i><i>플래시카드 ☆</i><i>한국음 한자 ★</i></div><div class="t-bar">${['홈', '배우기', '회화·여행', '놀이', '자료'].map((l, i) => `<i class="${i === 1 ? 'on' : ''}">${l}</i>`).join('')}</div></div>`,
  card: `<div class="t-card"><span class="t-q">?</span><span class="jp" lang="ja">猫</span><div class="t-btns"><i>모르겠어요</i><i class="on">맞은 걸로 처리</i></div></div>`,
  cal: `<div class="t-cal">${[1, 3, 7, 14, 30].map(n => `<span><b class="num">${n}일</b>뒤</span>`).join('<i>→</i>')}</div>`,
  course: `<div class="t-course">${[
    ['1', '히라가나 첫걸음'],
    ['2', '히라가나 た·な·は행'],
    ['3', '히라가나 ま~わ행']
  ]
    .map(([n, t], i) => `<p class="${i === 0 ? 'on' : ''}"><b class="num">${n}일차</b>${t}</p>`)
    .join('')}</div>`
};
let tourI = 0;
function openTour() {
  tourI = 0;
  renderTour();
}
function renderTour() {
  const s = TOUR[tourI];
  const html = `<div class="tour-in"><button type="button" class="btn quiet t-skip" data-t="skip">${s.last ? '닫기' : '건너뛰기'}</button>
    <div class="t-art">${TOUR_ART[s.art] || ''}</div><h2>${s.h}</h2><p>${s.p}</p>
    <div class="t-dots">${TOUR.map((_, i) => `<i class="${i === tourI ? 'on' : ''}"></i>`).join('')}</div>
    <div class="row t-nav">${tourI > 0 ? `<button type="button" class="btn" data-t="prev">이전</button>` : ''}${s.last ? `<button type="button" class="btn" data-t="look">둘러볼게요</button><button type="button" class="btn primary" data-t="course">코스 시작</button>` : `<button type="button" class="btn primary" data-t="next">다음</button>`}</div>
    ${s.last ? `<button type="button" class="btn quiet" data-t="ltest">조금 알아요 · 레벨 테스트로 시작</button>` : ''}</div>`;
  const cur = document.querySelector('#sheet .sheet.tour');
  if (cur) {
    cur.innerHTML = html;
    return;
  }
  const el = openSheet(html, 'tour');
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-t]');
    if (!b) return;
    const a = b.dataset.t;
    if (a === 'next') {
      tourI = Math.min(TOUR.length - 1, tourI + 1);
      renderTour();
    } else if (a === 'prev') {
      tourI = Math.max(0, tourI - 1);
      renderTour();
    } else {
      S.seen.tour = 1;
      S.seen.v9 = 1;
      save();
      closeSheet();
      if (a === 'ltest') {
        startLevelTest();
        return;
      }
      if (a === 'course') {
        go('home');
        setTimeout(() => {
          const c = view.querySelector('.course-card');
          if (c)
            try {
              c.scrollIntoView({ block: 'center', behavior: 'smooth' });
            } catch (e) {}
        }, 60);
      }
    }
  });
}
document.getElementById('helpBtn').addEventListener('click', () => openHelp());
function homeExtraClick(b) {
  if (b.dataset.ctask) {
    const [l, di, ti] = b.dataset.ctask.split(':');
    startTask(l, +di, +ti);
    return true;
  }
  if ('gocourse' in b.dataset) {
    startMod('course');
    return true;
  }
  if ('share' in b.dataset) {
    shareCard();
    return true;
  }
  if ('help' in b.dataset) {
    openHelp();
    return true;
  }
  return false;
}

// ---- play/setup.js ----
'use strict';
/* ================= play tab: modes, labels, saved state ================= */
const PLAY = new Set(['omikuji', 'cards', 'stamps', 'rain', 'match', 'vs']);
const LBL_LANG = { ja: { omikuji: '오미쿠지', rain: '가나 비' }, en: { omikuji: '포춘 쿠키', rain: '단어 비' } };
const modeLabel = m => (LBL_LANG[S.lang] || {})[m] || MODE_LABEL[m] || m;
Object.assign(MODE_LABEL, {
  omikuji: '오늘의 운세',
  cards: '단어 카드',
  stamps: '여행 도장',
  rain: '비 게임',
  match: '짝 맞추기',
  vs: '친구 대결'
});
for (const [k, v] of Object.entries({
  xp: { ja: 0, en: 0 },
  cards: { ja: {}, en: {} },
  tickets: { ja: 0, en: 0 },
  omi: { ja: {}, en: {} },
  omiDays: { ja: {}, en: {} },
  gbest: {},
  cardStart: {},
  name: ''
}))
  if (S[k] === undefined || S[k] === null || (typeof v === 'object' && typeof S[k] !== 'object')) S[k] = clone(v);
for (const k of ['xp', 'tickets']) for (const l of ['ja', 'en']) if (typeof S[k][l] !== 'number') S[k][l] = 0;
for (const k of ['cards', 'omi', 'omiDays']) for (const l of ['ja', 'en']) if (!S[k][l] || typeof S[k][l] !== 'object') S[k][l] = {};
if (S.set.sfx === undefined) S.set.sfx = true;

// ---- features/sound.js ----
'use strict';
/* ---------- sound effects (WebAudio, no files) ---------- */
let AC = null;
function audio() {
  try {
    if (!AC) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      AC = new C();
    }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  } catch (e) {
    return null;
  }
}
function tone(a, f, t, d, type = 'sine', g = 0.13, f2) {
  const o = a.createOscillator(),
    v = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, a.currentTime + t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, a.currentTime + t + d);
  v.gain.setValueAtTime(0.0001, a.currentTime + t);
  v.gain.exponentialRampToValueAtTime(g, a.currentTime + t + 0.012);
  v.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t + d);
  o.connect(v);
  v.connect(a.destination);
  o.start(a.currentTime + t);
  o.stop(a.currentTime + t + d + 0.02);
}
function sfx(kind) {
  if (!S.set.sfx) return;
  const a = audio();
  if (!a) return;
  try {
    if (kind === 'ok') {
      tone(a, 880, 0, 0.12, 'sine', 0.12);
      tone(a, 1320, 0.08, 0.22, 'sine', 0.1);
    } else if (kind === 'ng') {
      tone(a, 260, 0, 0.16, 'triangle', 0.12, 200);
      tone(a, 196, 0.12, 0.22, 'triangle', 0.1, 160);
    } else if (kind === 'combo') {
      [784, 988, 1175, 1568].forEach((f, i) => tone(a, f, i * 0.06, 0.18, 'sine', 0.11));
    } else if (kind === 'lvl') {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(a, f, i * 0.09, i === 4 ? 0.5 : 0.2, 'triangle', 0.12));
    } else if (kind === 'pop') {
      tone(a, 660, 0, 0.08, 'sine', 0.1, 990);
    } else if (kind === 'card') {
      [1047, 1319, 1568, 2093, 2637].forEach((f, i) => tone(a, f, i * 0.05, 0.25, 'sine', 0.07));
    } else if (kind === 'stamp') {
      tone(a, 140, 0, 0.12, 'square', 0.08, 90);
      tone(a, 880, 0.1, 0.2, 'sine', 0.08);
    } else if (kind === 'shake') {
      for (let i = 0; i < 6; i++) tone(a, 300 + Math.random() * 200, i * 0.12, 0.06, 'square', 0.03);
    } else if (kind === 'flip') {
      tone(a, 520, 0, 0.06, 'sine', 0.06, 780);
    }
  } catch (e) {}
}

// ---- features/levels.js ----
'use strict';
/* ---------- XP, levels, titles ---------- */
const TITLES = {
  ja: [
    [1, '일본어 새싹'],
    [3, '히라가나 견습생'],
    [5, '가타카나 탐험가'],
    [8, '단어 수집가'],
    [11, '편의점 주문 가능'],
    [14, '라멘집 단골'],
    [17, '길 묻기 성공'],
    [20, '호텔 체크인 마스터'],
    [24, '이자카야 수다쟁이'],
    [28, '여행 회화 달인'],
    [33, '일본 친구 사귀기'],
    [40, '하나마루 선생님']
  ],
  en: [
    [1, '영어 새싹'],
    [3, 'ABC 견습생'],
    [5, '단어 수집가'],
    [8, '카페 주문 가능'],
    [11, '길 묻기 성공'],
    [14, '쇼핑 프로'],
    [17, '공항 프리패스'],
    [20, '스몰토크 입문'],
    [24, '여행 회화 달인'],
    [28, '현지인 친구'],
    [33, '프리토킹 도전자'],
    [40, '하나마루 선생님']
  ]
};
const lvNeed = L => 80 + 20 * L;
function levelOf(xp) {
  let L = 1;
  xp = Math.max(0, xp | 0);
  while (xp >= lvNeed(L)) {
    xp -= lvNeed(L);
    L++;
  }
  return { L, cur: xp, need: lvNeed(L) };
}
const titleOf = (lang, L) => {
  let t = TITLES[lang][0][1];
  for (const [l, n] of TITLES[lang]) if (L >= l) t = n;
  return t;
};
const nextTitle = (lang, L) => TITLES[lang].find(([l]) => l > L);
let LAST_GAIN = 0;
function gainXP(n, lang) {
  lang = lang || S.lang;
  if (!n) return;
  const dd = S.days[today()] || (S.days[today()] = { n: 0, c: 0 });
  dd.x = (dd.x || 0) + n;
  const before = levelOf(S.xp[lang]).L;
  S.xp[lang] += n;
  LAST_GAIN = n;
  const after = levelOf(S.xp[lang]).L;
  if (after > before) {
    S.tickets[lang] += 1;
    save();
    const newT = titleOf(lang, after) !== titleOf(lang, before);
    setTimeout(() => levelUp(lang, after, newT), 350);
    checkBadges();
  }
}
function levelUp(lang, L, newTitle) {
  sfx('lvl');
  const old = document.getElementById('lvup');
  if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'lvup';
  el.id = 'lvup';
  el.setAttribute('role', 'status');
  el.innerHTML = `<span class="lv-k">LEVEL UP</span><b>Lv.${L}</b><span>${newTitle ? '새 칭호 · ' : ''}${esc(titleOf(lang, L))}</span><small>카드 뽑기권 +1</small>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  el.addEventListener('click', () => el.remove());
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 400);
  }, 3200);
  if (curTab() === 'home') renderHome();
}
function levelHTML() {
  const lang = S.lang;
  const { L, cur, need } = levelOf(S.xp[lang]);
  const nt = nextTitle(lang, L);
  return `<div class="lvl"><div class="lv-badge"><small>Lv</small><b class="num">${L}</b></div><div class="lv-main"><b>${esc(titleOf(lang, L))}</b><div class="meter"><i style="width:${(cur / need) * 100}%"></i></div><small class="num">다음 레벨까지 ${need - cur} XP${nt ? ` · Lv.${nt[0]} '${esc(nt[1])}'` : ''}</small></div></div>`;
}

/* ---------- combo ---------- */
let COMBO = 0;
function onAnswer(ok) {
  const prev = COMBO;
  COMBO = ok ? COMBO + 1 : 0;
  if (ok) missionEvent('combo', { n: COMBO });
  if (!ok) {
    sfx('ng');
    return;
  }
  const mile = COMBO >= 10 && COMBO % 10 === 0;
  sfx(mile || (COMBO >= 5 && COMBO % 5 === 0) ? 'combo' : 'ok');
  if (mile) {
    gainXP(20);
    setTimeout(() => toast(`${COMBO} 콤보! 보너스 +20 XP`), 200);
  }
  const card = document.getElementById('card');
  if (!card) return;
  if (LAST_GAIN) {
    const f = document.createElement('span');
    f.className = 'xpf';
    f.textContent = `+${LAST_GAIN} XP`;
    card.appendChild(f);
    setTimeout(() => f.remove(), 1100);
  }
  if (COMBO >= 3) {
    const c = document.createElement('span');
    c.className = 'combo c' + (COMBO >= 20 ? 3 : COMBO >= 10 ? 2 : 1);
    c.innerHTML = `<b class="num">${COMBO}</b>콤보`;
    card.appendChild(c);
  }
}

// ---- play/cards.js ----
'use strict';
/* ---------- tickets & cards (gacha) ---------- */
const RARE = ['N', 'R', 'SR', 'SSR'];
const RARE_W = { N: 55, R: 28, SR: 13, SSR: 4 };
const RARE_KO = { N: '일반', R: '레어', SR: '슈퍼 레어', SSR: '전설' };
const CARDS = { ja: typeof GACHA_JA !== 'undefined' ? GACHA_JA : [], en: typeof GACHA_EN !== 'undefined' ? GACHA_EN : [] };
function grantTicket(lang, why) {
  S.tickets[lang] += 1;
  save();
  setTimeout(() => toast(`${why} · 카드 뽑기권 +1`), 900);
}
function drawCard(lang) {
  const pool = CARDS[lang];
  if (!pool.length || S.tickets[lang] < 1) return null;
  let c = seasonPickCard(lang);
  if (!c) {
    let r = Math.random() * 100,
      rar = 'N';
    for (const k of RARE) {
      r -= RARE_W[k];
      if (r <= 0) {
        rar = k;
        break;
      }
    }
    let cand = pool.filter(c => c.r === rar);
    if (!cand.length) cand = pool;
    const fresh = cand.filter(c => !S.cards[lang][c.id]);
    if (fresh.length && Math.random() < 0.7) cand = fresh;
    c = cand[(Math.random() * cand.length) | 0];
  }
  S.tickets[lang] -= 1;
  const dup = !!S.cards[lang][c.id];
  S.cards[lang][c.id] = (S.cards[lang][c.id] || 0) + 1;
  save();
  if (dup) gainXP(20, lang);
  checkBadges();
  return { c, dup };
}
const cardCount = lang => Object.keys(S.cards[lang]).filter(id => allCards(lang).some(c => c.id === id)).length;
function cardFront(c, lang, big) {
  const ja = lang === 'ja';
  return `<div class="gc-face gc-front r-${c.r}"><span class="gc-r">${c.r} · ${RARE_KO[c.r]}</span><span class="gc-cat">${esc(c.cat || '')}</span>
    <b class="gc-w ${ja ? 'jp' : 'en'}" lang="${lang}" style="font-size:${big ? Math.max(22, Math.min(40, 300 / Math.max(4, [...c.w].length))) : 16}px">${esc(c.w)}</b>${ja && c.rd && c.rd !== c.w ? `<span class="gc-rd jp" lang="ja">${esc(c.rd)}</span>` : ''}<span class="gc-m">${esc(c.m)}</span></div>`;
}
function cardDetail(lang, id) {
  const c = allCards(lang).find(x => x.id === id);
  if (!c) return;
  const ja = lang === 'ja';
  openSheet(
    `<div class="sheet-h"><b>단어 카드</b><button type="button" class="icon-btn" data-close aria-label="닫기">${XICON}</button></div>
    <div class="h-scroll"><div class="gcard big"><div class="gc-in">${cardFront(c, lang, true)}</div></div>
    <div class="panel" style="padding:14px;display:grid;gap:8px">
      <div class="row">${spkBtn(ja ? c.rd || c.w : c.w, '발음 듣기', lang)}<span class="note" style="align-self:center">${S.cards[lang][id] > 1 ? `${S.cards[lang][id]}장 보유` : ''}</span></div>
      ${c.lit ? `<p class="fb-sub">직역: ${esc(c.lit)}</p>` : ''}
      ${c.ex ? `<div class="ex"><p class="${ja ? 'ex-jp' : 'ex-en'}" lang="${lang}">${esc(c.ex)}</p>${ja && c.exr ? `<p class="ex-rd" lang="ja">${esc(c.exr)}</p>` : ''}<p class="ex-ko">${esc(c.exko || '')}</p>${spkBtn(c.ex, '예문 듣기', lang)}</div>` : ''}
      ${c.tip ? `<p style="margin:0;font-size:14px">${esc(c.tip)}</p>` : ''}
    </div></div>`,
    'card'
  );
}
function renderCards() {
  const pb = document.getElementById('pbody');
  const lang = S.lang;
  const pool = CARDS[lang];
  if (!S.cardStart[lang]) {
    S.cardStart[lang] = 1;
    S.tickets[lang] += 1;
    save();
    setTimeout(() => toast('첫 방문 선물 · 카드 뽑기권 +1'), 300);
  }
  const have = cardCount(lang);
  const tk = S.tickets[lang];
  pb.innerHTML = `<div class="chart">
    <div class="gacha"><div class="gacha-top"><div><b class="num">뽑기권 ${tk}장</b><small>수집 ${have} / ${allCards(lang).length}</small></div><button class="btn primary" data-gdraw ${tk ? '' : 'disabled'}>카드 뽑기</button></div>
      <div id="gstage" class="gstage"></div>
      <p class="note">뽑기권은 하루 목표를 채우면 1장, 레벨이 오르면 1장, 30일 코스 하루치를 끝내면 1장 생겨요. ${lang === 'ja' ? '오미쿠지에서 대길이 나와도 1장!' : '포춘 쿠키에서 아주 좋은 운이 나와도 1장!'}</p></div>
    <div id="gGrid" class="chart">${cardGridHTML(lang)}</div>
  </div>`;
  pb.onclick = null;
  bindCards(pb, lang, pool);
}
function cardGridHTML(lang) {
  const pool = CARDS[lang];
  const byR = RARE.map(r => [r, pool.filter(c => c.r === r)]);
  const s = activeSeason();
  const sc = SEASON_CARDS[lang].filter(c => S.cards[lang][c.id] || (s && c.season === s.id));
  const seasonBox = sc.length
    ? `<section class="chart-box season-box"><div class="cal-head"><h2 class="sec-title" style="margin:0">시즌 한정${s ? ' · ' + esc((seasonMsg(s.id) || {}).title || '') : ''}</h2><span class="note num">${sc.filter(c => S.cards[lang][c.id]).length} / ${sc.length}</span></div>
    <div class="gc-grid">${sc.map(c => (S.cards[lang][c.id] ? `<button type="button" class="gc-mini r-${c.r} sea" data-gcard="${esc(c.id)}"><b class="${lang === 'ja' ? 'jp' : 'en'}" lang="${lang}">${esc(c.w)}</b><small>${esc(c.m)}</small>${S.cards[lang][c.id] > 1 ? `<i class="num">×${S.cards[lang][c.id]}</i>` : ''}</button>` : `<span class="gc-mini none sea r-${c.r}"><b>?</b></span>`)).join('')}</div>${s ? `<p class="note" style="margin-top:8px">${seasonEnd(s)}까지 뽑기에서 일정 확률로 나와요.</p>` : ''}</section>`
    : '';
  return (
    seasonBox +
    `${byR
      .map(
        ([
          r,
          cs
        ]) => `<section class="chart-box"><div class="cal-head"><h2 class="sec-title" style="margin:0">${r} · ${RARE_KO[r]}</h2><span class="note num">${cs.filter(c => S.cards[lang][c.id]).length} / ${cs.length}</span></div>
      <div class="gc-grid">${cs.map(c => (S.cards[lang][c.id] ? `<button type="button" class="gc-mini r-${c.r}" data-gcard="${esc(c.id)}"><b class="${lang === 'ja' ? 'jp' : 'en'}" lang="${lang}">${esc(c.w)}</b><small>${esc(c.m)}</small>${S.cards[lang][c.id] > 1 ? `<i class="num">×${S.cards[lang][c.id]}</i>` : ''}</button>` : `<span class="gc-mini none r-${c.r}"><b>?</b></span>`)).join('')}</div></section>`
      )
      .join('')}`
  );
}
function bindCards(pb, lang, pool) {
  pb.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.gcard) {
      cardDetail(lang, b.dataset.gcard);
      return;
    }
    if ('gdraw' in b.dataset) {
      const res = drawCard(lang);
      if (!res) return;
      b.disabled = true;
      sfx('flip');
      const st = document.getElementById('gstage');
      st.innerHTML = `<div class="gcard draw r-${res.c.r}"><div class="gc-in"><div class="gc-face gc-back"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="${HANAMARU_PATHS[0]}"/><path d="${HANAMARU_PATHS[1]}"/></svg></div>${cardFront(res.c, lang, true)}</div></div><p class="gres" hidden>${res.dup ? '이미 가진 카드예요 · 경험치 +20' : res.c.r === 'SSR' ? '전설 카드! 대단해요' : '새 카드를 얻었어요'}</p>`;
      setTimeout(() => {
        const g = st.querySelector('.gcard');
        if (g) g.classList.add('open');
        sfx(res.c.r === 'SSR' || res.c.r === 'SR' ? 'combo' : 'card');
      }, 700);
      setTimeout(() => {
        const p = st.querySelector('.gres');
        if (p) p.hidden = false;
        const top = document.querySelector('.gacha-top');
        if (top) {
          top.querySelector('b').textContent = `뽑기권 ${S.tickets[lang]}장`;
          top.querySelector('small').textContent = `수집 ${cardCount(lang)} / ${allCards(lang).length}`;
          const bt = top.querySelector('[data-gdraw]');
          if (bt) bt.disabled = S.tickets[lang] < 1;
        }
        const gg = document.getElementById('gGrid');
        if (gg) gg.innerHTML = cardGridHTML(lang);
        st.querySelector('.gcard').addEventListener('click', () => cardDetail(lang, res.c.id));
      }, 1300);
    }
  };
}

// ---- play/stamps.js ----
'use strict';
/* ---------- travel stamps ---------- */
const CITY = {
  ja: [
    [
      'tokyo',
      '東京',
      '도쿄',
      [
        'greet-first-meeting-intro',
        'greet-first-day-office',
        'daily-morning-coworker',
        'social-line-exchange',
        'food-konbini-coffee',
        'shop-clothes-tryon',
        'move-station-transfer'
      ]
    ],
    ['osaka', '大阪', '오사카', ['daily-street-catchup', 'social-dinner-invite', 'food-izakaya-order', 'shop-drugstore-taxfree']],
    ['kyoto', '京都', '교토', ['food-cafe-order', 'sight-shrine-photo', 'move-bus-destination']],
    ['sapporo', '札幌', '삿포로', ['daily-weather-smalltalk', 'shop-konbini-checkout', 'stay-hotel-checkin', 'help-ask-repeat-bus']],
    ['fukuoka', '博多', '하카타', ['food-ramen-ticket', 'stay-room-problem', 'phone-restaurant-reserve']],
    ['naha', '那覇', '나하', ['move-taxi-ride', 'stay-hotel-luggage', 'phone-hotel-inquiry']],
    ['nagoya', '名古屋', '나고야', ['daily-weekend-story', 'food-restaurant-check', 'shop-exchange-size', 'help-lost-way-hotel']],
    ['yokohama', '横浜', '요코하마', ['greet-new-neighbor', 'social-weekend-plans-friend', 'phone-hair-salon', 'help-train-lost-item']],
    ['narita', '成田', '나리타', ['stay-airport-checkin', 'stay-immigration']],
    ['hakone', '箱根', '하코네', ['social-hobby-hiking', 'sight-onsen-rules']],
    ['nara', '奈良', '나라', ['sight-tourist-info', 'health-pharmacy-headache', 'help-koban-lost-wallet']],
    ['hiroshima', '広島', '히로시마', ['sight-museum-ticket', 'phone-reservation-change', 'health-medicine-instructions']],
    ['sendai', '仙台', '센다이', ['greet-long-time-no-see', 'stay-checkout-taxi', 'health-hospital-reception']],
    ['kanazawa', '金沢', '가나자와', ['food-kaiten-sushi', 'move-ask-way-museum', 'health-doctor-symptoms']]
  ],
  en: [
    ['newyork', 'New York', '뉴욕', ['sight-museum-tickets', 'move-subway-ticket', 'food-steak-restaurant', 'shop-discount-checkout']],
    ['london', 'London', '런던', ['greet-old-friend', 'daily-weather-chat', 'sight-city-tour', 'move-bus-driver']],
    [
      'losangeles',
      'Los Angeles',
      '로스앤젤레스',
      ['food-fastfood-to-go', 'food-truck-taco-order', 'sight-photo-request', 'move-taxi-ride']
    ],
    [
      'sanfrancisco',
      'San Francisco',
      '샌프란시스코',
      ['social-hobbies', 'food-cafe-latte-order', 'move-street-directions', 'help-phone-charge']
    ],
    ['chicago', 'Chicago', '시카고', ['greet-class-intro', 'daily-morning-chat', 'food-split-bill-tip', 'health-pharmacy-cold-medicine']],
    ['seattle', 'Seattle', '시애틀', ['daily-weekend-plans', 'social-making-plans', 'health-clinic-checkin', 'health-prescription-pickup']],
    ['boston', 'Boston', '보스턴', ['greet-party-meet', 'health-doctor-symptoms', 'phone-doctor-appointment', 'help-lost-ask-directions']],
    ['honolulu', 'Honolulu', '호놀룰루', ['stay-hotel-checkin', 'shop-gift-wrap', 'stay-luggage-after-checkout', 'stay-late-checkout']],
    ['toronto', 'Toronto', '토론토', ['greet-new-neighbor', 'daily-catching-up', 'social-exchange-contacts', 'social-dinner-decline']],
    [
      'vancouver',
      'Vancouver',
      '밴쿠버',
      ['stay-airline-checkin', 'stay-immigration-interview', 'sight-visitor-center', 'stay-room-problem']
    ],
    ['sydney', 'Sydney', '시드니', ['shop-clothing-size', 'shop-return-item', 'phone-restaurant-booking', 'phone-change-reservation']],
    [
      'dublin',
      'Dublin',
      '더블린',
      ['phone-hotel-front-desk', 'food-allergy-tell-server', 'help-report-lost-wallet', 'help-ask-speak-slowly']
    ]
  ]
};
(function fixCities() {
  for (const lang of ['ja', 'en']) {
    const m = lang === 'ja' ? 'jdlg' : 'edlg';
    const ids = new Set(DLG[m].map(d => d.id));
    const used = new Set();
    for (const c of CITY[lang]) {
      c[3] = c[3].filter(id => ids.has(id));
      c[3].forEach(id => used.add(id));
    }
    const rest = DLG[m].filter(d => !used.has(d.id));
    rest.forEach((d, i) => CITY[lang][i % CITY[lang].length][3].push(d.id));
  }
})();
const dlgByCity = (lang, c) => c[3].map(id => DLG[lang === 'ja' ? 'jdlg' : 'edlg'].find(d => d.id === id)).filter(Boolean);
const dlgDone = d => !!S.stats[d.key];
function cityOf(lang, dlgId) {
  return CITY[lang].find(c => c[3].includes(dlgId));
}
function onDialogueDone(mod, d, first, perfect) {
  const lang = mod === 'jdlg' ? 'ja' : 'en';
  gainXP(perfect ? 30 : 20, lang);
  missionEvent('dialogue');
  if (!first) return;
  const c = cityOf(lang, d.id);
  if (!c) return;
  const ds = dlgByCity(lang, c);
  const n = ds.filter(dlgDone).length;
  setTimeout(() => {
    sfx('stamp');
    toast(n === ds.length ? `${c[2]} 도장 완성! (${n}/${ds.length})` : `${c[2]} 도장을 받았어요 (${n}/${ds.length})`);
  }, 900);
  checkBadges();
}
const stampTotal = lang => CITY[lang].reduce((a, c) => a + dlgByCity(lang, c).filter(dlgDone).length, 0);
function stampSVG(lang, c, size) {
  const ds = dlgByCity(lang, c);
  const n = ds.filter(dlgDone).length;
  const full = n === ds.length && n > 0;
  const rot = ((c[0].charCodeAt(0) * 7 + c[0].length * 13) % 17) - 8;
  const name = c[1];
  const ja = lang === 'ja';
  const fs = ja ? (name.length >= 3 ? 24 : 30) : name.length > 10 ? 11 : name.length > 7 ? 13 : 15;
  if (!n)
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" class="stamp none" aria-hidden="true"><circle cx="50" cy="50" r="44"/><text x="50" y="${ja ? 60 : 55}" text-anchor="middle" font-size="${ja ? fs : fs}" class="${ja ? 'jp' : ''}">${esc(name)}</text></svg>`;
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" class="stamp ${full ? 'full' : 'part'}" style="transform:rotate(${rot}deg)" aria-hidden="true"><circle cx="50" cy="50" r="45" class="o"/><circle cx="50" cy="50" r="38" class="i"/>
    <text x="50" y="${ja ? 58 : 55}" text-anchor="middle" font-size="${fs}" font-weight="700" class="${ja ? 'jp' : ''}">${esc(name)}</text><text x="50" y="78" text-anchor="middle" font-size="9" class="sm">${full ? (ja ? '完' : 'COMPLETE') : n + ' / ' + ds.length}</text><text x="50" y="30" text-anchor="middle" font-size="8" class="sm">${ja ? 'HANAMARU' : 'HANAMARU'}</text></svg>`;
}
let STAMP_SEL = null;
function renderStamps() {
  const pb = document.getElementById('pbody');
  const lang = S.lang;
  const M = lang === 'ja' ? MAP_JA : MAP_EN;
  const cities = CITY[lang];
  if (!STAMP_SEL || !cities.some(c => c[0] === STAMP_SEL)) STAMP_SEL = null;
  const tot = cities.reduce((a, c) => a + dlgByCity(lang, c).length, 0);
  const got = stampTotal(lang);
  const fullN = cities.filter(c => {
    const ds = dlgByCity(lang, c);
    return ds.length && ds.every(dlgDone);
  }).length;
  const dot = c => {
    const [x, y] = M.c[c[0]] || [0, 0];
    const ds = dlgByCity(lang, c);
    const n = ds.filter(dlgDone).length;
    const st = n === ds.length && n ? 'full' : n ? 'part' : 'none';
    return `<g class="pin ${st} ${STAMP_SEL === c[0] ? 'sel' : ''}" data-city="${c[0]}" role="button" aria-label="${c[2]}"><circle cx="${x}" cy="${y}" r="11" class="hit"/><circle cx="${x}" cy="${y}" r="${st === 'none' ? 4 : 5.5}" class="dot"/>${STAMP_SEL === c[0] ? `<circle cx="${x}" cy="${y}" r="10" class="ring"/>` : ''}</g>`;
  };
  const sel = STAMP_SEL && cities.find(c => c[0] === STAMP_SEL);
  pb.innerHTML = `<div class="chart">
    <div class="kpis" style="margin-top:0"><div class="kpi"><b class="num">${got}</b><span>받은 도장 / ${tot}</span></div><div class="kpi"><b class="num">${fullN}</b><span>완성한 도시 / ${cities.length}</span></div><div class="kpi"><b class="num">${tot ? Math.round((got / tot) * 100) : 0}%</b><span>여행 진행</span></div></div>
    <div class="map-box"><svg viewBox="0 0 ${M.w} ${M.h}" class="map" role="img" aria-label="${lang === 'ja' ? '일본 지도' : '세계 지도'}"><path d="${M.d}" class="land"/>${M.oki ? `<rect x="${M.box[0]}" y="${M.box[1]}" width="${M.box[2]}" height="${M.box[3]}" rx="6" class="inset"/><path d="${M.oki}" class="land"/><text x="${M.box[0] + 6}" y="${M.box[1] + 14}" font-size="10" class="lbl">오키나와</text>` : ''}${cities.map(dot).join('')}${
      sel
        ? (() => {
            const [x, y] = M.c[sel[0]];
            const left = x > M.w * 0.62;
            return `<text x="${left ? x - 14 : x + 14}" y="${y + 4}" text-anchor="${left ? 'end' : 'start'}" class="sel-lbl">${esc(sel[2])}</text>`;
          })()
        : ''
    }</svg>
      <p class="note">${lang === 'ja' ? '회화 탭의 대화 연습을 끝까지 하면 그 대화가 열리는 도시에 도장이 찍혀요.' : '회화 탭의 영어 대화를 끝까지 하면 그 도시에 도장이 찍혀요.'} 지도의 점이나 아래 도장을 눌러 보세요.</p></div>
    ${
      sel
        ? `<section class="chart-box city-box"><div class="city-h">${stampSVG(lang, sel, 84)}<div><b style="font-size:19px">${esc(sel[2])}</b><span class="note">${lang === 'ja' ? `<span class="jp">${esc(sel[1])}</span> · ` : ''}대화 ${dlgByCity(lang, sel).length}개</span></div></div>
      <div class="wl">${dlgByCity(lang, sel)
        .map(
          d =>
            `<div class="wl-i" data-st="${dlgDone(d) ? 'done' : ''}"><button class="wl-main" data-sdlg="${esc(d.id)}"><span class="w" style="font-size:16px;font-weight:600">${esc(d.title)}</span><span class="s">${SCENES[d.sc] || ''} · ${dlgDone(d) ? '도장 받음 · 다시 하기' : '대화 시작'}</span></button><span></span></div>`
        )
        .join('')}</div></section>`
        : ''
    }
    <div class="stamp-grid">${cities
      .map(c => {
        const ds = dlgByCity(lang, c);
        const n = ds.filter(dlgDone).length;
        return `<button type="button" class="stamp-cell ${STAMP_SEL === c[0] ? 'sel' : ''}" data-city="${c[0]}">${stampSVG(lang, c, 74)}<span>${esc(c[2])}</span><small class="num">${n} / ${ds.length}</small></button>`;
      })
      .join('')}</div>
  </div>`;
  pb.onclick = e => {
    const g = e.target.closest('[data-city]');
    if (g) {
      STAMP_SEL = STAMP_SEL === g.dataset.city ? null : g.dataset.city;
      renderStamps();
      if (STAMP_SEL) {
        const cb = document.querySelector('.city-box');
        if (cb)
          try {
            cb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          } catch (err) {}
      }
      return;
    }
    const b = e.target.closest('[data-sdlg]');
    if (b) {
      const m = lang === 'ja' ? 'jdlg' : 'edlg';
      const d = DLG[m].find(x => x.id === b.dataset.sdlg);
      if (d) {
        DG = null;
        startMod(m);
        startDlg(m, d);
      }
    }
  };
}

// ---- play/omikuji.js ----
'use strict';
/* ---------- omikuji / fortune cookie ---------- */
const OMI = { ja: typeof OMI_JA !== 'undefined' ? OMI_JA : [], en: typeof FORT_EN !== 'undefined' ? FORT_EN : [] };
const OMI_RANK = {
  ja: [
    ['大吉', 15, '대길', '최고의 운이에요!'],
    ['中吉', 20, '중길', '꽤 좋은 하루예요'],
    ['小吉', 20, '소길', '작은 행운이 있어요'],
    ['吉', 20, '길', '좋은 일이 생길 거예요'],
    ['末吉', 15, '말길', '뒤로 갈수록 좋아지는 운'],
    ['凶', 10, '흉', '조심하면 괜찮아요']
  ],
  en: [
    ['great', 20, '아주 좋은 운', '최고의 하루가 될 거예요!'],
    ['good', 35, '좋은 운', '좋은 일이 기다리고 있어요'],
    ['small', 30, '작은 행운', '작지만 기분 좋은 일이 생겨요'],
    ['careful', 15, '조심하면 좋은 날', '천천히 가면 괜찮아요']
  ]
};
function drawOmi(lang) {
  const ranks = OMI_RANK[lang];
  let r = Math.random() * ranks.reduce((a, x) => a + x[1], 0),
    rank = ranks[0][0];
  for (const x of ranks) {
    r -= x[1];
    if (r <= 0) {
      rank = x[0];
      break;
    }
  }
  let pool = OMI[lang].filter(o => o.f === rank);
  if (!pool.length) pool = OMI[lang];
  const i = OMI[lang].indexOf(pool[(Math.random() * pool.length) | 0]);
  const words = lang === 'ja' ? BASE_JP : BASE_EN;
  const lw = words[(Math.random() * words.length) | 0];
  const nums = [];
  while (nums.length < 6) {
    const n = (1 + Math.random() * 45) | 0;
    if (!nums.includes(n)) nums.push(n);
  }
  nums.sort((a, b) => a - b);
  missionEvent('omikuji');
  S.omi[lang] = { d: today(), i, no: (1 + Math.random() * 100) | 0, ans: null, tied: false, lw: lw.key, nums, order: null };
  S.omiDays[lang][today()] = 1;
  save();
  checkBadges();
}
function renderOmikuji(anim) {
  const pb = document.getElementById('pbody');
  const lang = S.lang;
  const ja = lang === 'ja';
  const o = S.omi[lang];
  const drawn = o && o.d === today() && OMI[lang][o.i];
  if (!drawn) {
    pb.innerHTML = `<div class="omi-wrap">${
      ja
        ? `<svg viewBox="0 0 140 190" class="omi-box" aria-hidden="true"><path d="M70 6 128 34v122l-58 28-58-28V34z" class="wood"/><path d="M70 6v178M12 34l58 28 58-28" class="edge"/><rect x="50" y="78" width="40" height="78" rx="3" class="lab"/><text x="70" y="98" text-anchor="middle" class="lt">御</text><text x="70" y="122" text-anchor="middle" class="lt">神</text><text x="70" y="146" text-anchor="middle" class="lt">籤</text><rect x="64" y="0" width="12" height="16" rx="2" class="stick"/></svg>`
        : `<svg viewBox="0 0 200 140" class="omi-box cookie" aria-hidden="true"><path d="M20 90C20 40 70 18 110 26c40 8 72 40 70 70-30-26-62-30-80-12-18-20-52-14-80 6z" class="ck"/><path d="M100 84c-6 18-4 34 6 46" class="ckl"/></svg>`
    }
      <h2 class="omi-t">${ja ? '오늘의 오미쿠지' : '오늘의 포춘 쿠키'}</h2>
      <p class="note">${ja ? '일본 신사에서 뽑는 운세 종이예요. 하루에 한 번 뽑을 수 있고, 오늘의 일본어 한 문장이 들어 있어요.' : '쿠키를 깨면 오늘의 운세와 영어 한 문장이 나와요. 하루에 한 번 열 수 있어요.'}</p>
      <button class="btn primary" data-omi="draw" style="min-width:200px">${ja ? '흔들어서 뽑기' : '쿠키 깨기'}</button>
      <p class="note num">지금까지 ${Object.keys(S.omiDays[lang]).length}번 뽑았어요</p></div>`;
    pb.onclick = e => {
      const b = e.target.closest('[data-omi=draw]');
      if (!b) return;
      b.disabled = true;
      const box = pb.querySelector('.omi-box');
      box.classList.add('shake');
      sfx('shake');
      setTimeout(() => {
        drawOmi(lang);
        renderOmikuji(true);
        const oo = S.omi[lang];
        const rk = OMI[lang][oo.i].f;
        sfx(rk === '大吉' || rk === 'great' ? 'combo' : 'card');
        if (rk === '大吉' || rk === 'great') {
          grantTicket(lang, ja ? '대길 보너스' : '아주 좋은 운 보너스');
        }
      }, 950);
    };
    return;
  }
  const it = OMI[lang][o.i];
  const rk = OMI_RANK[lang].find(x => x[0] === it.f) || OMI_RANK[lang][0];
  if (!o.order) {
    o.order = shuffle([{ t: it.k, ok: true }, ...(it.d || []).slice(0, 2).map(t => ({ t, ok: false }))]);
    save();
  }
  const lw = (ja ? BASE_JP : BASE_EN).find(w => w.key === o.lw);
  const quiz = `<div class="omi-q"><p class="lbl" style="margin:0">이 문장의 뜻은?</p><div class="opts">${o.order
    .map((x, i) => {
      const st = o.ans === null ? '' : x.ok ? 'ok' : i === o.ans ? 'ng' : 'dim';
      return `<button type="button" class="opt" data-oq="${i}" ${st ? `data-state="${st}" aria-disabled="true"` : ''}><span class="n">${i + 1}</span><span>${esc(x.t)}</span></button>`;
    })
    .join('')}</div>
    ${o.ans !== null ? `<p class="note" style="color:${o.order[o.ans].ok ? 'var(--ok)' : 'var(--ng)'};font-weight:600">${o.order[o.ans].ok ? '정답! 경험치 +15' : '아쉬워요. 내일 또 도전해요'}</p>` : ''}</div>`;
  const bad = it.f === '凶' || it.f === 'careful';
  const sea = activeSeason();
  pb.innerHTML = `<div class="omi-wrap"><div class="omi-slip ${ja ? '' : 'paper'} ${anim ? 'unfold' : ''} ${o.tied ? 'tied' : ''} ${sea ? 'sea-' + sea.id : ''}">${sea ? `<span class="omi-sea">${ja ? esc(sea.ja) + '限定' : esc((seasonMsg(sea.id) || {}).title || '')}</span>` : ''}
      ${ja ? `<span class="omi-no num">第${o.no}番</span><b class="omi-rank jp" lang="ja">${it.f}</b>` : `<b class="omi-rank en">${esc(rk[2])}</b>`}
      <span class="omi-rk">${ja ? esc(rk[2]) + ' · ' : ''}${esc(rk[3])}</span>
      <span class="omi-topic">오늘의 ${esc(it.topic || '운세')}</span>
      <p class="omi-s ${ja ? 'jp' : 'en'}" lang="${lang}">${esc(it.s)}</p>${ja && it.r ? `<p class="omi-r jp" lang="ja">${esc(it.r)}</p>` : ''}
      <div>${spkBtn(it.s, '문장 듣기', lang)}</div>
      ${ja ? '' : `<p class="omi-nums num">Lucky numbers · ${o.nums.join(' · ')}</p>`}
    </div>
    ${quiz}
    ${lw ? `<div class="lucky"><span class="lbl">행운의 단어</span><b class="${ja ? 'jp' : 'en'}" lang="${lang}">${esc(lw.w)}</b>${ja && lw.r !== lw.w ? `<span class="jp" lang="ja">${esc(lw.r)}</span>` : ''}<span class="note">${esc(lw.m[0])}</span>${spkBtn(ja ? lw.r : lw.w, '', lang)}</div>` : ''}
    ${bad && ja && !o.tied ? `<button class="btn" data-omi="tie">나쁜 운은 신사 나무에 묶어 두기</button>` : ''}
    ${o.tied ? `<p class="note" style="text-align:center">오미쿠지를 나무에 묶었어요. 나쁜 운은 여기 두고 가요!</p>` : ''}
    <p class="note" style="text-align:center">내일 다시 ${ja ? '뽑을' : '열'} 수 있어요 · 지금까지 ${Object.keys(S.omiDays[lang]).length}번</p></div>`;
  if (anim && S.set.autoSpeak) speak(it.s, lang);
  pb.onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.dataset.speak) return;
    if (b.dataset.oq !== undefined && o.ans === null) {
      o.ans = +b.dataset.oq;
      const ok = o.order[o.ans].ok;
      save();
      if (ok) {
        gainXP(15, lang);
        save();
      }
      sfx(ok ? 'ok' : 'ng');
      renderOmikuji(false);
    } else if (b.dataset.omi === 'tie') {
      o.tied = true;
      save();
      sfx('stamp');
      renderOmikuji(false);
    }
  };
}

// ---- play/rain.js ----
'use strict';
/* ---------- mini game: rain ---------- */
let RG = null;
function stopGames() {
  if (RG) {
    RG.run = false;
    if (RG.raf) cancelAnimationFrame(RG.raf);
    RG = null;
  }
  if (MG && MG.t) {
    clearTimeout(MG.t);
  }
}
const RAIN_TYPES = {
  ja: [
    ['h', '히라가나'],
    ['k', '가타카나'],
    ['w', '단어']
  ],
  en: [['ew', '영단어']]
};
function rainItem(type, used) {
  if (type === 'h' || type === 'k') {
    const pool = KANA.filter(x => x.set !== 'yoon');
    const x = pool[(Math.random() * pool.length) | 0];
    const ch = type === 'k' ? toKata(x.h) : x.h;
    return {
      show: ch,
      ans: x.alts[0],
      opts: () => shuffle([x.alts[0], ...shuffle([...new Set(pool.map(y => y.alts[0]).filter(a => a !== x.alts[0]))]).slice(0, 3)]),
      cls: 'jp'
    };
  }
  const words = (type === 'w' ? BASE_JP : BASE_EN).filter(w => [...(type === 'w' ? w.r : w.w)].length <= 7);
  const w = words[(Math.random() * words.length) | 0];
  return {
    show: type === 'w' ? w.r : w.w,
    ans: w.m[0],
    opts: () => {
      const o = [w.m[0]];
      for (const y of shuffle(words)) {
        if (o.length >= 4) break;
        if (!y.m.some(m => w.m.includes(m)) && !o.includes(y.m[0])) o.push(y.m[0]);
      }
      return shuffle(o);
    },
    cls: type === 'w' ? 'jp' : 'en',
    word: true
  };
}
function renderRain() {
  stopGames();
  const pb = document.getElementById('pbody');
  const lang = S.lang;
  const types = RAIN_TYPES[lang];
  let ty = S.gbest.rainType && types.some(t => t[0] === S.gbest.rainType) ? S.gbest.rainType : types[0][0];
  const best = S.gbest['rain_' + ty] || 0;
  pb.innerHTML = `<div class="empty" style="text-align:left;justify-items:stretch">
    <p style="margin:0;font-weight:700;font-size:18px">${modeLabel('rain')}</p>
    <p class="note">위에서 떨어지는 ${ty === 'h' || ty === 'k' ? '글자의 발음' : '단어의 뜻'}을 아래 버튼에서 골라요. 가장 아래에 있는 ${ty === 'h' || ty === 'k' ? '글자' : '단어'}(테두리 표시)부터 맞혀야 해요. 바닥에 닿으면 하트가 하나 줄고, 3개를 다 잃으면 끝나요.</p>
    ${types.length > 1 ? `<div class="chips">${types.map(([v, l]) => `<button class="chip" data-rty="${v}" aria-pressed="${v === ty}">${l}</button>`).join('')}</div>` : ''}
    <div class="due-n"><b class="num">${best}</b><span>최고 기록</span></div>
    <button class="btn primary" data-rain="start">시작</button></div>`;
  pb.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.rty) {
      S.gbest.rainType = b.dataset.rty;
      save();
      renderRain();
    } else if (b.dataset.rain === 'start') startRain(ty);
  };
}
function startRain(ty) {
  stopGames();
  const pb = document.getElementById('pbody');
  pb.innerHTML = `<div class="rain-top"><span class="hearts" id="rgH">♥♥♥</span><b class="num" id="rgS">0</b><button class="btn quiet" data-rain="quit" style="min-height:36px;padding:4px 10px">그만하기</button></div>
    <div class="rain-field" id="rgF"><div class="rain-floor"></div></div><div class="opts grid2 rain-opts" id="rgO"></div>`;
  const F = document.getElementById('rgF');
  RG = {
    ty,
    run: true,
    items: [],
    score: 0,
    lives: 3,
    last: performance.now(),
    spawnT: 0,
    tgt: null,
    id: 0,
    H: F.clientHeight || 340,
    W: F.clientWidth || 340
  };
  const spawn = () => {
    const q = rainItem(ty);
    const el = document.createElement('span');
    el.className = 'drop ' + q.cls;
    el.textContent = q.show;
    el.lang = lang2(ty);
    F.appendChild(el);
    const w = q.word ? Math.min(RG.W - 20, Math.max(60, [...q.show].length * (ty === 'ew' ? 13 : 22))) : 48;
    const x = 8 + Math.random() * Math.max(10, RG.W - w - 16);
    el.style.left = x + 'px';
    RG.items.push({ id: ++RG.id, q, el, y: -40 });
  };
  const pickTgt = () => {
    let t = null;
    for (const it of RG.items) if (!t || it.y > t.y) t = it;
    if (t && (!RG.tgt || RG.tgt.id !== t.id)) {
      RG.tgt = t;
      RG.items.forEach(i => i.el.classList.toggle('tgt', i === t));
      RG.opts = t.q.opts();
      document.getElementById('rgO').innerHTML = RG.opts
        .map(
          (o, i) =>
            `<button type="button" class="opt" data-ro="${i}"><span class="${ty === 'h' || ty === 'k' ? 'mono-opt' : ''}">${esc(o)}</span></button>`
        )
        .join('');
    }
    if (!t) {
      RG.tgt = null;
      document.getElementById('rgO').innerHTML = '';
    }
  };
  const step = now => {
    if (!RG || !RG.run) return;
    const dt = Math.min(0.05, (now - RG.last) / 1000);
    RG.last = now;
    const sp = Math.min(130, (RG.ty === 'h' || RG.ty === 'k' ? 34 : 24) + RG.score * 2.2);
    RG.spawnT -= dt * 1000;
    if (RG.spawnT <= 0) {
      spawn();
      RG.spawnT = Math.max(RG.ty === 'h' || RG.ty === 'k' ? 750 : 1300, (RG.ty === 'h' || RG.ty === 'k' ? 2100 : 3000) - RG.score * 45);
    }
    const floor = RG.H - 46;
    for (const it of [...RG.items]) {
      it.y += sp * dt * (it.fast ? 1.6 : 1);
      it.el.style.transform = `translateY(${it.y}px)`;
      if (it.y >= floor) {
        it.el.classList.add('miss');
        RG.items = RG.items.filter(x => x !== it);
        setTimeout(() => it.el.remove(), 300);
        RG.lives--;
        sfx('ng');
        COMBO = 0;
        document.getElementById('rgH').textContent = '♥'.repeat(Math.max(0, RG.lives)) + '♡'.repeat(3 - Math.max(0, RG.lives));
        if (RG.lives <= 0) {
          endRain();
          return;
        }
      }
    }
    pickTgt();
    RG.raf = requestAnimationFrame(step);
  };
  spawn();
  pickTgt();
  RG.raf = requestAnimationFrame(step);
  pb.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.rain === 'quit') {
      endRain();
      return;
    }
    if (b.dataset.ro !== undefined && RG && RG.tgt) {
      const v = RG.opts[+b.dataset.ro];
      const t = RG.tgt;
      if (v === t.q.ans) {
        RG.score++;
        document.getElementById('rgS').textContent = RG.score;
        t.el.classList.add('pop');
        RG.items = RG.items.filter(x => x !== t);
        setTimeout(() => t.el.remove(), 250);
        RG.tgt = null;
        sfx('pop');
        pickTgt();
      } else {
        b.dataset.state = 'ng';
        t.fast = true;
        sfx('ng');
        setTimeout(() => {
          if (b.isConnected) b.removeAttribute('data-state');
        }, 350);
      }
    }
  };
}
const lang2 = ty => (ty === 'ew' ? 'en' : 'ja');
function endRain() {
  if (!RG) return;
  const { score, ty } = RG;
  missionEvent('game');
  stopGames();
  const k = 'rain_' + ty;
  const prev = S.gbest[k] || 0;
  const nb = score > prev;
  if (nb) S.gbest[k] = score;
  const xp = score * 3;
  gainXP(xp);
  save();
  checkBadges();
  const pb = document.getElementById('pbody');
  if (!pb) return;
  pb.innerHTML = `<div class="sum"><div class="sum-score"><b class="num">${score}</b><span>개</span></div><p class="sum-msg">${nb && score ? '최고 기록이에요!' : `최고 기록 ${prev}개`} · 경험치 +${xp}</p><div class="row"><button class="btn" data-rain="menu">설정</button><button class="btn primary" data-rain="again">다시 하기</button></div></div>`;
  if (nb && score) sfx('combo');
  pb.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.rain === 'again') startRain(ty);
    else if (b.dataset.rain === 'menu') renderRain();
  };
}

// ---- play/match.js ----
'use strict';
/* ---------- mini game: memory match ---------- */
let MG = null;
const MATCH_TYPES = {
  ja: [
    ['wm', '단어 ↔ 뜻'],
    ['hk', '히라가나 ↔ 가타카나'],
    ['kj', '한자 ↔ 뜻']
  ],
  en: [
    ['wm', '단어 ↔ 뜻'],
    ['irr', '원형 ↔ 과거형']
  ]
};
function matchPairs(ty) {
  if (ty === 'hk') {
    return shuffle(KANA.filter(x => x.set === 'basic'))
      .slice(0, 6)
      .map(x => [x.h, toKata(x.h), 'jp', 'jp']);
  }
  if (ty === 'kj') {
    return shuffle(KANJI)
      .slice(0, 6)
      .map(k => [k.k, k.hun, 'jp', '']);
  }
  if (ty === 'irr') {
    return shuffle(IRR)
      .slice(0, 6)
      .map(x => [x.b, x.p.split('/')[0], 'en', 'en']);
  }
  const lang = S.lang;
  const src = lang === 'ja' ? BASE_JP : BASE_EN;
  const out = [];
  const ms = new Set();
  for (const w of shuffle(src)) {
    if (out.length >= 6) break;
    const m = w.m[0];
    if (ms.has(m) || [...(lang === 'ja' ? (S.set.kanji ? w.w : w.r) : w.w)].length > 8) continue;
    ms.add(m);
    out.push([lang === 'ja' ? (S.set.kanji ? w.w : w.r) : w.w, m, lang === 'ja' ? 'jp' : 'en', '']);
  }
  return out;
}
function renderMatch() {
  stopGames();
  const pb = document.getElementById('pbody');
  const lang = S.lang;
  const types = MATCH_TYPES[lang];
  const ty = S.gbest.matchType && types.some(t => t[0] === S.gbest.matchType) ? S.gbest.matchType : types[0][0];
  const pairs = matchPairs(ty);
  const cards = shuffle(
    pairs.flatMap((p, i) => [
      { p: i, t: p[0], c: p[2] },
      { p: i, t: p[1], c: p[3] }
    ])
  );
  MG = { ty, cards, open: [], done: new Set(), moves: 0, start: 0, lock: false };
  const bk = S.gbest['match_' + lang + '_' + ty];
  pb.innerHTML = `<div class="chart"><div class="chips">${types.map(([v, l]) => `<button class="chip" data-mty="${v}" aria-pressed="${v === ty}">${l}</button>`).join('')}</div>
    <div class="cal-head" style="margin:0"><p class="note">뒤집힌 카드 두 장을 골라 짝을 찾아요.${bk ? ` 최고 기록 ${bk.m}번 · ${bk.s}초` : ''}</p><span class="num" id="mgM" style="font-weight:600">0번</span></div>
    <div class="mgrid">${cards.map((c, i) => `<button type="button" class="mc" data-mc="${i}" aria-label="카드 ${i + 1}"><span class="mc-in"><span class="mc-b"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="${HANAMARU_PATHS[0]}"/><path d="${HANAMARU_PATHS[1]}"/></svg></span><span class="mc-f ${c.c}" ${c.c === 'jp' ? 'lang="ja"' : c.c === 'en' ? 'lang="en"' : ''} style="font-size:${[...c.t].length <= 2 ? 30 : [...c.t].length <= 4 ? 20 : [...c.t].length <= 6 ? 16 : 13}px">${esc(c.t)}</span></span></button>`).join('')}</div>
    <div id="mgEnd"></div></div>`;
  pb.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.mty) {
      S.gbest.matchType = b.dataset.mty;
      save();
      renderMatch();
      return;
    }
    if ('mgagain' in b.dataset) {
      renderMatch();
      return;
    }
    if (b.dataset.mc === undefined || MG.lock) return;
    const i = +b.dataset.mc;
    if (MG.open.includes(i) || MG.done.has(i)) return;
    if (!MG.start) MG.start = Date.now();
    b.classList.add('up');
    sfx('flip');
    MG.open.push(i);
    if (MG.open.length === 2) {
      MG.moves++;
      document.getElementById('mgM').textContent = MG.moves + '번';
      const [a, c] = MG.open;
      if (MG.cards[a].p === MG.cards[c].p) {
        MG.done.add(a);
        MG.done.add(c);
        MG.open = [];
        setTimeout(() => {
          pb.querySelectorAll(`[data-mc="${a}"],[data-mc="${c}"]`).forEach(x => x.classList.add('got'));
          sfx('ok');
        }, 250);
        if (MG.done.size === MG.cards.length) setTimeout(endMatch, 600);
      } else {
        MG.lock = true;
        MG.t = setTimeout(() => {
          pb.querySelectorAll('.mc.up:not(.got)').forEach(x => x.classList.remove('up'));
          MG.open = [];
          MG.lock = false;
        }, 850);
      }
    }
  };
}
function endMatch() {
  if (!MG) return;
  missionEvent('game');
  const lang = S.lang;
  const s = Math.round((Date.now() - MG.start) / 1000);
  const k = 'match_' + lang + '_' + MG.ty;
  const prev = S.gbest[k];
  const nb = !prev || MG.moves < prev.m || (MG.moves === prev.m && s < prev.s);
  if (nb) S.gbest[k] = { m: MG.moves, s };
  const xp = 30 + (MG.moves <= 9 ? 20 : 0);
  gainXP(xp);
  save();
  sfx('combo');
  const end = document.getElementById('mgEnd');
  if (end)
    end.innerHTML = `<div class="sum"><div class="sum-score"><b class="num">${MG.moves}</b><span>번 · ${s}초</span></div><p class="sum-msg">${nb ? '최고 기록이에요!' : `최고 기록 ${prev.m}번 · ${prev.s}초`} · 경험치 +${xp}</p><div class="row"><button class="btn primary" data-mgagain>다시 하기</button></div></div>`;
  try {
    end.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  } catch (e) {}
}

// ---- play/vs.js ----
'use strict';
/* ---------- friend challenge ---------- */
const VS_TYPES = {
  ja: [
    ['jw', '단어'],
    ['js', '문장'],
    ['jk', '문자']
  ],
  en: [
    ['ew', '단어'],
    ['es', '문장']
  ]
};
const VS_NAME = { jw: '일본어 단어', js: '일본어 문장', jk: '일본어 문자', ew: '영단어', es: '영어 문장' };
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function sShuffle(arr, R) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (R() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function vsQuestions(t, seed) {
  const R = rng(seed);
  const qs = [];
  if (t === 'jw' || t === 'ew') {
    const src = t === 'jw' ? BASE_JP_N5 : BASE_EN;
    const picks = sShuffle(src, R).slice(0, 10);
    for (const w of picks) {
      const o = [{ t: w.m[0], ok: true }];
      for (const y of sShuffle(src, R)) {
        if (o.length >= 4) break;
        if (y !== w && !y.m.some(m => w.m.includes(m)) && !o.some(x => x.t === y.m[0])) o.push({ t: y.m[0], ok: false });
      }
      qs.push({
        key: w.key,
        show: t === 'jw' ? w.w : w.w,
        sub: t === 'jw' && w.w !== w.r ? w.r : '',
        cls: t === 'jw' ? 'jp' : 'en',
        ask: '뜻을 고르세요',
        opts: sShuffle(o, R),
        say: t === 'jw' ? w.r : w.w
      });
    }
  } else if (t === 'js' || t === 'es') {
    const src = t === 'js' ? SENTS : EN_SENTS;
    const picks = sShuffle(src, R).slice(0, 10);
    for (const s of picks) {
      const o =
        t === 'js'
          ? [{ t: s.a[0], ok: true }, ...s.d.map(d => ({ t: d[0], ok: false }))]
          : [{ t: s.a, ok: true }, ...s.d.map(d => ({ t: d[0], ok: false }))];
      qs.push({
        key: s.key,
        ko: s.k,
        ask: t === 'js' ? '알맞은 일본어를 고르세요' : '알맞은 영어를 고르세요',
        optCls: t === 'js' ? 'jp' : 'en',
        opts: sShuffle(o, R),
        say: t === 'js' ? s.a[0] : s.a
      });
    }
  } else {
    const pool = KANA.filter(x => x.set !== 'yoon');
    const picks = sShuffle(pool, R).slice(0, 10);
    for (const x of picks) {
      const kata = R() < 0.5;
      const ch = kata ? toKata(x.h) : x.h;
      const o = [{ t: x.alts[0], ok: true }];
      for (const y of sShuffle(pool, R)) {
        if (o.length >= 4) break;
        if (!o.some(z => z.t === y.alts[0])) o.push({ t: y.alts[0], ok: false });
      }
      qs.push({ key: 'k:' + ch, show: ch, cls: 'jp glyphish', ask: '발음을 고르세요', optCls: 'mono-opt', opts: sShuffle(o, R), say: ch });
    }
  }
  return qs;
}
const b64u = {
  enc: s => b64enc(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: s => b64dec(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4))
};
function vsLink(o) {
  const base = location.protocol === 'http:' || location.protocol === 'https:' ? location.href.split('#')[0] : '';
  return base + '#vs=' + b64u.enc(JSON.stringify(o));
}
function parseVS(h) {
  try {
    const m = /[#&]vs=([A-Za-z0-9_-]+)/.exec(h || '');
    if (!m) return null;
    const o = JSON.parse(b64u.dec(m[1]));
    if (!o || !VS_NAME[o.t] || typeof o.s !== 'number') return null;
    o.p = Math.max(0, Math.min(10, o.p | 0));
    o.n = String(o.n || '친구').slice(0, 12);
    if (o.o) {
      o.o.n = String(o.o.n || '친구').slice(0, 12);
      o.o.p = Math.max(0, Math.min(10, o.o.p | 0));
    }
    return o;
  } catch (e) {
    return null;
  }
}
let VS_IN = null,
  VSG = null;
function renderVS() {
  const pb = document.getElementById('pbody');
  const lang = S.lang;
  if (VSG && !VSG.done) return vsPlay();
  if (VSG && VSG.done) return vsResult();
  const types = VS_TYPES[lang];
  const sel = S.gbest.vsType && types.some(t => t[0] === S.gbest.vsType) ? S.gbest.vsType : types[0][0];
  const inv = VS_IN && VS_TYPES[lang].some(t => t[0] === VS_IN.t) ? VS_IN : null;
  pb.innerHTML = `<div class="chart">
    ${inv ? `<div class="vs-in"><span class="lbl">도전장이 왔어요</span><b>${esc(inv.n)}님이 ${VS_NAME[inv.t]} 10문제에서 <span class="num">${inv.p}</span>개 맞혔어요${inv.o ? ` (상대 ${esc(inv.o.n)}: ${inv.o.p}개)` : ''}</b><span class="note">같은 문제를 풀고 점수를 비교해 보세요.</span><button class="btn primary" data-vs="accept">도전 받기</button></div>` : ''}
    <section class="chart-box" style="display:grid;gap:12px"><h2 class="sec-title" style="margin:0">대결 만들기</h2>
      <p class="note">10문제를 먼저 풀고, 결과 링크를 친구에게 보내요. 친구가 링크를 열면 똑같은 문제가 나오고, 끝나면 점수를 비교해요.</p>
      <div class="chips">${types.map(([v, l]) => `<button class="chip" data-vst="${v}" aria-pressed="${v === sel}">${l}</button>`).join('')}</div>
      <label class="vs-name"><span class="note">내 이름 (친구에게 보여요)</span><input id="vsName" type="text" maxlength="12" placeholder="예: 민수" value="${esc(S.name || '')}" autocomplete="off"></label>
      <button class="btn primary" data-vs="new">대결 문제 풀기</button></section></div>`;
  pb.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    const nm = document.getElementById('vsName');
    if (nm) {
      S.name = nm.value.trim().slice(0, 12);
      save();
    }
    if (b.dataset.vst) {
      S.gbest.vsType = b.dataset.vst;
      save();
      renderVS();
    } else if (b.dataset.vs === 'new') {
      const seed = (Math.random() * 2 ** 31) >>> 0;
      VSG = { t: sel, s: seed, qs: vsQuestions(sel, seed), i: 0, score: 0, ans: null, res: [], inv: null, done: false };
      vsPlay();
    } else if (b.dataset.vs === 'accept') {
      VSG = { t: inv.t, s: inv.s, qs: vsQuestions(inv.t, inv.s), i: 0, score: 0, ans: null, res: [], inv, done: false };
      VS_IN = null;
      vsPlay();
    }
  };
}
function vsPlay() {
  const pb = document.getElementById('pbody');
  const q = VSG.qs[VSG.i];
  pb.innerHTML = `<div class="prog"><div class="prog-bar"><i style="width:${(VSG.i / 10) * 100}%"></i></div><span class="num">${VSG.i + 1} / 10</span><span class="score num"><span class="o">○ ${VSG.score}</span></span></div>
    <div class="card" id="card"><span class="cat">친구 대결 · ${VS_NAME[VSG.t]}${VSG.inv ? ` · vs ${esc(VSG.inv.n)}` : ''}</span>${q.ko ? `<p class="ko">${esc(q.ko)}</p>` : `<div class="tz wide"><span class="${q.cls.includes('glyphish') ? 'glyph' : 'word'} ${q.cls}" ${q.cls.includes('jp') ? 'lang="ja"' : 'lang="en"'} style="${q.cls.includes('glyphish') ? '' : `font-size:${q.cls.includes('jp') ? wordSize(q.show) : enSize(q.show)}px`}">${esc(q.show)}</span></div>${q.sub ? `<p class="cap jp" lang="ja">${esc(q.sub)}</p>` : ''}`}<p class="cap">${q.ask}</p>${MARKS}</div>
    <div class="opts" style="margin-top:12px">${q.opts
      .map((o, i) => {
        const st = VSG.ans === null ? '' : o.ok ? 'ok' : i === VSG.ans ? 'ng' : 'dim';
        return `<button type="button" class="opt" data-vo="${i}" ${st ? `data-state="${st}"` : ''}><span class="n">${i + 1}</span><span class="${q.optCls || ''}" ${q.optCls === 'jp' ? 'lang="ja"' : ''}>${esc(o.t)}</span></button>`;
      })
      .join('')}</div>`;
  if (VSG.ans !== null) document.getElementById('card').dataset.mark = q.opts[VSG.ans].ok ? 'ok' : 'ng';
  pb.onclick = e => {
    const b = e.target.closest('[data-vo]');
    if (!b || VSG.ans !== null) return;
    VSG.ans = +b.dataset.vo;
    const ok = q.opts[VSG.ans].ok;
    if (ok) VSG.score++;
    VSG.res.push({ q, ok });
    record(q.key, ok);
    vsPlay();
    onAnswer(ok);
    setTimeout(
      () => {
        if (!VSG) return;
        VSG.ans = null;
        VSG.i++;
        if (VSG.i >= 10) {
          VSG.done = true;
          sfx('combo');
          vsResult();
        } else if (activeMod() === 'vs') vsPlay();
      },
      ok ? 750 : 1400
    );
  };
}
function vsResult() {
  const pb = document.getElementById('pbody');
  const me = S.name || '나';
  const g = VSG;
  const inv = g.inv;
  let verdict = '';
  if (inv) {
    verdict = g.score > inv.p ? '내가 이겼어요!' : g.score < inv.p ? `${esc(inv.n)}님이 이겼어요` : '비겼어요!';
  }
  if (!g.xp) {
    g.xp = 1;
    gainXP(inv && g.score > inv.p ? 40 : 20);
  }
  const link = vsLink(inv ? { t: g.t, s: g.s, n: me, p: g.score, o: { n: inv.n, p: inv.p } } : { t: g.t, s: g.s, n: me, p: g.score });
  const text = inv
    ? `[하나마루 대결] ${VS_NAME[g.t]} 결과: ${me} ${g.score} vs ${inv.n} ${inv.p}! 다시 붙어 볼래?`
    : `[하나마루 대결] ${VS_NAME[g.t]} 10문제에서 ${g.score}개 맞혔어! 너는 몇 개? 링크를 열면 같은 문제가 나와.`;
  const missed = g.res.filter(x => !x.ok);
  pb.innerHTML = `<div class="sum"><div class="vs-score">${inv ? `<div><small>${esc(me)}</small><b class="num">${g.score}</b></div><span>vs</span><div><small>${esc(inv.n)}</small><b class="num">${inv.p}</b></div>` : `<div><small>${esc(me)}</small><b class="num">${g.score}</b><small>/ 10</small></div>`}</div>
    <p class="sum-msg">${inv ? verdict : '이제 친구에게 도전장을 보내 보세요.'}</p>
    ${missed.length ? `<ul class="miss">${missed.map(x => `<li><span>${esc(x.q.ko || x.q.show)}</span><span class="s">${esc(x.q.opts.find(o => o.ok).t)}</span></li>`).join('')}</ul>` : ''}
    <div class="row"><button class="btn primary" data-vs="send">${inv ? '결과 보내기' : '친구에게 도전장 보내기'}</button><button class="btn" data-vs="done">처음으로</button></div>
    ${link.startsWith('#') ? `<p class="note">이 미리보기 화면에서는 링크를 만들 수 없어요. GitHub에 올린 앱 주소에서 쓰면 친구에게 보낼 수 있어요.</p>` : ''}</div>`;
  pb.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.vs === 'done') {
      VSG = null;
      renderVS();
    } else if (b.dataset.vs === 'send') {
      const full = text + '\n' + link;
      const fb = () =>
        copyText(full, '도전장 링크를 복사했어요. 카톡에 붙여 넣어 보내세요.', () => {
          if (!pb.querySelector('#vsTxt'))
            pb.querySelector('.sum').insertAdjacentHTML(
              'beforeend',
              `<textarea id="vsTxt" readonly style="width:100%;min-height:100px;font-size:15px;border:1px solid var(--line);border-radius:10px;padding:10px;background:var(--paper);color:var(--ink)">${esc(full)}</textarea><p class="note">위 내용을 길게 눌러 복사해서 보내 주세요.</p>`
            );
        });
      try {
        if (navigator.share && !link.startsWith('#')) {
          navigator.share({ text, url: link }).catch(err => {
            if (!err || err.name !== 'AbortError') fb();
          });
        } else fb();
      } catch (err) {
        fb();
      }
    }
  };
}

// ---- play/play.js ----
'use strict';
/* ---------- play tab renderer ---------- */
function renderPlay(mod) {
  view.innerHTML = `<section class="mod">${modeSeg(mod)}<div id="pbody"></div></section>`;
  bindModes();
  ({ omikuji: renderOmikuji, cards: renderCards, stamps: renderStamps, rain: renderRain, match: renderMatch, vs: renderVS })[mod]();
}

/* ---------- badges, help, tour, home hooks ---------- */
BADGES.push(
  {
    id: 'lv10',
    name: '레벨 10',
    desc: '한 언어에서 레벨 10 달성',
    p: () => [Math.min(10, Math.max(levelOf(S.xp.ja).L, levelOf(S.xp.en).L)), 10]
  },
  {
    id: 'stamp12',
    name: '여행 도장 12',
    desc: '여행 도장 12개 모으기',
    p: () => [Math.min(12, Math.max(stampTotal('ja'), stampTotal('en'))), 12]
  },
  {
    id: 'omi7',
    name: '운세 7번',
    desc: '오미쿠지나 포춘 쿠키 7번 뽑기',
    p: () => [Math.min(7, Object.keys(S.omiDays.ja).length + Object.keys(S.omiDays.en).length), 7]
  },
  { id: 'card30', name: '카드 수집가', desc: '단어 카드 30장 모으기', p: () => [Math.min(30, cardCount('ja') + cardCount('en')), 30] },
  {
    id: 'rain30',
    name: '비 피하기 달인',
    desc: '비 게임에서 30개 맞히기',
    p: () => [
      Math.min(
        30,
        Math.max(
          0,
          ...Object.entries(S.gbest)
            .filter(([k]) => k.startsWith('rain_'))
            .map(([, v]) => +v || 0)
        )
      ),
      30
    ]
  }
);
Object.assign(MODE_HELP, {
  omikuji: '하루 한 번 뽑는 오늘의 운세예요. 일본어 모드는 오미쿠지, 영어 모드는 포춘 쿠키예요. 운세 문장의 뜻을 맞히면 경험치를 받아요.',
  cards: '뽑기권으로 단어 카드를 뽑아 도감을 채워요. 관용구·의성어·유행어처럼 퀴즈에 없는 재미있는 표현이 들어 있어요.',
  stamps: '회화 탭의 대화 연습을 끝까지 하면 그 대화가 열리는 도시에 도장이 찍혀요. 지도를 채워 보세요.',
  rain: '떨어지는 글자나 단어가 바닥에 닿기 전에 알맞은 답을 눌러요. 갈수록 빨라져요.',
  match: '뒤집힌 카드 두 장을 골라 짝을 맞춰요. 적은 횟수로 끝낼수록 좋아요.',
  vs: '같은 10문제를 친구와 풀고 점수를 비교해요. 링크로 도전장을 보내요.'
});
TAB_HELP.play = '오미쿠지·단어 카드·여행 도장·미니게임·친구 대결';
TAB_HELP.eplay = '포춘 쿠키·단어 카드·여행 도장·미니게임·친구 대결';
TOUR.splice(TOUR.length - 1, 0, {
  h: '놀면서 레벨 업',
  p: '문제를 맞히면 경험치가 쌓여 <b>레벨과 칭호</b>가 올라가요. <b>놀이</b> 탭에는 오늘의 운세, 단어 카드 뽑기, 여행 도장 지도, 미니게임, 친구 대결이 있어요.',
  art: 'play'
});
TOUR_ART.play = `<div class="t-play"><div class="lvl" style="pointer-events:none"><div class="lv-badge"><small>Lv</small><b class="num">5</b></div><div class="lv-main"><b>가타카나 탐험가</b><div class="meter"><i style="width:62%"></i></div></div></div><div class="t-play-row"><span class="jp">大吉</span><span>도장</span><span>카드</span></div></div>`;
function playHomeHTML() {
  const lang = S.lang;
  const ja = lang === 'ja';
  const o = S.omi[lang];
  const drawnToday = o && o.d === today();
  const tk = S.tickets[lang];
  const items = [];
  if (!drawnToday)
    items.push(
      `<button class="pl-chip" data-goplay="omikuji"><span class="pl-ico ${ja ? 'jp' : ''}">${ja ? '籤' : '운'}</span><span><b>${ja ? '오늘의 오미쿠지' : '오늘의 포춘 쿠키'}</b><small>아직 안 뽑았어요</small></span></button>`
    );
  if (tk > 0)
    items.push(
      `<button class="pl-chip" data-goplay="cards"><span class="pl-ico num">${tk}</span><span><b>카드 뽑기권 ${tk}장</b><small>단어 카드를 뽑아 보세요</small></span></button>`
    );
  return items.length ? `<div class="pl-row">${items.join('')}</div>` : '';
}
function playClick(b) {
  if (b.dataset.goplay) {
    startMod(b.dataset.goplay);
    return true;
  }
  return false;
}
function whatsNew9() {
  openSheet(
    `<div class="sheet-h"><b>새로 생긴 것</b><button type="button" class="icon-btn" data-close aria-label="닫기">${XICON}</button></div>
    <div class="h-scroll"><div class="h-sec" style="padding:14px;display:grid;gap:10px;font-size:15px;line-height:1.6">
    <p style="margin:0"><b>홈 정리</b> · 오늘 할 일(코스·복습·미션)이 한곳에 모였어요. 설정과 백업은 맨 위 톱니바퀴로 옮겼어요.</p>
    <p style="margin:0"><b>오늘의 미션</b> · 매일 3개, 다 하면 카드 뽑기권!</p>
    <p style="margin:0"><b>레벨 테스트</b> · 20문제로 코스 시작 지점을 추천받아요.</p>
    <p style="margin:0"><b>${S.lang === 'ja' ? 'N4 단계' : '실전 단계'}</b> · ${S.lang === 'ja' ? 'N4 단어 335개, 문법 31개, 한자 80자, 가능형·의지형, 코스 31~60일차' : '전치사·시제·구동사 270문제와 코스 31~60일차'}가 생겼어요.</p>
    <p style="margin:0"><b>연속 듣기 · 오답 노트 · 주간 리포트 · 시즌 이벤트</b>도 추가됐어요.</p></div>
    <button class="btn primary" data-wn style="width:100%">확인</button></div>`,
    'help'
  );
  document.querySelector('#sheet [data-wn]').addEventListener('click', () => closeSheet());
}
function whatsNew() {
  openSheet(
    `<div class="sheet-h"><b>새로 생긴 것</b><button type="button" class="icon-btn" data-close aria-label="닫기">${XICON}</button></div>
    <div class="h-scroll"><div class="h-sec" style="padding:14px;display:grid;gap:10px;font-size:15px;line-height:1.6">
    <p style="margin:0"><b>레벨과 칭호</b> · 문제를 맞힐 때마다 경험치가 쌓여요. 홈 맨 위에서 확인하세요.</p>
    <p style="margin:0"><b>콤보와 효과음</b> · 연속으로 맞히면 콤보가 쌓여요. 효과음은 홈의 설정에서 끌 수 있어요.</p>
    <p style="margin:0"><b>놀이 탭</b> · 오늘의 운세, 단어 카드 뽑기, 여행 도장 지도, 미니게임, 친구 대결이 생겼어요.</p>
    <p style="margin:0" class="note">지금까지 끝낸 대화는 도장으로 바로 반영돼요. 지금까지 푼 문제만큼 경험치도 넣어 뒀어요.</p></div>
    <button class="btn primary" data-wn style="width:100%">놀이 탭 가 보기</button></div>`,
    'help'
  );
  document.querySelector('#sheet [data-wn]').addEventListener('click', () => {
    closeSheet();
    startMod('omikuji');
  });
}
/* retroactive XP for existing learners (once) */
if (!S.seen.xpInit) {
  S.seen.xpInit = 1;
  let ja = 0,
    en = 0;
  for (const [k, s] of Object.entries(S.stats)) {
    const v = (s.c || 0) * 10 + (s.w || 0) * 3;
    if (/^(ew|es|eb|el|ed|esh|ir|mp|dl:en):/.test(k) || k.startsWith('dl:en:')) en += v;
    else ja += v;
  }
  S.xp.ja = Math.max(S.xp.ja, Math.min(ja, 6000));
  S.xp.en = Math.max(S.xp.en, Math.min(en, 6000));
  save();
}

// ---- features/missions.js ----
'use strict';
/* ================= daily missions: 3 small goals a day, per language ================= */

// id, text, target, which event advances it, and how much
const MISSION_POOL = [
  { id: 'solve20', t: '문제 20개 풀기', n: 20, ev: 'answer', f: () => 1 },
  { id: 'solve30', t: '문제 30개 풀기', n: 30, ev: 'answer', f: () => 1 },
  { id: 'ok15', t: '정답 15개 맞히기', n: 15, ev: 'answer', f: d => (d.ok ? 1 : 0) },
  { id: 'ok25', t: '정답 25개 맞히기', n: 25, ev: 'answer', f: d => (d.ok ? 1 : 0) },
  { id: 'new10', t: '처음 보는 문제 10개 풀기', n: 10, ev: 'answer', f: d => (d.isNew ? 1 : 0) },
  { id: 'rev10', t: '전에 본 문제 10개 다시 풀기', n: 10, ev: 'answer', f: d => (d.isReview ? 1 : 0) },
  {
    id: 'listen8',
    t: '듣기·발음 문제 8개',
    n: 8,
    ev: 'answer',
    tts: true,
    f: d => (/^(jl|el|jd|ed|sh|esh|jm|mp):/.test(d.key || '') ? 1 : 0)
  },
  { id: 'combo5', t: '5콤보 만들기', n: 5, ev: 'combo', max: true, f: d => d.n },
  { id: 'combo10', t: '10콤보 만들기', n: 10, ev: 'combo', max: true, f: d => d.n },
  { id: 'dlg1', t: '대화 연습 1개 끝내기', n: 1, ev: 'dialogue', f: () => 1 },
  { id: 'course1', t: '코스 과제 1개 끝내기', n: 1, ev: 'course', f: () => 1 },
  { id: 'perfect', t: '한 라운드 전부 맞히기', n: 1, ev: 'perfect', f: () => 1 },
  { id: 'game1', t: '미니게임 한 판 하기', n: 1, ev: 'game', f: () => 1 },
  { id: 'omikuji', t: '오늘의 운세 뽑기', n: 1, ev: 'omikuji', f: () => 1 },
  { id: 'speed1', t: '60초 도전 한 번', n: 1, ev: 'speed', f: () => 1 }
];
const MISSION_XP = 30;

function missionState(lang) {
  if (!S.missions || typeof S.missions !== 'object') S.missions = {};
  let m = S.missions[lang];
  if (!m || m.d !== today()) {
    // pick 3 from different event kinds, the same way all day (seeded by date)
    const R = rng(dayIdx() * 7 + (lang === 'en' ? 3 : 0));
    const pool = sShuffle(
      MISSION_POOL.filter(x => hasTTS || !x.tts),
      R
    );
    const ids = [],
      kinds = new Set();
    for (const x of pool) {
      if (ids.length >= 3) break;
      if (kinds.has(x.ev)) continue;
      kinds.add(x.ev);
      ids.push(x.id);
    }
    m = S.missions[lang] = { d: today(), ids, p: [0, 0, 0], done: [0, 0, 0], all: 0 };
  }
  return m;
}
const missionDef = id => MISSION_POOL.find(x => x.id === id);

function missionEvent(ev, data = {}) {
  const lang = S.lang,
    m = missionState(lang);
  let changed = false;
  m.ids.forEach((id, i) => {
    const def = missionDef(id);
    if (!def || def.ev !== ev || m.done[i]) return;
    const v = def.f(data);
    if (!v) return;
    m.p[i] = def.max ? Math.max(m.p[i], v) : m.p[i] + v;
    changed = true;
    if (m.p[i] >= def.n) {
      m.p[i] = def.n;
      m.done[i] = 1;
      gainXP(MISSION_XP, lang);
      setTimeout(() => {
        sfx('combo');
        toast(`미션 완료: ${def.t} · +${MISSION_XP} XP`);
      }, 700);
    }
  });
  if (changed && !m.all && m.done.every(Boolean)) {
    m.all = 1;
    setTimeout(() => grantTicket(lang, '오늘의 미션 모두 완료'), 1800);
  }
  if (changed) save();
}

function missionsHTML() {
  const m = missionState(S.lang);
  return m.ids
    .map((id, i) => {
      const def = missionDef(id);
      if (!def) return '';
      return `<li class="todo-i ms" data-done="${!!m.done[i]}"><span class="ck" aria-hidden="true">${m.done[i] ? CHECK_SVG : ''}</span><span class="tl">${esc(def.t)}<span class="ms-bar"><i style="width:${(m.p[i] / def.n) * 100}%"></i></span></span><span class="num ms-n">${m.p[i]}/${def.n}</span></li>`;
    })
    .join('');
}
const CHECK_SVG =
  '<svg viewBox="0 0 20 20"><path d="M4 10.5 8 14l8-8.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// ---- features/seasons.js ----
'use strict';
/* ================= seasonal events: home banner, limited cards, special omikuji ================= */

// [key, from (month, day), to (month, day), accent emoji-free label]
const SEASONS = [
  { id: 'newyear', from: [1, 1], to: [1, 15], ja: 'お正月' },
  { id: 'spring', from: [3, 20], to: [4, 20], ja: 'お花見' },
  { id: 'summer', from: [7, 15], to: [8, 31], ja: '夏祭り' },
  { id: 'halloween', from: [10, 10], to: [10, 31], ja: 'ハロウィン' },
  { id: 'autumn', from: [11, 1], to: [11, 30], ja: '秋' },
  { id: 'christmas', from: [12, 10], to: [12, 31], ja: 'クリスマス' }
];
const SEASON_CARDS = {
  ja: typeof SEASON_CARDS_JA !== 'undefined' ? SEASON_CARDS_JA : [],
  en: typeof SEASON_CARDS_EN !== 'undefined' ? SEASON_CARDS_EN : []
};
const SEASON_DRAW_CHANCE = 0.3;

function activeSeason(d = new Date()) {
  const md = (d.getMonth() + 1) * 100 + d.getDate();
  return SEASONS.find(s => md >= s.from[0] * 100 + s.from[1] && md <= s.to[0] * 100 + s.to[1]) || null;
}
const seasonCards = (lang, id) => SEASON_CARDS[lang].filter(c => c.season === id);
const seasonMsg = id => (typeof SEASON_MSGS !== 'undefined' && SEASON_MSGS[id]) || null;
const seasonEnd = s => `${s.to[0]}월 ${s.to[1]}일`;

function seasonBannerHTML() {
  const s = activeSeason();
  if (!s) return '';
  const msg = seasonMsg(s.id);
  if (!msg) return '';
  const lang = S.lang,
    ja = lang === 'ja',
    g = msg[lang] || msg.ja;
  const cards = seasonCards(lang, s.id),
    got = cards.filter(c => S.cards[lang][c.id]).length;
  return `<section class="season s-${s.id}"><div class="ss-top"><span class="ss-tag">${esc(msg.title)} · ${seasonEnd(s)}까지</span></div>
    <p class="ss-g ${ja ? 'jp' : 'en'}" lang="${lang}">${esc(g.t)}</p>${ja && g.r && g.r.replace(/\s/g, '') !== g.t ? `<p class="ss-r jp" lang="ja">${esc(g.r)}</p>` : ''}<p class="ss-k">${esc(g.k)}</p>
    <div class="ss-bot"><span class="note">${esc(msg.desc)}</span>${spkBtn(g.t, '', lang)}</div>
    ${cards.length ? `<button class="btn" data-goplay="cards">한정 카드 ${got} / ${cards.length}</button>` : ''}</section>`;
}

// During an event, some draws come from the event's limited cards.
function seasonPickCard(lang) {
  const s = activeSeason();
  if (!s) return null;
  const cards = seasonCards(lang, s.id);
  if (!cards.length || Math.random() >= SEASON_DRAW_CHANCE) return null;
  const fresh = cards.filter(c => !S.cards[lang][c.id]);
  const pool = fresh.length && Math.random() < 0.7 ? fresh : cards;
  return pool[(Math.random() * pool.length) | 0];
}
const allCards = lang => CARDS[lang].concat(SEASON_CARDS[lang]);

// ---- features/weekly.js ----
'use strict';
/* ================= weekly report: last week vs the week before ================= */

// Which study area a stats key belongs to (counted per day in S.days[day].m)
const KEY_GROUPS = [
  [/^k:/, '문자'],
  [/^(kj|hj|hw):/, '한자'],
  [/^(w|ew):/, '단어'],
  [/^(lw|wa|kg):/, '외래어'],
  [/^sg:/, '메뉴판·간판'],
  [/^ks:/, '간사이벤'],
  [/^cj:/, '동사 활용'],
  [/^ct:/, '조수사·날짜'],
  [/^(s|es|jb|eb):/, '문장'],
  [/^(pt|kp):/, '조사'],
  [/^gp:/, '문법'],
  [/^pl:/, '반말·존댓말'],
  [/^(ep|et|eph|xt):/, '영문법'],
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

// ---- features/level-test.js ----
'use strict';
/* ================= level test: 20 questions → which course day to start from ================= */

let LT = null; // { lang, qs, i, ans, res: [{sec, ok}] }

// Each section: how many questions, how to build one question, and the course day to start at if this is weak.
const LT_PLAN = {
  ja: [
    { sec: 'hira', name: '히라가나', n: 4, day: 1, make: R => ltKana(R, 'h') },
    { sec: 'kata', name: '가타카나', n: 3, day: 7, make: R => ltKana(R, 'k') },
    { sec: 'word', name: '기초 단어', n: 4, day: 5, make: R => ltWord(R, BASE_JP_N5, 'ja') },
    { sec: 'part', name: '조사', n: 3, day: 15, make: R => ltPart(R) },
    { sec: 'sent', name: '문장', n: 3, day: 14, make: R => ltSent(R, 'ja') },
    { sec: 'conj', name: '동사 활용', n: 3, day: 21, make: R => ltConj(R) }
  ],
  en: [
    {
      sec: 'word',
      name: '기초 단어',
      n: 6,
      day: 1,
      make: R =>
        ltWord(
          R,
          BASE_EN.filter(w => w.cats.some(c => ['verb', 'noun', 'talk'].includes(c))),
          'en'
        )
    },
    {
      sec: 'word2',
      name: '형용사·동사구',
      n: 4,
      day: 9,
      make: R =>
        ltWord(
          R,
          BASE_EN.filter(w => w.cats.some(c => ['adj', 'phr'].includes(c))),
          'en'
        )
    },
    { sec: 'sent', name: '문장', n: 4, day: 4, make: R => ltSent(R, 'en') },
    { sec: 'irr', name: '불규칙 동사', n: 3, day: 7, make: R => ltIrr(R) },
    { sec: 'gram', name: '전치사·시제', n: 3, day: 31, make: R => ltEG(R) }
  ]
};
const pick = (arr, R) => arr[(R() * arr.length) | 0];
const opts4 = (right, wrongs, R) => sShuffle([{ t: right, ok: true }, ...wrongs.slice(0, 3).map(t => ({ t, ok: false }))], R);
function ltKana(R, sc) {
  const pool = KANA.filter(x => x.set !== 'yoon');
  const x = pick(pool, R);
  const wr = sShuffle([...new Set(pool.map(y => y.alts[0]).filter(a => a !== x.alts[0]))], R);
  return {
    key: 'k:' + (sc === 'k' ? toKata(x.h) : x.h),
    show: sc === 'k' ? toKata(x.h) : x.h,
    glyph: true,
    ask: '발음을 고르세요',
    opts: opts4(x.alts[0], wr, R),
    optCls: 'mono-opt'
  };
}
function ltWord(R, src, lang) {
  const w = pick(src, R);
  const wr = [];
  for (const y of sShuffle(src, R)) {
    if (wr.length >= 3) break;
    if (!y.m.some(m => w.m.includes(m)) && !wr.includes(y.m[0])) wr.push(y.m[0]);
  }
  return { key: w.key, show: w.w, sub: lang === 'ja' && w.w !== w.r ? w.r : '', lang, ask: '뜻을 고르세요', opts: opts4(w.m[0], wr, R) };
}
function ltPart(R) {
  const q = pick(ITEMS.part, R);
  const ex = P_EXCL[q.p] || [];
  const wr = sShuffle(
    ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も', 'の', 'から', 'まで'].filter(p => p !== q.p && !ex.includes(p)),
    R
  );
  return {
    key: q.key,
    html: `<p class="ko" style="font-size:16px;color:var(--muted);margin-top:22px">${esc(q.k)}</p><p class="psent" lang="ja">${partSentence(q, false)}</p>`,
    ask: '빈칸에 알맞은 조사를 고르세요',
    opts: opts4(q.p, wr, R),
    optCls: 'jp'
  };
}
function ltSent(R, lang) {
  const s = pick(lang === 'ja' ? SENTS : EN_SENTS, R);
  const right = lang === 'ja' ? s.a[0] : s.a;
  return {
    key: s.key,
    ko: s.k,
    ask: lang === 'ja' ? '알맞은 일본어를 고르세요' : '알맞은 영어를 고르세요',
    opts: sShuffle([{ t: right, ok: true }, ...s.d.map(d => ({ t: d[0], ok: false }))], R),
    optCls: lang === 'ja' ? 'jp' : 'en'
  };
}
function ltConj(R) {
  const pool = CONJ_ITEMS.filter(x => ['te', 'ta', 'nai'].includes(x.form) && x.v.lvl === 5);
  const q = pick(pool, R);
  const wr = sShuffle(conjWrongs(q.v, q.form), R).map(x => x.w);
  return {
    key: q.key,
    show: q.v.w,
    sub: `${q.v.r} · ${q.v.m[0]}`,
    lang: 'ja',
    ask: `${FORMS[q.form]}으로 바꾸면?`,
    opts: opts4(q.right.w, wr, R),
    optCls: 'jp'
  };
}
function ltIrr(R) {
  const x = pick(IRR, R);
  const right = x.p.split('/')[0];
  const wr = [regPast(x.b), x.pp.split('/')[0], x.b + 'ed', x.b].filter(t => !x.p.split('/').includes(t));
  return { key: x.key, show: x.b, lang: 'en', sub: x.ko, ask: '과거형을 고르세요', opts: opts4(right, [...new Set(wr)], R), optCls: 'en' };
}
function ltEG(R) {
  const src = [...EG.eprep.items, ...EG.etense.items];
  const q = pick(src, R);
  return {
    key: q.key,
    html: `<p class="psent en" lang="en" style="font-family:var(--f-en);margin-top:22px">${esc(q.s).replace('___', '<span class="blank">？</span>')}</p><p class="cap">${esc(q.k)}</p>`,
    ask: '빈칸에 알맞은 말을 고르세요',
    opts: opts4(q.a, q.o, R),
    optCls: 'en'
  };
}

function startLevelTest(lang) {
  lang = lang || S.lang;
  stopAll();
  const R = rng((Math.random() * 2 ** 31) >>> 0);
  const qs = [];
  for (const p of LT_PLAN[lang])
    for (let k = 0; k < p.n; k++) {
      const q = p.make(R);
      q.sec = p.sec;
      qs.push(q);
    }
  LT = { lang, qs, i: 0, ans: null, res: [] };
  if (S.lang !== lang) {
    S.lang = lang;
    save();
    renderTabs();
  }
  for (const b of tabsEl.children) b.removeAttribute('aria-current');
  ltRender();
  window.scrollTo(0, 0);
}
function ltRender() {
  if (!LT) return;
  if (LT.i >= LT.qs.length) return ltResult();
  const q = LT.qs[LT.i],
    n = LT.qs.length;
  const head =
    q.html ||
    (q.ko
      ? `<p class="ko">${esc(q.ko)}</p>`
      : `<div class="tz ${q.glyph ? '' : 'wide'}"><span class="${q.glyph ? 'glyph' : q.lang === 'en' ? 'eword' : 'word'}" lang="${q.lang || 'ja'}" ${q.glyph ? '' : `style="font-size:${q.lang === 'en' ? enSize(q.show) : wordSize(q.show)}px"`}>${esc(q.show)}</span></div>${q.sub ? `<p class="cap ${q.lang === 'ja' ? 'jp' : ''}">${esc(q.sub)}</p>` : ''}`);
  view.innerHTML = `<section class="mod lt"><div class="lt-head"><b>레벨 테스트</b><button class="btn quiet" data-lt="quit" style="min-height:36px">그만하기</button></div>
    <div class="prog"><div class="prog-bar"><i style="width:${(LT.i / n) * 100}%"></i></div><span class="num">${LT.i + 1} / ${n}</span></div>
    <div class="card" id="card"><span class="cat">${esc(LT_PLAN[LT.lang].find(p => p.sec === q.sec).name)}</span>${head}<p class="cap">${q.ask}</p>${MARKS}</div>
    <div class="opts" style="margin-top:12px">${q.opts
      .map((o, i) => {
        const st = LT.ans === null ? '' : o.ok ? 'ok' : i === LT.ans ? 'ng' : 'dim';
        return `<button type="button" class="opt" data-lto="${i}" ${st ? `data-state="${st}"` : ''}><span class="n">${i + 1}</span><span class="${q.optCls || ''}">${esc(o.t)}</span></button>`;
      })
      .join('')}</div>
    <div class="sub-actions"><button type="button" class="btn quiet" data-lto="-1">모르겠어요</button></div>
    <p class="note" style="text-align:center;margin-top:8px">모르는 문제는 '모르겠어요'를 눌러 주세요. 그래야 시작할 곳을 정확히 찾을 수 있어요.</p></section>`;
  if (LT.ans !== null) document.getElementById('card').dataset.mark = LT.ans >= 0 && q.opts[LT.ans].ok ? 'ok' : 'ng';
  view.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.lt === 'quit') {
      LT = null;
      go(curTab());
      return;
    }
    if (b.dataset.lto === undefined || LT.ans !== null) return;
    LT.ans = +b.dataset.lto;
    const ok = LT.ans >= 0 && q.opts[LT.ans].ok;
    LT.res.push({ sec: q.sec, ok });
    record(q.key, ok);
    sfx(ok ? 'ok' : 'ng');
    ltRender();
    setTimeout(
      () => {
        if (!LT) return;
        LT.ans = null;
        LT.i++;
        ltRender();
      },
      ok ? 550 : 1100
    );
  };
}
function ltRecommend(lang, res) {
  const plan = LT_PLAN[lang];
  const score = p => {
    const r = res.filter(x => x.sec === p.sec);
    return [r.filter(x => x.ok).length, r.length];
  };
  const weak = plan.filter(p => {
    const [c, n] = score(p);
    return c < Math.ceil(n * 0.7);
  });
  const total = COURSE[lang].length;
  const day = weak.length ? Math.min(...weak.map(p => p.day)) : Math.min(total, lang === 'ja' ? 31 : 41);
  return { day: Math.min(day, total), weak, score };
}
function ltResult() {
  const { lang, res } = LT;
  const rec = ltRecommend(lang, res);
  const plan = LT_PLAN[lang];
  const c = res.filter(x => x.ok).length;
  const di = rec.day - 1;
  const d = COURSE[lang][di];
  S.ltest = S.ltest || {};
  S.ltest[lang] = { d: today(), c, n: res.length, day: rec.day };
  save();
  view.innerHTML = `<section class="mod lt"><div class="sum">
    <div class="sum-score"><b class="num">${c}</b><span class="num">/ ${res.length}</span></div>
    <div class="mst">${plan
      .map(p => {
        const [cc, n] = rec.score(p);
        return `<div class="mst-row"><div><b style="font-weight:500">${esc(p.name)}</b><span class="num">${cc} / ${n}</span></div><div class="meter"><i style="width:${n ? (cc / n) * 100 : 0}%"></i></div></div>`;
      })
      .join('')}</div>
    <div class="lt-rec"><span class="lbl">추천 시작 지점</span><b>${rec.day}일차 · ${esc(d ? d.t : '')}</b><span class="note">${rec.weak.length ? `${rec.weak.map(p => p.name).join(', ')} 쪽을 먼저 다지면 좋아요.` : '기초는 탄탄해요! 다음 단계부터 시작해요.'}</span></div>
    <div class="row">${rec.day > 1 ? `<button class="btn primary" data-lt="skip">${rec.day}일차부터 시작</button>` : ''}<button class="btn ${rec.day > 1 ? '' : 'primary'}" data-lt="from1">1일차부터 차근차근</button></div>
    <p class="note">'${rec.day}일차부터 시작'을 누르면 그 앞의 코스 과제는 끝낸 것으로 표시돼요. 언제든 코스 화면에서 다시 할 수 있어요.</p></div></section>`;
  view.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.lt === 'skip') {
      for (let i = 0; i < di; i++) S.course[lang][i] = COURSE[lang][i].k.map(() => 1);
      save();
      LT = null;
      toast(`${rec.day}일차부터 시작해요`);
      go('home');
    } else if (b.dataset.lt === 'from1') {
      LT = null;
      go('home');
    }
  };
}

// ---- features/autoplay.js ----
'use strict';
/* ================= continuous listening: sentences read one after another (for commuting) ================= */

const AP_DEF = { sc: 'all', ko: true, rep: 1, slow: false, shuffle: false };
let AP = null; // { mod, list, i, playing, timer, lock }
if (!S.ap || typeof S.ap !== 'object') S.ap = { ...AP_DEF };

function apList(mod) {
  const items = mod === 'jauto' ? SENTS : EN_SENTS;
  const list = items.filter(s => S.ap.sc === 'all' || s.sc === S.ap.sc);
  return S.ap.shuffle ? shuffle(list) : list;
}
function stopAutoplay() {
  if (!AP) return;
  AP.playing = false;
  clearTimeout(AP.timer);
  try {
    speechSynthesis.cancel();
  } catch (e) {}
  if (AP.lock) {
    try {
      AP.lock.release();
    } catch (e) {}
    AP.lock = null;
  }
}
const koVoice = () => {
  try {
    return speechSynthesis.getVoices().find(v => /^ko/i.test(v.lang)) || null;
  } catch (e) {
    return null;
  }
};

// speak one text and call done() when it ends (with a time-based fallback)
function apSay(text, lang, done) {
  if (!hasTTS) {
    done();
    return;
  }
  let fired = false;
  const fin = () => {
    if (!fired) {
      fired = true;
      done();
    }
  };
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'ko' ? 'ko-KR' : lang === 'en' ? 'en-US' : 'ja-JP';
    const v = lang === 'ko' ? koVoice() : voices[lang];
    if (v) u.voice = v;
    u.rate = lang === 'ko' ? 1 : S.ap.slow ? (lang === 'en' ? 0.7 : 0.6) : lang === 'en' ? 0.95 : 0.9;
    u.onend = fin;
    u.onerror = fin;
    speechSynthesis.speak(u);
  } catch (e) {
    fin();
    return;
  }
  AP.timer = setTimeout(fin, 2500 + text.length * 260); // safety net if onend never fires
}

function apPlayCurrent() {
  if (!AP || !AP.playing) return;
  const s = AP.list[AP.i];
  if (!s) {
    AP.playing = false;
    apRender();
    return;
  }
  const lang = AP.mod === 'jauto' ? 'ja' : 'en';
  const text = lang === 'ja' ? s.a[0] : s.a;
  const steps = [];
  for (let k = 0; k < S.ap.rep; k++) steps.push([text, lang, 700]);
  if (S.ap.ko) steps.push([s.k, 'ko', 1300]);
  const run = n => {
    if (!AP || !AP.playing) return;
    if (n >= steps.length) {
      AP.i++;
      if (AP.i >= AP.list.length) {
        AP.i = 0;
        if (S.ap.shuffle) AP.list = shuffle(AP.list);
      }
      apRender();
      AP.timer = setTimeout(apPlayCurrent, 400);
      return;
    }
    const [t, l, gap] = steps[n];
    apSay(t, l, () => {
      clearTimeout(AP.timer);
      AP.timer = setTimeout(() => run(n + 1), gap);
    });
  };
  run(0);
}
async function apStart() {
  AP.playing = true;
  apRender();
  try {
    if (navigator.wakeLock && !AP.lock) AP.lock = await navigator.wakeLock.request('screen');
  } catch (e) {}
  try {
    speechSynthesis.cancel();
  } catch (e) {}
  apPlayCurrent();
}
function apMove(d) {
  const was = AP.playing;
  stopAutoplay();
  AP.i = (AP.i + d + AP.list.length) % AP.list.length;
  apRender();
  if (was) apStart();
}

function renderAutoplay(mod) {
  if (!AP || AP.mod !== mod) {
    stopAutoplay();
    AP = { mod, list: apList(mod), i: 0, playing: false, timer: null, lock: null };
  }
  view.innerHTML = `<section class="mod">${modeSeg(mod)}<div id="apBody"></div></section>`;
  bindModes();
  apRender();
}
function apRender() {
  const box = document.getElementById('apBody');
  if (!box || !AP) return;
  const mod = AP.mod,
    ja = mod === 'jauto',
    s = AP.list[AP.i] || null,
    items = ja ? SENTS : EN_SENTS;
  const opt = (k, v, l) => `<button class="chip" data-apo="${k}:${v}" aria-pressed="${String(S.ap[k]) === String(v)}">${l}</button>`;
  box.innerHTML = `<div class="ap">
    <div class="chips">${[['all', '전체'], ...Object.entries(SCENES)].map(([v, l]) => `<button class="chip" data-apsc="${v}" aria-pressed="${S.ap.sc === v}">${l}${v === 'all' ? '' : ' ' + items.filter(x => x.sc === v).length}</button>`).join('')}</div>
    <div class="ap-card">${
      s
        ? `<span class="cat">${SCENES[s.sc] || ''} · ${AP.i + 1} / ${AP.list.length}</span>
      <p class="ap-s ${ja ? 'jp' : 'en'}" lang="${ja ? 'ja' : 'en'}">${esc(ja ? s.a[0] : s.a)}</p>${ja ? `<p class="ap-r jp" lang="ja">${esc(s.a[1])}</p>` : ''}<p class="ap-k">${esc(s.k)}</p>`
        : '<p class="note">문장이 없어요</p>'
    }</div>
    <div class="ap-ctl"><button class="icon-btn big" data-ap="prev" aria-label="이전 문장">${AP_ICON.prev}</button>
      <button class="play" data-ap="toggle" aria-label="${AP.playing ? '멈추기' : '재생'}">${AP.playing ? AP_ICON.pause : PLAY_ICON}</button>
      <button class="icon-btn big" data-ap="next" aria-label="다음 문장">${AP_ICON.next}</button></div>
    <div class="ap-opts">
      <div class="set-row"><div><b>한국어 뜻도 읽기</b></div><div class="seg">${opt('ko', true, '켜기')}${opt('ko', false, '끄기')}</div></div>
      <div class="set-row"><div><b>${ja ? '일본어' : '영어'} 반복</b></div><div class="seg">${opt('rep', 1, '1번')}${opt('rep', 2, '2번')}${opt('rep', 3, '3번')}</div></div>
      <div class="set-row"><div><b>속도</b></div><div class="seg">${opt('slow', false, '보통')}${opt('slow', true, '천천히')}</div></div>
      <div class="set-row"><div><b>순서</b></div><div class="seg">${opt('shuffle', false, '차례대로')}${opt('shuffle', true, '섞기')}</div></div>
    </div>
    <p class="note">재생하는 동안 화면이 꺼지지 않게 해 둬요. 아이폰에서 화면을 직접 끄거나 다른 앱으로 가면 소리가 멈춰요. 무음 모드에서는 소리가 나지 않아요.</p></div>`;
  box.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.ap === 'toggle') {
      if (AP.playing) {
        stopAutoplay();
        apRender();
      } else apStart();
    } else if (b.dataset.ap === 'prev') apMove(-1);
    else if (b.dataset.ap === 'next') apMove(1);
    else if (b.dataset.apsc) {
      stopAutoplay();
      S.ap.sc = b.dataset.apsc;
      save();
      AP.list = apList(mod);
      AP.i = 0;
      apRender();
    } else if (b.dataset.apo) {
      const [k, v] = b.dataset.apo.split(':');
      S.ap[k] = k === 'rep' ? +v : v === 'true';
      save();
      if (k === 'shuffle') {
        stopAutoplay();
        AP.list = apList(mod);
        AP.i = 0;
      }
      apRender();
    }
  };
}
const AP_ICON = {
  prev: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>'
};
CUSTOM.jauto = renderAutoplay;
CUSTOM.eauto = renderAutoplay;
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && AP && AP.playing && !AP.lock && navigator.wakeLock)
    navigator.wakeLock
      .request('screen')
      .then(l => {
        if (AP) AP.lock = l;
      })
      .catch(() => {});
});

// ---- views/wrong-notes.js ----
'use strict';
/* ================= wrong-answer notebook: everything missed in the last 7 / 30 days ================= */

let WN_RANGE = 7; // days; 0 = all time
const WN_SKIP = new Set(['jdlg', 'edlg']);

function wrongItems(range) {
  const idx = itemIndex(),
    t = dayIdx(),
    out = [];
  for (const [k, s] of Object.entries(S.stats)) {
    if (!s.w) continue;
    if (range && !(s.lw !== undefined && s.lw >= t - range + 1)) continue;
    const e = idx.get(k);
    if (!e || WN_SKIP.has(e.mod) || modLang(e.mod) !== S.lang) continue;
    out.push({ k, s, mod: e.mod, it: e.it });
  }
  // most-missed first, then the ones still not fixed, then most recent
  out.sort((a, b) => b.s.w - a.s.w || isWeak(b.k) - isWeak(a.k) || (b.s.lw || 0) - (a.s.lw || 0));
  return out;
}

function renderWrongNotes() {
  const vb = document.getElementById('vbody');
  const list = wrongItems(WN_RANGE);
  const groups = {};
  for (const x of list) (groups[x.mod] = groups[x.mod] || []).push(x);
  const label = m => MODE_LABEL[m] || m;
  const line = x => {
    const [a, b] = itemLabel(x.mod, x.it);
    const ja = modLang(x.mod) === 'ja' && !['part', 'pol'].includes(x.mod);
    return `<li><span class="${ja ? 'jp' : modLang(x.mod) === 'en' ? 'en' : ''}" style="font-size:17px">${esc(a)}</span><span class="s">${esc(b)}</span><span class="wn-n num ${isWeak(x.k) ? 'weak' : ''}">${x.s.w}번${isWeak(x.k) ? '' : ' · 고침'}</span></li>`;
  };
  vb.innerHTML = `<div class="chart">
    <div class="seg" role="group" aria-label="기간">${[
      [7, '최근 7일'],
      [30, '최근 30일'],
      [0, '전체']
    ]
      .map(([v, l]) => `<button data-wnr="${v}" aria-pressed="${WN_RANGE === v}">${l}</button>`)
      .join('')}</div>
    <p class="note">틀린 적 있는 문제를 많이 틀린 순서로 모았어요. '고침'은 그 뒤에 두 번 연속 맞힌 문제예요.</p>
    ${list.length ? `<section class="chart-box"><h2 class="sec-title">가장 많이 틀린 10개</h2><ul class="miss wn">${list.slice(0, 10).map(line).join('')}</ul></section>` : `<div class="empty"><p style="margin:0;font-weight:600">이 기간에 틀린 문제가 없어요</p><p class="note">기간을 늘려 보거나, 문제를 더 풀어 보세요.</p></div>`}
    ${Object.entries(groups)
      .map(
        ([
          m,
          xs
        ]) => `<section class="chart-box"><div class="cal-head"><h2 class="sec-title" style="margin:0">${label(m)} · ${xs.length}개</h2><button class="btn primary" data-wnre="${m}" style="min-height:38px;padding:6px 14px">다시 풀기</button></div>
      <ul class="miss wn">${xs.slice(0, 8).map(line).join('')}${xs.length > 8 ? `<li><span class="s">외 ${xs.length - 8}개</span></li>` : ''}</ul></section>`
      )
      .join('')}
  </div>`;
  vb.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.wnr !== undefined) {
      WN_RANGE = +b.dataset.wnr;
      renderWrongNotes();
      return;
    }
    if (b.dataset.wnre) {
      const m = b.dataset.wnre;
      const xs = groups[m] || [];
      PENDING[m] = xs.slice(0, 20).map(x => x.it);
      R[m] = null;
      S.filt[m] = 'all';
      startMod(m);
    }
  };
}

// ---- features/support.js ----
'use strict';
/* ================= support the app: donation links + privacy-friendly visit counter ================= */

const DONATE_KINDS = [
  ['toss', '토스로 후원'],
  ['kakaopay', '카카오페이로 후원'],
  ['bmc', 'Buy Me a Coffee']
];
const safeUrl = u => (/^https:\/\/[^\s"'<>]+$/.test(u || '') ? u : '');
const donateLinks = () => DONATE_KINDS.map(([k, label]) => [safeUrl(APP_CONFIG.donate[k]), label]).filter(([u]) => u);

// Settings section (and help) — nothing is shown until a link is set in js/config.js
function donateHTML() {
  const links = donateLinks();
  if (!links.length) return '';
  return `<section><h2 class="sec-title">앱 응원하기</h2><div class="panel donate" style="padding:14px;display:grid;gap:10px">
    <p class="note" style="color:var(--ink)">${esc(APP_CONFIG.donate.message || '')}</p>
    <div class="row">${links.map(([u, label], i) => `<a class="btn ${i ? '' : 'primary'}" href="${esc(u)}" target="_blank" rel="noopener">${esc(label)}</a>`).join('')}</div>
    <p class="note">후원은 앱 기능과 상관없어요. 모든 기능은 계속 무료예요.</p></div></section>`;
}
// One quiet line on the home screen
function donateHomeHTML() {
  return donateLinks().length
    ? `<button class="donate-line" data-settings="donate">하나마루가 도움이 됐다면 커피 한 잔 후원하기 →</button>`
    : '';
}

// Visit counter: only on the real website (not in previews or local files)
function startAnalytics() {
  const a = APP_CONFIG.analytics || {};
  if (!/^https?:$/.test(location.protocol) || /claude\.ai|claudeusercontent|localhost|127\.0\.0\.1/.test(location.hostname)) return;
  if (document.getElementById('hm-analytics')) return;
  const s = document.createElement('script');
  s.id = 'hm-analytics';
  s.defer = true;
  if (/^[0-9a-f]{32}$/i.test(a.cloudflareToken || '')) {
    s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    s.setAttribute('data-cf-beacon', JSON.stringify({ token: a.cloudflareToken }));
  } else if (/^https:\/\/[a-z0-9-]+\.goatcounter\.com\/count$/i.test(a.goatcounter || '')) {
    s.src = 'https://gc.zgo.at/count.js';
    s.setAttribute('data-goatcounter', a.goatcounter);
  } else return;
  document.head.appendChild(s);
}
const analyticsOn = () => !!(APP_CONFIG.analytics && (APP_CONFIG.analytics.cloudflareToken || APP_CONFIG.analytics.goatcounter));

// "문제가 이상해요" → Google Form (link set in js/config.js)
//   - pre-filled link (answer = ABC): the report text goes straight into the form
//   - plain form link: the report text is copied, then the form opens so it can be pasted
function openReportForm(text) {
  const link = safeUrl((APP_CONFIG.report || {}).form);
  if (!link || !/^https:\/\/(docs\.google\.com\/forms\/|forms\.gle\/)/.test(link)) return false;
  const pre = /=ABC(&|$)/.test(link);
  const url = pre ? link.replace(/=ABC(&|$)/, '=' + encodeURIComponent(text) + '$1') : link;
  if (!pre) {
    try {
      navigator.clipboard.writeText(text).catch(() => {});
    } catch (e) {}
  }
  const w = window.open(url, '_blank');
  if (!w) {
    toast('팝업이 막혔어요. 잠시 뒤 다시 눌러 주세요.');
    return false;
  }
  try {
    w.opener = null;
  } catch (e) {}
  toast(
    pre ? '신고 양식이 열렸어요. 보내기를 눌러 주세요. 고마워요!' : '신고 내용을 복사했어요. 열린 양식 칸에 붙여넣고 보내 주세요. 고마워요!'
  );
  return true;
}

// Backup reminder: after 2 weeks without copying a backup code (only once there is something to lose)
const BACKUP_EVERY = 14;
function backupDue() {
  if (totalN() < 50) return false;
  const t = dayIdx();
  if (S.backupSnooze && t < S.backupSnooze) return false;
  const since = S.lastBackup === undefined ? Infinity : t - S.lastBackup;
  return since >= BACKUP_EVERY;
}
function backupTodoHTML() {
  if (!backupDue()) return '';
  const never = S.lastBackup === undefined;
  return `<li class="todo-i backup"><button type="button" data-settings="backup"><span class="ck" aria-hidden="true"><i class="badge-n">!</i></span><span class="tl">기록 백업할 때가 됐어요<small>${never ? '아직 백업한 적이 없어요' : `마지막 백업 후 ${dayIdx() - S.lastBackup}일 지났어요`} · 휴대폰을 바꿔도 기록을 지킬 수 있어요</small></span><span class="go">백업</span></button></li>
    <li class="todo-snooze"><button type="button" class="link" data-bksnooze>일주일 뒤에 다시 알려 주세요</button></li>`;
}
function backupClick(b) {
  if (!('bksnooze' in b.dataset)) return false;
  S.backupSnooze = dayIdx() + 7;
  save();
  renderHome();
  return true;
}

// ---- ui/settings.js ----
'use strict';
/* ================= settings screen (header gear button): study options, look, backup, reset ================= */

let confirmReset = false;
let bk = { mode: null, msg: '', code: '', input: '' };

const VOICE_SAMPLE = { ja: 'こんにちは。今日もいっしょに勉強しましょう。', en: "Hello! Let's study together today." };
const voiceShort = v =>
  v.name
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/Microsoft|Google|Online|Natural/gi, m => (/google/i.test(m) ? 'Google' : ''))
    .trim() || v.name;
function voiceHTML() {
  const langs = S.lang === 'ja' ? ['ja', 'en'] : ['en', 'ja'];
  const row = l => {
    const vs = langVoices(l).slice(0, 8);
    if (!vs.length)
      return `<div class="set-row"><div><b>${l === 'ja' ? '일본어' : '영어'} 목소리</b><small>목소리를 찾지 못했어요. 잠시 뒤 다시 열어 보거나 <button type="button" class="link" data-vhelp>목소리 받는 방법</button>을 확인하세요.</small></div></div>`;
    const cur = (S.voice && S.voice[l]) || '';
    const good = voiceScore(vs[0], l) >= 40;
    return `<div class="voice-row"><div class="vr-h"><b>${l === 'ja' ? '일본어' : '영어'} 목소리</b><button type="button" class="btn" data-vtest="${l}">▶ 들어 보기</button></div>
      <div class="chips"><button type="button" class="chip" data-voice="${l}" data-uri="" aria-pressed="${!cur}">자동 (가장 좋은 것)</button>${vs
        .map(
          v =>
            `<button type="button" class="chip" data-voice="${l}" data-uri="${esc(v.voiceURI)}" aria-pressed="${cur === v.voiceURI}">${esc(voiceShort(v))}${voiceScore(v, l) >= 40 ? ' <i class="v-hq">고음질</i>' : ''}</button>`
        )
        .join('')}</div>
      ${good ? '' : `<p class="note" style="margin:0">고음질 목소리를 받으면 훨씬 자연스러워요. <button type="button" class="link" data-vhelp>받는 방법</button></p>`}</div>`;
  };
  return `<section id="set-voice"><h2 class="sec-title">발음 목소리</h2><div class="panel" style="padding:14px;display:grid;gap:14px">${langs.map(row).join('')}</div></section>`;
}
function settingsHTML() {
  const segRow = (label, small, key, opts) =>
    `<div class="set-row"><div><b>${label}</b>${small ? `<small>${small}</small>` : ''}</div><div class="seg" role="group" aria-label="${label}">${opts.map(([v, l]) => `<button data-setk="${key}" data-v="${v}" aria-pressed="${String(S.set[key]) === String(v)}">${l}</button>`).join('')}</div></div>`;
  const sw = (key, label, small) =>
    `<div class="set-row"><div><b>${label}</b>${small ? `<small>${small}</small>` : ''}</div><button class="switch" role="switch" data-sw="${key}" aria-checked="${S.set[key]}" aria-label="${label}"></button></div>`;
  return `<div class="sheet-h"><b>설정</b><button type="button" class="icon-btn" data-close aria-label="닫기">${XICON}</button></div>
  <div class="h-scroll">
    <section><h2 class="sec-title">공부</h2><div class="panel">
      ${segRow('하루 목표', '푼 문제 수 기준', 'goal', [
        [0, '끄기'],
        [10, '10'],
        [20, '20'],
        [30, '30'],
        [50, '50']
      ])}
      ${segRow('한 라운드 문제 수', '', 'round', [
        [10, '10'],
        [20, '20'],
        [30, '30']
      ])}
      ${sw('autoNext', '맞히면 자동으로 다음 문제', '문자·단어 연습에 적용')}
      ${hasTTS ? sw('autoSpeak', '답 확인 후 자동 발음', '아이폰 무음 모드에서는 소리가 나지 않아요') + sw('slow', '천천히 발음', '') : ''}
      ${sw('sfx', '효과음', '정답·콤보·레벨 업 소리')}
    </div></section>
    ${hasTTS ? voiceHTML() : ''}
    <section><h2 class="sec-title">화면</h2><div class="panel">
      ${segRow('테마', '', 'theme', [
        ['auto', '자동'],
        ['light', '밝게'],
        ['dark', '어둡게']
      ])}
      ${segRow('글자 크기', '', 'zoom', [
        [1, '보통'],
        [1.1, '크게'],
        [1.2, '아주 크게']
      ])}
    </div></section>
    <section id="set-menu"><h2 class="sec-title">메뉴 편집</h2><div class="panel" style="padding:14px;display:grid;gap:12px">
      <p class="note" style="margin:0">켜진 연습만 메뉴에 보여요. 안 쓰는 건 눌러서 끄세요. (기록은 지워지지 않아요)</p>${menuEditHTML()}</div></section>
    <section><h2 class="sec-title">레벨 테스트</h2><div class="panel" style="padding:14px;display:grid;gap:10px">
      <p class="note">20문제로 실력을 확인하고 코스를 어디서부터 할지 추천받아요.${S.ltest && S.ltest[S.lang] ? ` 지난 결과: ${S.ltest[S.lang].c}/${S.ltest[S.lang].n} · ${S.ltest[S.lang].day}일차 추천` : ''}</p>
      <button class="btn" data-set-ltest>${S.lang === 'ja' ? '일본어' : '영어'} 레벨 테스트 하기</button></div></section>
    <section id="set-backup"><h2 class="sec-title">기록 백업</h2><div class="panel backup" style="padding:14px;display:grid;gap:10px">
      <p class="note">학습 기록은 이 기기에만 저장돼요. 휴대폰을 바꾸거나 Safari 데이터를 지우기 전에 백업 코드를 복사해서 메모 앱이나 '카톡 나에게 보내기'에 보관하세요. 레벨·카드·코스 기록도 함께 저장돼요.</p>
      <div class="row"><button class="btn" data-bk="copy">백업 코드 복사</button><button class="btn" data-bk="open">코드로 복원</button></div>
      ${bk.mode === 'show' ? `<textarea id="bkOut" readonly aria-label="백업 코드">${esc(bk.code)}</textarea>` : ''}
      ${bk.mode === 'import' ? `<textarea id="bkIn" placeholder="HM2. 으로 시작하는 백업 코드를 붙여 넣으세요" aria-label="백업 코드 입력">${esc(bk.input)}</textarea><button class="btn primary" data-bk="restore">복원하기</button><p class="note">지금 기록과 합쳐져요. 같은 문제는 더 많이 푼 쪽 기록을 남겨요.</p>` : ''}
      ${bk.msg ? `<p class="note" style="color:var(--ink)">${esc(bk.msg)}</p>` : ''}
    </div></section>
    ${
      isStandalone()
        ? ''
        : `<section id="set-install"><h2 class="sec-title">아이폰 홈 화면에 추가</h2><div class="panel" style="padding:14px">
      <ol class="steps"><li>Safari에서 이 앱 주소를 엽니다.</li><li>아래쪽 공유 버튼(네모에 위쪽 화살표)을 누릅니다.</li><li>'홈 화면에 추가'를 누르면 앱 아이콘이 생깁니다.</li></ol></div></section>`
    }
    <div id="set-donate">${donateHTML()}</div>
    <section><h2 class="sec-title">도움말</h2><div class="row"><button class="btn" data-set-remind>매일 알림 만들기</button><button class="btn" data-set-help>사용 안내</button><button class="btn" data-set-tour>튜토리얼 다시 보기</button></div></section>
    <section class="danger">${confirmReset ? `<span class="note">학습 기록을 모두 지울까요?</span><button class="btn" data-reset="yes" style="color:var(--ng)">지우기</button><button class="btn quiet" data-reset="no">취소</button>` : `<button class="btn quiet" data-reset="ask">학습 기록 초기화</button>`}</section>
    <p class="note" style="text-align:center;padding:4px 0">하나마루 · 버전 ${esc(APP_VERSION.startsWith('__') ? '미리보기' : APP_VERSION.slice(0, 8))}</p>
  </div>`;
}

function openSettings(section) {
  const el = openSheet(settingsHTML(), 'help settings');
  const rerender = () => {
    el.innerHTML = settingsHTML();
    if (curTab() === 'home') renderHome();
  };
  const resetRounds = () => {
    for (const k in R) R[k] = null;
  };
  el.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.voice) {
      S.voice[b.dataset.voice] = b.dataset.uri;
      save();
      pickVoice();
      speak(VOICE_SAMPLE[b.dataset.voice], b.dataset.voice);
      rerender();
      return;
    }
    if (b.dataset.vtest) {
      speak(VOICE_SAMPLE[b.dataset.vtest], b.dataset.vtest);
      return;
    }
    if ('vhelp' in b.dataset) {
      closeSheet();
      openHelp('voice');
      return;
    }
    if (b.dataset.setk) {
      const k = b.dataset.setk,
        v = b.dataset.v;
      S.set[k] = k === 'theme' ? v : +v;
      if (k === 'round') resetRounds();
      save();
      applyLook();
      rerender();
    } else if (b.dataset.sw) {
      S.set[b.dataset.sw] = !S.set[b.dataset.sw];
      save();
      rerender();
    } else if ('setLtest' in b.dataset) {
      closeSheet();
      startLevelTest();
    } else if ('setRemind' in b.dataset) {
      closeSheet();
      openHelp('remind');
    } else if ('setHelp' in b.dataset) {
      closeSheet();
      openHelp();
    } else if ('setTour' in b.dataset) {
      closeSheet();
      openTour();
    } else if (b.dataset.bk === 'copy') {
      const code = makeCode();
      S.lastBackup = dayIdx();
      save();
      const fallback = () => {
        bk = { mode: 'show', code, msg: '자동 복사가 안 돼요. 위 코드를 길게 눌러 전체 선택한 뒤 복사하세요.', input: '' };
        rerender();
        const t = el.querySelector('#bkOut');
        if (t) {
          t.focus();
          t.select();
        }
      };
      try {
        navigator.clipboard
          .writeText(code)
          .then(() => {
            bk = {
              mode: null,
              msg: `백업 코드를 복사했어요 (${Object.keys(S.stats).length}개 문제 기록). 메모 앱 등에 붙여 넣어 보관하세요.`,
              code: '',
              input: ''
            };
            rerender();
          })
          .catch(fallback);
      } catch (err) {
        fallback();
      }
    } else if (b.dataset.bk === 'open') {
      bk = { mode: bk.mode === 'import' ? null : 'import', msg: '', code: '', input: '' };
      rerender();
      const t = el.querySelector('#bkIn');
      if (t) t.focus();
    } else if (b.dataset.bk === 'restore') {
      const val = (el.querySelector('#bkIn') || {}).value || '';
      try {
        const n = mergeBackup(readCode(val));
        resetRounds();
        bk = { mode: null, msg: `복원했어요. 문제 기록 ${n}개를 합쳤어요.`, code: '', input: '' };
      } catch (err) {
        bk = {
          mode: 'import',
          msg: '코드를 읽을 수 없어요. HM 으로 시작하는 코드 전체를 빠짐없이 붙여 넣었는지 확인하세요.',
          code: '',
          input: val
        };
      }
      rerender();
    } else if (b.dataset.reset) {
      if (b.dataset.reset === 'ask') confirmReset = true;
      else {
        if (b.dataset.reset === 'yes') {
          Object.assign(S, {
            stats: {},
            days: {},
            goalDays: {},
            badges: [],
            best: {},
            course: { ja: {}, en: {} },
            courseFin: {},
            xp: { ja: 0, en: 0 },
            cards: { ja: {}, en: {} },
            tickets: { ja: 0, en: 0 },
            omi: { ja: {}, en: {} },
            omiDays: { ja: {}, en: {} },
            gbest: {},
            cardStart: {},
            missions: {},
            ltest: {}
          });
          resetRounds();
          save();
          toast('학습 기록을 지웠어요');
        }
        confirmReset = false;
      }
      rerender();
    }
  });
  if (section) {
    const t = el.querySelector('#set-' + section);
    if (t)
      setTimeout(() => {
        try {
          t.scrollIntoView({ block: 'start' });
        } catch (e) {}
      }, 30);
  }
}
document.getElementById('setBtn').addEventListener('click', () => openSettings());

// ---- features/travel.js ----
'use strict';
/* ================= travel phrase cards: show a big card to staff and let the phone read it aloud ================= */

const TRAVEL_CATS = {
  fav: '★ 즐겨찾기',
  basic: '기본·인사',
  food: '식당·카페',
  shop: '쇼핑·결제',
  move: '교통·길',
  stay: '숙소',
  sight: '관광',
  trouble: '곤란할 때',
  health: '병원·약국'
};
const TRAVEL = {
  ja: (typeof TRAVEL_JA !== 'undefined' ? TRAVEL_JA : []).map(o => ({ ...o, key: 'tv:ja:' + o.t })),
  en: (typeof TRAVEL_EN !== 'undefined' ? TRAVEL_EN : []).map(o => ({ ...o, key: 'tv:en:' + o.t }))
};
if (!S.travFav || typeof S.travFav !== 'object') S.travFav = {};
let TV_CAT = { ja: 'basic', en: 'basic' };
let TV_SHOW = null; // { list, i, lock }

// Skip the reading line when the sentence is already all kana
const tvNeedsR = x => x.r && x.r.replace(/\s/g, '') !== x.t.replace(/\s/g, '');

function travelList(lang) {
  const c = TV_CAT[lang];
  return TRAVEL[lang].filter(x => (c === 'fav' ? S.travFav[x.key] : x.c === c));
}

function renderTravel(mod) {
  const lang = mod === 'jtrav' ? 'ja' : 'en',
    ja = lang === 'ja';
  const list = travelList(lang);
  const favN = TRAVEL[lang].filter(x => S.travFav[x.key]).length;
  view.innerHTML = `<section class="mod">${modeSeg(mod)}<div class="chart">
    <p class="note">여행 중에 바로 꺼내 쓰는 문장이에요. <b>보여주기</b>를 누르면 화면 가득 크게 띄우고 읽어 줘요. 점원에게 화면을 보여 주기만 해도 돼요.</p>
    <div class="chips">${Object.entries(TRAVEL_CATS)
      .map(
        ([k, l]) =>
          `<button class="chip" data-tvc="${k}" aria-pressed="${TV_CAT[lang] === k}">${l}${k === 'fav' ? ' ' + favN : ' ' + TRAVEL[lang].filter(x => x.c === k).length}</button>`
      )
      .join('')}</div>
    ${
      list.length
        ? `<div class="tv-list">${list
            .map(
              (x, i) => `<div class="tv-card">
      <div class="tv-ko">${esc(x.ko)}</div>
      <div class="tv-t ${ja ? 'jp' : 'en'}" lang="${lang}">${esc(x.t)}</div>${ja && tvNeedsR(x) ? `<div class="tv-r jp" lang="ja">${esc(x.r)}</div>` : ''}
      ${x.n ? `<div class="tv-n">${esc(x.n)}</div>` : ''}
      <div class="tv-act"><button class="btn primary" data-tvshow="${i}">보여주기</button>${spkBtn(x.t, '듣기', lang)}<button class="star" data-tvfav="${esc(x.key)}" aria-pressed="${!!S.travFav[x.key]}" aria-label="즐겨찾기">${S.travFav[x.key] ? '★' : '☆'}</button></div>
    </div>`
            )
            .join('')}</div>`
        : `<div class="empty"><p style="margin:0;font-weight:600">즐겨찾기한 문장이 없어요</p><p class="note">문장 오른쪽의 ☆를 눌러 여행에 쓸 문장을 모아 두세요.</p></div>`
    }
  </div></section>`;
  bindModes();
  view.onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.closest('.modes') || b.dataset.speak) return;
    if (b.dataset.tvc) {
      TV_CAT[lang] = b.dataset.tvc;
      renderTravel(mod);
    } else if (b.dataset.tvfav) {
      const k = b.dataset.tvfav;
      if (S.travFav[k]) delete S.travFav[k];
      else S.travFav[k] = 1;
      save();
      if (TV_CAT[lang] === 'fav') renderTravel(mod);
      else {
        b.setAttribute('aria-pressed', !!S.travFav[k]);
        b.textContent = S.travFav[k] ? '★' : '☆';
      }
    } else if (b.dataset.tvshow !== undefined) openTravelShow(lang, list, +b.dataset.tvshow);
  };
}

// Full-screen card for showing to someone
async function openTravelShow(lang, list, i) {
  closeTravelShow();
  TV_SHOW = { lang, list, i, lock: null };
  const el = document.createElement('div');
  el.className = 'tv-show';
  el.id = 'tvShow';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  document.body.appendChild(el);
  document.body.classList.add('sheet-open');
  el.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const a = b.dataset.tv;
    if (a === 'close') closeTravelShow();
    else if (a === 'say' || a === 'slow') speak(TV_SHOW.list[TV_SHOW.i].t, TV_SHOW.lang, a === 'slow');
    else if (a === 'prev' || a === 'next') {
      TV_SHOW.i = (TV_SHOW.i + (a === 'next' ? 1 : -1) + TV_SHOW.list.length) % TV_SHOW.list.length;
      drawTravelShow(true);
    }
  });
  drawTravelShow(true);
  try {
    if (navigator.wakeLock) TV_SHOW.lock = await navigator.wakeLock.request('screen');
  } catch (e) {}
}
function drawTravelShow(say) {
  const el = document.getElementById('tvShow');
  if (!el || !TV_SHOW) return;
  const x = TV_SHOW.list[TV_SHOW.i],
    ja = TV_SHOW.lang === 'ja';
  const len = [...x.t].length;
  // Japanese has no spaces to break on: pick a size so each line holds at most ~9 characters and lines come out even.
  const perLine = Math.ceil(len / Math.ceil(len / 9));
  const size = ja ? Math.min(16, 86 / perLine) : x.t.length <= 20 ? 11 : x.t.length <= 40 ? 8.5 : 7;
  el.innerHTML = `<div class="tv-show-in">
    <div class="tv-show-top"><span>${ja ? 'すみません、' : 'Excuse me,'}</span><button class="icon-btn" data-tv="close" aria-label="닫기">${XICON}</button></div>
    <p class="tv-big ${ja ? 'jp' : 'en'}" lang="${TV_SHOW.lang}" style="font-size:min(${size}vw, 64px)">${esc(x.t)}</p>
    ${ja && tvNeedsR(x) ? `<p class="tv-big-r jp" lang="ja">${esc(x.r)}</p>` : ''}
    <p class="tv-big-ko">${esc(x.ko)}</p>
    <div class="tv-show-ctl"><button class="btn" data-tv="prev">←</button><button class="btn primary" data-tv="say">${SPK_ICON} 다시 듣기</button><button class="btn" data-tv="slow">천천히</button><button class="btn" data-tv="next">→</button></div>
  </div>`;
  if (say) speak(x.t, TV_SHOW.lang);
}
function closeTravelShow() {
  const el = document.getElementById('tvShow');
  if (el) el.remove();
  if (TV_SHOW && TV_SHOW.lock) {
    try {
      TV_SHOW.lock.release();
    } catch (e) {}
  }
  TV_SHOW = null;
  if (!document.getElementById('sheet')) document.body.classList.remove('sheet-open');
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && TV_SHOW) closeTravelShow();
});
CUSTOM.jtrav = renderTravel;
CUSTOM.etrav = renderTravel;

// ---- features/writing.js ----
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

// ---- features/flashcards.js ----
'use strict';
/* ================= flashcards: flip, then "알아요 / 몰라요" (swipe right / left) ================= */

const FC_SIZE = 20;
let FC = null; // { mod, lang, cards, i, flipped, res: [{w, ok}] }

// Due and weak words first, then words not seen yet, then the rest.
function fcDeck(mod, only) {
  const lang = mod === 'flash' ? 'ja' : 'en';
  const pool = only || basePool(lang === 'ja' ? 'word' : 'ew', false);
  const rank = w => (isDue(w.key) ? 0 : isWeak(w.key) ? 1 : !S.stats[w.key] ? 2 : 3);
  const sorted = shuffle(pool).sort((a, b) => rank(a) - rank(b));
  return sorted.slice(0, Math.min(FC_SIZE, sorted.length));
}
function startFlash(mod, only) {
  FC = { mod, lang: mod === 'flash' ? 'ja' : 'en', cards: fcDeck(mod, only), i: 0, flipped: false, res: [] };
}

function renderFlash(mod) {
  if (!FC || FC.mod !== mod) startFlash(mod);
  view.innerHTML = `<section class="mod">${modeSeg(mod)}<div id="fcBody"></div></section>`;
  bindModes();
  fcRender();
}
function fcRender() {
  const box = document.getElementById('fcBody');
  if (!box || !FC) return;
  const { lang, cards, i } = FC,
    ja = lang === 'ja';
  if (!cards.length) {
    box.innerHTML = `<div class="empty"><p style="margin:0;font-weight:600">카드로 볼 단어가 없어요</p><p class="note">단어 퀴즈의 설정에서 범위를 넓혀 보세요.</p></div>`;
    return;
  }
  if (i >= cards.length) return fcSummary(box);
  const w = cards[i];
  const front = ja ? (S.set.kanji ? w.w : w.r) : w.w;
  const st = itemStatus(w.key);
  box.innerHTML = `<div class="prog"><div class="prog-bar"><i style="width:${(i / cards.length) * 100}%"></i></div><span class="num">${i + 1} / ${cards.length}</span><span class="score num"><span class="o">○ ${FC.res.filter(x => x.ok).length}</span><span>× ${FC.res.filter(x => !x.ok).length}</span></span></div>
    <div class="fc ${FC.flipped ? 'flip' : ''}" id="fcCard" role="button" tabindex="0" aria-label="카드 뒤집기">
      <div class="fc-in">
        <div class="fc-face fc-front">${st ? `<span class="fc-st ${st}">${{ weak: '복습 필요', learn: '연습 중', done: '익힘' }[st]}</span>` : '<span class="fc-st new">새 단어</span>'}
          <b class="${ja ? 'jp' : 'en'}" lang="${lang}" style="font-size:${ja ? wordSize(front) : enSize(front)}px">${esc(front)}</b><small>눌러서 뒤집기</small></div>
        <div class="fc-face fc-back">
          <b class="${ja ? 'jp' : 'en'}" lang="${lang}" style="font-size:${Math.min(44, ja ? wordSize(w.w) : enSize(w.w))}px">${esc(w.w)}</b>
          ${ja && w.w !== w.r ? `<span class="jp" lang="ja" style="font-size:19px">${esc(w.r)}</span>` : ''}${ja ? `<span class="mono">${romaji(w.r)}</span>` : ''}
          <p class="fc-m">${esc(w.m.join(', '))}</p>
          ${w.ex ? `<p class="fc-ex ${ja ? 'jp' : 'en'}" lang="${lang}">${esc(w.ex)}</p><p class="fc-exk">${esc(w.exko || '')}</p>` : ''}
        </div>
      </div>
    </div>
    <div class="fc-btns"><button class="btn fc-no" data-fc="no">← 몰라요</button>${spkBtn(ja ? w.r : w.w, '', lang)}<button class="btn fc-yes" data-fc="yes">알아요 →</button></div>
    <p class="note" style="text-align:center">카드를 왼쪽으로 밀면 몰라요, 오른쪽으로 밀면 알아요. 몰라요 카드는 복습에 다시 나와요.</p>`;
  const card = document.getElementById('fcCard');
  let sx = null,
    dx = 0;
  card.addEventListener('pointerdown', e => {
    sx = e.clientX;
    dx = 0;
  });
  card.addEventListener('pointermove', e => {
    if (sx === null) return;
    dx = e.clientX - sx;
    card.style.transform = `translateX(${dx}px) rotate(${dx / 25}deg)`;
  });
  const end = () => {
    if (sx === null) return;
    const d = dx;
    sx = null;
    card.style.transform = '';
    if (d > 70) fcAnswer(true);
    else if (d < -70) fcAnswer(false);
    else if (Math.abs(d) < 6) fcFlip();
  };
  card.addEventListener('pointerup', end);
  card.addEventListener('pointercancel', () => {
    sx = null;
    card.style.transform = '';
  });
  card.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      fcFlip();
    }
  });
  box.onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.dataset.speak) return;
    if (b.dataset.fc === 'yes') fcAnswer(true);
    else if (b.dataset.fc === 'no') fcAnswer(false);
    else if (b.dataset.fc === 'again') {
      startFlash(FC.mod);
      fcRender();
    } else if (b.dataset.fc === 'retry') {
      startFlash(
        FC.mod,
        FC.res.filter(x => !x.ok).map(x => x.w)
      );
      fcRender();
    }
  };
}
function fcFlip() {
  FC.flipped = !FC.flipped;
  const c = document.getElementById('fcCard');
  if (c) c.classList.toggle('flip', FC.flipped);
  if (FC.flipped && S.set.autoSpeak) {
    const w = FC.cards[FC.i];
    speak(FC.lang === 'ja' ? w.r : w.w, FC.lang);
  }
}
function fcAnswer(ok) {
  if (!FC || FC.i >= FC.cards.length) return;
  const w = FC.cards[FC.i];
  FC.res.push({ w, ok });
  record(w.key, ok);
  sfx(ok ? 'ok' : 'flip');
  FC.i++;
  FC.flipped = false;
  fcRender();
}
function fcSummary(box) {
  const ok = FC.res.filter(x => x.ok).length,
    no = FC.res.length - ok;
  box.innerHTML = `<div class="sum"><div class="sum-score"><b class="num">${ok}</b><span class="num">/ ${FC.res.length}</span></div>
    <p class="sum-msg">${no ? `몰라요 ${no}장은 복습 목록에 넣어 뒀어요.` : '전부 알고 있네요. 하나마루!'}</p>
    ${
      no
        ? `<ul class="miss">${FC.res
            .filter(x => !x.ok)
            .map(
              x =>
                `<li><span class="${FC.lang === 'ja' ? 'jp' : 'en'}" lang="${FC.lang}">${esc(x.w.w)}</span><span class="s">${FC.lang === 'ja' && x.w.w !== x.w.r ? esc(x.w.r) + ' · ' : ''}${esc(x.w.m[0])}</span></li>`
            )
            .join('')}</ul>`
        : ''
    }
    <div class="row">${no ? `<button class="btn primary" data-fc="retry">몰라요 ${no}장 다시</button>` : ''}<button class="btn ${no ? '' : 'primary'}" data-fc="again">새로 ${FC_SIZE}장</button></div></div>`;
}
CUSTOM.flash = renderFlash;
CUSTOM.eflash = renderFlash;

// ---- features/share-words.js ----
'use strict';
/* ================= word-list share links: send my own words + starred words to a friend ================= */

const WL_MAX_FAV = 200;

function wordSharePayload(lang, withMine, withFav) {
  const mine = withMine ? S.custom[lang].map(c => (lang === 'ja' ? [c.w, c.r, c.m] : [c.w, c.m])) : [];
  const words = lang === 'ja' ? BASE_JP : BASE_EN;
  const fav = withFav
    ? words
        .filter(w => S.fav[w.key])
        .slice(0, WL_MAX_FAV)
        .map(w => w.key)
    : [];
  return { v: 1, l: lang, n: (S.name || '').slice(0, 12), c: mine, f: fav };
}
function wordShareLink(o) {
  const base = location.protocol === 'http:' || location.protocol === 'https:' ? location.href.split('#')[0] : '';
  return base + '#wl=' + b64u.enc(JSON.stringify(o));
}
function parseWordShare(h) {
  try {
    const m = /[#&]wl=([A-Za-z0-9_-]+)/.exec(h || '');
    if (!m) return null;
    const o = JSON.parse(b64u.dec(m[1]));
    if (!o || !['ja', 'en'].includes(o.l) || !Array.isArray(o.c) || !Array.isArray(o.f)) return null;
    o.n = String(o.n || '친구').slice(0, 12) || '친구';
    o.c = o.c.filter(x => Array.isArray(x) && x.every(v => typeof v === 'string' && v.length <= 60)).slice(0, 300);
    o.f = o.f.filter(k => typeof k === 'string' && k.length <= 80).slice(0, WL_MAX_FAV);
    return o;
  } catch (e) {
    return null;
  }
}

// sender
function openWordShare(lang) {
  const mineN = S.custom[lang].length;
  const favN = (lang === 'ja' ? BASE_JP : BASE_EN).filter(w => S.fav[w.key]).length;
  const el = openSheet(
    `<div class="sheet-h"><b>단어장 공유</b><button type="button" class="icon-btn" data-close aria-label="닫기">${XICON}</button></div>
    <div class="h-scroll">
      <p class="note">링크를 받은 친구가 열면, 아래 단어가 친구 앱의 '내 단어'와 즐겨찾기에 들어가요.</p>
      <div class="panel" style="padding:4px 14px">
        <label class="set-row"><div><b>내가 추가한 단어</b><small>${mineN}개</small></div><input type="checkbox" id="wsMine" ${mineN ? 'checked' : 'disabled'}></label>
        <label class="set-row"><div><b>★ 즐겨찾기한 단어</b><small>${favN}개${favN > WL_MAX_FAV ? ` (앞의 ${WL_MAX_FAV}개만)` : ''}</small></div><input type="checkbox" id="wsFav" ${favN ? 'checked' : 'disabled'}></label>
      </div>
      <label class="vs-name"><span class="note">내 이름 (친구에게 보여요)</span><input id="wsName" type="text" maxlength="12" placeholder="예: 민수" value="${esc(S.name || '')}" autocomplete="off"></label>
      <button class="btn primary" data-ws="send" ${mineN || favN ? '' : 'disabled'}>링크 보내기</button>
      ${mineN || favN ? '' : `<p class="note">아직 보낼 단어가 없어요. 단어장에서 ☆를 누르거나 내 단어를 추가해 보세요.</p>`}
    </div>`,
    'help'
  );
  el.querySelector('[data-ws=send]').addEventListener('click', () => {
    S.name = (el.querySelector('#wsName').value || '').trim().slice(0, 12);
    save();
    const o = wordSharePayload(lang, el.querySelector('#wsMine').checked, el.querySelector('#wsFav').checked);
    if (!o.c.length && !o.f.length) {
      toast('보낼 단어를 골라 주세요');
      return;
    }
    const link = wordShareLink(o);
    const text = `[하나마루 단어장] ${o.n || '친구'}의 ${lang === 'ja' ? '일본어' : '영어'} 단어 ${o.c.length + o.f.length}개! 링크를 열면 내 앱에 추가돼요.`;
    if (link.startsWith('#')) {
      toast('이 미리보기에서는 링크를 만들 수 없어요. GitHub 주소의 앱에서 써 주세요.');
      return;
    }
    const fb = () =>
      copyText(text + '\n' + link, '단어장 링크를 복사했어요. 카톡에 붙여 넣어 보내세요.', () => toast('링크를 복사하지 못했어요'));
    try {
      if (navigator.share)
        navigator.share({ text, url: link }).catch(err => {
          if (!err || err.name !== 'AbortError') fb();
        });
      else fb();
    } catch (err) {
      fb();
    }
  });
}

// receiver
function offerWordShare(o) {
  const lang = o.l,
    words = lang === 'ja' ? BASE_JP : BASE_EN;
  const keys = new Set(words.map(w => w.key));
  const fav = o.f.filter(k => keys.has(k));
  const sample = [...o.c.map(c => c[0]), ...fav.slice(0, 6).map(k => words.find(w => w.key === k).w)].slice(0, 8);
  const el = openSheet(
    `<div class="sheet-h"><b>${esc(o.n)}님의 단어장</b><button type="button" class="icon-btn" data-close aria-label="닫기">${XICON}</button></div>
    <div class="h-scroll">
      <p style="margin:0">${lang === 'ja' ? '일본어' : '영어'} 단어 <b>${o.c.length + fav.length}개</b>를 받았어요. ${[o.c.length ? `직접 만든 단어 ${o.c.length}개는 '내 단어'에` : '', fav.length ? `${fav.length}개는 즐겨찾기에` : ''].filter(Boolean).join(', ')} 들어가요.</p>
      <div class="chips">${sample.map(w => `<span class="chip ${lang === 'ja' ? 'jp' : 'en'}" lang="${lang}">${esc(w)}</span>`).join('')}${o.c.length + fav.length > sample.length ? '<span class="chip">…</span>' : ''}</div>
      <button class="btn primary" data-wsa>내 단어장에 추가</button>
    </div>`,
    'help'
  );
  el.querySelector('[data-wsa]').addEventListener('click', () => {
    let added = 0;
    for (const c of o.c) {
      if (lang === 'ja') {
        const [w, r, m] = c;
        if (w && r && m && !S.custom.ja.some(x => x.w === w && x.r === r)) {
          S.custom.ja.push({ w, r, m });
          added++;
        }
      } else {
        const [w, m] = c;
        if (w && m && !S.custom.en.some(x => x.w === w)) {
          S.custom.en.push({ w, m });
          added++;
        }
      }
    }
    for (const k of fav)
      if (!S.fav[k]) {
        S.fav[k] = 1;
        added++;
      }
    if (lang === 'ja') {
      S.word.cats = [...new Set([...S.word.cats, 'mine'])];
      R.word = null;
    } else {
      S.ew.cats = [...new Set([...S.ew.cats, 'mine'])];
      R.ew = null;
    }
    rebuildWords();
    save();
    closeSheet();
    toast(added ? `단어 ${added}개를 추가했어요` : '이미 다 가지고 있는 단어예요');
    if (S.lang !== lang) {
      S.lang = lang;
      save();
      renderTabs();
    }
    startMod(lang === 'ja' ? 'jlist' : 'elist');
  });
}

// ---- views/hanja-rules.js ----
'use strict';
/* ================= 한국음 규칙: rules with real percentages, a Korean-sound lookup, and false friends ================= */

let HJR_Q = '';

// share of kanji (교육한자, main on'yomi) that follow each rule — computed from the data, not hard-coded
function hjrStats() {
  const out = {};
  for (const r of HJ_RULES) {
    const xs = HJ_ITEMS.filter(x => r.jong.includes((hjDec(x.h) || [0, 0, -1])[2]));
    const ok = xs.filter(x => r.ends.includes(hjEnd(x.o))).length;
    out[r.id] = { n: xs.length, p: xs.length ? Math.round((ok * 100) / xs.length) : 0 };
  }
  return out;
}
function hjrChoStats(c) {
  const xs = HJ_ITEMS.filter(x => c.c.includes(HJ_CHO[(hjDec(x.h) || [-1])[0]]));
  const want = c.to.match(/[ぁ-ん]/g) || [];
  const ok = xs.filter(x => want.includes(hjRow(x.o))).length;
  return xs.length ? Math.round((ok * 100) / xs.length) : 0;
}
const hjrEx = k => {
  const x = HJ_BY_K.get(k);
  return x
    ? `<span class="hj-ex"><b class="jp" lang="ja">${esc(k)}</b> ${esc(x.h)} → <span class="jp" lang="ja">${esc(x.o)}</span></span>`
    : '';
};
const hjrWordEx = t => HJW_ITEMS.find(w => w.s.some(x => x[4] === t));

const hjrDiffCard = d =>
  `<div class="hjr-d"><div><b class="jp" lang="ja">${esc(d.k)}</b> <span class="jp" lang="ja">${esc(d.r)}</span>${spkBtn(d.r, '')}</div><p>한국어로 읽으면 <s>${esc(d.ko)}</s> → 일본어 뜻은 <b>${esc(d.ja)}</b></p>${d.n ? `<p class="note">${esc(d.n)}</p>` : ''}</div>`;

function renderHanjaRules(mod) {
  const st = hjrStats();
  const sok = hjrWordEx('촉음'),
    ren = hjrWordEx('연탁'),
    han = hjrWordEx('반탁음');
  const chg = (w, t) =>
    w
      ? `<li><b>${t}</b> · <span class="jp" lang="ja">${esc(w.k)}</span> ${esc(w.ko)} = ${w.s.map(x => `<span class="jp" lang="ja">${esc(x[2])}</span>`).join(' + ')} → <b class="jp" lang="ja">${esc(w.r)}</b></li>`
      : '';
  view.innerHTML = `<section class="mod">${modeSeg(mod)}<div class="chart hjr">
    <p class="hjr-lead">한국어 한자음을 알면 일본어 음독이 보여요. <b>学校</b>는 <b>학교</b>, 일본어로 <b class="jp" lang="ja">がっこう</b>. 생각보다 규칙적이에요.</p>
    <div class="row hjr-go"><button class="btn primary" data-hjgo="hj">한자 퀴즈</button><button class="btn" data-hjgo="hjw">한자어 퀴즈</button><button class="btn" data-share-hj="">카드 만들기</button></div>

    <h3 class="hjr-h">① 받침이 끝소리를 정해요</h3>
    <p class="note">교육한자 ${HJ_ITEMS.length}자의 대표 음독으로 세어 본 비율이에요.</p>
    <div class="hjr-rules">${HJ_RULES.map(
      r => `<div class="hjr-rule">
      <div class="hjr-top"><b>${r.from}</b><span class="hjr-to">→ ${r.to}</span><span class="hjr-p num">${st[r.id].p}%</span></div>
      <div class="hjr-bar"><i style="width:${st[r.id].p}%"></i></div>
      <div class="hjr-ex">${r.ex.map(hjrEx).join('')}</div></div>`
    ).join('')}</div>

    <h3 class="hjr-h">② 첫소리도 대체로 정해져 있어요</h3>
    <div class="hjr-cho">${HJ_CHO_RULES.map(c => `<div class="hjr-c ${c.star ? 'hot' : ''}"><b>${c.c.join(' · ')}</b><span>→ <span class="jp" lang="ja">${c.to}</span> <span class="hjr-p num">${hjrChoStats(c)}%</span></span><span class="hjr-ex">${c.ex.map(hjrEx).join('')}</span>${c.star ? '<em>한국어 ㅎ은 일본어 か행! (학 → がく, 한 → かん)</em>' : ''}</div>`).join('')}</div>

    <h3 class="hjr-h">③ 붙이면 소리가 바뀌는 곳</h3>
    <ul class="hjr-chg">${chg(sok, '촉음')}${chg(ren, '탁음')}${chg(han, '반탁음')}</ul>
    <p class="note">く·き·つ·ち로 끝나는 음 뒤에 か·さ·た·ぱ행이 오면 っ로 줄어들기 쉬워요. 뒤에 오는 글자는 가끔 탁음(が·ざ·だ·ば)이 돼요.</p>

    <h3 class="hjr-h">④ 한국음 사전</h3>
    <input type="search" id="hjrQ" class="wl-search" placeholder="한국음으로 찾기 (예: 학, 도서관)" value="${esc(HJR_Q)}" lang="ko" autocomplete="off" aria-label="한국음으로 찾기">
    <div id="hjrOut"></div>

    ${
      HJ_DIFF_LIST.length
        ? `<h3 class="hjr-h">⑤ 조심! 한자는 같은데 뜻이 달라요</h3>
    <div class="hjr-diff">${HJ_DIFF_LIST.slice(0, 6).map(hjrDiffCard).join('')}</div>
    ${HJ_DIFF_LIST.length > 6 ? `<details class="hjr-more"><summary>${HJ_DIFF_LIST.length - 6}개 더 보기</summary><div class="hjr-diff">${HJ_DIFF_LIST.slice(6).map(hjrDiffCard).join('')}</div></details>` : ''}`
        : ''
    }
    <p class="note hjr-credit">한자 음 자료: KANJIDIC2 (© EDRDG, CC BY-SA 4.0)</p>
  </div></section>`;
  bindModes();
  const q = document.getElementById('hjrQ');
  q.addEventListener('input', () => {
    HJR_Q = q.value.trim();
    hjrLookup();
  });
  hjrLookup();
  view.onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.closest('.modes') || b.dataset.speak) return;
    if (b.dataset.hjgo) startMod(b.dataset.hjgo);
  };
}

// 한국음 → kanji list; a whole word gets the matching 한자어 or a guess from the most common kanji
function hjrLookup() {
  const box = document.getElementById('hjrOut');
  if (!box) return;
  const q = HJR_Q.replace(/\s/g, '');
  if (!q || ![...q].every(c => hjDec(c))) {
    box.innerHTML = q ? '<p class="note">한글로 입력해 주세요.</p>' : '';
    return;
  }
  const bySound = h =>
    HJ_ITEMS.filter(x => x.hs.includes(h))
      .sort((a, b) => a.f - b.f)
      .slice(0, 8);
  let html = '';
  if (q.length > 1) {
    const w = HJW_ITEMS.find(x => x.ko === q) || HJ_DIFF_LIST.find(x => x.ko === q);
    if (w)
      html += `<div class="hjr-hit"><b class="jp" lang="ja">${esc(w.k)}</b> <b class="jp" lang="ja">${esc(w.r)}</b>${spkBtn(w.r, '')}${w.ja ? '' : `<button type="button" class="link" data-share-hj="${esc(w.k)}">카드로 보내기</button>`}${w.ja ? `<p class="note">일본어 뜻은 '${esc(w.ja)}'이에요. ${esc(w.n || '')}</p>` : ''}</div>`;
    else {
      const guess = [...q].map(h => bySound(h)[0]);
      if (guess.every(Boolean))
        html += `<div class="hjr-hit guess"><span class="note">가장 흔한 한자로 추측하면</span> <b class="jp" lang="ja">${guess.map(x => esc(x.k)).join('')}</b> → <b class="jp" lang="ja">${guess.map(x => esc(x.o)).join('')}</b><p class="note">한자가 다를 수 있고, 붙일 때 소리가 바뀔 수도 있어요.</p></div>`;
    }
  }
  html += [...new Set(q)]
    .slice(0, 4)
    .map(h => {
      const xs = bySound(h);
      return `<div class="hjr-snd"><b>${esc(h)}</b>${xs.length ? xs.map(x => `<span class="hj-ex" title="${esc(x.hun)}"><b class="jp" lang="ja">${esc(x.k)}</b> <span class="jp" lang="ja">${esc(x.on.join('・'))}</span>${x.hun ? `<small>${esc(x.hun)}</small>` : ''}</span>`).join('') : '<span class="note">교육한자에 없는 음이에요</span>'}</div>`;
    })
    .join('');
  box.innerHTML = html;
}
CUSTOM.hjr = renderHanjaRules;

// ---- features/signs.js ----
'use strict';
/* ================= 메뉴판·간판 읽기: words travelers see on menus, signs and stations ================= */

const SIGN_CATS = { menu: '식당·메뉴', shop: '가게·편의점', station: '역·교통', sign: '안내·경고', stay: '숙소·온천' };
const SIGN_ITEMS = (typeof SIGNS_RAW !== 'undefined' ? SIGNS_RAW : []).map(o => ({ ...o, key: 'sg:' + o.t }));
if (!Array.isArray(S.sgc)) S.sgc = [];

// Korean hanja reading of the kanji in a sign (営業中 → 영업중), when every kanji is known
function signKo(t) {
  const ks = [...t].filter(c => /[一-鿿]/.test(c));
  if (!ks.length || typeof HJ_BY_K === 'undefined') return '';
  const hs = ks.map(c => (HJ_BY_K.get(c) || {}).h);
  return hs.every(Boolean) ? ks.join('') + ' ' + hs.join('') : '';
}
const signBoard = (x, big) => `<div class="sgb sgb-${esc(x.c)} ${big ? 'big' : ''}" lang="ja"><span>${esc(x.t)}</span></div>`;

POOLS.sign = full => (full || !S.sgc.length ? SIGN_ITEMS : SIGN_ITEMS.filter(x => S.sgc.includes(x.c)));
SETUPS.sign = () => {
  const all = !S.sgc.length;
  return [
    `메뉴판·간판 ${POOLS.sign().length}개 · ${all ? '전체' : S.sgc.map(c => SIGN_CATS[c]).join('·')}`,
    `<div class="setup-row"><label>어디서</label><div class="chips"><button class="chip" data-sgc="" aria-pressed="${all}">전체</button>${Object.entries(
      SIGN_CATS
    )
      .map(
        ([c, l]) =>
          `<button class="chip" data-sgc="${c}" aria-pressed="${!all && S.sgc.includes(c)}">${l} ${SIGN_ITEMS.filter(x => x.c === c).length}</button>`
      )
      .join('')}</div></div>
     <p class="note">일본 여행에서 실제로 보게 되는 메뉴판·간판·역 안내예요. <button type="button" class="link" data-sglist>전체 목록 보기</button></p>`
  ];
};
LABELS.sign = q => [q.t, q.m];
SPEAKQ.sign = q => [q.r, 'ja'];
AUTO.sign = 1800;
CHECK.sign = (v, s) => genericChoice('sign', -1, s);
SHOWS.sign = (mod, q, card, zone, r) => {
  if (!r.order) r.order = shuffle([q.m, ...q.o].map(t => ({ t, ok: t === q.m, cls: '', lang: 'ko' })));
  card.innerHTML = `<span class="cat">${SIGN_CATS[q.c] || '간판'}</span>${signBoard(q, true)}
    <p class="cap">${r.answered ? `<span class="jp" lang="ja">${esc(q.r)}</span> · ` : ''}무슨 뜻일까요?</p>${MARKS}`;
  zone.dataset.type = 'sign';
  zone.innerHTML = optsHTML(r);
};
INFO.sign = q => {
  const ko = signKo(q.t);
  return `<p class="fb-big"><span class="jp" lang="ja">${esc(q.t)}</span> <span class="jp" lang="ja" style="font-size:.7em;color:var(--muted)">${esc(q.r)}</span></p>
    <p class="fb-sub" style="color:var(--ink)"><b>${esc(q.m)}</b>${ko ? ` · <span class="hj-chg">한국음 ${esc(ko.split(' ')[1])}</span>` : ''}</p>
    ${q.n ? `<p class="fb-sub">${esc(q.n)}</p>` : ''}<div>${spkBtn(q.r, '듣기')}</div>`;
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-sgc],[data-sglist]');
  if (!b) return;
  if (b.dataset.sglist !== undefined) return openSignList();
  const c = b.dataset.sgc;
  if (!c) S.sgc = [];
  else S.sgc = S.sgc.includes(c) ? S.sgc.filter(x => x !== c) : [...S.sgc, c];
  save();
  R.sign = null;
  renderModule('sign');
});

function openSignList() {
  const el = openSheet(
    `<div class="sheet-h"><b>메뉴판·간판 모아 보기</b><button type="button" class="icon-btn" data-close aria-label="닫기">${XICON}</button></div>
    <div class="h-scroll">${Object.entries(SIGN_CATS)
      .map(
        ([c, l]) =>
          `<h3 class="hjr-h">${l}</h3><div class="sg-grid">${SIGN_ITEMS.filter(x => x.c === c)
            .map(
              x =>
                `<button class="sg-cell" data-speak="${esc(x.r)}" data-lang="ja">${signBoard(x)}<b>${esc(x.m)}</b><small class="jp" lang="ja">${esc(x.r)}</small></button>`
            )
            .join('')}</div>`
      )
      .join('')}</div>`,
    'help'
  );
  return el;
}

// ---- features/trip.js ----
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

// ---- features/daily.js ----
'use strict';
/* ================= "오늘 공부 시작": one button that runs review → course → cards in a row (about 10 minutes) ================= */

let DAILY = null; // { lang, steps: [{ k, mod, label, di, ti }], i }

// review → course → weak spot (→ more course / review), at most 3 steps (about 10 minutes)
function dailyPlan(lang) {
  const steps = [];
  const dl = dueList();
  const due = ([m, n]) => ({ k: 'due', mod: m, label: `${DUE_LABEL[m] || modeLabel(m)} 복습 ${Math.min(n, S.set.round)}개` });
  const cd = curDay(lang);
  const tasks =
    cd < COURSE[lang].length
      ? dayTasks(lang, cd)
          .filter(x => !cDone(lang, cd, x.ti))
          .map(({ t, ti }) => ({ k: 'task', mod: t.m, di: cd, ti, label: `${cd + 1}일차 · ${taskLabel(t)}` }))
      : [];
  if (dl[0]) steps.push(due(dl[0]));
  if (tasks[0]) steps.push(tasks[0]);
  const wk = weakestArea(lang);
  if (wk && !steps.some(s => s.mod === wk.mod)) steps.push({ k: 'weak', mod: wk.mod, label: wk.label });
  if (steps.length < 3 && tasks[1]) steps.push(tasks[1]);
  if (steps.length < 3 && dl[1] && dl[1][1] >= 5) steps.push(due(dl[1]));
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
  else if (s.k === 'weak') {
    S.filt[s.mod] = 'weak';
    R[s.mod] = null;
    startMod(s.mod);
  } else {
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

// ---- features/share-more.js ----
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
  drawQRFooter(x, W, H, line);
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
    H = 1520,
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
  await Promise.all([loadCardFonts(), ensureQR()]);
  const n = t.day - dayIdx();
  shareImage(drawTripCard(t), `${t.name || '여행'} ${n > 0 ? 'D-' + n : 'D-DAY'}! 하나마루로 여행 회화 준비 중`, '여행 D-day 카드');
}

// ---- 한국음 발견 카드 ----
function drawHanjaCard(w) {
  const W = 1080,
    H = 1600,
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
  await Promise.all([loadCardFonts(), ensureQR()]);
  shareImage(drawHanjaCard(w), `${w.ko} = ${w.k} = ${w.r}! 한국어를 알면 일본어가 보여요 · 하나마루`, '한국음 카드');
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-share-trip],[data-share-hj]');
  if (!b) return;
  if (b.dataset.shareHj !== undefined) shareHanjaCard(b.dataset.shareHj);
  else shareTripCard();
});

// ---- views/weak.js ----
'use strict';
/* ================= 내 약점 리포트: accuracy per practice and per sub-skill, with a button straight into practice ================= */

// How to split a practice into sub-skills (item → label) for the finer report
const WEAK_SUB = {
  jlen: x => x.lb,
  kpart: x => x.g,
  etrap: x => x.g,
  part: x => x.p,
  hj: x => (hjRuleOf(x.h) || {}).from,
  sign: x => SIGN_CATS[x.c],
  kana: x => (x.sc === 'k' ? '가타카나' : '히라가나'),
  hjw: x => (x.s.some(p => p[4]) ? '소리가 바뀌는 단어 (촉음·탁음)' : '그대로 이어 읽는 단어')
};
const WEAK_MIN = 8;
// does the last Hangul syllable end in a consonant (for 이에요 / 예요)
const hasBatchim = t => {
  const c = (t || '').replace(/[^가-힣]/g, '').slice(-1);
  return !!c && (c.charCodeAt(0) - 0xac00) % 28 > 0;
}; // answers needed before a practice is judged

function statOf(keys) {
  let c = 0,
    w = 0,
    weak = 0;
  for (const k of keys) {
    const s = S.stats[k];
    if (!s) continue;
    c += s.c || 0;
    w += s.w || 0;
    if (isWeak(k)) weak++;
  }
  const n = c + w;
  return { n, c, w, weak, acc: n ? Math.round((c * 100) / n) : null };
}
function weakAreas(lang) {
  const out = [];
  for (const m of SRS_MODS[lang]) {
    if (!modTab(m)) continue;
    const items = basePool(m, true);
    const st = statOf(items.map(x => x.key));
    if (st.n >= WEAK_MIN) out.push({ mod: m, label: modeLabel(m), ...st, items });
  }
  return out.sort((a, b) => a.acc - b.acc);
}
function weakSubs(areas) {
  const out = [];
  for (const a of areas) {
    const f = WEAK_SUB[a.mod];
    if (!f) continue;
    const groups = new Map();
    for (const it of a.items) {
      const g = f(it);
      if (!g) continue;
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(it);
    }
    for (const [g, its] of groups) {
      const st = statOf(its.map(x => x.key));
      if (st.n >= 5) out.push({ mod: a.mod, area: a.label, sub: g, ...st, items: its });
    }
  }
  return out.sort((a, b) => a.acc - b.acc);
}
// the weakest area worth a review round (used by "오늘 공부 시작")
function weakestArea(lang) {
  const a = weakAreas(lang).find(x => x.acc < 75 && x.weak > 0);
  return a ? { mod: a.mod, label: `약점 보강 · ${a.label} ${a.acc}%` } : null;
}
let WEAK_SUBS = [];
function renderWeak(mod) {
  const lang = S.lang;
  const areas = weakAreas(lang);
  WEAK_SUBS = weakSubs(areas)
    .filter(x => x.acc < 80)
    .slice(0, 6);
  const tone = acc => (acc >= 85 ? 'ok' : acc >= 70 ? 'mid' : 'ng');
  const worst = areas[0];
  view.innerHTML = `<section class="mod">${modeSeg(mod)}<div class="chart weak">
    ${
      !areas.length
        ? `<div class="empty"><p style="margin:0;font-weight:600">아직 기록이 부족해요</p><p class="note">연습마다 ${WEAK_MIN}문제 이상 풀면 어디가 약한지 알려 드릴게요.</p></div>`
        : `<p class="weak-lead">${worst.acc < 85 ? `가장 약한 곳은 <b>${esc(worst.label)}</b>${hasBatchim(worst.label) ? '이에요' : '예요'}. 정답률 ${worst.acc}%.` : '전체적으로 잘하고 있어요! 정답률이 낮은 순서로 보여 드려요.'}</p>
    ${
      WEAK_SUBS.length
        ? `<h3 class="hjr-h">콕 집은 약점</h3><div class="weak-subs">${WEAK_SUBS.map(
            (x, i) =>
              `<div class="weak-sub"><div><b>${esc(x.sub)}</b><small>${esc(x.area)} · ${x.n}문제 중 ${x.c}개 맞힘</small></div><span class="weak-acc ${tone(x.acc)} num">${x.acc}%</span><button type="button" class="btn" data-wsub="${i}">집중 연습</button></div>`
          ).join('')}</div>`
        : ''
    }
    <h3 class="hjr-h">연습별 정답률</h3>
    <div class="weak-list">${areas
      .map(
        a => `<div class="weak-row"><div class="wr-top"><b>${esc(a.label)}</b><span class="num">${a.acc}% · ${a.n}문제</span></div>
        <span class="weak-bar"><i class="${tone(a.acc)}" style="width:${a.acc}%"></i></span>
        <div class="wr-act">${a.weak ? `<small>복습 필요 ${a.weak}개</small><button type="button" class="link" data-wmod="${a.mod}">틀린 것 연습 →</button>` : '<small>복습 필요 없음</small>'}</div></div>`
      )
      .join('')}</div>`
    }
    <p class="note" style="margin-top:14px">정답률은 지금까지 푼 모든 기록으로 계산해요. 약한 곳은 '오늘 공부 시작'에도 자동으로 섞여 나와요.</p>
  </div></section>`;
  view.onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.closest('.modes')) return;
    if (b.dataset.wmod) {
      S.filt[b.dataset.wmod] = 'weak';
      R[b.dataset.wmod] = null;
      save();
      startMod(b.dataset.wmod);
    } else if (b.dataset.wsub !== undefined) {
      const x = WEAK_SUBS[+b.dataset.wsub];
      if (!x) return;
      // weakest items of that sub-skill first, then the rest of it
      const items = [...x.items].sort((p, q) => isWeak(q.key) - isWeak(p.key) || (S.stats[q.key]?.w || 0) - (S.stats[p.key]?.w || 0));
      PENDING[x.mod] = items.slice(0, Math.min(items.length, S.set.round));
      R[x.mod] = null;
      startMod(x.mod);
    }
  };
}
CUSTOM.weak = renderWeak;

// ---- features/ai.js ----
'use strict';
/* ================= AI connection: one small Cloudflare Worker (see AI_SETUP.md); nothing is sent unless it is set up ================= */

const aiCfg = () => (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.ai) || {};
const aiOn = () => /^https:\/\/[^\s"'<>]+$/.test(aiCfg().endpoint || '');
const aiLimit = () => Math.max(5, +aiCfg().dailyLimit || 30);
function aiUsed() {
  if (!S.aiUse || S.aiUse.d !== today()) S.aiUse = { d: today(), n: 0 };
  return S.aiUse.n;
}
const aiLeft = () => Math.max(0, aiLimit() - aiUsed());

// task: chat | hint | review | translate. Resolves to the reply text; rejects with a Korean message.
async function aiCall(task, payload) {
  if (!aiOn()) throw new Error('AI가 아직 연결되지 않았어요.');
  if (!navigator.onLine) throw new Error('인터넷에 연결되어 있지 않아요.');
  if (aiLeft() <= 0) throw new Error(`오늘 AI 사용 횟수(${aiLimit()}번)를 다 썼어요. 내일 다시 만나요!`);
  S.aiUse.n++;
  save();
  let res;
  try {
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const t = ctl ? setTimeout(() => ctl.abort(), 30000) : null;
    res = await fetch(aiCfg().endpoint.replace(/\/$/, '') + '/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, ...payload }),
      signal: ctl ? ctl.signal : undefined
    });
    if (t) clearTimeout(t);
  } catch (e) {
    throw new Error('AI 서버에 연결하지 못했어요. 잠시 뒤 다시 해 보세요.');
  }
  let j = null;
  try {
    j = await res.json();
  } catch (e) {}
  if (!res.ok || !j)
    throw new Error(
      j && j.error
        ? j.error
        : res.status === 429
          ? '오늘 AI 무료 사용량이 다 찼어요. 내일 다시 해 보세요.'
          : 'AI가 답하지 못했어요. 잠시 뒤 다시 해 보세요.'
    );
  return String(j.text || '');
}
// models sometimes wrap JSON in prose or code fences
function aiJSON(text) {
  try {
    return JSON.parse(text);
  } catch (e) {}
  const m = String(text).match(/\{[\s\S]*\}/);
  if (m)
    try {
      return JSON.parse(m[0]);
    } catch (e) {}
  return null;
}

// ---- features/aichat.js ----
'use strict';
/* ================= AI 회화 상대: role-play a real situation with an AI partner, then get corrections in Korean ================= */

const AI_SCENES = {
  ja: [
    {
      id: 'ramen',
      ico: '🍜',
      title: '라멘집에서 주문하기',
      partner: 'ラーメン屋の店員',
      role: '客',
      setting: '東京のラーメン屋。客が席に座ったところ。',
      goal: '라멘과 음료를 주문하고 계산까지 해 보세요.',
      open: ['いらっしゃいませ！ご注文はお決まりですか。', '어서 오세요! 주문 정하셨어요?']
    },
    {
      id: 'konbini',
      ico: '🏪',
      title: '편의점 계산대',
      partner: 'コンビニの店員',
      role: '客',
      setting: 'コンビニのレジ。客が弁当と飲み物を持ってきた。',
      goal: '데워 달라고 하고, 봉투와 결제 방법을 말해 보세요.',
      open: ['いらっしゃいませ。お弁当、温めますか。', '어서 오세요. 도시락 데워 드릴까요?']
    },
    {
      id: 'michi',
      ico: '🧭',
      title: '길 묻기',
      partner: '駅前で声をかけられた親切な人',
      role: '道に迷った旅行者',
      setting: '大阪の駅前。旅行者が道を聞いてきた。',
      goal: '가고 싶은 곳을 말하고 가는 법을 물어보세요.',
      open: ['はい、どうしましたか。', '네, 무슨 일이세요?']
    },
    {
      id: 'hotel',
      ico: '🏨',
      title: '호텔 체크인',
      partner: 'ホテルのフロント係',
      role: '宿泊客',
      setting: 'ホテルのフロント。客がチェックインに来た。',
      goal: '예약한 이름을 말하고, 아침 식사·체크아웃 시간을 물어보세요.',
      open: ['いらっしゃいませ。チェックインでございますか。', '어서 오세요. 체크인이신가요?']
    },
    {
      id: 'shop',
      ico: '👕',
      title: '옷 가게에서 쇼핑',
      partner: '服屋の店員',
      role: '客',
      setting: '服屋。客がシャツを見ている。',
      goal: '사이즈·색을 묻고 입어 봐도 되는지 물어보세요.',
      open: ['いらっしゃいませ。何かお探しですか。', '어서 오세요. 뭐 찾으세요?']
    },
    {
      id: 'drug',
      ico: '💊',
      title: '약국에서 약 사기',
      partner: '薬局の薬剤師',
      role: '客',
      setting: '薬局。客が体調が悪いと言って来た。',
      goal: '어디가 아픈지 말하고 약을 사 보세요.',
      open: ['こんにちは。どうされましたか。', '안녕하세요. 어디가 불편하세요?']
    },
    {
      id: 'train',
      ico: '🚄',
      title: '역 창구에서 표 사기',
      partner: '駅の窓口の係員',
      role: '旅行者',
      setting: '駅のみどりの窓口。旅行者が新幹線の切符を買いに来た。',
      goal: '목적지·시간·좌석(지정석/자유석)을 말해 보세요.',
      open: ['こんにちは。どちらまでですか。', '안녕하세요. 어디까지 가세요?']
    },
    {
      id: 'friend',
      ico: '🙌',
      title: '일본인 친구와 수다',
      partner: '交流会で会った日本人の大学生ゆい（親しみやすいタメ口）',
      role: '韓国人の参加者',
      setting: '日韓交流会。初めて会って、趣味や旅行の話をする。',
      goal: '자기소개하고 취미·여행 이야기를 나눠 보세요. 반말도 OK!',
      open: ['はじめまして！ゆいです。韓国から来たの？', '반가워! 나는 유이야. 한국에서 왔어?']
    }
  ],
  en: [
    {
      id: 'cafe',
      ico: '☕',
      title: '카페에서 주문하기',
      partner: 'a barista in a busy coffee shop in New York',
      role: 'customer',
      setting: 'A coffee shop counter.',
      goal: '음료와 사이즈, 매장/포장을 말해 보세요.',
      open: ['Hi there! What can I get for you today?', '안녕하세요! 뭘 드릴까요?']
    },
    {
      id: 'rest',
      ico: '🍽️',
      title: '레스토랑 주문',
      partner: 'a friendly waiter',
      role: 'customer',
      setting: 'A casual restaurant in London.',
      goal: '추천을 묻고 주문하고 계산해 보세요.',
      open: [
        'Good evening! Are you ready to order, or do you need a few more minutes?',
        '안녕하세요! 주문하시겠어요, 아니면 조금 더 보시겠어요?'
      ]
    },
    {
      id: 'dir',
      ico: '🧭',
      title: '길 묻기',
      partner: 'a kind local on the street',
      role: 'lost tourist',
      setting: 'A street corner in Sydney.',
      goal: '가고 싶은 곳을 말하고 길을 물어보세요.',
      open: ['Hi, you look a little lost. Can I help you?', '안녕하세요, 길을 잃으신 것 같네요. 도와드릴까요?']
    },
    {
      id: 'hotel',
      ico: '🏨',
      title: '호텔 체크인',
      partner: 'a hotel receptionist',
      role: 'guest',
      setting: 'A hotel front desk.',
      goal: '예약 이름을 말하고 조식·와이파이를 물어보세요.',
      open: ['Good afternoon! Are you checking in?', '안녕하세요! 체크인하시나요?']
    },
    {
      id: 'airport',
      ico: '✈️',
      title: '공항 입국 심사',
      partner: 'an immigration officer (polite but brief)',
      role: 'traveler',
      setting: 'Immigration counter at the airport.',
      goal: '방문 목적·기간·숙소를 대답해 보세요.',
      open: ['Hello. Passport, please. What is the purpose of your visit?', '안녕하세요. 여권 주세요. 방문 목적이 뭔가요?']
    },
    {
      id: 'friend',
      ico: '🙌',
      title: '외국인 친구와 수다',
      partner: 'Sam, a friendly exchange student',
      role: 'Korean student',
      setting: 'A language exchange meetup.',
      goal: '자기소개하고 취미 이야기를 나눠 보세요.',
      open: ["Hey! I'm Sam. Nice to meet you! Where are you from?", '안녕! 난 샘이야. 반가워! 어디서 왔어?']
    }
  ]
};
const AIC_MAX = 8; // learner turns per conversation
let AIC = null; // { lang, sc, msgs: [{ who: 'ai'|'me', t, ko }], busy, hint, review, err }

function renderAIChat(mod) {
  const lang = mod === 'aichat' ? 'ja' : 'en';
  if (AIC && AIC.lang !== lang) AIC = null;
  view.innerHTML = `<section class="mod">${modeSeg(mod)}<div id="aiBody" class="aic"></div></section>`;
  aicDraw(lang);
  view.onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.closest('.modes') || b.dataset.speak) return;
    const a = b.dataset.ai;
    if (b.dataset.aisc) {
      const sc = AI_SCENES[lang].find(x => x.id === b.dataset.aisc);
      AIC = { lang, sc, msgs: [{ who: 'ai', t: sc.open[0], ko: sc.open[1] }], busy: false };
      aicDraw(lang);
      speak(sc.open[0], lang);
    } else if (a === 'send') aicSend(lang);
    else if (a === 'hint') aicHint(lang);
    else if (a === 'review') aicReview(lang);
    else if (a === 'back') {
      AIC = null;
      aicDraw(lang);
    } else if (a === 'ko') b.closest('.aic-msg').classList.toggle('show-ko');
    else if (b.dataset.aiuse !== undefined) {
      const inp = document.getElementById('aiIn');
      if (inp && AIC && AIC.hint) {
        inp.value = AIC.hint[+b.dataset.aiuse].t;
        inp.focus();
      }
    } else if (a === 'mic') aicMic(lang);
  };
}
function aicDraw(lang) {
  const box = document.getElementById('aiBody');
  if (!box) return;
  const ja = lang === 'ja';
  if (!aiOn()) {
    box.innerHTML = `<div class="empty"><p style="margin:0;font-weight:600">AI 회화는 아직 준비 중이에요</p><p class="note">앱 주인이 AI 서버(무료)를 연결하면 바로 쓸 수 있어요. 연결 방법은 저장소의 AI_SETUP.md에 있어요.</p></div>`;
    return;
  }
  if (!AIC) {
    box.innerHTML = `<p class="note">AI가 점원·친구 역할을 맡아요. ${ja ? '일본어' : '영어'}로 자유롭게 대답하고, 막히면 <b>힌트</b>를, 끝나면 <b>첨삭</b>을 받아 보세요. 오늘 남은 횟수 <b class="num">${aiLeft()}</b>번.</p>
      <div class="mc-tpls">${AI_SCENES[lang].map(s => `<button type="button" class="mc-tpl" data-aisc="${s.id}"><span>${s.ico}</span><b>${esc(s.title)}</b><small>${esc(s.goal)}</small></button>`).join('')}</div>
      <p class="note">대화 내용은 답을 만들기 위해 AI 서버(Cloudflare)로 보내져요. 이름·연락처 같은 개인 정보는 쓰지 마세요.</p>`;
    return;
  }
  const turns = AIC.msgs.filter(m => m.who === 'me').length;
  const done = turns >= AIC_MAX;
  box.innerHTML = `<div class="aic-head"><button class="link" data-ai="back">‹ 상황 고르기</button><span>${AIC.sc.ico} ${esc(AIC.sc.title)}</span><span class="num">${turns}/${AIC_MAX}</span></div>
    <p class="aic-goal">🎯 ${esc(AIC.sc.goal)}</p>
    <div class="aic-log" id="aiLog">${AIC.msgs
      .map(
        m =>
          `<div class="aic-msg ${m.who}"><p class="${ja ? 'jp' : 'en'}" lang="${lang}">${esc(m.t)}</p>${m.ko ? `<p class="aic-ko">${esc(m.ko)}</p>` : ''}${
            m.who === 'ai'
              ? `<div class="aic-act">${spkBtn(m.t, '', lang)}${m.ko ? '<button type="button" class="link" data-ai="ko">번역</button>' : ''}</div>`
              : ''
          }</div>`
      )
      .join('')}${AIC.busy ? '<div class="aic-msg ai typing"><i></i><i></i><i></i></div>' : ''}</div>
    ${AIC.err ? `<p class="note" style="color:var(--ng)">${esc(AIC.err)}</p>` : ''}
    ${AIC.hint ? `<div class="aic-hints"><p class="lbl">이렇게 말해 보세요 (눌러서 입력)</p>${AIC.hint.map((h, i) => `<button type="button" class="aic-hint" data-aiuse="${i}"><b class="${ja ? 'jp' : 'en'}" lang="${lang}">${esc(h.t)}</b><small>${esc(h.ko || '')}</small></button>`).join('')}</div>` : ''}
    ${AIC.review ? aicReviewHTML(lang) : ''}
    ${
      AIC.review
        ? `<div class="row"><button class="btn primary" data-aisc="${AIC.sc.id}">같은 상황 다시</button><button class="btn" data-ai="back">다른 상황</button></div>`
        : `<div class="aic-input">
      <textarea id="aiIn" rows="2" lang="${lang}" placeholder="${ja ? '일본어로 대답해 보세요 (한국어로 써도 알아들어요)' : '영어로 대답해 보세요'}" ${done || AIC.busy ? 'disabled' : ''}></textarea>
      <div class="row">${hasRec() ? `<button class="btn" data-ai="mic" ${AIC.busy ? 'disabled' : ''}>🎤 말하기</button>` : ''}<button class="btn" data-ai="hint" ${AIC.busy || done ? 'disabled' : ''}>힌트</button><button class="btn primary" data-ai="send" ${AIC.busy || done ? 'disabled' : ''}>보내기</button></div>
      <button class="btn aic-end" data-ai="review" ${AIC.busy || !turns ? 'disabled' : ''}>대화 끝내고 첨삭 받기</button>
    </div>`
    }`;
  const log = document.getElementById('aiLog');
  if (log) log.scrollTop = log.scrollHeight;
  const inp = document.getElementById('aiIn');
  if (inp)
    inp.onkeydown = e => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        aicSend(lang);
      }
    };
}
const aicHistory = () => AIC.msgs.map(m => ({ role: m.who === 'ai' ? 'assistant' : 'user', content: m.t }));
const aicScene = () => ({ title: AIC.sc.title, partner: AIC.sc.partner, role: AIC.sc.role, setting: AIC.sc.setting });
async function aicSend(lang) {
  const inp = document.getElementById('aiIn');
  const v = inp ? inp.value.trim().slice(0, 200) : '';
  if (!v || AIC.busy) return;
  AIC.msgs.push({ who: 'me', t: v });
  AIC.busy = true;
  AIC.hint = null;
  AIC.err = '';
  aicDraw(lang);
  try {
    const txt = await aiCall('chat', { lang, scene: aicScene(), messages: aicHistory() });
    const j = aiJSON(txt);
    const t = (j && (j.reply || j.ja || j.en)) || txt.replace(/[{}"]/g, '').trim();
    AIC.msgs.push({ who: 'ai', t, ko: (j && j.ko) || '' });
    if (S.set.autoSpeak !== false) speak(t, lang);
  } catch (e) {
    AIC.err = e.message;
  }
  AIC.busy = false;
  aicDraw(lang);
}
async function aicHint(lang) {
  if (AIC.busy) return;
  AIC.busy = true;
  AIC.err = '';
  aicDraw(lang);
  try {
    const j = aiJSON(await aiCall('hint', { lang, scene: aicScene(), messages: aicHistory() }));
    const xs = (j && (j.options || j.hints)) || [];
    AIC.hint = xs
      .slice(0, 3)
      .map(h => ({ t: h.reply || h.ja || h.en || h.text || '', ko: h.ko || '' }))
      .filter(h => h.t);
    if (!AIC.hint.length) AIC.err = '힌트를 만들지 못했어요. 다시 눌러 보세요.';
  } catch (e) {
    AIC.err = e.message;
  }
  AIC.busy = false;
  aicDraw(lang);
}
async function aicReview(lang) {
  if (AIC.busy) return;
  AIC.busy = true;
  AIC.err = '';
  aicDraw(lang);
  try {
    const j = aiJSON(await aiCall('review', { lang, scene: aicScene(), messages: aicHistory() }));
    AIC.review =
      j && (j.items || j.tip)
        ? { items: (j.items || []).slice(0, 8), tip: j.tip || '' }
        : { items: [], tip: '첨삭을 만들지 못했어요. 다시 시도해 보세요.' };
    grantTicket && grantTicket(lang, 'AI 회화 완료');
  } catch (e) {
    AIC.err = e.message;
  }
  AIC.busy = false;
  aicDraw(lang);
}
function aicReviewHTML(lang) {
  const r = AIC.review,
    ja = lang === 'ja';
  return `<div class="aic-review"><h3 class="hjr-h">✍️ 첨삭</h3>
    ${
      r.items.length
        ? r.items
            .map(
              x =>
                `<div class="aic-fix"><p class="aic-you ${ja ? 'jp' : 'en'}" lang="${lang}"><s>${esc(x.you || '')}</s></p><p class="${ja ? 'jp' : 'en'} aic-good" lang="${lang}">→ ${esc(x.fix || '')}</p>${x.why ? `<p class="note">${esc(x.why)}</p>` : ''}${x.fix ? spkBtn(x.fix, '', lang) : ''}</div>`
            )
            .join('')
        : '<p class="aic-good">고칠 곳이 없어요. 훌륭해요!</p>'
    }
    ${r.tip ? `<p class="aic-tip">💡 ${esc(r.tip)}</p>` : ''}<p class="note">AI 첨삭은 틀릴 수도 있어요. 이상하면 참고만 하세요.</p></div>`;
}
// speech input (Safari / Chrome); fills the text box, no grading
const hasRec = () => typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
function aicMic(lang) {
  const R0 = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!R0) return;
  try {
    const rec = new R0();
    rec.lang = lang === 'ja' ? 'ja-JP' : 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    toast('듣고 있어요… 말해 보세요');
    rec.onresult = e => {
      const t = e.results[0][0].transcript;
      const inp = document.getElementById('aiIn');
      if (inp) inp.value = (inp.value ? inp.value + ' ' : '') + t;
    };
    rec.onerror = () => toast('음성을 알아듣지 못했어요. 다시 해 보세요.');
    rec.start();
  } catch (e) {
    toast('이 기기에서는 음성 입력을 쓸 수 없어요');
  }
}
CUSTOM.aichat = renderAIChat;
CUSTOM.eaichat = renderAIChat;

// ---- features/diary.js ----
'use strict';
/* ================= AI 한 줄 일기: write one sentence a day, the AI corrects it gently ================= */
const DIARY_TOPICS = {
  ja: [
    '오늘 먹은 것',
    '오늘 날씨',
    '주말에 한 일',
    '지금 기분',
    '요즘 빠진 것',
    '가 보고 싶은 곳',
    '오늘 만난 사람',
    '내일 할 일',
    '좋아하는 음식',
    '어제 본 것(영화·영상)',
    '오늘 산 것',
    '요즘 고민'
  ],
  en: [
    'What I ate today',
    'Today’s weather',
    'My weekend',
    'How I feel now',
    'Something I like lately',
    'A place I want to visit',
    'Someone I met today',
    'Plans for tomorrow',
    'My favorite food',
    'Something I watched',
    'Something I bought',
    'A small worry'
  ]
};
const DIARY_EX = { ja: '例) 今日はラーメンを食べました。とてもおいしかったです。', en: 'e.g. I ate ramen today. It was really good.' };
const DIARY_DAILY = 3; // corrections per day
if (!S.diary || typeof S.diary !== 'object') S.diary = { ja: [], en: [] };
let DY = { busy: false, err: '', last: null, topicShift: 0 };

function renderDiary(mod) {
  const lang = mod === 'diary' ? 'ja' : 'en';
  if (!S.diary || typeof S.diary !== 'object') S.diary = { ja: [], en: [] };
  if (!Array.isArray(S.diary[lang])) S.diary[lang] = [];
  view.innerHTML = `<section class="mod">${modeSeg(mod)}<div class="chart dy" id="dyBody"></div></section>`;
  dyDraw(lang);
  view.onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.closest('.modes') || b.dataset.speak) return;
    if (b.dataset.dy === 'go') dySend(lang);
    else if (b.dataset.dy === 'topic') {
      DY.topicShift++;
      dyDraw(lang);
    } else if (b.dataset.dyopen !== undefined) b.closest('.dy-h').classList.toggle('open');
  };
}
const dyToday = lang => S.diary[lang].filter(x => x.d === today()).length;
function dyDraw(lang) {
  const box = document.getElementById('dyBody');
  if (!box) return;
  const ja = lang === 'ja';
  if (!aiOn()) {
    box.innerHTML = '<div class="empty"><p style="margin:0;font-weight:600">AI 일기는 아직 준비 중이에요</p></div>';
    return;
  }
  const topics = DIARY_TOPICS[lang];
  const topic = topics[(dayIdx() + DY.topicShift) % topics.length];
  const left = Math.max(0, DIARY_DAILY - dyToday(lang));
  const inp = document.getElementById('dyIn');
  const draft = inp ? inp.value : '';
  box.innerHTML = `<p class="note">하루 한 문장, ${ja ? '일본어' : '영어'}로 써 보세요. 모르는 단어는 한국어로 써도 AI가 고쳐 줘요. 오늘 남은 첨삭 <b class="num">${left}</b>번.</p>
    <div class="dy-topic"><span>오늘의 주제</span><b>${esc(topic)}</b><button type="button" class="link" data-dy="topic">다른 주제</button></div>
    <textarea id="dyIn" rows="3" lang="${lang}" maxlength="200" placeholder="${esc(DIARY_EX[lang])}" ${DY.busy ? 'disabled' : ''}>${esc(draft)}</textarea>
    <div class="row"><button class="btn primary" data-dy="go" ${DY.busy || !left ? 'disabled' : ''}>${DY.busy ? '첨삭 중…' : left ? 'AI 첨삭 받기' : '내일 또 써요'}</button></div>
    ${DY.err ? `<p class="note" style="color:var(--ng)">${esc(DY.err)}</p>` : ''}
    ${DY.last ? dyCard(DY.last, lang, true) : ''}
    ${
      S.diary[lang].length
        ? `<h3 class="hjr-h">내 일기 ${S.diary[lang].length}개</h3><div class="dy-list">${S.diary[lang]
            .slice(0, 30)
            .map(
              x =>
                `<div class="dy-h"><button type="button" class="dy-hd" data-dyopen><span class="num">${x.d.slice(5).replace('-', '.')}</span><b class="${ja ? 'jp' : 'en'}" lang="${lang}">${esc(x.natural || x.fixed || x.text)}</b></button>${dyCard(x, lang, false)}</div>`
            )
            .join('')}</div>`
        : ''
    }
    <p class="note">AI 첨삭은 틀릴 수도 있어요. 쓴 문장은 첨삭을 위해 AI 서버로 보내지고, 일기는 내 폰에만 저장돼요.</p>`;
}
function dyCard(x, lang, fresh) {
  const ja = lang === 'ja',
    cls = ja ? 'jp' : 'en';
  const same = (x.fixed || '').replace(/\s/g, '') === (x.text || '').replace(/\s/g, '');
  return `<div class="dy-card ${fresh ? 'fresh' : ''}">
    <p class="dy-row"><span>내가 쓴 글</span><span class="${cls}" lang="${lang}">${same ? esc(x.text) : `<s>${esc(x.text)}</s>`}</span></p>
    ${same ? '<p class="dy-ok">틀린 곳이 없어요! 👏</p>' : `<p class="dy-row"><span>고친 문장</span><b class="${cls}" lang="${lang}">${esc(x.fixed)}</b></p>`}
    ${x.natural && x.natural !== x.fixed ? `<p class="dy-row"><span>더 자연스럽게</span><b class="${cls}" lang="${lang}">${esc(x.natural)}</b></p>` : ''}
    ${x.ko ? `<p class="dy-row"><span>뜻</span><span>${esc(x.ko)}</span></p>` : ''}
    ${(x.notes || []).length ? `<ul class="dy-notes">${x.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
    ${x.good ? `<p class="aic-tip">💡 ${esc(x.good)}</p>` : ''}
    <div class="row">${spkBtn(x.natural || x.fixed || x.text, '듣기', lang)}</div></div>`;
}
async function dySend(lang) {
  const inp = document.getElementById('dyIn');
  const text = inp ? inp.value.trim().slice(0, 200) : '';
  if (!text || DY.busy) return;
  if (dyToday(lang) >= DIARY_DAILY) return;
  DY.busy = true;
  DY.err = '';
  dyDraw(lang);
  try {
    const j = aiJSON(await aiCall('diary', { lang, text }));
    if (!j || !(j.fixed || j.natural)) throw new Error('첨삭을 만들지 못했어요. 다시 해 보세요.');
    const entry = {
      d: today(),
      text,
      fixed: String(j.fixed || text),
      natural: String(j.natural || ''),
      ko: String(j.ko || ''),
      notes: (Array.isArray(j.notes) ? j.notes : []).slice(0, 3).map(String),
      good: String(j.good || '')
    };
    S.diary[lang].unshift(entry);
    if (S.diary[lang].length > 100) S.diary[lang].length = 100;
    save();
    DY.last = entry;
    if (inp) inp.value = '';
    gainXP(10);
  } catch (e) {
    DY.err = e.message;
  }
  DY.busy = false;
  dyDraw(lang);
  if (!DY.err) {
    const t = document.getElementById('dyIn');
    if (t) t.value = '';
  }
}
CUSTOM.diary = renderDiary;
CUSTOM.ediary = renderDiary;

// ---- features/mycard.js ----
'use strict';
/* ================= 나만의 여행 카드: fill-in-the-blank cards to show a taxi driver, a waiter, a front desk ================= */

const ALLERGENS = [
  ['卵', 'たまご', '달걀', 'eggs'],
  ['乳製品', 'にゅうせいひん', '우유·유제품', 'dairy'],
  ['小麦', 'こむぎ', '밀', 'wheat'],
  ['そば', 'そば', '메밀', 'buckwheat'],
  ['えび', 'えび', '새우', 'shrimp'],
  ['かに', 'かに', '게', 'crab'],
  ['落花生', 'らっかせい', '땅콩', 'peanuts'],
  ['ナッツ', 'ナッツ', '견과류', 'tree nuts'],
  ['大豆', 'だいず', '콩', 'soy'],
  ['ごま', 'ごま', '깨', 'sesame'],
  ['魚', 'さかな', '생선', 'fish'],
  ['貝', 'かい', '조개류', 'shellfish'],
  ['豚肉', 'ぶたにく', '돼지고기', 'pork'],
  ['牛肉', 'ぎゅうにく', '소고기', 'beef'],
  ['鶏肉', 'とりにく', '닭고기', 'chicken'],
  ['アルコール', 'アルコール', '알코올', 'alcohol']
];
// f: fields — text (free text) or pick (allergen list). make(v) → { t, r, ko }
const MC_TPL = {
  ja: [
    {
      id: 'taxi',
      ico: '🚕',
      name: '택시 · 여기로 가 주세요',
      f: [['place', '가고 싶은 곳 (호텔 이름·주소 붙여넣기)', 'text']],
      make: v => ({ t: `${v.place}までお願いします。`, r: '', ko: `${v.place}까지 가 주세요.` })
    },
    {
      id: 'where',
      ico: '🧭',
      name: '길 묻기 · 어떻게 가요?',
      f: [['place', '찾는 곳 (역·가게 이름)', 'text']],
      make: v => ({ t: `${v.place}へはどうやって行きますか。`, r: '', ko: `${v.place}에는 어떻게 가요?` })
    },
    {
      id: 'allergy',
      ico: '⚠️',
      name: '알레르기 · 이게 들어 있나요?',
      f: [['items', '알레르기 있는 음식', 'pick']],
      make: v => {
        const xs = v.items || [];
        const t = xs.map(a => a[0]).join('・'),
          r = xs.map(a => a[1]).join('・'),
          k = xs.map(a => a[2]).join('·');
        return {
          t: `私は${t}アレルギーがあります。${t}は入っていますか。`,
          r: `わたし は ${r} アレルギー が あります。 ${r} は はいって います か。`,
          ko: `저는 ${k} 알레르기가 있어요. ${k}이(가) 들어 있나요?`
        };
      }
    },
    {
      id: 'noeat',
      ico: '🍽️',
      name: '못 먹는 음식 · 빼 주세요',
      f: [['items', '못 먹는 음식', 'pick']],
      make: v => {
        const xs = v.items || [];
        const t = xs.map(a => a[0]).join('・'),
          r = xs.map(a => a[1]).join('・'),
          k = xs.map(a => a[2]).join('·');
        return {
          t: `${t}が食べられません。抜いてもらえますか。`,
          r: `${r} が たべられません。 ぬいて もらえます か。`,
          ko: `${k}을(를) 못 먹어요. 빼 주실 수 있나요?`
        };
      }
    },
    {
      id: 'reserve',
      ico: '🏨',
      name: '예약 · 제 이름으로 예약했어요',
      f: [['name', '예약한 이름 (예: KIM MINJI)', 'text']],
      make: v => ({ t: `${v.name}の名前で予約しています。`, r: '', ko: `${v.name} 이름으로 예약했어요.` })
    },
    {
      id: 'want',
      ico: '🛍️',
      name: '쇼핑 · 이거 있어요?',
      f: [['thing', '찾는 물건 (일본어 이름이나 사진 설명)', 'text']],
      make: v => ({ t: `${v.thing}はありますか。`, r: '', ko: `${v.thing} 있어요?` })
    },
    {
      id: 'free',
      ico: '✏️',
      name: '직접 만들기',
      f: [
        ['ja', '보여 줄 일본어 (번역기에서 붙여넣기)', 'text'],
        ['ko', '한국어 뜻 (나만 보는 메모)', 'text']
      ],
      make: v => ({ t: v.ja, r: '', ko: v.ko || '' })
    }
  ],
  en: [
    {
      id: 'taxi',
      ico: '🚕',
      name: '택시 · 여기로 가 주세요',
      f: [['place', '가고 싶은 곳 (호텔 이름·주소 붙여넣기)', 'text']],
      make: v => ({ t: `Please take me to ${v.place}.`, ko: `${v.place}까지 가 주세요.` })
    },
    {
      id: 'where',
      ico: '🧭',
      name: '길 묻기 · 어떻게 가요?',
      f: [['place', '찾는 곳', 'text']],
      make: v => ({ t: `How can I get to ${v.place}?`, ko: `${v.place}에는 어떻게 가요?` })
    },
    {
      id: 'allergy',
      ico: '⚠️',
      name: '알레르기 · 이게 들어 있나요?',
      f: [['items', '알레르기 있는 음식', 'pick']],
      make: v => {
        const xs = (v.items || []).map(a => a[3]);
        const e = xs.length > 1 ? xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1] : xs[0] || '';
        return {
          t: `I'm allergic to ${e}. Does this contain ${e}?`,
          ko: `저는 ${(v.items || []).map(a => a[2]).join('·')} 알레르기가 있어요. 들어 있나요?`
        };
      }
    },
    {
      id: 'reserve',
      ico: '🏨',
      name: '예약 · 제 이름으로 예약했어요',
      f: [['name', '예약한 이름', 'text']],
      make: v => ({ t: `I have a reservation under ${v.name}.`, ko: `${v.name} 이름으로 예약했어요.` })
    },
    {
      id: 'free',
      ico: '✏️',
      name: '직접 만들기',
      f: [
        ['ja', '보여 줄 영어 문장', 'text'],
        ['ko', '한국어 뜻 (메모)', 'text']
      ],
      make: v => ({ t: v.ja, ko: v.ko || '' })
    }
  ]
};
if (!S.myCards || typeof S.myCards !== 'object') S.myCards = { ja: [], en: [] };
let MC_EDIT = null; // { tpl, v: {} }

function renderMyCards(mod) {
  const lang = mod === 'mycard' ? 'ja' : 'en';
  const box = `<section class="mod">${modeSeg(mod)}<div class="chart mc" id="mcBody"></div></section>`;
  view.innerHTML = box;
  mcDraw(lang);
  view.onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.closest('.modes') || b.dataset.speak) return;
    const list = S.myCards[lang];
    if (b.dataset.mcnew) {
      MC_EDIT = { tpl: b.dataset.mcnew, v: {} };
      mcDraw(lang);
    } else if (b.dataset.mcpick) {
      const a = ALLERGENS.find(x => x[0] === b.dataset.mcpick);
      const cur = MC_EDIT.v.items || (MC_EDIT.v.items = []);
      const i = cur.findIndex(x => x[0] === a[0]);
      if (i >= 0) cur.splice(i, 1);
      else cur.push(a);
      b.setAttribute('aria-pressed', i < 0);
      mcPreview(lang);
    } else if (b.dataset.mc === 'save') {
      const tpl = MC_TPL[lang].find(x => x.id === MC_EDIT.tpl);
      for (const [k, , type] of tpl.f)
        if (type === 'pick' ? !(MC_EDIT.v.items || []).length : !String(MC_EDIT.v[k] || '').trim())
          return toast(type === 'pick' ? '음식을 하나 이상 골라 주세요' : '빈칸을 채워 주세요');
      const c = tpl.make(MC_EDIT.v);
      list.unshift({ id: Date.now().toString(36), tpl: tpl.id, ico: tpl.ico, ...c });
      if (list.length > 30) list.length = 30;
      save();
      MC_EDIT = null;
      toast('카드를 저장했어요');
      mcDraw(lang);
    } else if (b.dataset.mc === 'cancel') {
      MC_EDIT = null;
      mcDraw(lang);
    } else if (b.dataset.mcshow !== undefined) {
      openTravelShow(
        lang,
        list.map(c => ({ ...c, key: 'mc:' + c.id })),
        +b.dataset.mcshow
      );
    } else if (b.dataset.mcdel !== undefined) {
      list.splice(+b.dataset.mcdel, 1);
      save();
      mcDraw(lang);
    }
  };
  view.oninput = e => {
    const inp = e.target.closest('[data-mcf]');
    if (!inp || !MC_EDIT) return;
    MC_EDIT.v[inp.dataset.mcf] = inp.value.trim().slice(0, 120);
    mcPreview(lang);
  };
}
function mcDraw(lang) {
  const box = document.getElementById('mcBody');
  if (!box) return;
  const ja = lang === 'ja',
    list = S.myCards[lang];
  if (MC_EDIT) {
    const tpl = MC_TPL[lang].find(x => x.id === MC_EDIT.tpl);
    box.innerHTML = `<h3 class="hjr-h">${tpl.ico} ${esc(tpl.name)}</h3>
      ${tpl.f
        .map(([k, label, type]) =>
          type === 'pick'
            ? `<div class="trip-f">${esc(label)}<div class="chips">${ALLERGENS.map(a => `<button type="button" class="chip" data-mcpick="${a[0]}" aria-pressed="${(MC_EDIT.v.items || []).some(x => x[0] === a[0])}">${esc(a[2])}</button>`).join('')}</div></div>`
            : `<label class="trip-f">${esc(label)}<input type="text" data-mcf="${k}" value="${esc(MC_EDIT.v[k] || '')}" maxlength="120" autocomplete="off"></label>`
        )
        .join('')}
      <p class="lbl" style="margin:12px 0 6px">미리 보기</p><div id="mcPrev"></div>
      <div class="row"><button class="btn primary" data-mc="save">저장</button><button class="btn" data-mc="cancel">취소</button></div>
      <p class="note">장소·이름은 예약 메일이나 지도 앱에서 복사해 붙여넣으면 정확해요. ${ja ? '일본어 주소가 있으면 그대로 붙여넣는 게 제일 좋아요.' : ''}</p>`;
    mcPreview(lang);
    return;
  }
  box.innerHTML = `<p class="note">빈칸만 채우면 택시 기사·점원에게 화면 가득 보여 줄 수 있는 카드가 돼요. 비행기 안에서도 열려요(오프라인).</p>
    <div class="mc-tpls">${MC_TPL[lang].map(t => `<button type="button" class="mc-tpl" data-mcnew="${t.id}"><span>${t.ico}</span><b>${esc(t.name)}</b></button>`).join('')}</div>
    <h3 class="hjr-h">내 카드 ${list.length}개</h3>
    ${
      list.length
        ? `<div class="tv-list">${list
            .map(
              (
                c,
                i
              ) => `<div class="tv-card"><div class="tv-ko">${c.ico || ''} ${esc(c.ko)}</div><div class="tv-t ${ja ? 'jp' : 'en'}" lang="${lang}">${esc(c.t)}</div>${c.r ? `<div class="tv-r jp" lang="ja">${esc(c.r)}</div>` : ''}
          <div class="tv-act"><button class="btn primary" data-mcshow="${i}">보여주기</button>${spkBtn(c.t, '듣기', lang)}<button class="link mc-del" data-mcdel="${i}">지우기</button></div></div>`
            )
            .join('')}</div>`
        : '<div class="empty"><p style="margin:0;font-weight:600">아직 만든 카드가 없어요</p><p class="note">위에서 하나 골라 만들어 보세요.</p></div>'
    }`;
}
function mcPreview(lang) {
  const el = document.getElementById('mcPrev');
  if (!el || !MC_EDIT) return;
  const tpl = MC_TPL[lang].find(x => x.id === MC_EDIT.tpl);
  const v = { ...MC_EDIT.v };
  for (const [k, , type] of tpl.f) if (type !== 'pick' && !v[k]) v[k] = '○○';
  if (!(v.items || []).length) v.items = [['○○', '○○', '○○', '○○']];
  const c = tpl.make(v);
  el.innerHTML = `<div class="tv-card mc-prev"><div class="tv-t ${lang === 'ja' ? 'jp' : 'en'}" lang="${lang}">${esc(c.t)}</div><div class="tv-ko">${esc(c.ko)}</div></div>`;
}
CUSTOM.mycard = renderMyCards;
CUSTOM.emycard = renderMyCards;

// ---- features/reader.js ----
'use strict';
/* ================= 붙여넣기 해석기: paste Japanese (e.g. from iPhone Live Text) → furigana, words, meanings, 한국음 =================
   Word splitting: kuromoji.js + IPADIC (js/vendor/kuromoji, ~18 MB, downloaded the first time this screen is used) */

let KURO = null,
  KURO_LOADING = null;
let RD = { text: '', toks: null, err: '', ko: '' };
function loadKuromoji() {
  if (KURO) return Promise.resolve(KURO);
  if (KURO_LOADING) return KURO_LOADING;
  KURO_LOADING = new Promise((ok, ng) => {
    const go = () =>
      window.kuromoji.builder({ dicPath: 'js/vendor/kuromoji/dict/' }).build((err, t) => {
        if (err) {
          KURO_LOADING = null;
          ng(err);
        } else ok((KURO = t));
      });
    if (window.kuromoji) return go();
    const sc = document.createElement('script');
    sc.src = 'js/vendor/kuromoji/kuromoji.js';
    sc.onload = go;
    sc.onerror = () => {
      KURO_LOADING = null;
      ng(new Error('load'));
    };
    document.head.appendChild(sc);
  });
  return KURO_LOADING;
}
const RD_POS = {
  名詞: '명사',
  動詞: '동사',
  形容詞: '형용사',
  副詞: '부사',
  助詞: '조사',
  助動詞: '조동사',
  連体詞: '연체사',
  接続詞: '접속사',
  感動詞: '감탄사',
  記号: '기호',
  接頭詞: '접두사',
  フィラー: '말 고르기'
};
const kata2hira = s => (s || '').replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 96));
let RD_DICT = null;
// everything the app knows, keyed by written form and by reading
function rdDict() {
  if (RD_DICT) return RD_DICT;
  const m = new Map();
  const put = (k, v) => {
    if (k && !m.has(k)) m.set(k, v);
  };
  for (const w of WORDS) put(w.w, { m: w.m.join(', '), src: '단어' });
  for (const w of HJW_ITEMS) put(w.k, { m: w.ko, src: '한자어' });
  for (const x of SIGN_ITEMS) put(x.t, { m: x.m, src: '간판' });
  for (const x of KS_ITEMS) put(x.w, { m: x.m + ' (간사이벤)', src: '간사이벤' });
  for (const w of WORDS) if (w.r !== w.w) put('r:' + w.r, { m: w.m.join(', '), src: '단어' });
  RD_DICT = m;
  return m;
}
function rdMeaning(t) {
  const d = rdDict();
  const hit = d.get(t.surface_form) || d.get(t.basic_form) || d.get('r:' + kata2hira(t.reading || ''));
  if (hit) return hit.m;
  const ks = [...(t.basic_form !== '*' ? t.basic_form : t.surface_form)].filter(c => HJ_BY_K.has(c));
  return ks.length ? ks.map(c => `${c} ${HJ_BY_K.get(c).hun || HJ_BY_K.get(c).h}`).join(' · ') : '';
}
const hasKanjiChar = s => /[一-鿿々]/.test(s);

function renderReader(mod) {
  view.innerHTML = `<section class="mod">${modeSeg(mod)}<div class="chart rd">
    <p class="note">아이폰 카메라로 메뉴판·간판을 비추고 글자를 길게 눌러 <b>복사</b>(텍스트 인식)한 뒤 여기에 붙여넣으세요. 읽는 법·뜻·한국음을 달아 드려요.</p>
    <textarea id="rdIn" rows="4" lang="ja" placeholder="예: 本日のおすすめ 味噌ラーメン 大盛り無料">${esc(RD.text)}</textarea>
    <div class="row"><button class="btn primary" data-rd="go">해석하기</button>${navigator.clipboard && navigator.clipboard.readText ? '<button class="btn" data-rd="paste">붙여넣기</button>' : ''}<button class="btn" data-rd="ex">예시</button></div>
    <div id="rdOut"></div>
    <p class="note rd-credit">단어 나누기: kuromoji.js · IPADIC. 처음 한 번 사전(약 18MB)을 내려받아요. 와이파이에서 여는 걸 추천해요.</p>
  </div></section>`;
  rdDraw();
  view.onclick = async e => {
    const b = e.target.closest('button');
    if (!b || b.closest('.modes') || b.dataset.speak) return;
    const inp = document.getElementById('rdIn');
    if (b.dataset.rd === 'paste') {
      try {
        inp.value = (await navigator.clipboard.readText()).slice(0, 400);
      } catch (er) {
        toast('붙여넣기를 허용해 주세요. 입력칸을 길게 눌러 붙여넣어도 돼요.');
      }
    } else if (b.dataset.rd === 'ex') inp.value = '本日のおすすめ\n味噌ラーメン 大盛り無料\n食券を買ってください。';
    else if (b.dataset.rd === 'go') rdRun(inp.value);
    else if (b.dataset.rd === 'ko') rdTranslate();
  };
}
async function rdRun(text) {
  RD = { text: text.trim().slice(0, 400), toks: null, err: '', ko: '', loading: true };
  if (!RD.text) return;
  rdDraw();
  try {
    const t = await loadKuromoji();
    RD.toks = RD.text.split('\n').map(line => t.tokenize(line));
  } catch (e) {
    RD.err = '사전을 불러오지 못했어요. 인터넷 연결을 확인하고 다시 해 보세요.';
  }
  RD.loading = false;
  rdDraw();
}
async function rdTranslate() {
  RD.koBusy = true;
  rdDraw();
  try {
    RD.ko = (await aiCall('translate', { lang: 'ja', text: RD.text })).trim();
  } catch (e) {
    RD.ko = '';
    RD.err = e.message;
  }
  RD.koBusy = false;
  rdDraw();
}
function rdDraw() {
  const box = document.getElementById('rdOut');
  if (!box) return;
  if (RD.loading) {
    box.innerHTML = `<div class="rd-load"><span class="spin"></span>${KURO ? '해석하는 중…' : '사전을 내려받는 중이에요 (처음 한 번만)…'}</div>`;
    return;
  }
  if (!RD.toks) {
    box.innerHTML = RD.err ? `<p class="note" style="color:var(--ng)">${esc(RD.err)}</p>` : '';
    return;
  }
  const ruby = RD.toks
    .map(line =>
      line
        .map(t => {
          const r = kata2hira(t.reading || '');
          return hasKanjiChar(t.surface_form) && r && r !== t.surface_form
            ? `<ruby>${esc(t.surface_form)}<rt>${esc(r)}</rt></ruby>`
            : esc(t.surface_form);
        })
        .join('')
    )
    .join('<br>');
  const seen = new Set();
  const words = RD.toks.flat().filter(t => {
    if (['助詞', '助動詞', '記号'].includes(t.pos) || !t.surface_form.trim()) return false;
    const k = t.basic_form !== '*' ? t.basic_form : t.surface_form;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const reading = RD.toks
    .flat()
    .map(t => kata2hira(t.reading || t.surface_form))
    .join('');
  box.innerHTML = `<div class="rd-ruby jp" lang="ja">${ruby}</div>
    <div class="row">${spkBtn(reading, '전체 듣기')}${aiOn() ? `<button class="btn" data-rd="ko" ${RD.koBusy ? 'disabled' : ''}>${RD.koBusy ? '번역 중…' : 'AI 번역'}</button>` : ''}</div>
    ${RD.ko ? `<p class="rd-ko">${esc(RD.ko)}</p>` : ''}${RD.err ? `<p class="note" style="color:var(--ng)">${esc(RD.err)}</p>` : ''}
    <h3 class="hjr-h">단어 ${words.length}개</h3>
    <div class="sr-list">${words
      .map(t => {
        const base = t.basic_form !== '*' ? t.basic_form : t.surface_form;
        const r = kata2hira(t.reading || '');
        const m = rdMeaning(t);
        return `<button type="button" class="sr-i" data-speak="${esc(r || t.surface_form)}" data-lang="ja"><b class="jp" lang="ja">${esc(t.surface_form)}${base !== t.surface_form ? ` <small class="rd-base">← ${esc(base)}</small>` : ''}</b><small>${r && r !== t.surface_form ? `<span class="jp" lang="ja">${esc(r)}</span> · ` : ''}${RD_POS[t.pos] || esc(t.pos)}${m ? ' · ' + esc(m) : ''}</small><span class="sr-go">${SPK_ICON}</span></button>`;
      })
      .join('')}</div>
    <p class="note">뜻은 앱에 있는 단어에서 찾아요. 없는 단어는 한자의 한국음(훈음)을 보여 줘요.</p>`;
}
CUSTOM.reader = renderReader;

// ---- ui/welcome.js ----
'use strict';
/* ================= first visit: what this app is in 3 seconds, pick a language, how to install ================= */

const siteUrl = () => (APP_CONFIG && APP_CONFIG.site) || (location.protocol.startsWith('http') ? location.href.split(/[?#]/)[0] : '');
// SNS links open inside an app's own browser, where "홈 화면에 추가" is missing and saved data can vanish
const inAppBrowser = () => {
  const ua = navigator.userAgent || '';
  if (/KAKAOTALK/i.test(ua)) return '카카오톡';
  if (/Instagram/i.test(ua)) return '인스타그램';
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return '페이스북';
  if (/Line\//i.test(ua)) return '라인';
  if (/NAVER\(inapp/i.test(ua)) return '네이버';
  if (/Twitter|X-Client/i.test(ua)) return 'X';
  if (/ThreadsApp|Barcelona/i.test(ua)) return '스레드';
  return '';
};
const isIOS = () =>
  /iPhone|iPad|iPod/i.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function installHint() {
  if (isStandalone()) return '';
  const inApp = inAppBrowser();
  if (inApp)
    return `<div class="wc-warn"><b>${inApp} 안에서 열렸어요</b><p>여기서는 홈 화면에 추가할 수 없고, 공부 기록이 사라질 수 있어요. ${isIOS() ? '<b>Safari</b>' : '<b>Chrome</b>'}로 열어 주세요.</p>
      ${inApp === '카카오톡' ? '<button type="button" class="btn primary" data-wl="ext">Safari·기본 브라우저로 열기</button>' : `<p class="note">오른쪽 위(또는 아래) <b>⋯</b> 메뉴 → <b>${isIOS() ? 'Safari로 열기' : '다른 브라우저로 열기'}</b></p>`}
      <button type="button" class="link" data-wl="copy">주소 복사하기</button></div>`;
  return isIOS()
    ? `<div class="wc-inst"><b>📲 앱처럼 쓰려면</b><p>Safari 아래쪽 <b>공유 버튼(□↑)</b> → <b>홈 화면에 추가</b>. 앱스토어 없이 아이콘이 생겨요.</p></div>`
    : `<div class="wc-inst"><b>📲 앱처럼 쓰려면</b><p>브라우저 메뉴 <b>⋮</b> → <b>홈 화면에 추가</b>(또는 '앱 설치').</p></div>`;
}
function openWelcome() {
  const ai = typeof aiOn === 'function' && aiOn();
  const el = openSheet(
    `<div class="wc">
      <div class="wc-hero"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3.5c7.6 0 12.6 5.3 12.3 12.6-.3 7-5.8 12.3-12.6 12.1C8.9 28 3.6 22.7 3.8 15.6 4 8.7 9.2 3.9 16.6 4.2" fill="none" stroke="var(--shu)" stroke-width="2.4" stroke-linecap="round"/><path d="M16.4 9.6c3.6.2 6 2.9 5.7 6.3-.3 3.3-3.1 5.8-6.4 5.5-3.2-.3-5.4-3-5.1-6.1.3-2.7 2.5-4.4 5-4.2 2.3.2 3.7 2 3.5 4.1-.2 1.7-1.6 2.9-3.2 2.7" fill="none" stroke="var(--shu)" stroke-width="2.2" stroke-linecap="round"/></svg>
        <h1>하나마루</h1><p>한국인을 위한 일본어·영어 회화 앱<br>여행 가기 전, 하루 10분</p></div>
      <div class="wc-feats">
        <div class="wc-f"><span>漢</span><div><b>한국음으로 한자 읽기</b><p>학교 = <span class="jp" lang="ja">学校</span> = <span class="jp" lang="ja" style="color:var(--shu)">がっこう</span>. 받침 규칙만 알면 절반은 읽혀요.</p></div></div>
        <div class="wc-f"><span>🧳</span><div><b>여행 카드</b><p>점원에게 화면 가득 보여 주고 읽어 줘요. 호텔 주소·알레르기 카드도 만들어요.</p></div></div>
        ${
          ai
            ? `<div class="wc-f"><span>💬</span><div><b>AI 회화</b><p>라멘집·편의점에서 AI 점원과 연습하고, 끝나면 틀린 표현을 고쳐 줘요.</p></div></div>`
            : `<div class="wc-f"><span>📅</span><div><b>오늘 공부 시작</b><p>버튼 하나로 복습과 코스를 하루 10분씩 알아서 이어 줘요.</p></div></div>`
        }
      </div>
      <p class="wc-free">무료 · 가입 없음 · 기록은 내 폰에만 저장</p>
      <div class="wc-go"><button type="button" class="btn primary" data-wl="ja">일본어로 시작</button><button type="button" class="btn" data-wl="en">영어로 시작</button></div>
      ${installHint()}
      <p class="wc-foot"><button type="button" class="link" data-wl="tour">사용법 30초 보기</button> · <button type="button" class="link" data-wl="privacy">개인정보 안내</button></p>
    </div>`,
    'help welcome'
  );
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-wl]');
    if (!b) return;
    const a = b.dataset.wl;
    if (a === 'ja' || a === 'en') {
      welcomeDone(a);
      closeSheet();
      go('home');
      toast(a === 'ja' ? '반가워요! 오늘 공부 시작을 눌러 보세요' : 'Welcome! 오늘 공부 시작을 눌러 보세요');
    } else if (a === 'tour') {
      welcomeDone(S.lang);
      closeSheet();
      openTour();
    } else if (a === 'privacy') openPrivacy();
    else if (a === 'ext') location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(siteUrl());
    else if (a === 'copy') copyText(siteUrl(), '주소를 복사했어요. Safari·Chrome 주소창에 붙여넣어 주세요.', () => toast(siteUrl()));
  });
}
function welcomeDone(lang) {
  if (S.lang !== lang) {
    S.lang = lang;
    renderTabs();
  }
  S.seen.tour = 1;
  for (let v = 8; v <= WN_LATEST; v++) S.seen['v' + v] = 1;
  save();
}
// privacy notice: the same text as privacy.html, shown in the app
function privacyHTML() {
  return `<div class="pv">
    <p><b>하나마루는 회원가입이 없고, 공부 기록은 내 기기(브라우저)에만 저장돼요.</b> 앱 주인을 포함해 누구도 내 기록을 볼 수 없어요.</p>
    <h3>보내지는 정보</h3>
    <ul>
      <li><b>방문 통계</b> · 하루 몇 명이 오는지만 세요(Cloudflare Web Analytics). 쿠키를 쓰지 않고, 이름·기록·위치는 보내지 않아요.</li>
      <li><b>AI 회화 · 한 줄 일기 · AI 번역</b> · 이 기능을 쓸 때만, 입력한 글과 대화 내용이 답을 만들기 위해 AI 서버(Cloudflare Workers AI)로 보내져요. 앱이 저장하지는 않아요. 이름·연락처 같은 개인정보는 쓰지 마세요.</li>
      <li><b>오류 알림</b> · 앱이 고장 나면 오류 내용(어느 화면에서, 어떤 오류인지)과 기기 종류만 보내요. 공부 기록이나 입력한 글은 보내지 않아요.</li>
      <li><b>문제 신고</b> · '문제가 이상해요'를 누르면 그 문제 내용이 구글 폼으로 가요. 직접 보내기를 눌러야 전송돼요.</li>
    </ul>
    <h3>기록 지우기·옮기기</h3>
    <p>설정 → 기록 백업에서 코드로 옮길 수 있어요. 브라우저의 사이트 데이터를 지우면 기록도 지워져요.</p>
    <p class="note">문의: 앱 안의 '문제가 이상해요' 신고 폼</p></div>`;
}
function openPrivacy() {
  openSheet(
    `<div class="sheet-h"><b>개인정보 안내</b><button type="button" class="icon-btn" data-close aria-label="닫기">${XICON}</button></div><div class="h-scroll">${privacyHTML()}</div>`,
    'help'
  );
}

// ---- ui/search.js ----
'use strict';
/* ================= 통합 검색 (header 🔍): practices, words, grammar, expressions, signs, kanji, travel phrases ================= */

let SQ = '';
const kataToHira = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 96));
const sNorm = s =>
  kataToHira(
    String(s || '')
      .toLowerCase()
      .replace(/\s+/g, '')
  );
const sHit = (q, ...fields) => fields.some(f => sNorm(Array.isArray(f) ? f.join('/') : f).includes(q));

function searchGroups(raw) {
  const q = sNorm(raw);
  if (!q) return [];
  const ja = S.lang === 'ja';
  const G = [];
  const add = (title, items, row) => {
    if (items.length) G.push({ title, n: items.length, html: items.slice(0, 6).map(row).join('') });
  };
  const modes = Object.keys(MENU_DESC).filter(
    m => modTab(m) && (!/aichat$|diary$/.test(m) || aiOn()) && sHit(q, modeLabel(m), MENU_DESC[m])
  );
  add(
    '연습',
    modes,
    m =>
      `<button type="button" class="sr-i" data-mode="${m}" data-sclose><b>${esc(modeLabel(m))}</b><small>${esc(MENU_DESC[m])}</small><span class="sr-go">열기</span></button>`
  );
  const jw = WORDS.filter(w => sHit(q, w.w, w.r, w.m));
  const ew = EN_WORDS.filter(w => sHit(q, w.w, w.m));
  const jwRow = w =>
    `<button type="button" class="sr-i" data-speak="${esc(w.r)}" data-lang="ja"><b class="jp" lang="ja">${esc(w.w)}</b><small>${w.w !== w.r ? esc(w.r) + ' · ' : ''}${esc(w.m.join(', '))}</small><span class="sr-go">${SPK_ICON}</span></button>`;
  const ewRow = w =>
    `<button type="button" class="sr-i" data-speak="${esc(w.w)}" data-lang="en"><b class="en" lang="en">${esc(w.w)}</b><small>${esc(w.m.join(', '))}</small><span class="sr-go">${SPK_ICON}</span></button>`;
  if (ja) add('일본어 단어', jw, jwRow);
  add('영어 단어', ew, ewRow);
  if (!ja) add('일본어 단어', jw, jwRow);
  if (ja) {
    add(
      '문법',
      GRAM.filter(g => sHit(q, g.p, g.name, g.exp)),
      g =>
        `<button type="button" class="sr-i" data-sgram data-sclose><b class="jp" lang="ja">${esc(g.p)}</b><small>${esc(g.name)}</small><span class="sr-go">노트</span></button>`
    );
    add(
      '한국어 표현',
      KX.filter(x =>
        sHit(
          q,
          x.ko,
          (x.ja || []).map(j => j[0])
        )
      ),
      x =>
        `<button type="button" class="sr-i" data-skx="${esc(x.ko)}" data-sclose><b>${esc(x.ko)}</b><small>${esc((x.ja || []).map(j => j[0]).join(' · ') || x.sum)}</small><span class="sr-go">보기</span></button>`
    );
    add(
      '메뉴판·간판',
      SIGN_ITEMS.filter(x => sHit(q, x.t, x.r, x.m)),
      x =>
        `<button type="button" class="sr-i" data-speak="${esc(x.r)}" data-lang="ja"><b class="jp" lang="ja">${esc(x.t)}</b><small>${esc(x.r)} · ${esc(x.m)}</small><span class="sr-go">${SPK_ICON}</span></button>`
    );
    add(
      '한자',
      HJ_ITEMS.filter(x => x.k === raw.trim() || sHit(q, x.hun, x.h) || (q.length > 1 && sHit(q, x.on))),
      x =>
        `<button type="button" class="sr-i" data-speak="${esc(x.o)}" data-lang="ja"><b class="jp" lang="ja">${esc(x.k)}</b><small>${esc(x.hun || x.h)} · <span class="jp" lang="ja">${esc(x.on.join('・'))}</span></small><span class="sr-go">${SPK_ICON}</span></button>`
    );
  }
  if (ja && typeof HJW_ITEMS !== 'undefined')
    add(
      '한자어',
      HJW_ITEMS.filter(x => sHit(q, x.ko, x.k, x.r)),
      x =>
        `<button type="button" class="sr-i" data-speak="${esc(x.r)}" data-lang="ja"><b class="jp" lang="ja">${esc(x.k)}</b><small>${esc(x.r)} · ${esc(x.ko)}</small><span class="sr-go">${SPK_ICON}</span></button>`
    );
  const tl = ja ? 'ja' : 'en';
  add(
    '여행 문장',
    TRAVEL[tl].filter(x => sHit(q, x.ko, x.t, x.r)),
    x =>
      `<button type="button" class="sr-i" data-strav="${esc(x.key)}"><b class="${ja ? 'jp' : 'en'}" lang="${tl}">${esc(x.t)}</b><small>${esc(x.ko)}</small><span class="sr-go">보여주기</span></button>`
  );
  return G;
}
function openSearch() {
  const el = openSheet(
    `<div class="sheet-h"><b>검색</b><button type="button" class="icon-btn" data-close aria-label="닫기">${XICON}</button></div>
    <div class="h-scroll"><input type="search" id="srQ" class="wl-search" placeholder="단어, 문법, 표현, 간판, 한자, 연습 이름" value="${esc(SQ)}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="검색어">
    <div id="srOut" class="sr-out"></div></div>`,
    'help search'
  );
  const inp = el.querySelector('#srQ');
  const draw = () => {
    SQ = inp.value;
    const gs = searchGroups(SQ);
    el.querySelector('#srOut').innerHTML = !SQ.trim()
      ? '<p class="note">예: 会う, 수고, 약국, 税込, 학교, 조사</p>'
      : gs.length
        ? gs.map(g => `<h3 class="sr-h">${g.title} <span class="num">${g.n}</span></h3><div class="sr-list">${g.html}</div>`).join('')
        : '<p class="note">찾는 결과가 없어요.</p>';
  };
  inp.addEventListener('input', draw);
  draw();
  setTimeout(() => {
    try {
      inp.focus();
    } catch (e) {}
  }, 50);
  el.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.skx !== undefined) {
      closeSheet();
      KX_Q = b.dataset.skx;
      KX_CAT = '전체';
      startMod('koexp');
    } else if ('sgram' in b.dataset) {
      closeSheet();
      startMod('gnote');
    } else if (b.dataset.strav) {
      const x = TRAVEL[S.lang === 'ja' ? 'ja' : 'en'].find(t => t.key === b.dataset.strav);
      if (x) openTravelShow(S.lang === 'ja' ? 'ja' : 'en', [x], 0);
    } else if ('sclose' in b.dataset) closeSheet();
  });
}
document.getElementById('searchBtn').addEventListener('click', openSearch);

// ---- ui/whats-new.js ----
'use strict';
/* ================= "what's new" sheet, shown once to people who already used the app ================= */
// v: the version that added the item; people only see items newer than the last list they saw
const WHATS_NEW = [
  {
    v: 16,
    ai: true,
    t: 'AI 한 줄 일기',
    d: '회화·여행 탭 · 대화·듣기. 하루 한 문장 쓰면 AI가 틀린 곳과 더 자연스러운 표현을 한국어로 알려 줘요.'
  },
  {
    v: 16,
    ja: false,
    t: '한국인이 틀리는 영어',
    d: "배우기 탭 · 한국인 맞춤. married with him, '배 안 고파요?'에 Yes… 한국어를 그대로 옮기면 틀리는 곳만 134문제."
  },
  { v: 16, t: 'QR 공유 카드', d: '결과·D-day·한국음 카드 아래에 QR이 생겼어요. 친구가 카메라로 찍으면 바로 열려요.' },
  { v: 16, t: '개인정보 안내', d: '도움말과 설정에서 어떤 정보가 어디로 가는지 확인할 수 있어요. 공부 기록은 내 폰에만 있어요.' },
  {
    v: 15,
    t: '나만의 여행 카드',
    d: '회화·여행 탭. 호텔 주소·알레르기·예약 이름을 넣으면 택시 기사나 점원에게 화면 가득 보여 줄 카드가 돼요.'
  },
  {
    v: 15,
    ja: true,
    t: '붙여넣기 해석기',
    d: '회화·여행 탭. 아이폰 카메라로 메뉴판 글자를 복사해 붙여넣으면 읽는 법·뜻·한국음을 달아 줘요.'
  },
  { v: 15, ai: true, t: 'AI 회화', d: '회화·여행 탭. AI 점원·친구와 실제처럼 대화하고, 끝나면 틀린 표현을 한국어로 고쳐 줘요.' },
  {
    v: 14,
    t: '내 약점 리포트',
    d: '자료 탭. 어디가 약한지 정답률로 짚어 주고, 약한 곳만 골라 바로 연습해요. 오늘 공부 시작에도 자동으로 섞여요.'
  },
  { v: 14, t: '목소리 고르기', d: '설정 → 발음 목소리. 더 자연스러운 고음질 목소리를 고르고 미리 들어 볼 수 있어요.' },
  { v: 14, t: '공유 카드', d: '여행 D-day와 한국음 단어(학교 = 学校 = がっこう)를 이미지 카드로 친구에게 보내요.' },
  { v: 14, ja: true, t: '간사이벤', d: '회화·여행 탭. おおきに, なんでやねん — 오사카에서 듣는 사투리를 배워요.' },
  {
    v: 13,
    t: '화면을 정리했어요',
    d: '아래 탭이 5개로 줄었어요. 탭을 누르면 연습 목록이 설명과 함께 카드로 나와요. ☆를 누르면 홈과 목록 맨 위에 고정돼요.'
  },
  { v: 13, t: '오늘 공부 시작', d: '홈의 큰 버튼 하나로 복습 → 코스 → 단어 카드를 이어서 해요. 아래 막대에서 다음 단계로 넘어가요.' },
  { v: 13, t: '검색', d: '맨 위 돋보기로 단어·문법·표현·간판·한자·연습을 한 번에 찾아요.' },
  {
    v: 12,
    ja: true,
    t: '여행 D-day',
    d: '회화·여행 탭. 출발 날짜를 넣으면 여행 문장과 메뉴판 한자를 하루치씩 나눠 줘요. 홈에 D-day가 떠요.'
  },
  {
    v: 12,
    ja: true,
    t: '메뉴판·간판 읽기',
    d: '회화·여행 탭. 定食, 税込, 改札口처럼 일본에서 실제로 보는 글자를 간판 모양 그대로 읽어요.'
  },
  {
    v: 12,
    ja: true,
    t: '조사 함정',
    d: "배우기 탭 · 한국인 맞춤. '친구를 만나다'는 友達に会う! 한국어 조사를 그대로 옮기면 틀리는 곳만 모았어요."
  },
  { v: 12, ja: true, t: '번역 안 되는 한국어 표현', d: "회화·여행 탭. '수고하세요', '화이팅'은 일본어로 뭐라고 할까요?" },
  { v: 12, ja: true, t: '소리 구별 추가', d: '회화·여행 탭 · 발음. が/か, ざ/じゃ, つ/す처럼 한국인 귀에 똑같이 들리는 소리를 연습해요.' },
  { v: 12, ja: false, t: '여행 D-day', d: '회화·여행 탭. 출발 날짜를 넣으면 여행 영어 문장을 하루치씩 나눠 줘요.' },
  {
    v: 11,
    ja: true,
    t: '한국음으로 한자 읽기',
    d: '배우기 탭 · 한국인 맞춤. 학교(學校) → がっこう처럼 한국 한자음에서 일본어 음독을 짐작하는 규칙을 배워요.'
  },
  { v: 10, t: '여행 회화 카드', d: "회화·여행 탭. '보여주기'를 누르면 화면 가득 크게 띄우고 읽어 줘요." },
  { v: 10, ja: true, t: '글자 따라 쓰기', d: '배우기 탭. 획순 번호를 보며 손가락으로 따라 써요.' },
  { v: 10, t: '플래시카드', d: '배우기 탭. 넘기면서 알아요 / 몰라요만 눌러요.' },
  { v: 10, t: '단어장 공유', d: '자료 탭 → 단어장에서 링크로 친구에게 보내요.' }
];
const WN_LATEST = 16;

function whatsNew10(since) {
  const ja = S.lang === 'ja';
  // ja: true = Japanese only, false = English only, undefined = both
  const items = WHATS_NEW.filter(x => x.v > (since || 9) && (x.ja === undefined || x.ja === ja) && (!x.ai || aiOn()));
  if (!items.length) return;
  const el = openSheet(
    `<div class="sheet-h"><b>새로 생긴 것</b><button type="button" class="icon-btn" data-close aria-label="닫기">${XICON}</button></div>
    <div class="h-scroll"><div class="h-sec" style="padding:14px;display:grid;gap:10px;font-size:15px;line-height:1.6">
      ${items.map(x => `<p style="margin:0"><b>${esc(x.t)}</b> · ${esc(x.d)}</p>`).join('')}</div>
      <button class="btn primary" data-wn style="width:100%">확인</button></div>`,
    'help'
  );
  el.querySelector('[data-wn]').addEventListener('click', closeSheet);
}

// ---- boot.js ----
'use strict';
/* keyboard (desktop) */
document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (document.getElementById('sheet') || document.getElementById('tvShow')) return;
  if (curTab() === 'home') return;
  const mod = activeMod();
  if (SPEED.has(mod)) {
    if (SP && SP.running && /^[1-4]$/.test(e.key)) {
      answerSpeed(+e.key - 1);
      e.preventDefault();
    }
    return;
  }
  const r = R[mod];
  if (!r || r.done || r.empty) return;
  if (e.target.matches('input,textarea')) return;
  const choiceWord = (mod === 'word' || mod === 'ew') && S.set.wans === 'choice';
  const optAttr = ['sent', 'jl', 'es', 'el', 'kconf'].includes(mod)
    ? 'opt'
    : choiceWord || ['loan', 'conj', 'kanji', 'part', 'gram', 'irr', 'mp', 'cnt', 'pol', 'jlen'].includes(mod) || INFO[mod]
      ? 'wopt'
      : null;
  if (optAttr) {
    if (!r.answered && /^[1-4]$/.test(e.key)) {
      const b = document.querySelector(`[data-${optAttr}="${+e.key - 1}"]`);
      if (b) b.click();
      e.preventDefault();
    } else if (r.answered && e.key === 'Enter') {
      next(mod);
      e.preventDefault();
    }
    return;
  }
  if (BUILD.has(mod)) {
    if (e.key === 'Enter') {
      r.answered ? next(mod) : checkBuild(mod, false);
      e.preventDefault();
    }
    return;
  }
  if (((mod === 'kana' && S.kana.dir === 'r2k') || mod === 'jd') && S.kana.input === 'pad') {
    if (e.key === 'Enter') {
      if (r.answered) next(mod);
      else if (padVal) CHECK[mod](padVal);
      e.preventDefault();
    } else if (e.key === 'Backspace' && !r.answered) {
      padVal = padVal.slice(0, -1);
      renderPad('');
      e.preventDefault();
    }
    return;
  }
  if (r.answered && e.key === 'Enter') {
    next(mod);
    e.preventDefault();
  }
});

applyLook();
renderTabs();
VS_IN = parseVS(location.hash);
if (VS_IN) {
  try {
    history.replaceState(null, '', location.href.split('#')[0]);
  } catch (e) {}
  const vl = ['jw', 'js', 'jk'].includes(VS_IN.t) ? 'ja' : 'en';
  if (S.lang !== vl) {
    S.lang = vl;
    save();
    renderTabs();
  }
  S.smode[S.lang][S.lang === 'ja' ? 'play' : 'eplay'] = 'vs';
  S.tabs[S.lang] = S.lang === 'ja' ? 'play' : 'eplay';
  save();
}
const WL_IN = parseWordShare(location.hash);
if (WL_IN) {
  try {
    history.replaceState(null, '', location.href.split('#')[0]);
  } catch (e) {}
}
if (VS_IN) startMod('vs');
else go(curTab());
checkUpdate();
if (WL_IN) setTimeout(() => offerWordShare(WL_IN), 400);
else if (!VS_IN) {
  if (!S.seen.tour) setTimeout(openWelcome, 300);
  else if (!S.seen['v' + WN_LATEST]) {
    // the newest list this person has already seen (v8/v9 lists were before WHATS_NEW)
    let since = 9;
    for (let v = WN_LATEST - 1; v >= 10; v--)
      if (S.seen['v' + v]) {
        since = v;
        break;
      }
    for (let v = 8; v <= WN_LATEST; v++) S.seen['v' + v] = 1;
    save();
    setTimeout(() => whatsNew10(since), 500);
  }
}
startAnalytics();
window.__hanamaruReady = true;
