'use strict';
/* ================= "what's new" sheet, shown once to people who already used the app ================= */
// onlyNew: people who already saw the v10 list just get the newest item
function whatsNew10(onlyNew) {
  const ja = S.lang === 'ja';
  const hj = `<p style="margin:0"><b>한국음으로 한자 읽기</b> · ${ja ? '' : '일본어 모드의 '}문자 탭 · 단어 탭. 학교(學校) → がっこう처럼 한국 한자음에서 일본어 음독을 짐작하는 규칙을 배워요. 받침 ㄱ은 く, ㄹ은 つ, ㅇ은 장음!</p>`;
  const el = openSheet(
    `<div class="sheet-h"><b>새로 생긴 것</b><button type="button" class="icon-btn" data-close aria-label="닫기">${XICON}</button></div>
    <div class="h-scroll"><div class="h-sec" style="padding:14px;display:grid;gap:10px;font-size:15px;line-height:1.6">
      ${hj}${
        onlyNew
          ? ''
          : `
      <p style="margin:0"><b>여행 회화 카드</b> · 회화 탭. '보여주기'를 누르면 화면 가득 크게 띄우고 읽어 줘요. 점원에게 보여 주기만 하면 돼요.</p>
      ${ja ? `<p style="margin:0"><b>글자 따라 쓰기</b> · 문자 탭. 획순 번호를 보며 손가락으로 따라 써요.</p>` : ''}
      <p style="margin:0"><b>플래시카드</b> · 단어 탭. 넘기면서 알아요 / 몰라요만 눌러요.</p>
      <p style="margin:0"><b>${ja ? '일본식 영어' : '콩글리시'} 퀴즈</b> · 단어 탭. ${ja ? 'サラリーマン이 영어로는?' : '핸드폰이 영어로는?'}</p>
      <p style="margin:0"><b>단어장 공유</b> · 자료 탭 단어장에서 링크로 친구에게 보내요.</p>
      <p style="margin:0" class="note">2주마다 백업 알림이 뜨고, 사용 안내에 '매일 공부 알림 만들기'가 생겼어요.</p>`
      }</div>
      <button class="btn primary" data-wn style="width:100%">확인</button></div>`,
    'help'
  );
  el.querySelector('[data-wn]').addEventListener('click', closeSheet);
}
