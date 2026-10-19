'use strict';
/* ---------- travel stamps ---------- */
const CITY = {
  ja: [
    [
      'tokyo',
      '東京',
      '도쿄',
      [
        'greet-first-meeting-intro',
        'greet-first-day-office',
        'daily-morning-coworker',
        'social-line-exchange',
        'food-konbini-coffee',
        'shop-clothes-tryon',
        'move-station-transfer'
      ]
    ],
    ['osaka', '大阪', '오사카', ['daily-street-catchup', 'social-dinner-invite', 'food-izakaya-order', 'shop-drugstore-taxfree']],
    ['kyoto', '京都', '교토', ['food-cafe-order', 'sight-shrine-photo', 'move-bus-destination']],
    ['sapporo', '札幌', '삿포로', ['daily-weather-smalltalk', 'shop-konbini-checkout', 'stay-hotel-checkin', 'help-ask-repeat-bus']],
    ['fukuoka', '博多', '하카타', ['food-ramen-ticket', 'stay-room-problem', 'phone-restaurant-reserve']],
    ['naha', '那覇', '나하', ['move-taxi-ride', 'stay-hotel-luggage', 'phone-hotel-inquiry']],
    ['nagoya', '名古屋', '나고야', ['daily-weekend-story', 'food-restaurant-check', 'shop-exchange-size', 'help-lost-way-hotel']],
    ['yokohama', '横浜', '요코하마', ['greet-new-neighbor', 'social-weekend-plans-friend', 'phone-hair-salon', 'help-train-lost-item']],
    ['narita', '成田', '나리타', ['stay-airport-checkin', 'stay-immigration']],
    ['hakone', '箱根', '하코네', ['social-hobby-hiking', 'sight-onsen-rules']],
    ['nara', '奈良', '나라', ['sight-tourist-info', 'health-pharmacy-headache', 'help-koban-lost-wallet']],
    ['hiroshima', '広島', '히로시마', ['sight-museum-ticket', 'phone-reservation-change', 'health-medicine-instructions']],
    ['sendai', '仙台', '센다이', ['greet-long-time-no-see', 'stay-checkout-taxi', 'health-hospital-reception']],
    ['kanazawa', '金沢', '가나자와', ['food-kaiten-sushi', 'move-ask-way-museum', 'health-doctor-symptoms']]
  ],
  en: [
    ['newyork', 'New York', '뉴욕', ['sight-museum-tickets', 'move-subway-ticket', 'food-steak-restaurant', 'shop-discount-checkout']],
    ['london', 'London', '런던', ['greet-old-friend', 'daily-weather-chat', 'sight-city-tour', 'move-bus-driver']],
    [
      'losangeles',
      'Los Angeles',
      '로스앤젤레스',
      ['food-fastfood-to-go', 'food-truck-taco-order', 'sight-photo-request', 'move-taxi-ride']
    ],
    [
      'sanfrancisco',
      'San Francisco',
      '샌프란시스코',
      ['social-hobbies', 'food-cafe-latte-order', 'move-street-directions', 'help-phone-charge']
    ],
    ['chicago', 'Chicago', '시카고', ['greet-class-intro', 'daily-morning-chat', 'food-split-bill-tip', 'health-pharmacy-cold-medicine']],
    ['seattle', 'Seattle', '시애틀', ['daily-weekend-plans', 'social-making-plans', 'health-clinic-checkin', 'health-prescription-pickup']],
    ['boston', 'Boston', '보스턴', ['greet-party-meet', 'health-doctor-symptoms', 'phone-doctor-appointment', 'help-lost-ask-directions']],
    ['honolulu', 'Honolulu', '호놀룰루', ['stay-hotel-checkin', 'shop-gift-wrap', 'stay-luggage-after-checkout', 'stay-late-checkout']],
    ['toronto', 'Toronto', '토론토', ['greet-new-neighbor', 'daily-catching-up', 'social-exchange-contacts', 'social-dinner-decline']],
    [
      'vancouver',
      'Vancouver',
      '밴쿠버',
      ['stay-airline-checkin', 'stay-immigration-interview', 'sight-visitor-center', 'stay-room-problem']
    ],
    ['sydney', 'Sydney', '시드니', ['shop-clothing-size', 'shop-return-item', 'phone-restaurant-booking', 'phone-change-reservation']],
    [
      'dublin',
      'Dublin',
      '더블린',
      ['phone-hotel-front-desk', 'food-allergy-tell-server', 'help-report-lost-wallet', 'help-ask-speak-slowly']
    ]
  ]
};
(function fixCities() {
  for (const lang of ['ja', 'en']) {
    const m = lang === 'ja' ? 'jdlg' : 'edlg';
    const ids = new Set(DLG[m].map(d => d.id));
    const used = new Set();
    for (const c of CITY[lang]) {
      c[3] = c[3].filter(id => ids.has(id));
      c[3].forEach(id => used.add(id));
    }
    const rest = DLG[m].filter(d => !used.has(d.id));
    rest.forEach((d, i) => CITY[lang][i % CITY[lang].length][3].push(d.id));
  }
})();
const dlgByCity = (lang, c) => c[3].map(id => DLG[lang === 'ja' ? 'jdlg' : 'edlg'].find(d => d.id === id)).filter(Boolean);
const dlgDone = d => !!S.stats[d.key];
function cityOf(lang, dlgId) {
  return CITY[lang].find(c => c[3].includes(dlgId));
}
function onDialogueDone(mod, d, first, perfect) {
  const lang = mod === 'jdlg' ? 'ja' : 'en';
  gainXP(perfect ? 30 : 20, lang);
  missionEvent('dialogue');
  if (!first) return;
  const c = cityOf(lang, d.id);
  if (!c) return;
  const ds = dlgByCity(lang, c);
  const n = ds.filter(dlgDone).length;
  setTimeout(() => {
    sfx('stamp');
    toast(n === ds.length ? `${c[2]} 도장 완성! (${n}/${ds.length})` : `${c[2]} 도장을 받았어요 (${n}/${ds.length})`);
  }, 900);
  checkBadges();
}
const stampTotal = lang => CITY[lang].reduce((a, c) => a + dlgByCity(lang, c).filter(dlgDone).length, 0);
function stampSVG(lang, c, size) {
  const ds = dlgByCity(lang, c);
  const n = ds.filter(dlgDone).length;
  const full = n === ds.length && n > 0;
  const rot = ((c[0].charCodeAt(0) * 7 + c[0].length * 13) % 17) - 8;
  const name = c[1];
  const ja = lang === 'ja';
  const fs = ja ? (name.length >= 3 ? 24 : 30) : name.length > 10 ? 11 : name.length > 7 ? 13 : 15;
  if (!n)
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" class="stamp none" aria-hidden="true"><circle cx="50" cy="50" r="44"/><text x="50" y="${ja ? 60 : 55}" text-anchor="middle" font-size="${ja ? fs : fs}" class="${ja ? 'jp' : ''}">${esc(name)}</text></svg>`;
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" class="stamp ${full ? 'full' : 'part'}" style="transform:rotate(${rot}deg)" aria-hidden="true"><circle cx="50" cy="50" r="45" class="o"/><circle cx="50" cy="50" r="38" class="i"/>
    <text x="50" y="${ja ? 58 : 55}" text-anchor="middle" font-size="${fs}" font-weight="700" class="${ja ? 'jp' : ''}">${esc(name)}</text><text x="50" y="78" text-anchor="middle" font-size="9" class="sm">${full ? (ja ? '完' : 'COMPLETE') : n + ' / ' + ds.length}</text><text x="50" y="30" text-anchor="middle" font-size="8" class="sm">${ja ? 'HANAMARU' : 'HANAMARU'}</text></svg>`;
}
let STAMP_SEL = null;
function renderStamps() {
  const pb = document.getElementById('pbody');
  const lang = S.lang;
  const M = lang === 'ja' ? MAP_JA : MAP_EN;
  const cities = CITY[lang];
  if (!STAMP_SEL || !cities.some(c => c[0] === STAMP_SEL)) STAMP_SEL = null;
  const tot = cities.reduce((a, c) => a + dlgByCity(lang, c).length, 0);
  const got = stampTotal(lang);
  const fullN = cities.filter(c => {
    const ds = dlgByCity(lang, c);
    return ds.length && ds.every(dlgDone);
  }).length;
  const dot = c => {
    const [x, y] = M.c[c[0]] || [0, 0];
    const ds = dlgByCity(lang, c);
    const n = ds.filter(dlgDone).length;
    const st = n === ds.length && n ? 'full' : n ? 'part' : 'none';
    return `<g class="pin ${st} ${STAMP_SEL === c[0] ? 'sel' : ''}" data-city="${c[0]}" role="button" aria-label="${c[2]}"><circle cx="${x}" cy="${y}" r="11" class="hit"/><circle cx="${x}" cy="${y}" r="${st === 'none' ? 4 : 5.5}" class="dot"/>${STAMP_SEL === c[0] ? `<circle cx="${x}" cy="${y}" r="10" class="ring"/>` : ''}</g>`;
  };
  const sel = STAMP_SEL && cities.find(c => c[0] === STAMP_SEL);
  pb.innerHTML = `<div class="chart">
    <div class="kpis" style="margin-top:0"><div class="kpi"><b class="num">${got}</b><span>받은 도장 / ${tot}</span></div><div class="kpi"><b class="num">${fullN}</b><span>완성한 도시 / ${cities.length}</span></div><div class="kpi"><b class="num">${tot ? Math.round((got / tot) * 100) : 0}%</b><span>여행 진행</span></div></div>
    <div class="map-box"><svg viewBox="0 0 ${M.w} ${M.h}" class="map" role="img" aria-label="${lang === 'ja' ? '일본 지도' : '세계 지도'}"><path d="${M.d}" class="land"/>${M.oki ? `<rect x="${M.box[0]}" y="${M.box[1]}" width="${M.box[2]}" height="${M.box[3]}" rx="6" class="inset"/><path d="${M.oki}" class="land"/><text x="${M.box[0] + 6}" y="${M.box[1] + 14}" font-size="10" class="lbl">오키나와</text>` : ''}${cities.map(dot).join('')}${
      sel
        ? (() => {
            const [x, y] = M.c[sel[0]];
            const left = x > M.w * 0.62;
            return `<text x="${left ? x - 14 : x + 14}" y="${y + 4}" text-anchor="${left ? 'end' : 'start'}" class="sel-lbl">${esc(sel[2])}</text>`;
          })()
        : ''
    }</svg>
      <p class="note">${lang === 'ja' ? '회화 탭의 대화 연습을 끝까지 하면 그 대화가 열리는 도시에 도장이 찍혀요.' : '회화 탭의 영어 대화를 끝까지 하면 그 도시에 도장이 찍혀요.'} 지도의 점이나 아래 도장을 눌러 보세요.</p></div>
    ${
      sel
        ? `<section class="chart-box city-box"><div class="city-h">${stampSVG(lang, sel, 84)}<div><b style="font-size:19px">${esc(sel[2])}</b><span class="note">${lang === 'ja' ? `<span class="jp">${esc(sel[1])}</span> · ` : ''}대화 ${dlgByCity(lang, sel).length}개</span></div></div>
      <div class="wl">${dlgByCity(lang, sel)
        .map(
          d =>
            `<div class="wl-i" data-st="${dlgDone(d) ? 'done' : ''}"><button class="wl-main" data-sdlg="${esc(d.id)}"><span class="w" style="font-size:16px;font-weight:600">${esc(d.title)}</span><span class="s">${SCENES[d.sc] || ''} · ${dlgDone(d) ? '도장 받음 · 다시 하기' : '대화 시작'}</span></button><span></span></div>`
        )
        .join('')}</div></section>`
        : ''
    }
    <div class="stamp-grid">${cities
      .map(c => {
        const ds = dlgByCity(lang, c);
        const n = ds.filter(dlgDone).length;
        return `<button type="button" class="stamp-cell ${STAMP_SEL === c[0] ? 'sel' : ''}" data-city="${c[0]}">${stampSVG(lang, c, 74)}<span>${esc(c[2])}</span><small class="num">${n} / ${ds.length}</small></button>`;
      })
      .join('')}</div>
  </div>`;
  pb.onclick = e => {
    const g = e.target.closest('[data-city]');
    if (g) {
      STAMP_SEL = STAMP_SEL === g.dataset.city ? null : g.dataset.city;
      renderStamps();
      if (STAMP_SEL) {
        const cb = document.querySelector('.city-box');
        if (cb)
          try {
            cb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          } catch (err) {}
      }
      return;
    }
    const b = e.target.closest('[data-sdlg]');
    if (b) {
      const m = lang === 'ja' ? 'jdlg' : 'edlg';
      const d = DLG[m].find(x => x.id === b.dataset.sdlg);
      if (d) {
        DG = null;
        startMod(m);
        startDlg(m, d);
      }
    }
  };
}
