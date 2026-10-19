'use strict';
/* ================= pure logic: conjugation, numbers, dictation ================= */
const U_ROW = 'うくぐすつぬぶむる';
const I_E_ROW = 'いきぎしじちぢにひびぴみりえけげせぜてでねへべぺめれ';
const GODAN_EX = new Set([
  '帰る',
  '入る',
  '走る',
  '知る',
  '切る',
  '要る',
  '減る',
  '喋る',
  '滑る',
  '握る',
  '蹴る',
  '焦る',
  '限る',
  '参る',
  '散る',
  '練る',
  '照る',
  '茂る',
  '遮る',
  'しゃべる',
  'かえる',
  'はいる',
  'はしる'
]);
const TO_I = { う: 'い', く: 'き', ぐ: 'ぎ', す: 'し', つ: 'ち', ぬ: 'に', ぶ: 'び', む: 'み', る: 'り' };
const TO_A = { う: 'わ', く: 'か', ぐ: 'が', す: 'さ', つ: 'た', ぬ: 'な', ぶ: 'ば', む: 'ま', る: 'ら' };
const TE = { う: 'って', つ: 'って', る: 'って', く: 'いて', ぐ: 'いで', す: 'して', ぬ: 'んで', ぶ: 'んで', む: 'んで' };
const TO_E = { う: 'え', く: 'け', ぐ: 'げ', す: 'せ', つ: 'て', ぬ: 'ね', ぶ: 'べ', む: 'め', る: 'れ' };
const TO_O = { う: 'お', く: 'こ', ぐ: 'ご', す: 'そ', つ: 'と', ぬ: 'の', ぶ: 'ぼ', む: 'も', る: 'ろ' };
const FORMS = {
  masu: '~ます (정중형)',
  te: '~て (연결형)',
  nai: '~ない (부정형)',
  ta: '~た (과거형)',
  pot: '~える·~られる (가능형 N4)',
  vol: '~おう·~よう (의지형 N4)'
};
const FORM_SHORT = { masu: 'ます형', te: 'て형', nai: 'ない형', ta: 'た형', pot: '가능형', vol: '의지형' };
// verbs that are not used in the potential / volitional form (things that just happen)
const NO_PV = new Set([
  'ある',
  'わかる',
  '分かる',
  'できる',
  '出来る',
  '要る',
  '見える',
  '聞こえる',
  '似る',
  '違う',
  '困る',
  '疲れる',
  '晴れる',
  '曇る',
  '降る',
  '咲く',
  '光る',
  '鳴る',
  '壊れる',
  '止まる',
  '始まる',
  '終わる',
  '開く',
  '閉まる',
  '落ちる',
  '消える',
  '死ぬ',
  '空く',
  '込む',
  '混む',
  '似合う',
  '足りる',
  '冷える',
  '治る',
  '直る',
  '驚く',
  '生まれる',
  '亡くなる',
  '無くなる',
  'なくなる',
  '怒る',
  '太る',
  '痩せる',
  '割れる',
  '汚れる',
  '揺れる',
  '倒れる',
  '慌てる',
  '間に合う',
  'かかる',
  '掛かる',
  '知る'
]);
function verbGroup(w, r) {
  if (r === 'くる' && /来る$/.test(w)) return 'kuru';
  if (/する$/.test(r)) return 'suru';
  const last = r.slice(-1);
  if (!U_ROW.includes(last)) return null;
  if (last === 'る' && I_E_ROW.includes(r.slice(-2, -1)) && !GODAN_EX.has(w) && !GODAN_EX.has(r)) return 'ichi';
  return 'godan';
}
const teToTa = s => s.replace(/て$/, 'た').replace(/で$/, 'だ');
function conjOne(base, group, form, isIku, isAru) {
  const stem = base.slice(0, -1),
    last = base.slice(-1);
  if (group === 'suru') {
    const p = base.slice(0, -2);
    return p + { masu: 'します', te: 'して', nai: 'しない', ta: 'した', pot: 'できる', vol: 'しよう' }[form];
  }
  if (group === 'ichi') return stem + { masu: 'ます', te: 'て', nai: 'ない', ta: 'た', pot: 'られる', vol: 'よう' }[form];
  if (form === 'pot') return stem + TO_E[last] + 'る';
  if (form === 'vol') return stem + TO_O[last] + 'う';
  if (form === 'masu') return stem + TO_I[last] + 'ます';
  if (form === 'nai') return isAru ? 'ない' : stem + TO_A[last] + 'ない';
  const te = isIku ? stem + 'って' : stem + TE[last];
  return form === 'te' ? te : teToTa(te);
}
function conjugate(v, form) {
  const g = verbGroup(v.w, v.r);
  if (!g) return null;
  if ((form === 'pot' || form === 'vol') && (NO_PV.has(v.w) || NO_PV.has(v.r))) return null;
  if (g === 'kuru') {
    const t = {
      masu: ['来ます', 'きます'],
      te: ['来て', 'きて'],
      nai: ['来ない', 'こない'],
      ta: ['来た', 'きた'],
      pot: ['来られる', 'こられる'],
      vol: ['来よう', 'こよう']
    }[form];
    const p = v.w.slice(0, -2);
    return { w: p + t[0], r: v.r.slice(0, -2) + t[1] };
  }
  const isIku = v.r === 'いく' || /行く$/.test(v.w);
  const isAru = v.r === 'ある';
  return { w: conjOne(v.w, g, form, isIku, (isAru && v.w === 'ある') || isAru), r: conjOne(v.r, g, form, isIku, isAru) };
}
function conjWrongs(v, form) {
  const g = verbGroup(v.w, v.r);
  const out = [];
  const right = conjugate(v, form);
  const add = (w, r) => {
    if (w && r && r !== right.r && !out.some(o => o.r === r)) out.push({ w, r });
  };
  if (g === 'godan' || g === 'ichi') {
    const other = g === 'godan' ? 'ichi' : 'godan';
    if (!(other === 'godan' && !TO_I[v.r.slice(-1)]) && !(form === 'pot' && (g === 'ichi' || v.r.slice(-1) === 'る')))
      add(conjOne(v.w, other, form, false, false), conjOne(v.r, other, form, false, false));
    if ((form === 'te' || form === 'ta') && g === 'godan') {
      for (const e of ['って', 'いて', 'んで', 'して']) {
        const t = v.r.slice(0, -1) + e,
          tw = v.w.slice(0, -1) + e;
        add(form === 'te' ? tw : teToTa(tw), form === 'te' ? t : teToTa(t));
      }
    }
    if (form === 'nai' && g === 'godan') {
      add(v.w.slice(0, -1) + TO_I[v.r.slice(-1)] + 'ない', v.r.slice(0, -1) + TO_I[v.r.slice(-1)] + 'ない');
    }
    if (form === 'masu' && g === 'godan') {
      add(v.w.slice(0, -1) + 'ます', v.r.slice(0, -1) + 'ます');
    }
    if (form === 'masu' && g === 'ichi') {
      add(v.w.slice(0, -1) + 'ります', v.r.slice(0, -1) + 'ります');
    }
    if ((form === 'pot' || form === 'vol') && g === 'godan') {
      const i = TO_I[v.r.slice(-1)],
        e = form === 'pot' ? 'られる' : 'よう';
      add(v.w.slice(0, -1) + i + e, v.r.slice(0, -1) + i + e);
    }
  }
  for (const f of Object.keys(FORMS))
    if (f !== form) {
      const c = conjugate(v, f);
      if (c) add(c.w, c.r);
    }
  if (g === 'suru') {
    const p = v.w.slice(0, -2),
      pr = v.r.slice(0, -2);
    if (form === 'pot') {
      add(p + 'しられる', pr + 'しられる');
      add(p + 'する', pr + 'する');
    } else if (form === 'vol') {
      add(p + 'しろう', pr + 'しろう');
      add(p + 'すよう', pr + 'すよう');
    } else {
      add(p + 'すます', pr + 'すます');
      add(p + 'さない', pr + 'さない');
      add(p + 'すて', pr + 'すて');
    }
  }
  if (g === 'kuru') {
    if (form === 'pot') {
      add('くられる', 'くられる');
      add('きられる', 'きられる');
    } else if (form === 'vol') {
      add('くよう', 'くよう');
      add('きよう', 'きよう');
    } else {
      add('来ります', 'くります');
      add('来ない', 'くない');
      add('来って', 'くって');
    }
  }
  return out;
}
