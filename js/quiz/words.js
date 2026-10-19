'use strict';
/* ---------- words (shared) ---------- */
const kNorm = s =>
  s
    .normalize('NFC')
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[\s.,!?~·・'"“”‘’\-…]/g, '');
const kStem = s => s.replace(/(입니다|이에요|예요|해요|요|다)$/, '');
function meaningOk(input, ms) {
  const a = kNorm(input);
  if (!a) return false;
  return ms.some(m => {
    const b = kNorm(m);
    return a === b || (kStem(a) === kStem(b) && kStem(a).length > 0);
  });
}
function markWord(text, cands, ci) {
  const list = [];
  for (const c of cands) {
    if (!c) continue;
    list.push(c);
    if ([...c].length >= 3) list.push(c.slice(0, -1));
  }
  for (const c of list) {
    const idx = ci ? text.toLowerCase().indexOf(c.toLowerCase()) : text.indexOf(c);
    if (idx >= 0)
      return esc(text.slice(0, idx)) + '<mark>' + esc(text.slice(idx, idx + c.length)) + '</mark>' + esc(text.slice(idx + c.length));
  }
  return esc(text);
}
function wordOptions(q, all, mode, lang) {
  const qm = new Set(q.m.map(kNorm));
  const label = x => (mode === 'en' ? x.w : x.m.slice(0, 2).join(', '));
  const ql = label(q);
  const okx = x => x !== q && !x.m.some(m => qm.has(kNorm(m))) && label(x) !== ql && x.w !== q.w;
  let c = shuffle(all.filter(x => okx(x) && x.cats.some(k => q.cats.includes(k))));
  if (c.length < 3) c = c.concat(shuffle(all.filter(x => okx(x) && !c.includes(x))));
  const sub = x => (mode === 'en' ? x.m.slice(0, 2).join(', ') : lang === 'ja' ? (x.w !== x.r ? `${x.w} · ${x.r}` : x.w) : x.w);
  const mk = (x, ok) => ({
    t: label(x),
    ok,
    sub: sub(x),
    cls: mode === 'en' ? 'en' : 'ko-opt',
    lang: mode === 'en' ? 'en' : '',
    subCls: mode === 'en' ? '' : lang === 'ja' ? 'jp' : 'en',
    subLang: mode === 'en' ? '' : lang
  });
  return shuffle([mk(q, true), ...c.slice(0, 3).map(x => mk(x, false))]);
}
function optsHTML(r, attr = 'data-wopt') {
  return `<div class="opts">${r.order
    .map((o, i) => {
      const st = r.answered ? (o.ok ? 'ok' : i === r.chosen ? 'ng' : 'dim') : '';
      return `<button type="button" class="opt" ${attr}="${i}" ${st ? `data-state="${st}"` : ''} ${r.answered ? 'aria-disabled="true"' : ''}><span class="n">${i + 1}</span><span class="${o.cls}" ${o.lang ? `lang="${o.lang}"` : ''}>${esc(o.t)}</span>${r.answered && o.sub ? `<span class="tr ${o.subCls || ''}" ${o.subLang ? `lang="${o.subLang}"` : ''}>${esc(o.sub)}</span>` : ''}</button>`;
    })
    .join('')}</div>
    <div class="sub-actions"><button type="button" class="btn quiet" data-act="skip">${r.answered ? '다음' : '모르겠어요'}</button></div>`;
}
const favBtn = k =>
  `<button type="button" class="spk" data-act="fav" data-key="${esc(k)}" aria-pressed="${!!S.fav[k]}">${S.fav[k] ? '★ 즐겨찾기됨' : '☆ 즐겨찾기'}</button>`;

/* ---------- japanese words ---------- */
const wordSize = t => {
  const n = [...t].length;
  return n <= 2 ? 76 : n <= 4 ? 60 : n <= 6 ? 46 : n <= 8 ? 36 : 30;
};
function wordReading(q) {
  const disp = S.set.kanji ? q.w : q.r;
  const parts = [];
  if (disp !== q.r) parts.push(`<span class="jp" lang="ja">${esc(q.r)}</span>`);
  if (!S.set.kanji && q.w !== q.r) parts.push(`<span class="jp" lang="ja">${esc(q.w)}</span>`);
  parts.push(`<span class="mono">${romaji(q.r)}</span>`);
  return parts.join('') + spkBtn(q.r);
}
function showWord(mod, q, card, zone, r, focus) {
  const disp = S.set.kanji ? q.w : q.r;
  const open = r.revealed || r.answered;
  card.innerHTML = `<span class="cat">${esc(catName(CATS, q.cats.find(c => S.word.cats.includes(c)) || q.cats[0]))}</span><button type="button" class="qbtn" data-act="reveal" aria-expanded="${!!open}" aria-label="읽는 법 보기">?</button>
    <div class="tz wide"><span class="word" lang="ja" style="font-size:${wordSize(disp)}px">${esc(disp)}</span></div>
    <div class="reading" id="rd" ${open ? '' : 'hidden'}>${wordReading(q)}</div>${MARKS}`;
  if (S.set.wans === 'choice') {
    if (!r.order) r.order = wordOptions(q, WORDS, 'ko', 'ja');
    zone.dataset.type = 'wchoice';
    zone.innerHTML = optsHTML(r);
    return;
  }
  answerForm(zone, 'word', 'lang="ko" placeholder="뜻을 한국어로"', 'word');
  prepInput(zone, r, focus);
}
function wordInfoJP(q) {
  return `<div class="fb-line"><span class="jp" lang="ja">${esc(q.w)}</span>${q.w !== q.r ? `<span class="jp" lang="ja" style="font-size:17px">${esc(q.r)}</span>` : ''}<span class="mono">${romaji(q.r)}</span>${spkBtn(q.r)}</div>
    <p class="fb-sub">뜻: ${q.m.map(esc).join(', ')}${q.n ? ` · ${esc(q.n)}` : ''}</p>
    ${q.ex ? `<div class="ex"><p class="ex-jp" lang="ja">${markWord(q.ex, [q.w, q.r])}</p><p class="ex-rd" lang="ja">${esc(q.exr)}</p><p class="ex-ro mono">${esc(romaji(q.exr))}</p><p class="ex-ko">${esc(q.exko)}</p>${spkBtn(q.ex, '예문 듣기')}</div>` : ''}
    <div>${favBtn(q.key)}</div>`;
}
function checkWord(val, skip) {
  const r = R.word,
    q = r.qs[r.i];
  if (r.answered) return;
  const given = (val || '').trim();
  if (!skip && !given) return;
  gradeWord(q, !skip && meaningOk(given, q.m), given, skip);
}
function gradeWord(q, ok, given, skip) {
  const typed = S.set.wans !== 'choice';
  finish('word', q, ok, given, resultBody(ok, skip, given, wordInfoJP(q)), typed && !ok && !skip);
  const inp = document.getElementById('ans');
  if (inp) inp.dataset.state = ok ? 'ok' : 'ng';
  const rd = document.getElementById('rd');
  if (rd) rd.hidden = false;
  if (!typed) document.getElementById('zone').innerHTML = optsHTML(R.word);
  if (S.set.autoSpeak) speak(q.r);
  if (ok && S.set.autoNext) advT = setTimeout(() => next('word'), q.ex ? 2600 : 1500);
}

/* ---------- english words ---------- */
const enSize = t => {
  const n = t.length;
  return n <= 6 ? 54 : n <= 10 ? 42 : n <= 14 ? 34 : 28;
};
const enNorm = s =>
  s
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[.!?,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
function patHTML(w, mode) {
  return w
    .split(' ')
    .map(
      word =>
        `<span class="pw">${[...word].map((c, ci) => `<i>${mode === 'full' || (mode === 'hint' && ci === 0) ? esc(c) : ''}</i>`).join('')}</span>`
    )
    .join('');
}
function showEW(mod, q, card, zone, r, focus) {
  const e2k = S.ew.dir === 'e2k';
  const open = r.revealed || r.answered;
  const cat = `<span class="cat">${esc(catName(EN_CATS, q.cats.find(c => S.ew.cats.includes(c)) || q.cats[0]))}</span>`;
  const choice = S.set.wans === 'choice';
  if (e2k)
    card.innerHTML = `${cat}<button type="button" class="qbtn" data-act="reveal" aria-expanded="${!!open}" aria-label="발음 듣기">?</button><div class="tz wide"><span class="eword" lang="en" style="font-size:${enSize(q.w)}px">${esc(q.w)}</span></div><div class="reading" id="rd" ${open ? '' : 'hidden'}>${spkBtn(q.w, '발음 다시 듣기', 'en')}</div><p class="cap">${choice ? '알맞은 뜻을 고르세요' : '뜻을 한국어로 입력'} · ? 를 누르면 발음</p>${MARKS}`;
  else
    card.innerHTML = `${cat}<button type="button" class="qbtn" data-act="reveal" aria-expanded="${!!open}" aria-label="힌트 보기">?</button><p class="ko">${esc(q.m.join(', '))}</p><div class="pat" id="pat" aria-label="${q.w.replace(/ /g, '').length}글자">${patHTML(q.w, r.answered ? 'full' : open ? 'hint' : '')}</div><div class="reading" id="rd" ${open ? '' : 'hidden'}>${spkBtn(q.w, '발음 듣기', 'en')}</div><p class="cap">${choice ? '알맞은 영어를 고르세요' : '영어로 입력'} · ? 를 누르면 첫 글자와 발음</p>${MARKS}`;
  if (choice) {
    if (!r.order) r.order = wordOptions(q, EN_WORDS, e2k ? 'ko' : 'en', 'en');
    zone.dataset.type = 'wchoice';
    zone.innerHTML = optsHTML(r);
    return;
  }
  answerForm(
    zone,
    'ew-' + S.ew.dir,
    e2k ? 'lang="ko" placeholder="뜻을 한국어로"' : 'lang="en" inputmode="email" placeholder="영어로 입력"',
    'ew',
    e2k ? '' : 'roman'
  );
  prepInput(zone, r, focus);
}
function wordInfoEN(q) {
  return `<div class="fb-line"><span class="en" lang="en" style="font-size:24px;font-weight:600">${esc(q.w)}</span>${q.alt.length ? `<span class="fb-sub">(${esc(q.alt.join(', '))})</span>` : ''}${spkBtn(q.w, '발음 듣기', 'en')}</div><p class="fb-sub">뜻: ${q.m.map(esc).join(', ')}</p>
    ${q.ex ? `<div class="ex"><p class="ex-en" lang="en">${markWord(q.ex, [q.w, ...q.alt], true)}</p><p class="ex-ko">${esc(q.exko)}</p>${spkBtn(q.ex, '예문 듣기', 'en')}</div>` : ''}
    <div>${favBtn(q.key)}</div>`;
}
function checkEW(val, skip) {
  const r = R.ew,
    q = r.qs[r.i];
  if (r.answered) return;
  const e2k = S.ew.dir === 'e2k';
  const given = (val || '').trim();
  if (!skip && !given) return;
  gradeEW(q, !skip && (e2k ? meaningOk(given, q.m) : [q.w, ...q.alt].some(x => enNorm(x) === enNorm(given))), given, skip);
}
function gradeEW(q, ok, given, skip) {
  const typed = S.set.wans !== 'choice';
  finish('ew', q, ok, given, resultBody(ok, skip, given, wordInfoEN(q)), typed && !ok && !skip);
  const inp = document.getElementById('ans');
  if (inp) inp.dataset.state = ok ? 'ok' : 'ng';
  const rd = document.getElementById('rd');
  if (rd) rd.hidden = false;
  const p = document.getElementById('pat');
  if (p) p.innerHTML = patHTML(q.w, 'full');
  if (!typed) document.getElementById('zone').innerHTML = optsHTML(R.ew);
  if (S.set.autoSpeak) speak(q.w, 'en');
  if (ok && S.set.autoNext) advT = setTimeout(() => next('ew'), q.ex ? 2600 : 1500);
}
