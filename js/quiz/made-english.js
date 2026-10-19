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
