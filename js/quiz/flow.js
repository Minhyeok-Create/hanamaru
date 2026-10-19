'use strict';
/* ---------- generic 4-choice helpers ---------- */
const INFO = {},
  SPEAKQ = {},
  AUTO = { kanji: 1600, part: 1800, gram: 0, irr: 1600, mp: 0 };
function genericChoice(mod, i, skip) {
  const r = R[mod],
    q = r.qs[r.i];
  if (r.answered) return;
  if (!skip) r.chosen = i;
  const ok = !skip && r.order[i].ok;
  finish(mod, q, ok, skip ? '' : r.order[i].t, resultBody(ok, skip, '', INFO[mod](q)));
  document.getElementById('zone').innerHTML = optsHTML(r);
  const sp = SPEAKQ[mod] && SPEAKQ[mod](q);
  if (S.set.autoSpeak && sp) speak(sp[0], sp[1]);
  if (ok && S.set.autoNext && AUTO[mod]) advT = setTimeout(() => next(mod), AUTO[mod]);
}

/* ---------- shared flow ---------- */
function reportText(mod, q, given) {
  let p = '',
    a = '';
  if (mod === 'kana') {
    p = q.ch;
    a = q.alts[0];
  } else if (mod === 'kconf') {
    p = q.ch;
    a = kanaRom(q.ch);
  } else if (mod === 'word') {
    p = `${q.w} (${q.r})`;
    a = q.m.join(', ');
  } else if (mod === 'ew') {
    p = q.w;
    a = q.m.join(', ');
  } else if (mod === 'loan') {
    p = q.k;
    a = q.en;
  } else if (mod === 'conj') {
    p = `${q.v.w} → ${FORM_SHORT[q.form]}`;
    a = q.right.w;
  } else if (NUMS.has(mod)) {
    p = q.say;
    a = q.show;
  } else if (LABELS[mod] || ['kanji', 'irr', 'mp', 'part', 'cnt', 'pol', 'jlen'].includes(mod)) {
    [p, a] = itemLabel(mod, q);
  } else {
    p = q.k;
    a = modLang(mod) === 'ja' ? q.a[0] : q.a;
  }
  return `[하나마루 문제 신고]\n종류: ${MODE_LABEL[mod]}\n문제: ${p}\n정답: ${a}\n내 답: ${given || '-'}\n이상한 점: `;
}
function finish(mod, q, ok, given, body, canOverride) {
  const r = R[mod];
  const prev = record(q.key, ok);
  setTimeout(() => onAnswer(ok), 0);
  r.answered = true;
  r.lastOk = ok;
  r.mark = ok ? 'ok' : 'ng';
  r.res.push({ q, ok, given, prev });
  const last = r.i === r.qs.length - 1;
  r.fb = `<div class="fb-box ${ok ? 'ok' : 'ng'}">${body}</div><div class="fb-actions">${canOverride ? `<button type="button" class="btn" data-act="override">맞은 걸로 처리</button>` : ''}<button type="button" class="btn primary" data-act="next">${last ? '결과 보기' : '다음 문제'}</button></div><div class="fb-more"><button type="button" class="link" data-act="report">문제가 이상해요</button></div>`;
  document.getElementById('card').dataset.mark = r.mark;
  document.getElementById('fb').innerHTML = r.fb;
  updateProg(mod);
}
function override(mod) {
  const r = R[mod];
  const last = r.res[r.res.length - 1];
  if (!last || last.ok) return;
  forceCorrect(last.q.key, last.prev);
  last.ok = true;
  r.lastOk = true;
  r.mark = 'ok';
  r.fb = r.fb
    .replace('fb-box ng', 'fb-box ok')
    .replace(/<span class="badge">×<\/span>오답/, '<span class="badge">〇</span>정답으로 바꿨어요')
    .replace(/<button type="button" class="btn" data-act="override">.*?<\/button>/, '');
  document.getElementById('card').dataset.mark = 'ok';
  document.getElementById('fb').innerHTML = r.fb;
  const inp = document.getElementById('ans');
  if (inp) inp.dataset.state = 'ok';
  if (BUILD.has(mod)) showBuild(mod, last.q, document.getElementById('card'), document.getElementById('zone'), r);
  else renderPad('ok');
  updateProg(mod);
}
function next(mod) {
  clearAdv();
  const r = R[mod];
  if (!r || !r.answered) return;
  r.i++;
  r.answered = false;
  r.fb = '';
  r.mark = '';
  r.revealed = false;
  r.chosen = null;
  r.order = null;
  r.bank = null;
  r.built = null;
  r.ans = null;
  r.started = false;
  if (r.i >= r.qs.length) r.done = true;
  if (activeMod() === mod) showQ(mod, true);
}
function formEnter(mod) {
  const r = R[mod];
  const inp = document.getElementById('ans');
  if (r.answered) {
    next(mod);
    return;
  }
  CHECK[mod](inp.value);
}
function stageClick(mod, e) {
  const b = e.target.closest('button');
  if (!b || b.dataset.speak) return;
  const act = b.dataset.act;
  const r = R[mod];
  const q = r && !r.done && r.qs[r.i];
  const card = () => document.getElementById('card'),
    zone = () => document.getElementById('zone');
  if (act === 'next') next(mod);
  else if (act === 'skip') {
    if (r.answered) next(mod);
    else if (CHECK[mod]) CHECK[mod]('', true);
  } else if (act === 'override') override(mod);
  else if (act === 'report') {
    const txt = reportText(mod, q, r.res[r.res.length - 1]?.given);
    copyText(txt, '신고 내용을 복사했어요. 카톡으로 앱 만든 사람에게 보내 주세요.', () => {
      const fb = document.getElementById('fb');
      if (fb && !fb.querySelector('#rpt')) {
        fb.insertAdjacentHTML(
          'beforeend',
          `<textarea id="rpt" style="width:100%;min-height:110px;font-size:16px;border:1px solid var(--line);border-radius:10px;padding:10px;background:var(--paper);color:var(--ink)" readonly>${esc(txt)}</textarea><p class="note">위 내용을 길게 눌러 복사한 뒤 보내 주세요.</p>`
        );
        const t = fb.querySelector('#rpt');
        t.focus();
        t.select();
      }
    });
  } else if (act === 'fav') {
    const k = b.dataset.key;
    if (S.fav[k]) delete S.fav[k];
    else S.fav[k] = 1;
    save();
    const on = !!S.fav[k];
    b.setAttribute('aria-pressed', on);
    b.textContent = on ? '★ 즐겨찾기됨' : '☆ 즐겨찾기';
    r.fb = document.getElementById('fb').innerHTML;
  } else if (act === 'reveal') {
    r.revealed = !r.revealed || r.answered;
    b.setAttribute('aria-expanded', r.revealed);
    if (mod === 'word' || mod === 'pol' || DICT.has(mod)) {
      document.getElementById('rd').hidden = !r.revealed;
    } else if (mod === 'ew') {
      document.getElementById('rd').hidden = !r.revealed;
      const p = document.getElementById('pat');
      if (p && !r.answered) p.innerHTML = patHTML(q.w, r.revealed ? 'hint' : '');
      if (r.revealed && S.ew.dir === 'e2k') speak(q.w, 'en');
    } else document.querySelectorAll('.opt .rd').forEach(x => (x.hidden = !r.revealed));
  } else if (act === 'play' || act === 'playslow') {
    if (q)
      speak(
        NUMS.has(mod) ? q.say : mod === 'mp' ? q.tg : mod === 'jlen' ? q['r' + q.tg] : sentText(mod, q),
        modLang(mod),
        act === 'playslow'
      );
  } else if (act === 'retry') {
    newRound(mod, uniqueMissed(mod));
    showQ(mod, false);
  } else if (act === 'again') {
    newRound(mod);
    showQ(mod, false);
  } else if (act === 'duecont') {
    S.filt[mod] = 'due';
    newRound(mod);
    showQ(mod, false);
  } else if (act === 'duenext') startDue(b.dataset.mod);
  else if (act === 'course') go('home');
  else if (act === 'recstart') recStart();
  else if (act === 'recstop') recStop();
  else if (act === 'recplay') recPlay();
  else if (act === 'shok' || act === 'shno') rateShadow(mod, act === 'shok');
  else if (act === 'bclear') {
    if (!r.answered) {
      r.built = [];
      showBuild(mod, q, card(), zone(), r);
    }
  } else if (act === 'bcheck') checkBuild(mod, false);
  else if (b.dataset.b !== undefined) {
    if (!r.answered) {
      const id = +b.dataset.b;
      if (!r.built.includes(id)) r.built.push(id);
      showBuild(mod, q, card(), zone(), r);
    }
  } else if (b.dataset.u !== undefined) {
    if (!r.answered) {
      r.built.splice(+b.dataset.u, 1);
      showBuild(mod, q, card(), zone(), r);
    }
  } else if (b.dataset.wopt !== undefined) {
    if (r.answered) return;
    const i = +b.dataset.wopt;
    if (mod === 'loan') checkLoan(i);
    else if (mod === 'conj') checkConj(i);
    else if (INFO[mod]) genericChoice(mod, i);
    else {
      r.chosen = i;
      const ok = r.order[i].ok;
      if (mod === 'word') gradeWord(q, ok, '', false);
      else gradeEW(q, ok, '', false);
    }
  } else if (b.dataset.opt !== undefined) {
    if (r.answered) return;
    if (mod === 'kconf') checkConf(+b.dataset.opt);
    else checkChoice(mod, +b.dataset.opt);
  } else if (b.classList.contains('k') || b.closest('.pad-fn')) padKey(mod, b);
}
function uniqueMissed(mod) {
  const seen = new Set();
  return R[mod].res
    .filter(x => !x.ok)
    .map(x => x.q)
    .filter(q => NUMS.has(mod) || (!seen.has(q.key) && seen.add(q.key)));
}
function summary(mod) {
  const r = R[mod];
  const st = document.getElementById('stage');
  if (r.course && !r.course.marked) {
    r.course.marked = true;
    courseMark(r.course);
  }
  const n = r.res.length,
    c = r.res.filter(x => x.ok).length,
    pct = n ? Math.round((c / n) * 100) : 0;
  const missed = r.res.filter(x => !x.ok);
  if (pct === 100 && n >= 5 && !r.perfectSent) {
    r.perfectSent = true;
    missionEvent('perfect');
  }
  const msg =
    pct === 100
      ? '전부 맞혔어요. 하나마루!'
      : pct >= 80
        ? '잘했어요. 틀린 것만 한 번 더 보면 확실해져요.'
        : pct >= 50
          ? '절반 넘게 맞혔어요. 틀린 문제를 다시 풀어 보세요.'
          : '처음엔 다 어려워요. 틀린 것부터 천천히 다시 해 봐요.';
  const item = x => {
    const q = x.q;
    if (mod === 'kana' || mod === 'kconf')
      return `<li><span class="jp" lang="ja">${q.ch}</span><span class="mono">${kanaRom(q.ch)}</span>${x.given ? `<span class="s given">입력 <s>${esc(x.given)}</s></span>` : ''}</li>`;
    if (mod === 'word')
      return `<li><span class="jp" lang="ja">${esc(q.w)}</span><span class="s" lang="ja">${q.w !== q.r ? esc(q.r) + ' · ' : ''}${esc(q.m[0])}</span></li>`;
    if (mod === 'ew')
      return `<li><span class="en" lang="en" style="font-size:19px;font-weight:600">${esc(q.w)}</span><span class="s">${esc(q.m.join(', '))}</span></li>`;
    if (mod === 'loan') return `<li><span class="jp" lang="ja">${q.k}</span><span class="s">${esc(q.en)} · ${esc(q.ko)}</span></li>`;
    if (mod === 'conj')
      return `<li><span class="jp" lang="ja">${esc(q.v.w)}</span><span class="s">${FORM_SHORT[q.form]} → <span class="jp" lang="ja">${esc(q.right.w)}</span></span></li>`;
    if (LABELS[mod] || ['kanji', 'irr', 'mp', 'part', 'cnt', 'pol', 'jlen'].includes(mod)) {
      const [a, b2] = itemLabel(mod, q);
      return `<li><span class="${['kanji', 'cnt', 'pol', 'jlen'].includes(mod) ? 'jp' : mod === 'part' ? '' : 'en'}" style="font-size:18px">${esc(a)}</span><span class="s ${mod === 'cnt' || mod === 'pol' ? 'jp' : ''}">${esc(b2)}</span></li>`;
    }
    if (NUMS.has(mod))
      return `<li><span class="${mod === 'jn' ? 'jp' : 'en'}">${esc(q.show)}</span><span class="s">${esc(q.read)}</span>${x.given ? `<span class="s given">입력 <s>${esc(x.given)}</s></span>` : ''}</li>`;
    if (modLang(mod) === 'en')
      return `<li style="display:grid;gap:2px"><span>${esc(q.k)}</span><span class="en" lang="en" style="font-size:17px">${esc(q.a)}</span></li>`;
    return `<li style="display:grid;gap:2px"><span>${esc(q.k)}</span><span class="jp" lang="ja" style="font-size:17px">${q.a[0]}</span></li>`;
  };
  let dueRow = '';
  if (r.due) {
    const left = dueCount(mod);
    const nx = dueList().find(([m]) => m !== mod);
    dueRow = left
      ? `<button class="btn primary" data-act="duecont">이어서 복습 ${left}개</button>`
      : nx
        ? `<button class="btn primary" data-act="duenext" data-mod="${nx[0]}">다음 복습: ${DUE_LABEL[nx[0]]} ${nx[1]}개</button>`
        : `<p class="sum-msg" style="color:var(--ok);font-weight:600">오늘 복습을 모두 끝냈어요!</p>`;
  }
  st.innerHTML = `<div class="sum">
    <div class="sum-score">${pct >= 80 ? `<svg viewBox="0 0 200 200" aria-hidden="true"><path pathLength="1" d="M108 18C162 16 190 60 184 108 178 156 134 186 92 182 44 178 14 142 18 96 22 52 60 24 106 26M110 64c24 2 38 20 36 42-2 22-22 38-44 36-20-2-34-20-32-40 2-18 18-30 36-28 16 2 26 14 24 28"/></svg>` : ''}<b class="num">${c}</b><span class="num">/ ${n}</span></div>
    <p class="sum-msg">${msg}</p>
    ${dueRow ? `<div class="row">${dueRow}</div>` : ''}
    ${r.course ? `<div class="row"><button class="btn primary" data-act="course">코스로 돌아가기</button></div>` : ''}
    ${missed.length ? `<div><p class="lbl" style="margin:0 0 6px">틀린 문제</p><ul class="miss">${missed.map(item).join('')}</ul></div>` : ''}
    <div class="row">${missed.length ? `<button class="btn ${dueRow ? '' : 'primary'}" data-act="retry">틀린 ${uniqueMissed(mod).length}개 다시</button>` : ''}<button class="btn ${missed.length || dueRow ? '' : 'primary'}" data-act="again">새 라운드</button></div>
  </div>`;
  st.onclick = e => stageClick(mod, e);
  updateProg(mod);
  document.getElementById('ptext').textContent = '완료';
}
