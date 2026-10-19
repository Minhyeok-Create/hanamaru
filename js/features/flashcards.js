'use strict';
/* ================= flashcards: flip, then "알아요 / 몰라요" (swipe right / left) ================= */

const FC_SIZE = 20;
let FC = null; // { mod, lang, cards, i, flipped, res: [{w, ok}] }

// Due and weak words first, then words not seen yet, then the rest.
function fcDeck(mod, only) {
  const lang = mod === 'flash' ? 'ja' : 'en';
  const pool = only || basePool(lang === 'ja' ? 'word' : 'ew', false);
  const rank = w => (isDue(w.key) ? 0 : isWeak(w.key) ? 1 : !S.stats[w.key] ? 2 : 3);
  const sorted = shuffle(pool).sort((a, b) => rank(a) - rank(b));
  return sorted.slice(0, Math.min(FC_SIZE, sorted.length));
}
function startFlash(mod, only) {
  FC = { mod, lang: mod === 'flash' ? 'ja' : 'en', cards: fcDeck(mod, only), i: 0, flipped: false, res: [] };
}

function renderFlash(mod) {
  if (!FC || FC.mod !== mod) startFlash(mod);
  view.innerHTML = `<section class="mod">${modeSeg(mod)}<div id="fcBody"></div></section>`;
  bindModes();
  fcRender();
}
function fcRender() {
  const box = document.getElementById('fcBody');
  if (!box || !FC) return;
  const { lang, cards, i } = FC,
    ja = lang === 'ja';
  if (!cards.length) {
    box.innerHTML = `<div class="empty"><p style="margin:0;font-weight:600">카드로 볼 단어가 없어요</p><p class="note">단어 퀴즈의 설정에서 범위를 넓혀 보세요.</p></div>`;
    return;
  }
  if (i >= cards.length) return fcSummary(box);
  const w = cards[i];
  const front = ja ? (S.set.kanji ? w.w : w.r) : w.w;
  const st = itemStatus(w.key);
  box.innerHTML = `<div class="prog"><div class="prog-bar"><i style="width:${(i / cards.length) * 100}%"></i></div><span class="num">${i + 1} / ${cards.length}</span><span class="score num"><span class="o">○ ${FC.res.filter(x => x.ok).length}</span><span>× ${FC.res.filter(x => !x.ok).length}</span></span></div>
    <div class="fc ${FC.flipped ? 'flip' : ''}" id="fcCard" role="button" tabindex="0" aria-label="카드 뒤집기">
      <div class="fc-in">
        <div class="fc-face fc-front">${st ? `<span class="fc-st ${st}">${{ weak: '복습 필요', learn: '연습 중', done: '익힘' }[st]}</span>` : '<span class="fc-st new">새 단어</span>'}
          <b class="${ja ? 'jp' : 'en'}" lang="${lang}" style="font-size:${ja ? wordSize(front) : enSize(front)}px">${esc(front)}</b><small>눌러서 뒤집기</small></div>
        <div class="fc-face fc-back">
          <b class="${ja ? 'jp' : 'en'}" lang="${lang}" style="font-size:${Math.min(44, ja ? wordSize(w.w) : enSize(w.w))}px">${esc(w.w)}</b>
          ${ja && w.w !== w.r ? `<span class="jp" lang="ja" style="font-size:19px">${esc(w.r)}</span>` : ''}${ja ? `<span class="mono">${romaji(w.r)}</span>` : ''}
          <p class="fc-m">${esc(w.m.join(', '))}</p>
          ${w.ex ? `<p class="fc-ex ${ja ? 'jp' : 'en'}" lang="${lang}">${esc(w.ex)}</p><p class="fc-exk">${esc(w.exko || '')}</p>` : ''}
        </div>
      </div>
    </div>
    <div class="fc-btns"><button class="btn fc-no" data-fc="no">← 몰라요</button>${spkBtn(ja ? w.r : w.w, '', lang)}<button class="btn fc-yes" data-fc="yes">알아요 →</button></div>
    <p class="note" style="text-align:center">카드를 왼쪽으로 밀면 몰라요, 오른쪽으로 밀면 알아요. 몰라요 카드는 복습에 다시 나와요.</p>`;
  const card = document.getElementById('fcCard');
  let sx = null,
    dx = 0;
  card.addEventListener('pointerdown', e => {
    sx = e.clientX;
    dx = 0;
  });
  card.addEventListener('pointermove', e => {
    if (sx === null) return;
    dx = e.clientX - sx;
    card.style.transform = `translateX(${dx}px) rotate(${dx / 25}deg)`;
  });
  const end = () => {
    if (sx === null) return;
    const d = dx;
    sx = null;
    card.style.transform = '';
    if (d > 70) fcAnswer(true);
    else if (d < -70) fcAnswer(false);
    else if (Math.abs(d) < 6) fcFlip();
  };
  card.addEventListener('pointerup', end);
  card.addEventListener('pointercancel', () => {
    sx = null;
    card.style.transform = '';
  });
  card.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      fcFlip();
    }
  });
  box.onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.dataset.speak) return;
    if (b.dataset.fc === 'yes') fcAnswer(true);
    else if (b.dataset.fc === 'no') fcAnswer(false);
    else if (b.dataset.fc === 'again') {
      startFlash(FC.mod);
      fcRender();
    } else if (b.dataset.fc === 'retry') {
      startFlash(
        FC.mod,
        FC.res.filter(x => !x.ok).map(x => x.w)
      );
      fcRender();
    }
  };
}
function fcFlip() {
  FC.flipped = !FC.flipped;
  const c = document.getElementById('fcCard');
  if (c) c.classList.toggle('flip', FC.flipped);
  if (FC.flipped && S.set.autoSpeak) {
    const w = FC.cards[FC.i];
    speak(FC.lang === 'ja' ? w.r : w.w, FC.lang);
  }
}
function fcAnswer(ok) {
  if (!FC || FC.i >= FC.cards.length) return;
  const w = FC.cards[FC.i];
  FC.res.push({ w, ok });
  record(w.key, ok);
  sfx(ok ? 'ok' : 'flip');
  FC.i++;
  FC.flipped = false;
  fcRender();
}
function fcSummary(box) {
  const ok = FC.res.filter(x => x.ok).length,
    no = FC.res.length - ok;
  box.innerHTML = `<div class="sum"><div class="sum-score"><b class="num">${ok}</b><span class="num">/ ${FC.res.length}</span></div>
    <p class="sum-msg">${no ? `몰라요 ${no}장은 복습 목록에 넣어 뒀어요.` : '전부 알고 있네요. 하나마루!'}</p>
    ${
      no
        ? `<ul class="miss">${FC.res
            .filter(x => !x.ok)
            .map(
              x =>
                `<li><span class="${FC.lang === 'ja' ? 'jp' : 'en'}" lang="${FC.lang}">${esc(x.w.w)}</span><span class="s">${FC.lang === 'ja' && x.w.w !== x.w.r ? esc(x.w.r) + ' · ' : ''}${esc(x.w.m[0])}</span></li>`
            )
            .join('')}</ul>`
        : ''
    }
    <div class="row">${no ? `<button class="btn primary" data-fc="retry">몰라요 ${no}장 다시</button>` : ''}<button class="btn ${no ? '' : 'primary'}" data-fc="again">새로 ${FC_SIZE}장</button></div></div>`;
}
CUSTOM.flash = renderFlash;
CUSTOM.eflash = renderFlash;
