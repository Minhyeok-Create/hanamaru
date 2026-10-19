'use strict';
/* keyboard (desktop) */
document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (document.getElementById('sheet') || document.getElementById('tvShow')) return;
  if (curTab() === 'home') return;
  const mod = activeMod();
  if (SPEED.has(mod)) {
    if (SP && SP.running && /^[1-4]$/.test(e.key)) {
      answerSpeed(+e.key - 1);
      e.preventDefault();
    }
    return;
  }
  const r = R[mod];
  if (!r || r.done || r.empty) return;
  if (e.target.matches('input,textarea')) return;
  const choiceWord = (mod === 'word' || mod === 'ew') && S.set.wans === 'choice';
  const optAttr = ['sent', 'jl', 'es', 'el', 'kconf'].includes(mod)
    ? 'opt'
    : choiceWord || ['loan', 'conj', 'kanji', 'part', 'gram', 'irr', 'mp', 'cnt', 'pol', 'jlen'].includes(mod) || INFO[mod]
      ? 'wopt'
      : null;
  if (optAttr) {
    if (!r.answered && /^[1-4]$/.test(e.key)) {
      const b = document.querySelector(`[data-${optAttr}="${+e.key - 1}"]`);
      if (b) b.click();
      e.preventDefault();
    } else if (r.answered && e.key === 'Enter') {
      next(mod);
      e.preventDefault();
    }
    return;
  }
  if (BUILD.has(mod)) {
    if (e.key === 'Enter') {
      r.answered ? next(mod) : checkBuild(mod, false);
      e.preventDefault();
    }
    return;
  }
  if (((mod === 'kana' && S.kana.dir === 'r2k') || mod === 'jd') && S.kana.input === 'pad') {
    if (e.key === 'Enter') {
      if (r.answered) next(mod);
      else if (padVal) CHECK[mod](padVal);
      e.preventDefault();
    } else if (e.key === 'Backspace' && !r.answered) {
      padVal = padVal.slice(0, -1);
      renderPad('');
      e.preventDefault();
    }
    return;
  }
  if (r.answered && e.key === 'Enter') {
    next(mod);
    e.preventDefault();
  }
});

applyLook();
renderTabs();
VS_IN = parseVS(location.hash);
if (VS_IN) {
  try {
    history.replaceState(null, '', location.href.split('#')[0]);
  } catch (e) {}
  const vl = ['jw', 'js', 'jk'].includes(VS_IN.t) ? 'ja' : 'en';
  if (S.lang !== vl) {
    S.lang = vl;
    save();
    renderTabs();
  }
  S.smode[S.lang][S.lang === 'ja' ? 'play' : 'eplay'] = 'vs';
  S.tabs[S.lang] = S.lang === 'ja' ? 'play' : 'eplay';
  save();
}
const WL_IN = parseWordShare(location.hash);
if (WL_IN) {
  try {
    history.replaceState(null, '', location.href.split('#')[0]);
  } catch (e) {}
}
go(curTab());
checkUpdate();
if (WL_IN) setTimeout(() => offerWordShare(WL_IN), 400);
else if (!VS_IN) {
  if (!S.seen.tour) setTimeout(openTour, 400);
  else if (!S.seen.v10) {
    S.seen.v10 = S.seen.v9 = S.seen.v8 = 1;
    save();
    setTimeout(whatsNew10, 500);
  }
}
startAnalytics();
window.__hanamaruReady = true;
