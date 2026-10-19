'use strict';
/* ---------- sentence choice & listening ---------- */
function choiceItems(mod, q) {
  if (mod === 'sent') return [{ t: q.a[0], rd: q.a[1], ko: q.k, ok: true }, ...q.d.map(d => ({ t: d[0], rd: d[1], ko: d[2], ok: false }))];
  if (mod === 'jl') return [{ t: q.k, ko: q.a[0], ok: true }, ...q.d.map(d => ({ t: d[2], ko: d[0], ok: false }))];
  if (mod === 'es') return [{ t: q.a, ko: q.k, ok: true }, ...q.d.map(d => ({ t: d[0], ko: d[1], ok: false }))];
  return [{ t: q.k, ko: q.a, ok: true }, ...q.d.map(d => ({ t: d[1], ko: d[0], ok: false }))];
}
const sentText = (mod, q) => (modLang(mod) === 'ja' ? q.a[0] : q.a);
const playBox = extra =>
  `<div class="listen"><button type="button" class="play" data-act="play" aria-label="문장 듣기">${PLAY_ICON}</button><button type="button" class="spk" data-act="playslow">${SPK_ICON}천천히 듣기</button></div>${extra || ''}`;
function showChoice(mod, q, card, zone, r) {
  const fresh = !r.order;
  if (fresh) r.order = shuffle(choiceItems(mod, q));
  const open = r.revealed || r.answered;
  const lang = modLang(mod);
  if (mod === 'sent')
    card.innerHTML = `<span class="cat">${SCENES[q.sc] || ''} · 한국어 → 일본어</span>${S.set.kanji ? `<button type="button" class="qbtn" data-act="reveal" aria-expanded="${!!open}" aria-label="보기 읽는 법">?</button>` : ''}<p class="ko">${esc(q.k)}</p><p class="cap">알맞은 일본어를 고르세요</p>`;
  else if (mod === 'es')
    card.innerHTML = `<span class="cat">${SCENES[q.sc] || ''} · 한국어 → 영어</span><p class="ko">${esc(q.k)}</p><p class="cap">알맞은 영어 문장을 고르세요</p>`;
  else
    card.innerHTML = `<span class="cat">${SCENES[q.sc] || ''} · 듣기</span>${playBox(r.answered ? (lang === 'ja' ? `<p class="ko" lang="ja" style="font-family:var(--f-jp);font-weight:500">${q.a[0]}</p>` : `<p class="ko en" lang="en">${esc(q.a)}</p>`) : '')}<p class="cap">들은 문장의 뜻을 고르세요</p>`;
  zone.dataset.type = mod;
  zone.innerHTML = `<div class="opts">${r.order
    .map((o, i) => {
      const st = r.answered ? (o.ok ? 'ok' : i === r.chosen ? 'ng' : 'dim') : '';
      const hid = r.answered ? '' : 'hidden';
      let main,
        sub = '',
        tr;
      if (mod === 'sent') {
        main = `<span class="jp" lang="ja">${S.set.kanji ? o.t : o.rd}</span>`;
        if (S.set.kanji) sub = `<span class="rd" lang="ja" ${open ? '' : 'hidden'}>${o.rd}</span>`;
        tr = `<span class="tr" ${hid}>${esc(o.ko)}</span>`;
      } else if (mod === 'es') {
        main = `<span class="en" lang="en">${esc(o.t)}</span>`;
        tr = `<span class="tr" ${hid}>${esc(o.ko)}</span>`;
      } else {
        main = `<span class="ko-opt">${esc(o.t)}</span>`;
        tr =
          lang === 'ja'
            ? `<span class="tr jp" lang="ja" ${hid}>${esc(o.ko)}</span>`
            : `<span class="tr en" lang="en" ${hid}>${esc(o.ko)}</span>`;
      }
      return `<button type="button" class="opt" data-opt="${i}" ${st ? `data-state="${st}"` : ''} ${r.answered ? 'aria-disabled="true"' : ''}><span class="n">${i + 1}</span>${main}${sub}${tr}</button>`;
    })
    .join('')}</div>`;
  if (LISTEN.has(mod) && fresh && !r.answered) speak(sentText(mod, q), lang);
}
function sentFeedback(mod, q) {
  return modLang(mod) === 'ja'
    ? `<p class="fb-big" lang="ja">${q.a[0]}</p><p class="fb-sub" lang="ja" style="font-family:var(--f-jp);font-size:16px">${q.a[1]}</p><p class="fb-sub mono">${esc(romaji(q.a[1]))}</p><p class="fb-sub">${esc(q.k)}</p><div>${spkBtn(q.a[0], '문장 듣기')}</div>`
    : `<p class="fb-big en" lang="en">${esc(q.a)}</p><p class="fb-sub">${esc(q.k)}</p><div>${spkBtn(q.a, '문장 듣기', 'en')}</div>`;
}
function checkChoice(mod, i) {
  const r = R[mod],
    q = r.qs[r.i];
  if (r.answered) return;
  const o = r.order[i];
  r.chosen = i;
  const ok = o.ok;
  finish(
    mod,
    q,
    ok,
    o.t,
    `<div class="fb-head"><span class="badge">${ok ? '〇' : '×'}</span>${ok ? '정답' : '오답'}</div>${sentFeedback(mod, q)}`
  );
  showChoice(mod, q, document.getElementById('card'), document.getElementById('zone'), r);
  if (S.set.autoSpeak) speak(sentText(mod, q), modLang(mod));
}

