'use strict';
/* ================= romaji ================= */
const R1 = {},
  R2 = {};
for (const x of KANA) {
  (x.h.length === 1 ? R1 : R2)[x.h] = x.alts[0];
}
Object.assign(R1, { ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o', ゃ: 'ya', ゅ: 'yu', ょ: 'yo', ゎ: 'wa', ゔ: 'vu', を: 'o' });
Object.assign(R2, {
  てぃ: 'ti',
  でぃ: 'di',
  ふぁ: 'fa',
  ふぃ: 'fi',
  ふぇ: 'fe',
  ふぉ: 'fo',
  うぃ: 'wi',
  うぇ: 'we',
  うぉ: 'wo',
  しぇ: 'she',
  じぇ: 'je',
  ちぇ: 'che',
  ぢゃ: 'ja',
  ぢゅ: 'ju',
  ぢょ: 'jo',
  つぁ: 'tsa',
  ゔぁ: 'va',
  ゔぃ: 'vi',
  ゔぇ: 've',
  ゔぉ: 'vo',
  とぅ: 'tu',
  どぅ: 'du',
  いぇ: 'ye'
});
const PUNCT = { '。': '.', '、': ',', '？': '?', '！': '!', '・': ' ', '…': '…', '「': '"', '」': '"', '〜': '~' };
const SPECIAL = { は: 'wa', へ: 'e', を: 'o', では: 'dewa', には: 'niwa', とは: 'towa', こんにちは: 'konnichiwa', こんばんは: 'konbanwa' };
function conv(s) {
  s = toHira(s);
  let out = '',
    i = 0,
    soku = false;
  const push = r => {
    if (soku) {
      out += r.startsWith('ch') ? 't' : r[0];
      soku = false;
    }
    out += r;
  };
  while (i < s.length) {
    const two = s.substr(i, 2),
      one = s[i];
    if (R2[two]) {
      push(R2[two]);
      i += 2;
      continue;
    }
    if (one === 'っ') {
      soku = true;
      i++;
      continue;
    }
    if (one === 'ー') {
      const m = out.match(/[aeiou](?=[^aeiou]*$)/);
      out += m ? m[0] : '';
      i++;
      continue;
    }
    if (R1[one]) push(R1[one]);
    else out += PUNCT[one] ?? one;
    i++;
  }
  return out;
}
function romaji(str) {
  return str
    .trim()
    .split(/\s+/)
    .map(tok => {
      const m = tok.match(/^(.*?)([。、？！…]*)$/);
      const core = m[1],
        tail = m[2];
      return (SPECIAL[toHira(core)] ?? conv(core)) + conv(tail);
    })
    .join(' ')
    .replace(/\s+([.,?!])/g, '$1');
}
const stripP = s => s.replace(/[。、？！?!.,…]+$/, '').replace(/^[「"]+|[」"]+$/g, '');
const stripAll = s => s.replace(/[。、？！?!.,…・「」\s]/g, '');
let IDX = null;
