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
