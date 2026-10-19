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
