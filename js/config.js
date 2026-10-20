'use strict';
/* =====================================================================
   앱 설정 — 후원 링크와 방문 통계는 이 파일만 고치면 돼요.
   GitHub 저장소에서 js/config.js 를 열고 연필(✏️) 버튼으로 바로 수정할 수 있어요.
   따옴표 '' 안에 값을 넣고 저장(Commit)하면, 몇 분 뒤 앱에 반영돼요.
   ===================================================================== */
const APP_CONFIG = {
  // 후원 링크: 쓰는 것만 채우세요. 비워 두면 그 버튼은 보이지 않아요.
  donate: {
    toss: '', //        토스 아이디 링크      예) 'https://toss.me/내아이디'
    kakaopay: 'https://qr.kakaopay.com/Ej9H1LXf0', // 카카오페이 송금 코드  예) 'https://qr.kakaopay.com/xxxxxxxxx'
    bmc: '', //         Buy Me a Coffee      예) 'https://buymeacoffee.com/내아이디'
    message: '하나마루가 공부에 도움이 됐다면 커피 한 잔으로 응원해 주세요.'
  },

  // 문제 신고 구글 폼 링크
  //   - 그냥 폼 링크: 신고 내용을 복사한 뒤 폼을 열어 줘요 (붙여넣기 한 번 필요)
  //   - '미리 채워진 링크'(답 칸에 ABC 라고 적어서 만든 링크): 신고 내용이 폼에 자동으로 채워져요
  //     예) 'https://docs.google.com/forms/d/e/xxxx/viewform?usp=pp_url&entry.123456789=ABC'
  //   비워 두면 신고 내용만 복사돼요.
  report: {
    form: 'https://docs.google.com/forms/d/e/1FAIpQLSelpOZ-HQykU8yYBBFxLaG342e9jsN2c7uOz5S8kUleeUdRsw/viewform'
  },

  // 방문 통계: 둘 중 하나만 채우면 돼요. (쿠키·개인정보 없이 방문 수만 세요)
  analytics: {
    cloudflareToken: 'ba92846e027c40c18bccca13e9a5ebf2', // Cloudflare Web Analytics 토큰  예) '0123456789abcdef0123456789abcdef'
    goatcounter: '' //      GoatCounter 주소               예) 'https://내이름.goatcounter.com/count'
  },

  // AI 회화 상대: Cloudflare Worker 주소를 넣으면 켜져요. (만드는 법: 저장소의 AI_SETUP.md)
  //   예) 'https://hanamaru-ai.내아이디.workers.dev'
  ai: {
    endpoint: 'https://hanamaru-ai.drawingself7.workers.dev',
    dailyLimit: 30 // 한 사람(기기)이 하루에 AI에게 보낼 수 있는 횟수 (서버에도 IP당 제한이 따로 있어요)
  }
};
