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
