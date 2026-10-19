'use strict';
/* ---------- kana ---------- */
function acceptFor(q) {
  const conv = q.sc === 'h' ? x => x : toKata;
  return KANA.filter(x => x.prompt === q.prompt || x.alts[0] === q.prompt).map(x => conv(x.h));
}
function showKana(mod, q, card, zone, r, focus) {
  const k2r = S.kana.dir === 'k2r';
  const scName = q.sc === 'h' ? '히라가나' : '가타카나';
  card.innerHTML =
    (k2r
      ? `<div class="tz"><span class="glyph ${q.ch.length > 1 ? 'two' : ''}" lang="ja">${q.ch}</span></div><p class="cap">${scName} · 발음을 알파벳으로 입력</p>`
      : `<div class="tz"><span class="roma">${q.prompt}</span></div><p class="cap">${scName}로 써 보세요</p>`) + MARKS;
  padMax = 4;
  if (k2r || S.kana.input === 'sys') {
    answerForm(
      zone,
      k2r ? 'roman' : 'ja',
      k2r ? 'lang="en" inputmode="email" placeholder="예: ka, shi"' : 'lang="ja" placeholder="일본어 키보드로 입력"',
      'kana',
      k2r ? 'roman' : 'ja'
    );
    prepInput(zone, r, focus);
  } else {
    const type = 'pad-' + q.sc;
    if (zone.dataset.type !== type) {
      zone.dataset.type = type;
      zone.innerHTML = padHTML(q.sc);
    }
    if (!r.answered) padVal = '';
    renderPad(r.answered ? (r.lastOk ? 'ok' : 'ng') : '');
  }
}
function checkKana(val, skip) {
  const r = R.kana,
    q = r.qs[r.i];
  if (r.answered) return;
  const k2r = S.kana.dir === 'k2r';
  let ok = false,
    hint = '';
  const given = (val || '').trim();
  if (!skip) {
    if (k2r) {
      const v = given.toLowerCase().replace(/[\s']/g, '');
      if (!v) return;
      ok = q.alts.includes(v);
    } else {
      const v = given.replace(/\s/g, '').normalize('NFC');
      if (!v) return;
      const acc = acceptFor(q);
      ok = acc.includes(v);
      if (!ok) {
        const o = q.sc === 'h' ? toHira(v) : toKata(v);
        if (o !== v && acc.includes(o))
          hint = q.sc === 'h' ? '가타카나로 썼어요. 히라가나로 써야 해요.' : '히라가나로 썼어요. 가타카나로 써야 해요.';
      }
    }
  }
  const other = q.sc === 'h' ? toKata(q.h) : q.h;
  const ans = k2r ? `<span class="mono">${q.alts.join(' / ')}</span>` : `<span class="jp" lang="ja">${q.ch}</span>`;
  const extra = `<div class="fb-line"><span class="jp" lang="ja">${q.ch}</span><span class="mono">${q.alts[0]}</span><span class="fb-sub">${q.sc === 'h' ? '가타카나' : '히라가나'} <span class="jp" lang="ja">${other}</span></span>${spkBtn(q.ch)}</div>`;
  const body = ok
    ? `<div class="fb-head"><span class="badge">〇</span>정답</div>${extra}${!k2r && given !== q.ch ? `<p class="fb-sub">같은 소리 글자 ${esc(given)}도 정답으로 처리했어요.</p>` : ''}`
    : `<div class="fb-head"><span class="badge">×</span>${skip ? '정답 확인' : '오답'} · 정답은 ${ans}</div>${given && !skip ? `<p class="fb-sub given">입력: <s>${esc(given)}</s></p>` : ''}${hint ? `<p class="fb-sub">${hint}</p>` : ''}${extra}`;
  finish('kana', q, ok, given, body);
  const inp = document.getElementById('ans');
  if (inp) inp.dataset.state = ok ? 'ok' : 'ng';
  renderPad(ok ? 'ok' : 'ng');
  if (S.set.autoSpeak) speak(q.ch);
  if (ok && S.set.autoNext) advT = setTimeout(() => next('kana'), 900);
}

/* ---------- confusable kana ---------- */
function showConf(mod, q, card, zone, r) {
  const g = CONF[q.gi];
  const scName = q.sc === 'h' ? '히라가나' : '가타카나';
  if (!r.order) r.order = shuffle(g[1]);
  card.innerHTML =
    (q.dir === 'g2r'
      ? `<div class="tz"><span class="glyph" lang="ja">${q.ch}</span></div><p class="cap">이 글자의 발음을 고르세요</p>`
      : `<div class="tz"><span class="roma">${kanaRom(q.ch)}</span></div><p class="cap">이 소리의 ${scName}를 고르세요</p>`) + MARKS;
  zone.dataset.type = 'conf';
  zone.innerHTML = `<div class="opts grid2">${r.order
    .map((c, i) => {
      const st = r.answered ? (c === q.ch ? 'ok' : i === r.chosen ? 'ng' : 'dim') : '';
      return `<button type="button" class="opt" data-opt="${i}" ${st ? `data-state="${st}"` : ''}>${q.dir === 'g2r' ? `<span class="mono-opt">${kanaRom(c)}</span>` : `<span class="glyph-opt" lang="ja">${c}</span>`}${r.answered ? `<span class="tr ${q.dir === 'g2r' ? 'jp' : 'mono'}">${q.dir === 'g2r' ? c : kanaRom(c)}</span>` : ''}</button>`;
    })
    .join('')}</div>`;
}
function checkConf(i) {
  const r = R.kconf,
    q = r.qs[r.i];
  if (r.answered) return;
  r.chosen = i;
  const ok = r.order[i] === q.ch;
  const g = CONF[q.gi];
  const body = `<div class="fb-head"><span class="badge">${ok ? '〇' : '×'}</span>${ok ? '정답' : '오답'}</div><div class="conf">${g[1].map(c => `<span><b lang="ja">${c}</b><small>${kanaRom(c)}</small></span>`).join('')}</div><p class="fb-sub">${esc(g[2])}</p><div>${spkBtn(q.ch)}</div>`;
  finish('kconf', q, ok, r.order[i], body);
  showConf('kconf', q, document.getElementById('card'), document.getElementById('zone'), r);
  if (S.set.autoSpeak) speak(q.ch);
  if (ok && S.set.autoNext) advT = setTimeout(() => next('kconf'), 1100);
}
