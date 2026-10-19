'use strict';
/* ================= word-list share links: send my own words + starred words to a friend ================= */

const WL_MAX_FAV = 200;

function wordSharePayload(lang, withMine, withFav) {
  const mine = withMine ? S.custom[lang].map(c => (lang === 'ja' ? [c.w, c.r, c.m] : [c.w, c.m])) : [];
  const words = lang === 'ja' ? BASE_JP : BASE_EN;
  const fav = withFav
    ? words
        .filter(w => S.fav[w.key])
        .slice(0, WL_MAX_FAV)
        .map(w => w.key)
    : [];
  return { v: 1, l: lang, n: (S.name || '').slice(0, 12), c: mine, f: fav };
}
function wordShareLink(o) {
  const base = location.protocol === 'http:' || location.protocol === 'https:' ? location.href.split('#')[0] : '';
  return base + '#wl=' + b64u.enc(JSON.stringify(o));
}
function parseWordShare(h) {
  try {
    const m = /[#&]wl=([A-Za-z0-9_-]+)/.exec(h || '');
    if (!m) return null;
    const o = JSON.parse(b64u.dec(m[1]));
    if (!o || !['ja', 'en'].includes(o.l) || !Array.isArray(o.c) || !Array.isArray(o.f)) return null;
    o.n = String(o.n || '친구').slice(0, 12) || '친구';
    o.c = o.c.filter(x => Array.isArray(x) && x.every(v => typeof v === 'string' && v.length <= 60)).slice(0, 300);
    o.f = o.f.filter(k => typeof k === 'string' && k.length <= 80).slice(0, WL_MAX_FAV);
    return o;
  } catch (e) {
    return null;
  }
}

// sender
function openWordShare(lang) {
  const mineN = S.custom[lang].length;
  const favN = (lang === 'ja' ? BASE_JP : BASE_EN).filter(w => S.fav[w.key]).length;
  const el = openSheet(
    `<div class="sheet-h"><b>단어장 공유</b><button type="button" class="icon-btn" data-close aria-label="닫기">${XICON}</button></div>
    <div class="h-scroll">
      <p class="note">링크를 받은 친구가 열면, 아래 단어가 친구 앱의 '내 단어'와 즐겨찾기에 들어가요.</p>
      <div class="panel" style="padding:4px 14px">
        <label class="set-row"><div><b>내가 추가한 단어</b><small>${mineN}개</small></div><input type="checkbox" id="wsMine" ${mineN ? 'checked' : 'disabled'}></label>
        <label class="set-row"><div><b>★ 즐겨찾기한 단어</b><small>${favN}개${favN > WL_MAX_FAV ? ` (앞의 ${WL_MAX_FAV}개만)` : ''}</small></div><input type="checkbox" id="wsFav" ${favN ? 'checked' : 'disabled'}></label>
      </div>
      <label class="vs-name"><span class="note">내 이름 (친구에게 보여요)</span><input id="wsName" type="text" maxlength="12" placeholder="예: 민수" value="${esc(S.name || '')}" autocomplete="off"></label>
      <button class="btn primary" data-ws="send" ${mineN || favN ? '' : 'disabled'}>링크 보내기</button>
      ${mineN || favN ? '' : `<p class="note">아직 보낼 단어가 없어요. 단어장에서 ☆를 누르거나 내 단어를 추가해 보세요.</p>`}
    </div>`,
    'help'
  );
  el.querySelector('[data-ws=send]').addEventListener('click', () => {
    S.name = (el.querySelector('#wsName').value || '').trim().slice(0, 12);
    save();
    const o = wordSharePayload(lang, el.querySelector('#wsMine').checked, el.querySelector('#wsFav').checked);
    if (!o.c.length && !o.f.length) {
      toast('보낼 단어를 골라 주세요');
      return;
    }
    const link = wordShareLink(o);
    const text = `[하나마루 단어장] ${o.n || '친구'}의 ${lang === 'ja' ? '일본어' : '영어'} 단어 ${o.c.length + o.f.length}개! 링크를 열면 내 앱에 추가돼요.`;
    if (link.startsWith('#')) {
      toast('이 미리보기에서는 링크를 만들 수 없어요. GitHub 주소의 앱에서 써 주세요.');
      return;
    }
    const fb = () =>
      copyText(text + '\n' + link, '단어장 링크를 복사했어요. 카톡에 붙여 넣어 보내세요.', () => toast('링크를 복사하지 못했어요'));
    try {
      if (navigator.share)
        navigator.share({ text, url: link }).catch(err => {
          if (!err || err.name !== 'AbortError') fb();
        });
      else fb();
    } catch (err) {
      fb();
    }
  });
}

// receiver
function offerWordShare(o) {
  const lang = o.l,
    words = lang === 'ja' ? BASE_JP : BASE_EN;
  const keys = new Set(words.map(w => w.key));
  const fav = o.f.filter(k => keys.has(k));
  const sample = [...o.c.map(c => c[0]), ...fav.slice(0, 6).map(k => words.find(w => w.key === k).w)].slice(0, 8);
  const el = openSheet(
    `<div class="sheet-h"><b>${esc(o.n)}님의 단어장</b><button type="button" class="icon-btn" data-close aria-label="닫기">${XICON}</button></div>
    <div class="h-scroll">
      <p style="margin:0">${lang === 'ja' ? '일본어' : '영어'} 단어 <b>${o.c.length + fav.length}개</b>를 받았어요. ${[o.c.length ? `직접 만든 단어 ${o.c.length}개는 '내 단어'에` : '', fav.length ? `${fav.length}개는 즐겨찾기에` : ''].filter(Boolean).join(', ')} 들어가요.</p>
      <div class="chips">${sample.map(w => `<span class="chip ${lang === 'ja' ? 'jp' : 'en'}" lang="${lang}">${esc(w)}</span>`).join('')}${o.c.length + fav.length > sample.length ? '<span class="chip">…</span>' : ''}</div>
      <button class="btn primary" data-wsa>내 단어장에 추가</button>
    </div>`,
    'help'
  );
  el.querySelector('[data-wsa]').addEventListener('click', () => {
    let added = 0;
    for (const c of o.c) {
      if (lang === 'ja') {
        const [w, r, m] = c;
        if (w && r && m && !S.custom.ja.some(x => x.w === w && x.r === r)) {
          S.custom.ja.push({ w, r, m });
          added++;
        }
      } else {
        const [w, m] = c;
        if (w && m && !S.custom.en.some(x => x.w === w)) {
          S.custom.en.push({ w, m });
          added++;
        }
      }
    }
    for (const k of fav)
      if (!S.fav[k]) {
        S.fav[k] = 1;
        added++;
      }
    if (lang === 'ja') {
      S.word.cats = [...new Set([...S.word.cats, 'mine'])];
      R.word = null;
    } else {
      S.ew.cats = [...new Set([...S.ew.cats, 'mine'])];
      R.ew = null;
    }
    rebuildWords();
    save();
    closeSheet();
    toast(added ? `단어 ${added}개를 추가했어요` : '이미 다 가지고 있는 단어예요');
    if (S.lang !== lang) {
      S.lang = lang;
      save();
      renderTabs();
    }
    startMod(lang === 'ja' ? 'jlist' : 'elist');
  });
}
