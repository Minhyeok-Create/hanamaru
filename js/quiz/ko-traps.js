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
