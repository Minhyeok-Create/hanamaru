'use strict';
/* ================= English grammar: prepositions, tenses, phrasal verbs (fill the blank) ================= */

const EG = {
  eprep: {
    raw: typeof EN_PREP_RAW !== 'undefined' ? EN_PREP_RAW : [],
    key: 'ep:',
    label: '전치사',
    ask: '빈칸에 알맞은 전치사를 고르세요',
    note: 'in/on/at, for/during/since처럼 한국 사람이 자주 헷갈리는 전치사를 문장 속에서 골라요.'
  },
  etense: {
    raw: typeof EN_TENSE_RAW !== 'undefined' ? EN_TENSE_RAW : [],
    key: 'et:',
    label: '시제',
    ask: '빈칸에 알맞은 형태를 고르세요',
    note: 'yesterday, already, every day 같은 시간 표현을 보고 알맞은 시제와 동사 형태를 골라요.'
  },
  ephr: {
    raw: typeof EN_PHR_RAW !== 'undefined' ? EN_PHR_RAW : [],
    key: 'eph:',
    label: '구동사',
    ask: '빈칸에 알맞은 구동사를 고르세요',
    note: 'pick up, find out, get along with처럼 회화에서 자주 쓰는 구동사를 골라요.'
  }
};
for (const [mod, g] of Object.entries(EG)) {
  g.items = g.raw.map(o => ({ ...o, key: g.key + o.s }));
  const topics = [...new Set(g.items.map(x => x.t))];
  POOLS[mod] = full => (full || !S.eg[mod] || !S.eg[mod].length ? g.items : g.items.filter(x => S.eg[mod].includes(x.t)));
  SHOWS[mod] = showEG;
  SETUPS[mod] = () => {
    const sel = S.eg[mod] || [];
    const all = !sel.length;
    return [
      `${g.label} ${g.items.length}문제 · ${all ? '전체' : sel.join('·')}`,
      `<div class="setup-row"><label>주제</label><div class="chips"><button class="chip" data-egt="${mod}:" aria-pressed="${all}">전체</button>${topics.map(t => `<button class="chip" data-egt="${mod}:${esc(t)}" aria-pressed="${!all && sel.includes(t)}">${esc(t)} ${g.items.filter(x => x.t === t).length}</button>`).join('')}</div></div><p class="note">${g.note}</p>`
    ];
  };
  LABELS[mod] = q => [q.s.replace('___', q.a), q.a];
  INFO[mod] = q => {
    const full = q.s.replace('___', q.a);
    return `<p class="fb-big en" lang="en">${esc(q.s).replace('___', `<mark>${esc(q.a)}</mark>`)}</p><p class="fb-sub">${esc(q.k)}</p>
      <p class="fb-sub"><b style="color:var(--ink)">${esc(q.m || q.n || '')}</b></p>${q.m && q.n ? `<p class="fb-sub">${esc(q.n)}</p>` : ''}<div>${spkBtn(full, '문장 듣기', 'en')}</div>`;
  };
  SPEAKQ[mod] = q => [q.s.replace('___', q.a), 'en'];
  AUTO[mod] = 1900;
  CHECK[mod] = (v, s) => genericChoice(mod, -1, s);
}
if (!S.eg || typeof S.eg !== 'object') S.eg = {};

function showEG(mod, q, card, zone, r) {
  const g = EG[mod];
  if (!r.order)
    r.order = shuffle([{ t: q.a, ok: true, cls: 'en', lang: 'en' }, ...q.o.map(t => ({ t, ok: false, cls: 'en', lang: 'en' }))]);
  const sent = esc(q.s).replace('___', `<span class="blank">${r.answered ? esc(q.a) : '？'}</span>`);
  card.innerHTML = `<span class="cat">${g.label} · ${esc(q.t || '')}</span><p class="psent en" lang="en" style="font-family:var(--f-en)">${sent}</p><p class="cap">${esc(q.k)}</p><p class="cap">${g.ask}</p>${MARKS}`;
  zone.dataset.type = 'eg';
  zone.innerHTML = optsHTML(r);
}

// topic chips (setup panel) — handled here so the engine stays generic
document.addEventListener('click', e => {
  const b = e.target.closest('[data-egt]');
  if (!b) return;
  const [mod, t] = b.dataset.egt.split(':');
  let sel = S.eg[mod] || [];
  if (!t) sel = [];
  else if (sel.includes(t)) sel = sel.filter(x => x !== t);
  else sel = [...sel, t];
  S.eg[mod] = sel;
  save();
  R[mod] = null;
  renderModule(mod);
});
