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
