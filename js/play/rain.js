'use strict';
/* ---------- mini game: rain ---------- */
let RG = null;
function stopGames() {
  if (RG) {
    RG.run = false;
    if (RG.raf) cancelAnimationFrame(RG.raf);
    RG = null;
  }
  if (MG && MG.t) {
    clearTimeout(MG.t);
  }
}
const RAIN_TYPES = {
  ja: [
    ['h', '히라가나'],
    ['k', '가타카나'],
    ['w', '단어']
  ],
  en: [['ew', '영단어']]
};
function rainItem(type, used) {
  if (type === 'h' || type === 'k') {
    const pool = KANA.filter(x => x.set !== 'yoon');
    const x = pool[(Math.random() * pool.length) | 0];
    const ch = type === 'k' ? toKata(x.h) : x.h;
    return {
      show: ch,
      ans: x.alts[0],
      opts: () => shuffle([x.alts[0], ...shuffle([...new Set(pool.map(y => y.alts[0]).filter(a => a !== x.alts[0]))]).slice(0, 3)]),
      cls: 'jp'
    };
  }
  const words = (type === 'w' ? BASE_JP : BASE_EN).filter(w => [...(type === 'w' ? w.r : w.w)].length <= 7);
  const w = words[(Math.random() * words.length) | 0];
  return {
    show: type === 'w' ? w.r : w.w,
    ans: w.m[0],
    opts: () => {
      const o = [w.m[0]];
      for (const y of shuffle(words)) {
        if (o.length >= 4) break;
        if (!y.m.some(m => w.m.includes(m)) && !o.includes(y.m[0])) o.push(y.m[0]);
      }
      return shuffle(o);
    },
    cls: type === 'w' ? 'jp' : 'en',
    word: true
  };
}
function renderRain() {
  stopGames();
  const pb = document.getElementById('pbody');
  const lang = S.lang;
  const types = RAIN_TYPES[lang];
  let ty = S.gbest.rainType && types.some(t => t[0] === S.gbest.rainType) ? S.gbest.rainType : types[0][0];
  const best = S.gbest['rain_' + ty] || 0;
  pb.innerHTML = `<div class="empty" style="text-align:left;justify-items:stretch">
    <p style="margin:0;font-weight:700;font-size:18px">${modeLabel('rain')}</p>
    <p class="note">위에서 떨어지는 ${ty === 'h' || ty === 'k' ? '글자의 발음' : '단어의 뜻'}을 아래 버튼에서 골라요. 가장 아래에 있는 ${ty === 'h' || ty === 'k' ? '글자' : '단어'}(테두리 표시)부터 맞혀야 해요. 바닥에 닿으면 하트가 하나 줄고, 3개를 다 잃으면 끝나요.</p>
    ${types.length > 1 ? `<div class="chips">${types.map(([v, l]) => `<button class="chip" data-rty="${v}" aria-pressed="${v === ty}">${l}</button>`).join('')}</div>` : ''}
    <div class="due-n"><b class="num">${best}</b><span>최고 기록</span></div>
    <button class="btn primary" data-rain="start">시작</button></div>`;
  pb.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.rty) {
      S.gbest.rainType = b.dataset.rty;
      save();
      renderRain();
    } else if (b.dataset.rain === 'start') startRain(ty);
  };
}
function startRain(ty) {
  stopGames();
  const pb = document.getElementById('pbody');
  pb.innerHTML = `<div class="rain-top"><span class="hearts" id="rgH">♥♥♥</span><b class="num" id="rgS">0</b><button class="btn quiet" data-rain="quit" style="min-height:36px;padding:4px 10px">그만하기</button></div>
    <div class="rain-field" id="rgF"><div class="rain-floor"></div></div><div class="opts grid2 rain-opts" id="rgO"></div>`;
  const F = document.getElementById('rgF');
  RG = {
    ty,
    run: true,
    items: [],
    score: 0,
    lives: 3,
    last: performance.now(),
    spawnT: 0,
    tgt: null,
    id: 0,
    H: F.clientHeight || 340,
    W: F.clientWidth || 340
  };
  const spawn = () => {
    const q = rainItem(ty);
    const el = document.createElement('span');
    el.className = 'drop ' + q.cls;
    el.textContent = q.show;
    el.lang = lang2(ty);
    F.appendChild(el);
    const w = q.word ? Math.min(RG.W - 20, Math.max(60, [...q.show].length * (ty === 'ew' ? 13 : 22))) : 48;
    const x = 8 + Math.random() * Math.max(10, RG.W - w - 16);
    el.style.left = x + 'px';
    RG.items.push({ id: ++RG.id, q, el, y: -40 });
  };
  const pickTgt = () => {
    let t = null;
    for (const it of RG.items) if (!t || it.y > t.y) t = it;
    if (t && (!RG.tgt || RG.tgt.id !== t.id)) {
      RG.tgt = t;
      RG.items.forEach(i => i.el.classList.toggle('tgt', i === t));
      RG.opts = t.q.opts();
      document.getElementById('rgO').innerHTML = RG.opts
        .map(
          (o, i) =>
            `<button type="button" class="opt" data-ro="${i}"><span class="${ty === 'h' || ty === 'k' ? 'mono-opt' : ''}">${esc(o)}</span></button>`
        )
        .join('');
    }
    if (!t) {
      RG.tgt = null;
      document.getElementById('rgO').innerHTML = '';
    }
  };
  const step = now => {
    if (!RG || !RG.run) return;
    const dt = Math.min(0.05, (now - RG.last) / 1000);
    RG.last = now;
    const sp = Math.min(130, (RG.ty === 'h' || RG.ty === 'k' ? 34 : 24) + RG.score * 2.2);
    RG.spawnT -= dt * 1000;
    if (RG.spawnT <= 0) {
      spawn();
      RG.spawnT = Math.max(RG.ty === 'h' || RG.ty === 'k' ? 750 : 1300, (RG.ty === 'h' || RG.ty === 'k' ? 2100 : 3000) - RG.score * 45);
    }
    const floor = RG.H - 46;
    for (const it of [...RG.items]) {
      it.y += sp * dt * (it.fast ? 1.6 : 1);
      it.el.style.transform = `translateY(${it.y}px)`;
      if (it.y >= floor) {
        it.el.classList.add('miss');
        RG.items = RG.items.filter(x => x !== it);
        setTimeout(() => it.el.remove(), 300);
        RG.lives--;
        sfx('ng');
        COMBO = 0;
        document.getElementById('rgH').textContent = '♥'.repeat(Math.max(0, RG.lives)) + '♡'.repeat(3 - Math.max(0, RG.lives));
        if (RG.lives <= 0) {
          endRain();
          return;
        }
      }
    }
    pickTgt();
    RG.raf = requestAnimationFrame(step);
  };
  spawn();
  pickTgt();
  RG.raf = requestAnimationFrame(step);
  pb.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.rain === 'quit') {
      endRain();
      return;
    }
    if (b.dataset.ro !== undefined && RG && RG.tgt) {
      const v = RG.opts[+b.dataset.ro];
      const t = RG.tgt;
      if (v === t.q.ans) {
        RG.score++;
        document.getElementById('rgS').textContent = RG.score;
        t.el.classList.add('pop');
        RG.items = RG.items.filter(x => x !== t);
        setTimeout(() => t.el.remove(), 250);
        RG.tgt = null;
        sfx('pop');
        pickTgt();
      } else {
        b.dataset.state = 'ng';
        t.fast = true;
        sfx('ng');
        setTimeout(() => {
          if (b.isConnected) b.removeAttribute('data-state');
        }, 350);
      }
    }
  };
}
const lang2 = ty => (ty === 'ew' ? 'en' : 'ja');
function endRain() {
  if (!RG) return;
  const { score, ty } = RG;
  missionEvent('game');
  stopGames();
  const k = 'rain_' + ty;
  const prev = S.gbest[k] || 0;
  const nb = score > prev;
  if (nb) S.gbest[k] = score;
  const xp = score * 3;
  gainXP(xp);
  save();
  checkBadges();
  const pb = document.getElementById('pbody');
  if (!pb) return;
  pb.innerHTML = `<div class="sum"><div class="sum-score"><b class="num">${score}</b><span>개</span></div><p class="sum-msg">${nb && score ? '최고 기록이에요!' : `최고 기록 ${prev}개`} · 경험치 +${xp}</p><div class="row"><button class="btn" data-rain="menu">설정</button><button class="btn primary" data-rain="again">다시 하기</button></div></div>`;
  if (nb && score) sfx('combo');
  pb.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.rain === 'again') startRain(ty);
    else if (b.dataset.rain === 'menu') renderRain();
  };
}
