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
  const modes = Object.keys(MENU_DESC).filter(m => modTab(m) && sHit(q, modeLabel(m), MENU_DESC[m]));
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
