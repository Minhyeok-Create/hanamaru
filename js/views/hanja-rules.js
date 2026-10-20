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
