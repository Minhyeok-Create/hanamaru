'use strict';
/* ---------- tickets & cards (gacha) ---------- */
const RARE = ['N', 'R', 'SR', 'SSR'];
const RARE_W = { N: 55, R: 28, SR: 13, SSR: 4 };
const RARE_KO = { N: '일반', R: '레어', SR: '슈퍼 레어', SSR: '전설' };
const CARDS = { ja: typeof GACHA_JA !== 'undefined' ? GACHA_JA : [], en: typeof GACHA_EN !== 'undefined' ? GACHA_EN : [] };
function grantTicket(lang, why) {
  S.tickets[lang] += 1;
  save();
  setTimeout(() => toast(`${why} · 카드 뽑기권 +1`), 900);
}
function drawCard(lang) {
  const pool = CARDS[lang];
  if (!pool.length || S.tickets[lang] < 1) return null;
  let c = seasonPickCard(lang);
  if (!c) {
    let r = Math.random() * 100,
      rar = 'N';
    for (const k of RARE) {
      r -= RARE_W[k];
      if (r <= 0) {
        rar = k;
        break;
      }
    }
    let cand = pool.filter(c => c.r === rar);
    if (!cand.length) cand = pool;
    const fresh = cand.filter(c => !S.cards[lang][c.id]);
    if (fresh.length && Math.random() < 0.7) cand = fresh;
    c = cand[(Math.random() * cand.length) | 0];
  }
  S.tickets[lang] -= 1;
  const dup = !!S.cards[lang][c.id];
  S.cards[lang][c.id] = (S.cards[lang][c.id] || 0) + 1;
  save();
  if (dup) gainXP(20, lang);
  checkBadges();
  return { c, dup };
}
const cardCount = lang => Object.keys(S.cards[lang]).filter(id => allCards(lang).some(c => c.id === id)).length;
function cardFront(c, lang, big) {
  const ja = lang === 'ja';
  return `<div class="gc-face gc-front r-${c.r}"><span class="gc-r">${c.r} · ${RARE_KO[c.r]}</span><span class="gc-cat">${esc(c.cat || '')}</span>
    <b class="gc-w ${ja ? 'jp' : 'en'}" lang="${lang}" style="font-size:${big ? Math.max(22, Math.min(40, 300 / Math.max(4, [...c.w].length))) : 16}px">${esc(c.w)}</b>${ja && c.rd && c.rd !== c.w ? `<span class="gc-rd jp" lang="ja">${esc(c.rd)}</span>` : ''}<span class="gc-m">${esc(c.m)}</span></div>`;
}
function cardDetail(lang, id) {
  const c = allCards(lang).find(x => x.id === id);
  if (!c) return;
  const ja = lang === 'ja';
  openSheet(
    `<div class="sheet-h"><b>단어 카드</b><button type="button" class="icon-btn" data-close aria-label="닫기">${XICON}</button></div>
    <div class="h-scroll"><div class="gcard big"><div class="gc-in">${cardFront(c, lang, true)}</div></div>
    <div class="panel" style="padding:14px;display:grid;gap:8px">
      <div class="row">${spkBtn(ja ? c.rd || c.w : c.w, '발음 듣기', lang)}<span class="note" style="align-self:center">${S.cards[lang][id] > 1 ? `${S.cards[lang][id]}장 보유` : ''}</span></div>
      ${c.lit ? `<p class="fb-sub">직역: ${esc(c.lit)}</p>` : ''}
      ${c.ex ? `<div class="ex"><p class="${ja ? 'ex-jp' : 'ex-en'}" lang="${lang}">${esc(c.ex)}</p>${ja && c.exr ? `<p class="ex-rd" lang="ja">${esc(c.exr)}</p>` : ''}<p class="ex-ko">${esc(c.exko || '')}</p>${spkBtn(c.ex, '예문 듣기', lang)}</div>` : ''}
      ${c.tip ? `<p style="margin:0;font-size:14px">${esc(c.tip)}</p>` : ''}
    </div></div>`,
    'card'
  );
}
function renderCards() {
  const pb = document.getElementById('pbody');
  const lang = S.lang;
  const pool = CARDS[lang];
  if (!S.cardStart[lang]) {
    S.cardStart[lang] = 1;
    S.tickets[lang] += 1;
    save();
    setTimeout(() => toast('첫 방문 선물 · 카드 뽑기권 +1'), 300);
  }
  const have = cardCount(lang);
  const tk = S.tickets[lang];
  pb.innerHTML = `<div class="chart">
    <div class="gacha"><div class="gacha-top"><div><b class="num">뽑기권 ${tk}장</b><small>수집 ${have} / ${allCards(lang).length}</small></div><button class="btn primary" data-gdraw ${tk ? '' : 'disabled'}>카드 뽑기</button></div>
      <div id="gstage" class="gstage"></div>
      <p class="note">뽑기권은 하루 목표를 채우면 1장, 레벨이 오르면 1장, 30일 코스 하루치를 끝내면 1장 생겨요. ${lang === 'ja' ? '오미쿠지에서 대길이 나와도 1장!' : '포춘 쿠키에서 아주 좋은 운이 나와도 1장!'}</p></div>
    <div id="gGrid" class="chart">${cardGridHTML(lang)}</div>
  </div>`;
  pb.onclick = null;
  bindCards(pb, lang, pool);
}
function cardGridHTML(lang) {
  const pool = CARDS[lang];
  const byR = RARE.map(r => [r, pool.filter(c => c.r === r)]);
  const s = activeSeason();
  const sc = SEASON_CARDS[lang].filter(c => S.cards[lang][c.id] || (s && c.season === s.id));
  const seasonBox = sc.length
    ? `<section class="chart-box season-box"><div class="cal-head"><h2 class="sec-title" style="margin:0">시즌 한정${s ? ' · ' + esc((seasonMsg(s.id) || {}).title || '') : ''}</h2><span class="note num">${sc.filter(c => S.cards[lang][c.id]).length} / ${sc.length}</span></div>
    <div class="gc-grid">${sc.map(c => (S.cards[lang][c.id] ? `<button type="button" class="gc-mini r-${c.r} sea" data-gcard="${esc(c.id)}"><b class="${lang === 'ja' ? 'jp' : 'en'}" lang="${lang}">${esc(c.w)}</b><small>${esc(c.m)}</small>${S.cards[lang][c.id] > 1 ? `<i class="num">×${S.cards[lang][c.id]}</i>` : ''}</button>` : `<span class="gc-mini none sea r-${c.r}"><b>?</b></span>`)).join('')}</div>${s ? `<p class="note" style="margin-top:8px">${seasonEnd(s)}까지 뽑기에서 일정 확률로 나와요.</p>` : ''}</section>`
    : '';
  return (
    seasonBox +
    `${byR
      .map(
        ([
          r,
          cs
        ]) => `<section class="chart-box"><div class="cal-head"><h2 class="sec-title" style="margin:0">${r} · ${RARE_KO[r]}</h2><span class="note num">${cs.filter(c => S.cards[lang][c.id]).length} / ${cs.length}</span></div>
      <div class="gc-grid">${cs.map(c => (S.cards[lang][c.id] ? `<button type="button" class="gc-mini r-${c.r}" data-gcard="${esc(c.id)}"><b class="${lang === 'ja' ? 'jp' : 'en'}" lang="${lang}">${esc(c.w)}</b><small>${esc(c.m)}</small>${S.cards[lang][c.id] > 1 ? `<i class="num">×${S.cards[lang][c.id]}</i>` : ''}</button>` : `<span class="gc-mini none r-${c.r}"><b>?</b></span>`)).join('')}</div></section>`
      )
      .join('')}`
  );
}
function bindCards(pb, lang, pool) {
  pb.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.gcard) {
      cardDetail(lang, b.dataset.gcard);
      return;
    }
    if ('gdraw' in b.dataset) {
      const res = drawCard(lang);
      if (!res) return;
      b.disabled = true;
      sfx('flip');
      const st = document.getElementById('gstage');
      st.innerHTML = `<div class="gcard draw r-${res.c.r}"><div class="gc-in"><div class="gc-face gc-back"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="${HANAMARU_PATHS[0]}"/><path d="${HANAMARU_PATHS[1]}"/></svg></div>${cardFront(res.c, lang, true)}</div></div><p class="gres" hidden>${res.dup ? '이미 가진 카드예요 · 경험치 +20' : res.c.r === 'SSR' ? '전설 카드! 대단해요' : '새 카드를 얻었어요'}</p>`;
      setTimeout(() => {
        const g = st.querySelector('.gcard');
        if (g) g.classList.add('open');
        sfx(res.c.r === 'SSR' || res.c.r === 'SR' ? 'combo' : 'card');
      }, 700);
      setTimeout(() => {
        const p = st.querySelector('.gres');
        if (p) p.hidden = false;
        const top = document.querySelector('.gacha-top');
        if (top) {
          top.querySelector('b').textContent = `뽑기권 ${S.tickets[lang]}장`;
          top.querySelector('small').textContent = `수집 ${cardCount(lang)} / ${allCards(lang).length}`;
          const bt = top.querySelector('[data-gdraw]');
          if (bt) bt.disabled = S.tickets[lang] < 1;
        }
        const gg = document.getElementById('gGrid');
        if (gg) gg.innerHTML = cardGridHTML(lang);
        st.querySelector('.gcard').addEventListener('click', () => cardDetail(lang, res.c.id));
      }, 1300);
    }
  };
}
