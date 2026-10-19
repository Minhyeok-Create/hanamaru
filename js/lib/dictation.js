'use strict';
/* dictation */
const EN_CONTR = {
  "i'm": 'i am',
  "you're": 'you are',
  "we're": 'we are',
  "they're": 'they are',
  "he's": 'he is',
  "she's": 'she is',
  "it's": 'it is',
  "that's": 'that is',
  "what's": 'what is',
  "where's": 'where is',
  "how's": 'how is',
  "there's": 'there is',
  "here's": 'here is',
  "let's": 'let us',
  "i'll": 'i will',
  "you'll": 'you will',
  "we'll": 'we will',
  "it'll": 'it will',
  "i'd": 'i would',
  "you'd": 'you would',
  "i've": 'i have',
  "you've": 'you have',
  "we've": 'we have',
  "don't": 'do not',
  "doesn't": 'does not',
  "didn't": 'did not',
  "can't": 'cannot',
  "won't": 'will not',
  "isn't": 'is not',
  "aren't": 'are not',
  "wasn't": 'was not',
  "weren't": 'were not',
  "couldn't": 'could not',
  "wouldn't": 'would not',
  "shouldn't": 'should not',
  "haven't": 'have not',
  "hasn't": 'has not'
};
const enWords = s =>
  s
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9' ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .flatMap(w => (EN_CONTR[w] || w).split(' '))
    .map(w => (w === 'can' ? w : w))
    .join(' ')
    .replace(/\bcan not\b/g, 'cannot')
    .split(' ')
    .filter(Boolean);
function lcsMark(a, b) {
  const n = a.length,
    m = b.length,
    dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const inA = new Array(n).fill(false),
    inB = new Array(m).fill(false);
  let i = 0,
    j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      inA[i] = inB[j] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return { inA, inB };
}

const SCENES = {
  greet: '인사·소개',
  daily: '일상 대화',
  social: '친구·취미',
  food: '식당·카페',
  shop: '쇼핑',
  sight: '관광·구경',
  move: '길·교통',
  stay: '공항·호텔',
  phone: '전화·예약',
  health: '병원·약국',
  help: '곤란할 때'
};
