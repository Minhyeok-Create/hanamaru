'use strict';
/* ---------- omikuji / fortune cookie ---------- */
const OMI = { ja: typeof OMI_JA !== 'undefined' ? OMI_JA : [], en: typeof FORT_EN !== 'undefined' ? FORT_EN : [] };
const OMI_RANK = {
  ja: [
    ['大吉', 15, '대길', '최고의 운이에요!'],
    ['中吉', 20, '중길', '꽤 좋은 하루예요'],
    ['小吉', 20, '소길', '작은 행운이 있어요'],
    ['吉', 20, '길', '좋은 일이 생길 거예요'],
    ['末吉', 15, '말길', '뒤로 갈수록 좋아지는 운'],
    ['凶', 10, '흉', '조심하면 괜찮아요']
  ],
  en: [
    ['great', 20, '아주 좋은 운', '최고의 하루가 될 거예요!'],
    ['good', 35, '좋은 운', '좋은 일이 기다리고 있어요'],
    ['small', 30, '작은 행운', '작지만 기분 좋은 일이 생겨요'],
    ['careful', 15, '조심하면 좋은 날', '천천히 가면 괜찮아요']
  ]
};
function drawOmi(lang) {
  const ranks = OMI_RANK[lang];
  let r = Math.random() * ranks.reduce((a, x) => a + x[1], 0),
    rank = ranks[0][0];
  for (const x of ranks) {
    r -= x[1];
    if (r <= 0) {
      rank = x[0];
      break;
    }
  }
  let pool = OMI[lang].filter(o => o.f === rank);
  if (!pool.length) pool = OMI[lang];
  const i = OMI[lang].indexOf(pool[(Math.random() * pool.length) | 0]);
  const words = lang === 'ja' ? BASE_JP : BASE_EN;
  const lw = words[(Math.random() * words.length) | 0];
  const nums = [];
  while (nums.length < 6) {
    const n = (1 + Math.random() * 45) | 0;
    if (!nums.includes(n)) nums.push(n);
  }
  nums.sort((a, b) => a - b);
  missionEvent('omikuji');
  S.omi[lang] = { d: today(), i, no: (1 + Math.random() * 100) | 0, ans: null, tied: false, lw: lw.key, nums, order: null };
  S.omiDays[lang][today()] = 1;
  save();
  checkBadges();
}
function renderOmikuji(anim) {
  const pb = document.getElementById('pbody');
  const lang = S.lang;
  const ja = lang === 'ja';
  const o = S.omi[lang];
  const drawn = o && o.d === today() && OMI[lang][o.i];
  if (!drawn) {
    pb.innerHTML = `<div class="omi-wrap">${
      ja
        ? `<svg viewBox="0 0 140 190" class="omi-box" aria-hidden="true"><path d="M70 6 128 34v122l-58 28-58-28V34z" class="wood"/><path d="M70 6v178M12 34l58 28 58-28" class="edge"/><rect x="50" y="78" width="40" height="78" rx="3" class="lab"/><text x="70" y="98" text-anchor="middle" class="lt">御</text><text x="70" y="122" text-anchor="middle" class="lt">神</text><text x="70" y="146" text-anchor="middle" class="lt">籤</text><rect x="64" y="0" width="12" height="16" rx="2" class="stick"/></svg>`
        : `<svg viewBox="0 0 200 140" class="omi-box cookie" aria-hidden="true"><path d="M20 90C20 40 70 18 110 26c40 8 72 40 70 70-30-26-62-30-80-12-18-20-52-14-80 6z" class="ck"/><path d="M100 84c-6 18-4 34 6 46" class="ckl"/></svg>`
    }
      <h2 class="omi-t">${ja ? '오늘의 오미쿠지' : '오늘의 포춘 쿠키'}</h2>
      <p class="note">${ja ? '일본 신사에서 뽑는 운세 종이예요. 하루에 한 번 뽑을 수 있고, 오늘의 일본어 한 문장이 들어 있어요.' : '쿠키를 깨면 오늘의 운세와 영어 한 문장이 나와요. 하루에 한 번 열 수 있어요.'}</p>
      <button class="btn primary" data-omi="draw" style="min-width:200px">${ja ? '흔들어서 뽑기' : '쿠키 깨기'}</button>
      <p class="note num">지금까지 ${Object.keys(S.omiDays[lang]).length}번 뽑았어요</p></div>`;
    pb.onclick = e => {
      const b = e.target.closest('[data-omi=draw]');
      if (!b) return;
      b.disabled = true;
      const box = pb.querySelector('.omi-box');
      box.classList.add('shake');
      sfx('shake');
      setTimeout(() => {
        drawOmi(lang);
        renderOmikuji(true);
        const oo = S.omi[lang];
        const rk = OMI[lang][oo.i].f;
        sfx(rk === '大吉' || rk === 'great' ? 'combo' : 'card');
        if (rk === '大吉' || rk === 'great') {
          grantTicket(lang, ja ? '대길 보너스' : '아주 좋은 운 보너스');
        }
      }, 950);
    };
    return;
  }
  const it = OMI[lang][o.i];
  const rk = OMI_RANK[lang].find(x => x[0] === it.f) || OMI_RANK[lang][0];
  if (!o.order) {
    o.order = shuffle([{ t: it.k, ok: true }, ...(it.d || []).slice(0, 2).map(t => ({ t, ok: false }))]);
    save();
  }
  const lw = (ja ? BASE_JP : BASE_EN).find(w => w.key === o.lw);
  const quiz = `<div class="omi-q"><p class="lbl" style="margin:0">이 문장의 뜻은?</p><div class="opts">${o.order
    .map((x, i) => {
      const st = o.ans === null ? '' : x.ok ? 'ok' : i === o.ans ? 'ng' : 'dim';
      return `<button type="button" class="opt" data-oq="${i}" ${st ? `data-state="${st}" aria-disabled="true"` : ''}><span class="n">${i + 1}</span><span>${esc(x.t)}</span></button>`;
    })
    .join('')}</div>
    ${o.ans !== null ? `<p class="note" style="color:${o.order[o.ans].ok ? 'var(--ok)' : 'var(--ng)'};font-weight:600">${o.order[o.ans].ok ? '정답! 경험치 +15' : '아쉬워요. 내일 또 도전해요'}</p>` : ''}</div>`;
  const bad = it.f === '凶' || it.f === 'careful';
  const sea = activeSeason();
  pb.innerHTML = `<div class="omi-wrap"><div class="omi-slip ${ja ? '' : 'paper'} ${anim ? 'unfold' : ''} ${o.tied ? 'tied' : ''} ${sea ? 'sea-' + sea.id : ''}">${sea ? `<span class="omi-sea">${ja ? esc(sea.ja) + '限定' : esc((seasonMsg(sea.id) || {}).title || '')}</span>` : ''}
      ${ja ? `<span class="omi-no num">第${o.no}番</span><b class="omi-rank jp" lang="ja">${it.f}</b>` : `<b class="omi-rank en">${esc(rk[2])}</b>`}
      <span class="omi-rk">${ja ? esc(rk[2]) + ' · ' : ''}${esc(rk[3])}</span>
      <span class="omi-topic">오늘의 ${esc(it.topic || '운세')}</span>
      <p class="omi-s ${ja ? 'jp' : 'en'}" lang="${lang}">${esc(it.s)}</p>${ja && it.r ? `<p class="omi-r jp" lang="ja">${esc(it.r)}</p>` : ''}
      <div>${spkBtn(it.s, '문장 듣기', lang)}</div>
      ${ja ? '' : `<p class="omi-nums num">Lucky numbers · ${o.nums.join(' · ')}</p>`}
    </div>
    ${quiz}
    ${lw ? `<div class="lucky"><span class="lbl">행운의 단어</span><b class="${ja ? 'jp' : 'en'}" lang="${lang}">${esc(lw.w)}</b>${ja && lw.r !== lw.w ? `<span class="jp" lang="ja">${esc(lw.r)}</span>` : ''}<span class="note">${esc(lw.m[0])}</span>${spkBtn(ja ? lw.r : lw.w, '', lang)}</div>` : ''}
    ${bad && ja && !o.tied ? `<button class="btn" data-omi="tie">나쁜 운은 신사 나무에 묶어 두기</button>` : ''}
    ${o.tied ? `<p class="note" style="text-align:center">오미쿠지를 나무에 묶었어요. 나쁜 운은 여기 두고 가요!</p>` : ''}
    <p class="note" style="text-align:center">내일 다시 ${ja ? '뽑을' : '열'} 수 있어요 · 지금까지 ${Object.keys(S.omiDays[lang]).length}번</p></div>`;
  if (anim && S.set.autoSpeak) speak(it.s, lang);
  pb.onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.dataset.speak) return;
    if (b.dataset.oq !== undefined && o.ans === null) {
      o.ans = +b.dataset.oq;
      const ok = o.order[o.ans].ok;
      save();
      if (ok) {
        gainXP(15, lang);
        save();
      }
      sfx(ok ? 'ok' : 'ng');
      renderOmikuji(false);
    } else if (b.dataset.omi === 'tie') {
      o.tied = true;
      save();
      sfx('stamp');
      renderOmikuji(false);
    }
  };
}
