'use strict';
/* ---------- sound effects (WebAudio, no files) ---------- */
let AC = null;
function audio() {
  try {
    if (!AC) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      AC = new C();
    }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  } catch (e) {
    return null;
  }
}
function tone(a, f, t, d, type = 'sine', g = 0.13, f2) {
  const o = a.createOscillator(),
    v = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, a.currentTime + t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, a.currentTime + t + d);
  v.gain.setValueAtTime(0.0001, a.currentTime + t);
  v.gain.exponentialRampToValueAtTime(g, a.currentTime + t + 0.012);
  v.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t + d);
  o.connect(v);
  v.connect(a.destination);
  o.start(a.currentTime + t);
  o.stop(a.currentTime + t + d + 0.02);
}
function sfx(kind) {
  if (!S.set.sfx) return;
  const a = audio();
  if (!a) return;
  try {
    if (kind === 'ok') {
      tone(a, 880, 0, 0.12, 'sine', 0.12);
      tone(a, 1320, 0.08, 0.22, 'sine', 0.1);
    } else if (kind === 'ng') {
      tone(a, 260, 0, 0.16, 'triangle', 0.12, 200);
      tone(a, 196, 0.12, 0.22, 'triangle', 0.1, 160);
    } else if (kind === 'combo') {
      [784, 988, 1175, 1568].forEach((f, i) => tone(a, f, i * 0.06, 0.18, 'sine', 0.11));
    } else if (kind === 'lvl') {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(a, f, i * 0.09, i === 4 ? 0.5 : 0.2, 'triangle', 0.12));
    } else if (kind === 'pop') {
      tone(a, 660, 0, 0.08, 'sine', 0.1, 990);
    } else if (kind === 'card') {
      [1047, 1319, 1568, 2093, 2637].forEach((f, i) => tone(a, f, i * 0.05, 0.25, 'sine', 0.07));
    } else if (kind === 'stamp') {
      tone(a, 140, 0, 0.12, 'square', 0.08, 90);
      tone(a, 880, 0.1, 0.2, 'sine', 0.08);
    } else if (kind === 'shake') {
      for (let i = 0; i < 6; i++) tone(a, 300 + Math.random() * 200, i * 0.12, 0.06, 'square', 0.03);
    } else if (kind === 'flip') {
      tone(a, 520, 0, 0.06, 'sine', 0.06, 780);
    }
  } catch (e) {}
}
