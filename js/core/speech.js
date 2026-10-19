'use strict';
/* ================= speech, toast, clipboard ================= */
const hasTTS = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
const voices = { ja: null, en: null };
function pickVoice() {
  try {
    const vs = speechSynthesis.getVoices();
    voices.ja = vs.find(v => /^ja/i.test(v.lang) && /Kyoko|O-ren|Otoya|Hattori/i.test(v.name)) || vs.find(v => /^ja/i.test(v.lang)) || null;
    voices.en =
      vs.find(v => /^en[-_]US/i.test(v.lang) && /Samantha|Ava|Allison|Nicky|Aaron/i.test(v.name)) ||
      vs.find(v => /^en[-_]US/i.test(v.lang)) ||
      vs.find(v => /^en/i.test(v.lang)) ||
      null;
  } catch (e) {}
}
if (hasTTS) {
  pickVoice();
  try {
    speechSynthesis.addEventListener('voiceschanged', pickVoice);
  } catch (e) {}
}
function speakSeq(texts, lang) {
  if (!hasTTS || !texts.length) return;
  try {
    speechSynthesis.cancel();
    for (const t of texts) {
      const u = new SpeechSynthesisUtterance(t);
      u.lang = lang === 'en' ? 'en-US' : 'ja-JP';
      if (voices[lang]) u.voice = voices[lang];
      u.rate = S.set.slow ? (lang === 'en' ? 0.7 : 0.6) : lang === 'en' ? 0.95 : 0.9;
      speechSynthesis.speak(u);
    }
  } catch (e) {}
}
function speak(text, lang = 'ja', slow = false) {
  if (!hasTTS || !text) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'en' ? 'en-US' : 'ja-JP';
    if (voices[lang]) u.voice = voices[lang];
    u.rate = slow || S.set.slow ? (lang === 'en' ? 0.7 : 0.6) : lang === 'en' ? 0.95 : 0.9;
    speechSynthesis.speak(u);
  } catch (e) {}
}
const SPK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>';
const PLAY_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l12.5-7.5z"/></svg>';
const spkBtn = (t, label = '발음 듣기', lang = 'ja') =>
  hasTTS ? `<button type="button" class="spk" data-speak="${esc(t)}" data-lang="${lang}">${SPK_ICON}${label}</button>` : '';
function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    t.setAttribute('role', 'status');
    document.body.appendChild(t);
  }
  t.textContent = msg;
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2800);
}
function copyText(text, okMsg, onFail) {
  try {
    navigator.clipboard.writeText(text).then(
      () => toast(okMsg),
      () => onFail()
    );
  } catch (e) {
    onFail();
  }
}
function applyLook() {
  const root = document.documentElement;
  if (S.set.theme === 'auto') {
    if (root.dataset.hmTheme) {
      root.removeAttribute('data-theme');
      delete root.dataset.hmTheme;
    }
  } else {
    root.setAttribute('data-theme', S.set.theme);
    root.dataset.hmTheme = '1';
  }
  root.style.setProperty('--zoom', S.set.zoom);
}
