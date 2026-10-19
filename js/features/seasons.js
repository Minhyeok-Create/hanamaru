'use strict';
/* ================= seasonal events: home banner, limited cards, special omikuji ================= */

// [key, from (month, day), to (month, day), accent emoji-free label]
const SEASONS = [
  { id: 'newyear', from: [1, 1], to: [1, 15], ja: 'お正月' },
  { id: 'spring', from: [3, 20], to: [4, 20], ja: 'お花見' },
  { id: 'summer', from: [7, 15], to: [8, 31], ja: '夏祭り' },
  { id: 'halloween', from: [10, 10], to: [10, 31], ja: 'ハロウィン' },
  { id: 'autumn', from: [11, 1], to: [11, 30], ja: '秋' },
  { id: 'christmas', from: [12, 10], to: [12, 31], ja: 'クリスマス' }
];
const SEASON_CARDS = {
  ja: typeof SEASON_CARDS_JA !== 'undefined' ? SEASON_CARDS_JA : [],
  en: typeof SEASON_CARDS_EN !== 'undefined' ? SEASON_CARDS_EN : []
};
const SEASON_DRAW_CHANCE = 0.3;

function activeSeason(d = new Date()) {
  const md = (d.getMonth() + 1) * 100 + d.getDate();
  return SEASONS.find(s => md >= s.from[0] * 100 + s.from[1] && md <= s.to[0] * 100 + s.to[1]) || null;
}
const seasonCards = (lang, id) => SEASON_CARDS[lang].filter(c => c.season === id);
const seasonMsg = id => (typeof SEASON_MSGS !== 'undefined' && SEASON_MSGS[id]) || null;
const seasonEnd = s => `${s.to[0]}월 ${s.to[1]}일`;

function seasonBannerHTML() {
  const s = activeSeason();
  if (!s) return '';
  const msg = seasonMsg(s.id);
  if (!msg) return '';
  const lang = S.lang,
    ja = lang === 'ja',
    g = msg[lang] || msg.ja;
  const cards = seasonCards(lang, s.id),
    got = cards.filter(c => S.cards[lang][c.id]).length;
  return `<section class="season s-${s.id}"><div class="ss-top"><span class="ss-tag">${esc(msg.title)} · ${seasonEnd(s)}까지</span></div>
    <p class="ss-g ${ja ? 'jp' : 'en'}" lang="${lang}">${esc(g.t)}</p>${ja && g.r && g.r.replace(/\s/g, '') !== g.t ? `<p class="ss-r jp" lang="ja">${esc(g.r)}</p>` : ''}<p class="ss-k">${esc(g.k)}</p>
    <div class="ss-bot"><span class="note">${esc(msg.desc)}</span>${spkBtn(g.t, '', lang)}</div>
    ${cards.length ? `<button class="btn" data-goplay="cards">한정 카드 ${got} / ${cards.length}</button>` : ''}</section>`;
}

// During an event, some draws come from the event's limited cards.
function seasonPickCard(lang) {
  const s = activeSeason();
  if (!s) return null;
  const cards = seasonCards(lang, s.id);
  if (!cards.length || Math.random() >= SEASON_DRAW_CHANCE) return null;
  const fresh = cards.filter(c => !S.cards[lang][c.id]);
  const pool = fresh.length && Math.random() < 0.7 ? fresh : cards;
  return pool[(Math.random() * pool.length) | 0];
}
const allCards = lang => CARDS[lang].concat(SEASON_CARDS[lang]);
