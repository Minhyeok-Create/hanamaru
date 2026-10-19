'use strict';
/* ---------- shadowing ---------- */
const canRec = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
let REC = { stream: null, mr: null, url: null, chunks: [], on: false, err: '' };
function recRelease() {
  try {
    if (REC.mr && REC.mr.state === 'recording') REC.mr.stop();
  } catch (e) {}
  if (REC.stream) {
    REC.stream.getTracks().forEach(t => t.stop());
    REC.stream = null;
  }
  REC.on = false;
}
async function recStart() {
  REC.err = '';
  try {
    REC.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    REC.chunks = [];
    const mr = new MediaRecorder(REC.stream);
    REC.mr = mr;
    mr.ondataavailable = e => {
      if (e.data && e.data.size) REC.chunks.push(e.data);
    };
    mr.onstop = () => {
      if (REC.url) URL.revokeObjectURL(REC.url);
      REC.url = URL.createObjectURL(new Blob(REC.chunks, { type: mr.mimeType || 'audio/mp4' }));
      REC.on = false;
      if (REC.stream) {
        REC.stream.getTracks().forEach(t => t.stop());
        REC.stream = null;
      }
      refreshShadow();
    };
    if (hasTTS) {
      try {
        speechSynthesis.cancel();
      } catch (e) {}
    }
    mr.start();
    REC.on = true;
  } catch (e) {
    REC.err = '마이크를 쓸 수 없어요. 홈 화면 앱이나 Safari에서 마이크 권한을 허용해 주세요. 녹음 없이 소리 내어 따라 해도 좋아요.';
    REC.on = false;
  }
  refreshShadow();
}
function recStop() {
  try {
    if (REC.mr && REC.mr.state === 'recording') REC.mr.stop();
  } catch (e) {}
}
function recPlay() {
  if (REC.url) {
    try {
      const a = new Audio(REC.url);
      a.play().catch(() => {});
    } catch (e) {}
  }
}
function shadowZone(r) {
  const rec = canRec
    ? `<div class="row">${REC.on ? `<button type="button" class="btn rec-on" data-act="recstop">■ 녹음 멈추기</button>` : `<button type="button" class="btn" data-act="recstart">● 내 목소리 녹음</button>`}<button type="button" class="btn" data-act="recplay" ${REC.url && !REC.on ? '' : 'disabled'}>▶ 내 녹음 듣기</button></div>`
    : `<p class="note">이 화면에서는 녹음을 쓸 수 없어요. 원어민 발음을 듣고 소리 내어 따라 해 보세요.</p>`;
  return `<div class="shadow"><ol class="steps"><li>재생 버튼으로 원어민 발음을 들어요.</li><li>소리 내어 따라 말해요.${canRec ? ' 녹음해서 원어민 발음과 번갈아 들어 보세요.' : ''}</li><li>스스로 평가하고 다음 문장으로 넘어가요.</li></ol>${rec}${REC.err ? `<p class="note" style="color:var(--ng)">${esc(REC.err)}</p>` : ''}
    ${r.answered ? '' : `<div class="row"><button type="button" class="btn" data-act="shno">한 번 더 연습할래요</button><button type="button" class="btn primary" data-act="shok">잘 따라 했어요</button></div>`}</div>`;
}
function refreshShadow() {
  const m = activeMod();
  if ((m === 'jsh' || m === 'esh') && R[m] && !R[m].done) {
    const z = document.getElementById('zone');
    if (z) z.innerHTML = shadowZone(R[m]);
  }
}
function showShadow(mod, q, card, zone, r) {
  const ja = mod === 'jsh';
  const fresh = !r.started;
  r.started = true;
  if (fresh) {
    if (REC.url) {
      URL.revokeObjectURL(REC.url);
      REC.url = null;
    }
    REC.err = '';
  }
  card.innerHTML = `<span class="cat">${SCENES[q.sc] || ''} · 따라 말하기</span>${ja ? `<p class="fb-big" lang="ja" style="text-align:center;margin-top:26px">${esc(q.a[0])}</p><p class="cap" lang="ja" style="font-family:var(--f-jp);font-size:15px">${esc(q.a[1])}</p><p class="cap mono">${esc(romaji(q.a[1]))}</p>` : `<p class="ko en" lang="en">${esc(q.a)}</p>`}<p class="cap">${esc(q.k)}</p>${playBox()}`;
  zone.dataset.type = 'shadow';
  zone.innerHTML = shadowZone(r);
  if (fresh) speak(ja ? q.a[0] : q.a, ja ? 'ja' : 'en');
}
function rateShadow(mod, ok) {
  const r = R[mod],
    q = r.qs[r.i];
  if (r.answered) return;
  finish(
    mod,
    q,
    ok,
    '',
    `<div class="fb-head"><span class="badge">${ok ? '〇' : '△'}</span>${ok ? '좋아요! 다음 문장으로 가요' : '괜찮아요. 이 문장은 나중에 다시 나와요'}</div>`
  );
  document.getElementById('zone').innerHTML = shadowZone(r);
}
