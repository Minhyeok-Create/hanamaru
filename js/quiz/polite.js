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
