'use strict';
/* ---------- dictation ---------- */
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PART = { は: '(?:は|わ)', へ: '(?:へ|え)', を: '(?:を|お)', では: '(?:では|でわ)', には: '(?:には|にわ)' };
function showDict(mod, q, card, zone, r, focus) {
  const ja = mod === 'jd';
  const fresh = !r.started;
  r.started = true;
  card.innerHTML = `<span class="cat">${SCENES[q.sc] || ''} · 받아쓰기</span><button type="button" class="qbtn" data-act="reveal" aria-expanded="${!!(r.revealed || r.answered)}" aria-label="뜻 보기">?</button>${playBox(`<p class="cap" id="rd" ${r.revealed || r.answered ? '' : 'hidden'}>뜻: ${esc(q.k)}</p>`)}<p class="cap">${ja ? '들은 문장을 가나로 쓰세요' : '들은 문장을 영어로 쓰세요'} · ? 를 누르면 뜻</p>`;
  if (ja && S.kana.input === 'pad') {
    padMax = 60;
    if (zone.dataset.type !== 'pad-h') {
      zone.dataset.type = 'pad-h';
      zone.innerHTML = padHTML('h');
    }
    if (!r.answered) padVal = '';
    renderPad(r.answered ? (r.lastOk ? 'ok' : 'ng') : '');
  } else {
    answerForm(
      zone,
      'dict-' + mod,
      ja ? 'lang="ja" placeholder="일본어로 입력"' : 'lang="en" placeholder="들은 문장을 입력"',
      mod,
      ja ? 'ja' : ''
    );
    prepInput(zone, r, focus);
  }
  if (fresh && !r.answered) speak(sentText(mod, q), ja ? 'ja' : 'en');
}
function checkDict(mod, val, skip) {
  const r = R[mod],
    q = r.qs[r.i];
  if (r.answered) return;
  const given = (val || '').trim();
  if (!skip && !given) return;
  const ja = mod === 'jd';
  let ok = false,
    diff = '';
  if (ja) {
    const toks = q.a[1]
      .split(' ')
      .map(t => toHira(stripAll(t)))
      .filter(Boolean);
    const re = new RegExp('^' + toks.map(t => PART[t] || reEsc(t)).join('') + '$');
    const u = toHira(stripAll(given));
    ok = !skip && re.test(u);
    if (!ok && !skip) {
      const tgt = [...toks.join('')],
        uc = [...u];
      const { inA, inB } = lcsMark(uc, tgt);
      diff = `<p class="fb-sub diff">내 답: <span class="jp" style="font-size:17px;color:var(--ink)">${uc.map((c, i) => (inA[i] ? esc(c) : `<span class="bad">${esc(c)}</span>`)).join('')}</span></p><p class="fb-sub diff">빠진 글자: <span class="jp" style="font-size:17px;color:var(--ink)">${tgt.map((c, i) => (inB[i] ? esc(c) : `<span class="miss">${esc(c)}</span>`)).join('')}</span></p>`;
    }
  } else {
    const u = enWords(given),
      t = enWords(q.a);
    ok = !skip && u.join(' ') === t.join(' ');
    if (!ok && !skip) {
      const { inA, inB } = lcsMark(u, t);
      diff = `<p class="fb-sub diff">내 답: <span style="color:var(--ink)">${u.map((w, i) => (inA[i] ? esc(w) : `<span class="bad">${esc(w)}</span>`)).join(' ')}</span></p><p class="fb-sub diff">정답과 비교: <span style="color:var(--ink)">${t.map((w, i) => (inB[i] ? esc(w) : `<span class="miss">${esc(w)}</span>`)).join(' ')}</span></p>`;
    }
  }
  const body = `<div class="fb-head"><span class="badge">${ok ? '〇' : '×'}</span>${ok ? '정답' : skip ? '정답 확인' : '오답'}</div>${diff}${sentFeedback(mod, q)}`;
  finish(mod, q, ok, given, body, !ok && !skip);
  const inp = document.getElementById('ans');
  if (inp) inp.dataset.state = ok ? 'ok' : 'ng';
  renderPad(ok ? 'ok' : 'ng');
  const rd = document.getElementById('rd');
  if (rd) rd.hidden = false;
}

/* ---------- numbers ---------- */
function showNum(mod, q, card, zone, r, focus) {
  const ja = mod === 'jn';
  const fresh = !r.started;
  r.started = true;
  const L = { price: '가격', time: '시간', number: '숫자' };
  const ph = q.type === 'time' ? '예: 6시 30분 → 630' : q.type === 'price' && !ja ? '예: 12.99' : '숫자만 입력';
  card.innerHTML = `<span class="cat">${L[q.type]} 듣기</span>${playBox(r.answered ? `<p class="ko ${ja ? '' : 'en'}" ${ja ? 'lang="ja" style="font-family:var(--f-jp);font-weight:500"' : 'lang="en"'}>${esc(q.show)}</p>` : '')}<p class="cap">들은 ${L[q.type]}을 숫자로 쓰세요</p>`;
  answerForm(
    zone,
    'num-' + q.type + (q.type === 'price' && !ja ? 'd' : ''),
    `inputmode="${q.type === 'price' && !ja ? 'decimal' : 'numeric'}" placeholder="${ph}"`,
    mod,
    'roman'
  );
  prepInput(zone, r, focus);
  if (fresh && !r.answered) speak(q.say, ja ? 'ja' : 'en');
}
function checkNumQ(mod, val, skip) {
  const r = R[mod],
    q = r.qs[r.i];
  if (r.answered) return;
  const res = skip ? false : checkNum(q, val);
  if (res === null) return;
  const ja = mod === 'jn';
  const info = `<p class="fb-big ${ja ? '' : 'en'}" ${ja ? 'lang="ja"' : 'lang="en"'}>${esc(q.show)}</p><p class="fb-sub ${ja ? '' : 'en'}" ${ja ? 'lang="ja" style="font-family:var(--f-jp);font-size:16px"' : ''}>${esc(q.read)}</p>${ja ? `<p class="fb-sub mono">${esc(romaji(q.read))}</p>` : ''}<div>${spkBtn(q.say, '다시 듣기', ja ? 'ja' : 'en')}</div>`;
  finish(mod, q, res, (val || '').trim(), resultBody(res, skip, (val || '').trim(), info));
  const inp = document.getElementById('ans');
  if (inp) inp.dataset.state = res ? 'ok' : 'ng';
  showNum(mod, q, document.getElementById('card'), document.getElementById('zone'), r, false);
}

const CHECK = {
  kana: checkKana,
  word: checkWord,
  ew: checkEW,
  jb: (v, s) => checkBuild('jb', s),
  eb: (v, s) => checkBuild('eb', s),
  jd: (v, s) => checkDict('jd', v, s),
  ed: (v, s) => checkDict('ed', v, s),
  jn: (v, s) => checkNumQ('jn', v, s),
  enn: (v, s) => checkNumQ('enn', v, s),
  loan: (v, s) => checkLoan(-1, s),
  conj: (v, s) => checkConj(-1, s),
  kanji: (v, s) => genericChoice('kanji', -1, s),
  part: (v, s) => genericChoice('part', -1, s),
  gram: (v, s) => genericChoice('gram', -1, s),
  irr: (v, s) => genericChoice('irr', -1, s),
  mp: (v, s) => genericChoice('mp', -1, s),
  cnt: (v, s) => genericChoice('cnt', -1, s),
  pol: (v, s) => genericChoice('pol', -1, s),
  jlen: (v, s) => genericChoice('jlen', -1, s)
};
