'use strict';
/* ---------- friend challenge ---------- */
const VS_TYPES = {
  ja: [
    ['jw', '단어'],
    ['js', '문장'],
    ['jk', '문자']
  ],
  en: [
    ['ew', '단어'],
    ['es', '문장']
  ]
};
const VS_NAME = { jw: '일본어 단어', js: '일본어 문장', jk: '일본어 문자', ew: '영단어', es: '영어 문장' };
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function sShuffle(arr, R) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (R() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function vsQuestions(t, seed) {
  const R = rng(seed);
  const qs = [];
  if (t === 'jw' || t === 'ew') {
    const src = t === 'jw' ? BASE_JP_N5 : BASE_EN;
    const picks = sShuffle(src, R).slice(0, 10);
    for (const w of picks) {
      const o = [{ t: w.m[0], ok: true }];
      for (const y of sShuffle(src, R)) {
        if (o.length >= 4) break;
        if (y !== w && !y.m.some(m => w.m.includes(m)) && !o.some(x => x.t === y.m[0])) o.push({ t: y.m[0], ok: false });
      }
      qs.push({
        key: w.key,
        show: t === 'jw' ? w.w : w.w,
        sub: t === 'jw' && w.w !== w.r ? w.r : '',
        cls: t === 'jw' ? 'jp' : 'en',
        ask: '뜻을 고르세요',
        opts: sShuffle(o, R),
        say: t === 'jw' ? w.r : w.w
      });
    }
  } else if (t === 'js' || t === 'es') {
    const src = t === 'js' ? SENTS : EN_SENTS;
    const picks = sShuffle(src, R).slice(0, 10);
    for (const s of picks) {
      const o =
        t === 'js'
          ? [{ t: s.a[0], ok: true }, ...s.d.map(d => ({ t: d[0], ok: false }))]
          : [{ t: s.a, ok: true }, ...s.d.map(d => ({ t: d[0], ok: false }))];
      qs.push({
        key: s.key,
        ko: s.k,
        ask: t === 'js' ? '알맞은 일본어를 고르세요' : '알맞은 영어를 고르세요',
        optCls: t === 'js' ? 'jp' : 'en',
        opts: sShuffle(o, R),
        say: t === 'js' ? s.a[0] : s.a
      });
    }
  } else {
    const pool = KANA.filter(x => x.set !== 'yoon');
    const picks = sShuffle(pool, R).slice(0, 10);
    for (const x of picks) {
      const kata = R() < 0.5;
      const ch = kata ? toKata(x.h) : x.h;
      const o = [{ t: x.alts[0], ok: true }];
      for (const y of sShuffle(pool, R)) {
        if (o.length >= 4) break;
        if (!o.some(z => z.t === y.alts[0])) o.push({ t: y.alts[0], ok: false });
      }
      qs.push({ key: 'k:' + ch, show: ch, cls: 'jp glyphish', ask: '발음을 고르세요', optCls: 'mono-opt', opts: sShuffle(o, R), say: ch });
    }
  }
  return qs;
}
const b64u = {
  enc: s => b64enc(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: s => b64dec(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4))
};
function vsLink(o) {
  const base = location.protocol === 'http:' || location.protocol === 'https:' ? location.href.split('#')[0] : '';
  return base + '#vs=' + b64u.enc(JSON.stringify(o));
}
function parseVS(h) {
  try {
    const m = /[#&]vs=([A-Za-z0-9_-]+)/.exec(h || '');
    if (!m) return null;
    const o = JSON.parse(b64u.dec(m[1]));
    if (!o || !VS_NAME[o.t] || typeof o.s !== 'number') return null;
    o.p = Math.max(0, Math.min(10, o.p | 0));
    o.n = String(o.n || '친구').slice(0, 12);
    if (o.o) {
      o.o.n = String(o.o.n || '친구').slice(0, 12);
      o.o.p = Math.max(0, Math.min(10, o.o.p | 0));
    }
    return o;
  } catch (e) {
    return null;
  }
}
let VS_IN = null,
  VSG = null;
function renderVS() {
  const pb = document.getElementById('pbody');
  const lang = S.lang;
  if (VSG && !VSG.done) return vsPlay();
  if (VSG && VSG.done) return vsResult();
  const types = VS_TYPES[lang];
  const sel = S.gbest.vsType && types.some(t => t[0] === S.gbest.vsType) ? S.gbest.vsType : types[0][0];
  const inv = VS_IN && VS_TYPES[lang].some(t => t[0] === VS_IN.t) ? VS_IN : null;
  pb.innerHTML = `<div class="chart">
    ${inv ? `<div class="vs-in"><span class="lbl">도전장이 왔어요</span><b>${esc(inv.n)}님이 ${VS_NAME[inv.t]} 10문제에서 <span class="num">${inv.p}</span>개 맞혔어요${inv.o ? ` (상대 ${esc(inv.o.n)}: ${inv.o.p}개)` : ''}</b><span class="note">같은 문제를 풀고 점수를 비교해 보세요.</span><button class="btn primary" data-vs="accept">도전 받기</button></div>` : ''}
    <section class="chart-box" style="display:grid;gap:12px"><h2 class="sec-title" style="margin:0">대결 만들기</h2>
      <p class="note">10문제를 먼저 풀고, 결과 링크를 친구에게 보내요. 친구가 링크를 열면 똑같은 문제가 나오고, 끝나면 점수를 비교해요.</p>
      <div class="chips">${types.map(([v, l]) => `<button class="chip" data-vst="${v}" aria-pressed="${v === sel}">${l}</button>`).join('')}</div>
      <label class="vs-name"><span class="note">내 이름 (친구에게 보여요)</span><input id="vsName" type="text" maxlength="12" placeholder="예: 민수" value="${esc(S.name || '')}" autocomplete="off"></label>
      <button class="btn primary" data-vs="new">대결 문제 풀기</button></section></div>`;
  pb.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    const nm = document.getElementById('vsName');
    if (nm) {
      S.name = nm.value.trim().slice(0, 12);
      save();
    }
    if (b.dataset.vst) {
      S.gbest.vsType = b.dataset.vst;
      save();
      renderVS();
    } else if (b.dataset.vs === 'new') {
      const seed = (Math.random() * 2 ** 31) >>> 0;
      VSG = { t: sel, s: seed, qs: vsQuestions(sel, seed), i: 0, score: 0, ans: null, res: [], inv: null, done: false };
      vsPlay();
    } else if (b.dataset.vs === 'accept') {
      VSG = { t: inv.t, s: inv.s, qs: vsQuestions(inv.t, inv.s), i: 0, score: 0, ans: null, res: [], inv, done: false };
      VS_IN = null;
      vsPlay();
    }
  };
}
function vsPlay() {
  const pb = document.getElementById('pbody');
  const q = VSG.qs[VSG.i];
  pb.innerHTML = `<div class="prog"><div class="prog-bar"><i style="width:${(VSG.i / 10) * 100}%"></i></div><span class="num">${VSG.i + 1} / 10</span><span class="score num"><span class="o">○ ${VSG.score}</span></span></div>
    <div class="card" id="card"><span class="cat">친구 대결 · ${VS_NAME[VSG.t]}${VSG.inv ? ` · vs ${esc(VSG.inv.n)}` : ''}</span>${q.ko ? `<p class="ko">${esc(q.ko)}</p>` : `<div class="tz wide"><span class="${q.cls.includes('glyphish') ? 'glyph' : 'word'} ${q.cls}" ${q.cls.includes('jp') ? 'lang="ja"' : 'lang="en"'} style="${q.cls.includes('glyphish') ? '' : `font-size:${q.cls.includes('jp') ? wordSize(q.show) : enSize(q.show)}px`}">${esc(q.show)}</span></div>${q.sub ? `<p class="cap jp" lang="ja">${esc(q.sub)}</p>` : ''}`}<p class="cap">${q.ask}</p>${MARKS}</div>
    <div class="opts" style="margin-top:12px">${q.opts
      .map((o, i) => {
        const st = VSG.ans === null ? '' : o.ok ? 'ok' : i === VSG.ans ? 'ng' : 'dim';
        return `<button type="button" class="opt" data-vo="${i}" ${st ? `data-state="${st}"` : ''}><span class="n">${i + 1}</span><span class="${q.optCls || ''}" ${q.optCls === 'jp' ? 'lang="ja"' : ''}>${esc(o.t)}</span></button>`;
      })
      .join('')}</div>`;
  if (VSG.ans !== null) document.getElementById('card').dataset.mark = q.opts[VSG.ans].ok ? 'ok' : 'ng';
  pb.onclick = e => {
    const b = e.target.closest('[data-vo]');
    if (!b || VSG.ans !== null) return;
    VSG.ans = +b.dataset.vo;
    const ok = q.opts[VSG.ans].ok;
    if (ok) VSG.score++;
    VSG.res.push({ q, ok });
    record(q.key, ok);
    vsPlay();
    onAnswer(ok);
    setTimeout(
      () => {
        if (!VSG) return;
        VSG.ans = null;
        VSG.i++;
        if (VSG.i >= 10) {
          VSG.done = true;
          sfx('combo');
          vsResult();
        } else if (activeMod() === 'vs') vsPlay();
      },
      ok ? 750 : 1400
    );
  };
}
function vsResult() {
  const pb = document.getElementById('pbody');
  const me = S.name || '나';
  const g = VSG;
  const inv = g.inv;
  let verdict = '';
  if (inv) {
    verdict = g.score > inv.p ? '내가 이겼어요!' : g.score < inv.p ? `${esc(inv.n)}님이 이겼어요` : '비겼어요!';
  }
  if (!g.xp) {
    g.xp = 1;
    gainXP(inv && g.score > inv.p ? 40 : 20);
  }
  const link = vsLink(inv ? { t: g.t, s: g.s, n: me, p: g.score, o: { n: inv.n, p: inv.p } } : { t: g.t, s: g.s, n: me, p: g.score });
  const text = inv
    ? `[하나마루 대결] ${VS_NAME[g.t]} 결과: ${me} ${g.score} vs ${inv.n} ${inv.p}! 다시 붙어 볼래?`
    : `[하나마루 대결] ${VS_NAME[g.t]} 10문제에서 ${g.score}개 맞혔어! 너는 몇 개? 링크를 열면 같은 문제가 나와.`;
  const missed = g.res.filter(x => !x.ok);
  pb.innerHTML = `<div class="sum"><div class="vs-score">${inv ? `<div><small>${esc(me)}</small><b class="num">${g.score}</b></div><span>vs</span><div><small>${esc(inv.n)}</small><b class="num">${inv.p}</b></div>` : `<div><small>${esc(me)}</small><b class="num">${g.score}</b><small>/ 10</small></div>`}</div>
    <p class="sum-msg">${inv ? verdict : '이제 친구에게 도전장을 보내 보세요.'}</p>
    ${missed.length ? `<ul class="miss">${missed.map(x => `<li><span>${esc(x.q.ko || x.q.show)}</span><span class="s">${esc(x.q.opts.find(o => o.ok).t)}</span></li>`).join('')}</ul>` : ''}
    <div class="row"><button class="btn primary" data-vs="send">${inv ? '결과 보내기' : '친구에게 도전장 보내기'}</button><button class="btn" data-vs="done">처음으로</button></div>
    ${link.startsWith('#') ? `<p class="note">이 미리보기 화면에서는 링크를 만들 수 없어요. GitHub에 올린 앱 주소에서 쓰면 친구에게 보낼 수 있어요.</p>` : ''}</div>`;
  pb.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.vs === 'done') {
      VSG = null;
      renderVS();
    } else if (b.dataset.vs === 'send') {
      const full = text + '\n' + link;
      const fb = () =>
        copyText(full, '도전장 링크를 복사했어요. 카톡에 붙여 넣어 보내세요.', () => {
          if (!pb.querySelector('#vsTxt'))
            pb.querySelector('.sum').insertAdjacentHTML(
              'beforeend',
              `<textarea id="vsTxt" readonly style="width:100%;min-height:100px;font-size:15px;border:1px solid var(--line);border-radius:10px;padding:10px;background:var(--paper);color:var(--ink)">${esc(full)}</textarea><p class="note">위 내용을 길게 눌러 복사해서 보내 주세요.</p>`
            );
        });
      try {
        if (navigator.share && !link.startsWith('#')) {
          navigator.share({ text, url: link }).catch(err => {
            if (!err || err.name !== 'AbortError') fb();
          });
        } else fb();
      } catch (err) {
        fb();
      }
    }
  };
}
