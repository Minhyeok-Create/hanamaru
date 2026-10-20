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
