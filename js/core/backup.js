'use strict';
/* backup */
function b64enc(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function b64dec(b) {
  const bin = atob(b);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
function makeCode() {
  const st = Object.entries(S.stats).map(([k, v]) => [k, v.c, v.w, v.s, v.iv ?? 0, v.d ?? 0]);
  return (
    'HM2.' +
    b64enc(
      JSON.stringify({
        s: st,
        d: S.days,
        c: S.custom,
        f: Object.keys(S.fav),
        b: S.best,
        g: S.goalDays,
        bd: S.badges,
        co: S.course,
        x: S.xp,
        cd: S.cards,
        tk: S.tickets,
        om: S.omiDays,
        gb: S.gbest
      })
    )
  );
}
function readCode(code) {
  code = code.replace(/\s+/g, '');
  const m = code.match(/^HM([12])\.(.+)$/);
  if (!m) throw new Error('format');
  const o = JSON.parse(b64dec(m[2]));
  if (!Array.isArray(o.s)) throw new Error('format');
  return o;
}
function mergeBackup(o) {
  let n = 0;
  for (const [k, c, w, s, iv, d] of o.s) {
    if (typeof k !== 'string') continue;
    const cur = S.stats[k];
    if (!cur || c + w > cur.c + cur.w) {
      S.stats[k] = { c: +c || 0, w: +w || 0, s: +s || 0, iv: +iv || 0, d: d ? +d : dayIdx() };
      n++;
    }
  }
  for (const [day, v] of Object.entries(o.d || {})) {
    const cur = S.days[day];
    if (v && (!cur || v.n > cur.n)) S.days[day] = { n: +v.n || 0, c: +v.c || 0 };
  }
  if (o.c) {
    for (const c of o.c.ja || [])
      if (c && c.w && !S.custom.ja.some(x => x.w === c.w && x.r === c.r))
        S.custom.ja.push({ w: String(c.w), r: String(c.r), m: String(c.m) });
    for (const c of o.c.en || []) if (c && c.w && !S.custom.en.some(x => x.w === c.w)) S.custom.en.push({ w: String(c.w), m: String(c.m) });
  }
  for (const k of o.f || []) S.fav[k] = 1;
  for (const [k, v] of Object.entries(o.b || {})) S.best[k] = Math.max(S.best[k] || 0, +v || 0);
  Object.assign(S.goalDays, o.g || {});
  for (const b of o.bd || []) if (!S.badges.includes(b)) S.badges.push(b);
  for (const l of ['ja', 'en']) {
    if (o.x && +o.x[l] > S.xp[l]) S.xp[l] = +o.x[l];
    if (o.tk && +o.tk[l] > S.tickets[l]) S.tickets[l] = +o.tk[l];
    if (o.cd && o.cd[l]) for (const [id, n] of Object.entries(o.cd[l])) S.cards[l][id] = Math.max(S.cards[l][id] || 0, +n || 0);
    if (o.om && o.om[l]) Object.assign(S.omiDays[l], o.om[l]);
  }
  if (o.gb && typeof o.gb === 'object') for (const [k, v] of Object.entries(o.gb)) if (S.gbest[k] === undefined) S.gbest[k] = v;
  if (o.co && typeof o.co === 'object')
    for (const l of ['ja', 'en'])
      for (const [di, a] of Object.entries(o.co[l] || {})) {
        if (!Array.isArray(a)) continue;
        const cur = S.course[l][di] || (S.course[l][di] = []);
        a.forEach((v, i) => {
          if (v) cur[i] = 1;
        });
      }
  rebuildWords();
  save();
  return n;
}
