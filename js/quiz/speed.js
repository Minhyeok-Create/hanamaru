'use strict';
/* ================= 60-second challenge ================= */
let SP = null;
function stopSpeed() {
  if (SP) {
    if (SP.timer) {
      clearInterval(SP.timer);
      SP.timer = null;
    }
    if (SP.lockT) clearTimeout(SP.lockT);
    SP.running = false;
  }
}
function speedQ(mod) {
  if (mod === 'kspeed') {
    const k = S.kana;
    const pool = KANA.filter(x => k.sets.includes(x.set));
    const x = pool[(Math.random() * pool.length) | 0];
    const sc = k.script === 'm' ? (Math.random() < 0.5 ? 'h' : 'k') : k.script;
    const ch = sc === 'h' ? x.h : toKata(x.h);
    const others = shuffle(pool.filter(y => y !== x && y.alts[0] !== x.alts[0])).slice(0, 3);
    return {
      show: ch,
      cls: 'glyph',
      lang: 'ja',
      order: shuffle([{ t: x.alts[0], ok: true, cls: 'mono-opt' }, ...others.map(y => ({ t: y.alts[0], ok: false, cls: 'mono-opt' }))])
    };
  }
  const all = mod === 'wspeed' ? WORDS : EN_WORDS;
  const q = all[(Math.random() * all.length) | 0];
  return {
    show: mod === 'wspeed' ? (S.set.kanji ? q.w : q.r) : q.w,
    cls: mod === 'wspeed' ? 'word' : 'eword',
    lang: mod === 'wspeed' ? 'ja' : 'en',
    order: wordOptions(q, all, 'ko', mod === 'wspeed' ? 'ja' : 'en')
  };
}
function renderSpeed(mod) {
  const best = S.best[mod] || 0;
  const setup =
    mod === 'kspeed'
      ? `<div class="setup-row"><label>문자</label>${seg(
          'kana.script',
          [
            ['h', 'ひらがな'],
            ['k', 'カタカナ'],
            ['m', '섞기']
          ],
          S.kana.script
        )}</div><div class="setup-row"><label>범위</label><div class="chips">${Object.entries(SETS)
          .map(
            ([v, l]) =>
              `<button class="chip" data-multi="kana.sets" data-val="${v}" aria-pressed="${S.kana.sets.includes(v)}">${l}</button>`
          )
          .join('')}</div></div>`
      : mod === 'wspeed'
        ? kanjiRow('표기')
        : '';
  const what = mod === 'kspeed' ? '글자를 보고 발음을' : '단어를 보고 뜻을';
  view.innerHTML = `<section class="mod">${modeSeg(mod)}<div id="stage"><div class="empty" style="text-align:left;justify-items:stretch">
    <p style="margin:0;font-weight:700;font-size:18px">60초 도전</p>
    <p class="note">60초 동안 ${what} 최대한 많이 고르세요. 틀려도 바로 다음 문제로 넘어가요.</p>
    <div class="due-n"><b class="num">${best}</b><span>최고 기록</span></div>
    ${setup}
    <button class="btn primary" data-sp="start">시작</button>
  </div></div></section>`;
  bindModes();
  view.onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.closest('.modes')) return;
    if (b.dataset.sp === 'start') startSpeed(mod);
    else if (b.dataset.set) {
      const [g, k] = b.dataset.set.split('.');
      let v = b.dataset.val;
      if (v === 'true' || v === 'false') v = v === 'true';
      S[g][k] = v;
      save();
      renderSpeed(mod);
    } else if (b.dataset.multi) {
      const v = b.dataset.val;
      let arr = S.kana.sets;
      if (arr.includes(v)) {
        if (arr.length > 1) arr = arr.filter(x => x !== v);
      } else arr = [...arr, v];
      S.kana.sets = Object.keys(SETS).filter(s => arr.includes(s));
      save();
      renderSpeed(mod);
    }
  };
}
function startSpeed(mod) {
  stopSpeed();
  SP = { mod, running: true, end: Date.now() + 60000, score: 0, total: 0, lock: false };
  const st = document.getElementById('stage');
  st.innerHTML = `<div class="speed-top"><span class="num" id="spT">60</span><div class="speed-bar"><i id="spBar"></i></div><b class="num" id="spS">0</b></div><div class="card" id="spCard"></div><div class="zone" id="spZone"></div>`;
  SP.timer = setInterval(() => {
    if (!SP || !SP.running) return;
    const left = Math.max(0, SP.end - Date.now());
    const t = document.getElementById('spT'),
      bar = document.getElementById('spBar');
    if (t) t.textContent = Math.ceil(left / 1000);
    if (bar) bar.style.width = left / 600 + '%';
    if (left <= 0) endSpeed();
  }, 100);
  view.onclick = e => {
    const b = e.target.closest('button[data-sopt]');
    if (b) answerSpeed(+b.dataset.sopt);
    else {
      const s = e.target.closest('button[data-sp]');
      if (s) speedEndClick(s);
    }
  };
  nextSpeed();
}
function nextSpeed() {
  if (!SP || !SP.running) return;
  SP.q = speedQ(SP.mod);
  SP.lock = false;
  const q = SP.q;
  const size = q.cls === 'word' ? wordSize(q.show) : q.cls === 'eword' ? enSize(q.show) : null;
  document.getElementById('spCard').innerHTML =
    q.cls === 'glyph'
      ? `<div class="tz"><span class="glyph ${q.show.length > 1 ? 'two' : ''}" lang="ja">${q.show}</span></div>`
      : `<div class="tz wide"><span class="${q.cls}" lang="${q.lang}" style="font-size:${size}px">${esc(q.show)}</span></div>`;
  document.getElementById('spZone').innerHTML =
    `<div class="opts ${q.cls === 'glyph' ? 'grid2' : ''}">${q.order.map((o, i) => `<button type="button" class="opt" data-sopt="${i}"><span class="${o.cls}">${esc(o.t)}</span></button>`).join('')}</div>`;
}
function answerSpeed(i) {
  if (!SP || !SP.running || SP.lock) return;
  SP.lock = true;
  const o = SP.q.order[i];
  SP.total++;
  if (o.ok) SP.score++;
  record(null, o.ok);
  sfx(o.ok ? 'pop' : 'ng');
  document.getElementById('spS').textContent = SP.score;
  const btns = [...document.querySelectorAll('[data-sopt]')];
  btns[i].dataset.state = o.ok ? 'ok' : 'ng';
  if (!o.ok) btns[SP.q.order.findIndex(x => x.ok)].dataset.state = 'ok';
  SP.lockT = setTimeout(nextSpeed, o.ok ? 220 : 750);
}
function endSpeed() {
  if (!SP) return;
  stopSpeed();
  const mod = SP.mod;
  if (SPEED_C && SPEED_C.mod === mod) {
    courseMark(SPEED_C);
    SPEED_C = null;
  }
  const prev = S.best[mod] || 0;
  const isNew = SP.score > prev;
  if (isNew) S.best[mod] = SP.score;
  save();
  checkBadges();
  const name = { kspeed: '가나', wspeed: '일본어 단어', espeed: '영단어' }[mod];
  missionEvent('speed');
  SP.share = `하나마루 60초 도전 · ${name} ${SP.score}개 맞힘! (${SP.total}문제 중)`;
  document.getElementById('stage').innerHTML =
    `<div class="sum"><div class="sum-score">${isNew && SP.score > 0 ? `<svg viewBox="0 0 200 200" aria-hidden="true"><path pathLength="1" d="M108 18C162 16 190 60 184 108 178 156 134 186 92 182 44 178 14 142 18 96 22 52 60 24 106 26M110 64c24 2 38 20 36 42-2 22-22 38-44 36-20-2-34-20-32-40 2-18 18-30 36-28 16 2 26 14 24 28"/></svg>` : ''}<b class="num">${SP.score}</b><span>개</span></div>
    <p class="sum-msg">${isNew ? '최고 기록이에요!' : `최고 기록 ${prev}개`} · ${SP.total}문제 중 ${SP.score}개 정답</p>
    <div class="row"><button class="btn" data-sp="share">결과 복사</button><button class="btn primary" data-sp="again">다시 도전</button></div></div>`;
}
function speedEndClick(b) {
  if (b.dataset.sp === 'again') startSpeed(SP.mod);
  else if (b.dataset.sp === 'share') copyText(SP.share, '결과를 복사했어요. 친구에게 보내 보세요.', () => toast(SP.share));
}
