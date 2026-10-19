'use strict';
/* word lists */
const LS = { ja: { q: '', cat: 'all', add: false, msg: '' }, en: { q: '', cat: 'all', add: false, msg: '' } };
function renderWordList(lang) {
  const vb = document.getElementById('vbody');
  const ls = LS[lang];
  const cats = lang === 'ja' ? CATS : EN_CATS;
  const ja = lang === 'ja';
  const chips = [
    ['all', '전체'],
    ['fav', '★ 즐겨찾기'],
    ...(ja
      ? [
          ['n5', 'N5'],
          ['n4', 'N4']
        ]
      : []),
    ...((ja ? S.custom.ja : S.custom.en).length ? [['mine', '내 단어']] : []),
    ...Object.entries(cats)
      .filter(([k]) => k !== 'mine')
      .map(([k, [l]]) => [k, l])
  ];
  vb.innerHTML = `<div class="chart">
    <input type="search" class="wl-search" id="wlq" placeholder="${ja ? '단어, 읽기, 로마자, 뜻으로 검색' : '단어나 뜻으로 검색'}" value="${esc(ls.q)}" aria-label="단어 검색" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
    <div class="chips" id="wlc">${chips.map(([k, l]) => `<button class="chip" data-wc="${k}" aria-pressed="${ls.cat === k}">${l}</button>`).join('')}</div>
    <div>
      <div class="row wl-tools"><button class="btn" data-addtoggle>${ls.add ? '닫기' : '+ 내 단어 추가'}</button><button class="btn" data-wlshare>단어장 공유</button></div>
      ${
        ls.add
          ? `<form class="add-form" id="addForm" style="margin-top:8px" autocomplete="off">
        ${
          ja
            ? `<input id="aw" type="text" lang="ja" placeholder="단어 (예: 猫, ねこ)" aria-label="단어"><input id="ar" type="text" lang="ja" placeholder="읽기 – 히라가나 (예: ねこ)" aria-label="읽기"><input id="am" type="text" lang="ko" placeholder="뜻 – 여러 개면 쉼표로 (예: 고양이)" aria-label="뜻">`
            : `<input id="aw" type="text" lang="en" inputmode="email" placeholder="영어 단어나 표현" aria-label="단어"><input id="am" type="text" lang="ko" placeholder="뜻 – 여러 개면 쉼표로" aria-label="뜻">`
        }
        <button class="btn primary" type="submit">추가하기</button>${ls.msg ? `<p class="note" style="color:var(--ink)">${esc(ls.msg)}</p>` : ''}</form>`
          : ''
      }
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><p class="note" id="wlcount"></p>${LEGEND}</div>
    <div class="wl" id="wl"></div>
  </div>`;
  const draw = () => {
    const all = ja ? WORDS : EN_WORDS;
    const qq = ls.q.trim().toLowerCase();
    let list = all.filter(
      w =>
        ls.cat === 'all' ||
        (ls.cat === 'fav' ? S.fav[w.key] : ls.cat === 'n5' ? w.lvl === 5 : ls.cat === 'n4' ? w.lvl === 4 : w.cats.includes(ls.cat))
    );
    if (qq)
      list = list.filter(
        w =>
          w.w.toLowerCase().includes(qq) ||
          w.m.some(m => m.includes(qq)) ||
          (ja && (w.r.includes(qq) || toHira(w.r).includes(toHira(qq)) || romaji(w.r).includes(qq)))
      );
    document.getElementById('wlcount').textContent =
      `${list.length}개${list.length > 300 ? ' · 처음 300개만 보여요. 검색이나 분류로 좁혀 보세요.' : ''}`;
    document.getElementById('wl').innerHTML = list
      .slice(0, 300)
      .map(
        w => `<div class="wl-i" data-key="${esc(w.key)}" data-st="${itemStatus(w.key)}">
      <button class="wl-main" data-open><span class="w ${ja ? 'jp' : 'en'}" lang="${lang}">${esc(w.w)}</span>${ja && w.w !== w.r ? `<span class="s jp" lang="ja">${esc(w.r)}</span>` : ''}<span class="s">${esc(w.m.join(', '))}</span>${w.lvl === 4 ? '<span class="lv-tag">N4</span>' : ''}</button>
      <button class="star" data-star aria-pressed="${!!S.fav[w.key]}" aria-label="즐겨찾기">${S.fav[w.key] ? '★' : '☆'}</button>
      <div class="wl-ex" hidden>${ja ? `<span class="mono s">${romaji(w.r)}</span>` : ''}${w.ex ? (ja ? `<span class="ex-jp" lang="ja" style="font-size:16px">${markWord(w.ex, [w.w, w.r])}</span><span class="ex-rd" lang="ja">${esc(w.exr)}</span><span class="ex-ko">${esc(w.exko)}</span>` : `<span class="ex-en" lang="en" style="font-size:16px">${markWord(w.ex, [w.w, ...w.alt], true)}</span><span class="ex-ko">${esc(w.exko)}</span>`) : ''}
        <div class="row" style="margin-top:4px">${w.ex ? spkBtn(w.ex, '예문 듣기', lang) : ''}${w.mine ? `<button class="spk" data-del>삭제</button>` : ''}</div></div></div>`
      )
      .join('');
  };
  draw();
  document.getElementById('wlq').addEventListener('input', e => {
    ls.q = e.target.value;
    draw();
  });
  const form = document.getElementById('addForm');
  if (form)
    form.addEventListener('submit', e => {
      e.preventDefault();
      const w = document.getElementById('aw').value.trim(),
        m = document
          .getElementById('am')
          .value.trim()
          .split(/[,，/]/)
          .map(x => x.trim())
          .filter(Boolean)
          .join('/');
      if (ja) {
        const r = toHira(document.getElementById('ar').value.trim().replace(/\s/g, ''));
        const ww = w || r;
        if (!ww || !r || !m) {
          ls.msg = '단어, 읽기, 뜻을 모두 입력해 주세요.';
          return renderWordList(lang);
        }
        if (!/^[ぁ-ゖー]+$/.test(r)) {
          ls.msg = '읽기는 히라가나로 입력해 주세요.';
          return renderWordList(lang);
        }
        if (WORDS.some(x => x.w === ww && x.r === r)) {
          ls.msg = '이미 있는 단어예요.';
          return renderWordList(lang);
        }
        S.custom.ja.push({ w: ww, r, m });
      } else {
        if (!w || !m) {
          ls.msg = '단어와 뜻을 모두 입력해 주세요.';
          return renderWordList(lang);
        }
        if (EN_WORDS.some(x => x.w.toLowerCase() === w.toLowerCase())) {
          ls.msg = '이미 있는 단어예요.';
          return renderWordList(lang);
        }
        S.custom.en.push({ w, m });
      }
      rebuildWords();
      if (ja) {
        S.word.cats = [...new Set([...S.word.cats, 'mine'])];
        R.word = null;
      } else {
        S.ew.cats = [...new Set([...S.ew.cats, 'mine'])];
        R.ew = null;
      }
      save();
      ls.msg = '추가했어요. 단어 퀴즈에도 나와요.';
      ls.cat = 'mine';
      renderWordList(lang);
    });
  vb.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.wc) {
      ls.cat = b.dataset.wc;
      vb.querySelectorAll('[data-wc]').forEach(x => x.setAttribute('aria-pressed', x === b));
      draw();
      return;
    }
    if ('wlshare' in b.dataset) {
      openWordShare(lang);
      return;
    }
    if ('addtoggle' in b.dataset) {
      ls.add = !ls.add;
      ls.msg = '';
      renderWordList(lang);
      return;
    }
    const row = b.closest('.wl-i');
    if (!row) return;
    const key = row.dataset.key;
    if ('star' in b.dataset) {
      if (S.fav[key]) delete S.fav[key];
      else S.fav[key] = 1;
      save();
      const on = !!S.fav[key];
      b.setAttribute('aria-pressed', on);
      b.textContent = on ? '★' : '☆';
      return;
    }
    if ('del' in b.dataset) {
      if (b.dataset.confirm) {
        const arr = ja ? S.custom.ja : S.custom.en;
        const i = arr.findIndex(c => (ja ? 'w:' + c.w + '|' + c.r : 'ew:' + c.w) === key);
        if (i >= 0) arr.splice(i, 1);
        delete S.fav[key];
        rebuildWords();
        R.word = null;
        R.ew = null;
        save();
        draw();
      } else {
        b.dataset.confirm = '1';
        b.textContent = '정말 삭제';
      }
      return;
    }
    if ('open' in b.dataset) {
      const ex = row.querySelector('.wl-ex');
      const show = ex.hidden;
      vb.querySelectorAll('.wl-i.hit').forEach(x => {
        x.classList.remove('hit');
        x.querySelector('.wl-ex').hidden = true;
      });
      if (show) {
        row.classList.add('hit');
        ex.hidden = false;
        const w = (ja ? WORDS : EN_WORDS).find(x => x.key === key);
        if (w) speak(ja ? w.r : w.w, lang);
      }
    }
  };
}
