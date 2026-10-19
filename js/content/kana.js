'use strict';
/* ================= kana ================= */
const BASIC =
  'あ a,い i,う u,え e,お o,か ka,き ki,く ku,け ke,こ ko,さ sa,し shi/si,す su,せ se,そ so,た ta,ち chi/ti,つ tsu/tu,て te,と to,な na,に ni,ぬ nu,ね ne,の no,は ha,ひ hi,ふ fu/hu,へ he,ほ ho,ま ma,み mi,む mu,め me,も mo,や ya,ゆ yu,よ yo,ら ra,り ri,る ru,れ re,ろ ro,わ wa,を wo/o,ん n/nn';
const DAKU =
  'が ga,ぎ gi,ぐ gu,げ ge,ご go,ざ za,じ ji/zi,ず zu,ぜ ze,ぞ zo,だ da,ぢ ji/di/zi,づ zu/du,で de,ど do,ば ba,び bi,ぶ bu,べ be,ぼ bo,ぱ pa,ぴ pi,ぷ pu,ぺ pe,ぽ po';
const YOON =
  'きゃ kya,きゅ kyu,きょ kyo,しゃ sha/sya,しゅ shu/syu,しょ sho/syo,ちゃ cha/tya/cya,ちゅ chu/tyu/cyu,ちょ cho/tyo/cyo,にゃ nya,にゅ nyu,にょ nyo,ひゃ hya,ひゅ hyu,ひょ hyo,みゃ mya,みゅ myu,みょ myo,りゃ rya,りゅ ryu,りょ ryo,ぎゃ gya,ぎゅ gyu,ぎょ gyo,じゃ ja/zya/jya,じゅ ju/zyu/jyu,じょ jo/zyo/jyo,びゃ bya,びゅ byu,びょ byo,ぴゃ pya,ぴゅ pyu,ぴょ pyo';
const PROMPT_OVR = { ぢ: 'di', づ: 'du' };
const parseKana = (s, set) =>
  s.split(',').map(t => {
    const [h, r] = t.split(' ');
    const alts = r.split('/');
    return { h, alts, set, prompt: PROMPT_OVR[h] || alts[0] };
  });
const KANA = [...parseKana(BASIC, 'basic'), ...parseKana(DAKU, 'daku'), ...parseKana(YOON, 'yoon')];
const SETS = { basic: '기본 46', daku: '탁음·반탁음 25', yoon: '요음 33' };
const toKata = s => s.replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));
const toHira = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
const kanaRom = c => {
  const x = KANA.find(k => k.h === toHira(c));
  return x ? x.alts[0] : '';
};
const CONF = [
  ['h', ['ぬ', 'め'], 'ぬ(nu)는 끝에 작은 고리가 있고, め(me)는 고리 없이 끝나요.'],
  ['h', ['わ', 'れ', 'ね'], '오른쪽 끝을 보세요. わ(wa)는 둥글게 닫히고, れ(re)는 바깥으로 뻗고, ね(ne)는 작은 고리로 끝나요.'],
  ['h', ['は', 'ほ'], 'ほ(ho)는 오른쪽 위에 가로획이 하나 더 있어요.'],
  ['h', ['さ', 'き', 'ち'], 'き(ki)는 가로획이 두 개, さ(sa)는 하나예요. ち(chi)는 さ를 좌우로 뒤집은 모양이에요.'],
  ['h', ['る', 'ろ'], 'る(ru)는 끝에 고리가 있고, ろ(ro)는 고리가 없어요.'],
  ['h', ['い', 'り'], 'り(ri)는 오른쪽 획이 길게 내려와요.'],
  ['h', ['こ', 'に'], 'に(ni)는 왼쪽에 세로획이 하나 더 있어요.'],
  ['h', ['あ', 'お'], 'お(o)는 오른쪽 위에 점이 있어요.'],
  ['h', ['ま', 'も'], 'ま(ma)는 세로획이 가로획을 뚫고 아래에 고리가 있고, も(mo)는 세로획이 휘어 올라가요.'],
  ['h', ['う', 'つ', 'ら'], 'つ(tsu)는 한 획이에요. う(u)는 위에 점이 있고, ら(ra)는 왼쪽에 짧은 세로획이 있어요.'],
  [
    'k',
    ['シ', 'ツ'],
    'シ(shi)는 점이 왼쪽에 세로로 놓이고 긴 획이 아래에서 위로 올라가요. ツ(tsu)는 점이 위에 나란히 놓이고 긴 획이 위에서 아래로 내려가요.'
  ],
  ['k', ['ソ', 'ン'], 'ン(n)은 긴 획이 아래에서 위로 올라가고, ソ(so)는 위에서 아래로 내려가요.'],
  ['k', ['ク', 'ケ', 'タ'], 'ケ(ke)는 가로획이 오른쪽으로 길게 나가고, タ(ta)는 ク(ku) 안에 짧은 획이 하나 더 있어요.'],
  ['k', ['ウ', 'ワ', 'フ'], 'ウ(u)는 위에 점이 있고, ワ(wa)는 왼쪽에 짧은 세로획이 있고, フ(fu)는 한 획이에요.'],
  ['k', ['ス', 'ヌ'], 'ヌ(nu)는 가운데를 가로지르는 짧은 획이 있어요.'],
  ['k', ['チ', 'テ'], 'チ(chi)는 위 획이 비스듬하고 세로획이 휘어요. テ(te)는 가로획 두 개가 평평해요.'],
  ['k', ['コ', 'ユ', 'ロ'], 'ロ(ro)는 네모가 닫혀 있고, ユ(yu)는 아래 가로획이 길게 튀어나와요.'],
  ['k', ['ノ', 'メ', 'ナ'], 'ノ(no)는 한 획, メ(me)는 짧은 획이 가로지르고, ナ(na)는 가로획에 세로획이 지나가요.'],
  ['k', ['マ', 'ア'], 'ア(a)는 왼쪽 아래로 긴 획이 내려와요.'],
  ['k', ['ル', 'レ'], 'ル(ru)는 두 획, レ(re)는 한 획이에요.'],
  ['k', ['セ', 'サ'], 'サ(sa)는 세로획이 두 개, セ(se)는 하나예요.'],
  ['k', ['ヨ', 'ヲ'], 'ヨ(yo)는 가로획 세 개, ヲ(wo)는 가로획 두 개에 비스듬한 획이 있어요.']
];
