'use strict';
/* ---------- grammar notes ---------- */
let GN_LVL = '5';
function renderGNote() {
  const vb = document.getElementById('vbody');
  const list = GRAM.filter(g => String(g.lvl) === GN_LVL);
  vb.innerHTML = `<div class="chart"><div class="seg" role="group" aria-label="급수">${[
    ['5', 'N5'],
    ['4', 'N4']
  ]
    .map(
      ([v, l]) =>
        `<button data-gnl="${v}" aria-pressed="${GN_LVL === v}">${l} 문법 ${GRAM.filter(g => String(g.lvl) === v).length}</button>`
    )
    .join('')}</div><p class="note">눌러서 만드는 법과 예문을 보고, 바로 그 문법 퀴즈를 풀 수 있어요.</p><div class="wl">${list
    .map(g => {
      const gi = GRAM.indexOf(g);
      const ks = GRAM_ITEMS.filter(x => x.g === g).map(x => x.key);
      const d = doneCount(ks);
      return `<div class="wl-i" data-st="${d === ks.length && d ? 'done' : ks.some(k => S.stats[k]) ? 'learn' : ''}"><button class="wl-main" data-gopen><span class="w jp" lang="ja">${esc(g.p)}</span><span class="s">${esc(g.name)}</span></button><span></span>
    <div class="wl-ex" hidden><p class="fb-sub" style="margin:0">${esc(g.form)}</p><p class="fb-sub" style="margin:0;color:var(--ink)">${esc(g.exp)}</p>${g.ex.map(e => `<span class="ex-jp" lang="ja" style="font-size:16px">${esc(e[0])}</span><span class="ex-rd" lang="ja">${esc(e[1])}</span><span class="ex-ko">${esc(e[2])}</span>`).join('')}
      <div class="row" style="margin-top:6px">${spkBtn(g.ex.map(e => e[0]).join(' '), '예문 듣기')}<button class="btn" data-gquiz="${gi}">이 문법 퀴즈</button></div></div></div>`;
    })
    .join('')}</div></div>`;
  vb.onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.dataset.speak) return;
    if (b.dataset.gnl) {
      GN_LVL = b.dataset.gnl;
      renderGNote();
      return;
    }
    if (b.dataset.gquiz !== undefined) {
      const g = GRAM[+b.dataset.gquiz];
      PENDING.gram = GRAM_ITEMS.filter(x => x.g === g);
      R.gram = null;
      S.filt.gram = 'all';
      startMod('gram');
    } else if ('gopen' in b.dataset) {
      const row = b.closest('.wl-i');
      const ex = row.querySelector('.wl-ex');
      const show = ex.hidden;
      vb.querySelectorAll('.wl-i.hit').forEach(x => {
        x.classList.remove('hit');
        x.querySelector('.wl-ex').hidden = true;
      });
      if (show) {
        row.classList.add('hit');
        ex.hidden = false;
      }
    }
  };
}
