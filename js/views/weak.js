'use strict';
/* ================= 내 약점 리포트: accuracy per practice and per sub-skill, with a button straight into practice ================= */

// How to split a practice into sub-skills (item → label) for the finer report
const WEAK_SUB = {
  jlen: x => x.lb,
  kpart: x => x.g,
  part: x => x.p,
  hj: x => (hjRuleOf(x.h) || {}).from,
  sign: x => SIGN_CATS[x.c],
  kana: x => (x.sc === 'k' ? '가타카나' : '히라가나'),
  hjw: x => (x.s.some(p => p[4]) ? '소리가 바뀌는 단어 (촉음·탁음)' : '그대로 이어 읽는 단어')
};
const WEAK_MIN = 8;
// does the last Hangul syllable end in a consonant (for 이에요 / 예요)
const hasBatchim = t => {
  const c = (t || '').replace(/[^가-힣]/g, '').slice(-1);
  return !!c && (c.charCodeAt(0) - 0xac00) % 28 > 0;
}; // answers needed before a practice is judged

function statOf(keys) {
  let c = 0,
    w = 0,
    weak = 0;
  for (const k of keys) {
    const s = S.stats[k];
    if (!s) continue;
    c += s.c || 0;
    w += s.w || 0;
    if (isWeak(k)) weak++;
  }
  const n = c + w;
  return { n, c, w, weak, acc: n ? Math.round((c * 100) / n) : null };
}
function weakAreas(lang) {
  const out = [];
  for (const m of SRS_MODS[lang]) {
    if (!modTab(m)) continue;
    const items = basePool(m, true);
    const st = statOf(items.map(x => x.key));
    if (st.n >= WEAK_MIN) out.push({ mod: m, label: modeLabel(m), ...st, items });
  }
  return out.sort((a, b) => a.acc - b.acc);
}
function weakSubs(areas) {
  const out = [];
  for (const a of areas) {
    const f = WEAK_SUB[a.mod];
    if (!f) continue;
    const groups = new Map();
    for (const it of a.items) {
      const g = f(it);
      if (!g) continue;
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(it);
    }
    for (const [g, its] of groups) {
      const st = statOf(its.map(x => x.key));
      if (st.n >= 5) out.push({ mod: a.mod, area: a.label, sub: g, ...st, items: its });
    }
  }
  return out.sort((a, b) => a.acc - b.acc);
}
// the weakest area worth a review round (used by "오늘 공부 시작")
function weakestArea(lang) {
  const a = weakAreas(lang).find(x => x.acc < 75 && x.weak > 0);
  return a ? { mod: a.mod, label: `약점 보강 · ${a.label} ${a.acc}%` } : null;
}
let WEAK_SUBS = [];
function renderWeak(mod) {
  const lang = S.lang;
  const areas = weakAreas(lang);
  WEAK_SUBS = weakSubs(areas)
    .filter(x => x.acc < 80)
    .slice(0, 6);
  const tone = acc => (acc >= 85 ? 'ok' : acc >= 70 ? 'mid' : 'ng');
  const worst = areas[0];
  view.innerHTML = `<section class="mod">${modeSeg(mod)}<div class="chart weak">
    ${
      !areas.length
        ? `<div class="empty"><p style="margin:0;font-weight:600">아직 기록이 부족해요</p><p class="note">연습마다 ${WEAK_MIN}문제 이상 풀면 어디가 약한지 알려 드릴게요.</p></div>`
        : `<p class="weak-lead">${worst.acc < 85 ? `가장 약한 곳은 <b>${esc(worst.label)}</b>${hasBatchim(worst.label) ? '이에요' : '예요'}. 정답률 ${worst.acc}%.` : '전체적으로 잘하고 있어요! 정답률이 낮은 순서로 보여 드려요.'}</p>
    ${
      WEAK_SUBS.length
        ? `<h3 class="hjr-h">콕 집은 약점</h3><div class="weak-subs">${WEAK_SUBS.map(
            (x, i) =>
              `<div class="weak-sub"><div><b>${esc(x.sub)}</b><small>${esc(x.area)} · ${x.n}문제 중 ${x.c}개 맞힘</small></div><span class="weak-acc ${tone(x.acc)} num">${x.acc}%</span><button type="button" class="btn" data-wsub="${i}">집중 연습</button></div>`
          ).join('')}</div>`
        : ''
    }
    <h3 class="hjr-h">연습별 정답률</h3>
    <div class="weak-list">${areas
      .map(
        a => `<div class="weak-row"><div class="wr-top"><b>${esc(a.label)}</b><span class="num">${a.acc}% · ${a.n}문제</span></div>
        <span class="weak-bar"><i class="${tone(a.acc)}" style="width:${a.acc}%"></i></span>
        <div class="wr-act">${a.weak ? `<small>복습 필요 ${a.weak}개</small><button type="button" class="link" data-wmod="${a.mod}">틀린 것 연습 →</button>` : '<small>복습 필요 없음</small>'}</div></div>`
      )
      .join('')}</div>`
    }
    <p class="note" style="margin-top:14px">정답률은 지금까지 푼 모든 기록으로 계산해요. 약한 곳은 '오늘 공부 시작'에도 자동으로 섞여 나와요.</p>
  </div></section>`;
  view.onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.closest('.modes')) return;
    if (b.dataset.wmod) {
      S.filt[b.dataset.wmod] = 'weak';
      R[b.dataset.wmod] = null;
      save();
      startMod(b.dataset.wmod);
    } else if (b.dataset.wsub !== undefined) {
      const x = WEAK_SUBS[+b.dataset.wsub];
      if (!x) return;
      // weakest items of that sub-skill first, then the rest of it
      const items = [...x.items].sort((p, q) => isWeak(q.key) - isWeak(p.key) || (S.stats[q.key]?.w || 0) - (S.stats[p.key]?.w || 0));
      PENDING[x.mod] = items.slice(0, Math.min(items.length, S.set.round));
      R[x.mod] = null;
      startMod(x.mod);
    }
  };
}
CUSTOM.weak = renderWeak;