/* ---------- sentence building ---------- */
function buildTokens(mod, s) {
  if (mod === 'jb') {
    const tk = s.t.split(' '),
      rk = s.a[1].split(' ');
    return tk.map((k, i) => ({ k: stripP(k), r: stripP(rk[i] || k) })).filter(x => x.k);
  }
  return s.a
    .split(' ')
    .map(w => ({ k: stripP(w), r: stripP(w) }))
    .filter(x => x.k);
}
function decoyFor(mod, q, ans) {
  const pool = mod === 'jb' ? SENTS : EN_SENTS;
  const used = new Set(ans.map(x => x.k.toLowerCase()));
  for (let tries = 0; tries < 40; tries++) {
    const s = pool[(Math.random() * pool.length) | 0];
    if (s.k === q.k) continue;
    const toks = buildTokens(mod, s).filter(x => !used.has(x.k.toLowerCase()) && [...x.k].length > 1);
    if (toks.length) return toks[(Math.random() * toks.length) | 0];
  }
  return null;
}
function showBuild(mod, q, card, zone, r) {
  const jp = mod === 'jb';
  if (!r.bank) {
    const ans = buildTokens(mod, q);
    r.ans = ans;
    const dec = decoyFor(mod, q, ans);
    r.bank = shuffle([...ans, ...(dec ? [dec] : [])].map((x, i) => ({ ...x, id: i })));
    r.built = [];
  }
  const disp = x => (jp && !S.set.kanji ? x.r : x.k);
  const cls = jp ? 'jp' : 'en',
    lg = jp ? 'ja' : 'en';
  card.innerHTML = `<span class="cat">${SCENES[q.sc] || ''} · 문장 조립</span><p class="ko">${esc(q.k)}</p><p class="cap">블록을 순서대로 눌러 ${jp ? '일본어' : '영어'} 문장을 만드세요</p>`;
  zone.dataset.type = 'build';
  const st = r.answered ? (r.lastOk ? 'ok' : 'ng') : '';
  const byId = id => r.bank.find(b => b.id === id);
  zone.innerHTML = `<div class="build"><div class="build-line" id="bline" ${st ? `data-state="${st}"` : ''}>${r.built.map((id, pos) => `<button type="button" class="blk ${cls}" data-u="${pos}" lang="${lg}">${esc(disp(byId(id)))}</button>`).join('')}</div><div class="bank">${r.bank.map(x => `<button type="button" class="blk ${cls}${r.built.includes(x.id) ? ' used' : ''}" data-b="${x.id}" lang="${lg}">${esc(disp(x))}</button>`).join('')}</div>
    ${r.answered ? '' : `<div class="row"><button type="button" class="btn" data-act="bclear">다시 놓기</button><button type="button" class="btn primary" data-act="bcheck">확인</button></div>`}
    <div class="sub-actions"><button type="button" class="btn quiet" data-act="skip">${r.answered ? '다음' : '모르겠어요'}</button></div></div>`;
}
function checkBuild(mod, skip) {
  const r = R[mod],
    q = r.qs[r.i];
  if (r.answered) return;
  if (!skip && !r.built.length) return;
  const jp = mod === 'jb';
  const byId = id => r.bank.find(b => b.id === id);
  const got = r.built.map(byId);
  const ok = !skip && got.length === r.ans.length && got.every((x, i) => x.k.toLowerCase() === r.ans[i].k.toLowerCase());
  const shown = got.map(x => (jp && !S.set.kanji ? x.r : x.k)).join(jp ? '' : ' ');
  const body = `<div class="fb-head"><span class="badge">${ok ? '〇' : '×'}</span>${ok ? '정답' : skip ? '정답 확인' : '오답'}</div>${!ok && !skip ? `<p class="fb-sub given">만든 문장: <s>${esc(shown)}</s></p>` : ''}${sentFeedback(mod, q)}`;
  finish(mod, q, ok, shown, body, !ok && !skip);
  showBuild(mod, q, document.getElementById('card'), document.getElementById('zone'), r);
  if (S.set.autoSpeak) speak(sentText(mod, q), modLang(mod));
}
