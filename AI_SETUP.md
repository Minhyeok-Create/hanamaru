# 하나마루 AI 회화 켜기 (Cloudflare, 무료)

AI 회화·AI 번역은 Cloudflare Worker라는 작은 서버를 거쳐서 동작해요. 한 번만 설정하면 되고, 친구들은 아무것도 안 해도 돼요.

- 비용: Workers 무료 플랜(하루 요청 10만 건) + Workers AI 무료 사용량(하루 10,000 뉴런, 매일 오전 9시 초기화).
  무료 플랜에서는 한도를 넘어도 **돈이 나가지 않고** 그날만 AI 기능이 멈춰요.
- 코드: 이 저장소의 `worker/hanamaru-ai.js`

## 1. Worker 만들기
1. https://dash.cloudflare.com 에 로그인해요. (방문 통계에 쓰는 그 계정)
2. 왼쪽 메뉴에서 **Workers & Pages**(또는 Compute → Workers)를 누르고 **Create(만들기)** → **Start with Hello World!** 를 골라요.
3. 이름을 `hanamaru-ai` 로 하고 **Deploy** 를 눌러요.

## 2. 코드 붙여넣기
1. 만든 Worker 화면에서 **Edit code(코드 편집)** 를 눌러요.
2. 왼쪽 `worker.js` 의 내용을 **전부 지우고**, `worker/hanamaru-ai.js` 의 내용을 통째로 붙여넣어요.
3. 오른쪽 위 **Deploy** 를 눌러요.

## 3. AI 연결과 앱 주소 등록
1. Worker 화면 → **Settings(설정)** → **Bindings** → **Add binding** → **Workers AI** 를 고르고, 변수 이름(Variable name)에 `AI` 를 적고 저장해요.
2. **Settings** → **Variables and Secrets** → **Add** → 종류 Text, 이름 `ALLOWED_ORIGINS`, 값 `https://minhyeok-create.github.io` → 저장(Deploy)해요.
   (다른 사이트에서 이 서버를 못 쓰게 막는 설정이에요.)

## 4. 앱에 주소 넣기
1. Worker 화면 위쪽의 주소를 복사해요. 예) `https://hanamaru-ai.내아이디.workers.dev`
   브라우저로 열었을 때 `{"ok":true,"name":"hanamaru-ai"}` 가 보이면 성공이에요.
2. GitHub 저장소에서 `js/config.js` → 연필(✏️) → `ai:` 안의 `endpoint: ''` 따옴표 안에 주소를 붙여넣고 Commit 해요.
3. 몇 분 뒤 앱을 열고 업데이트하면 **회화·여행 → AI 회화** 가 켜져요.

## 알아 두기
- 메뉴 이름은 Cloudflare 화면 개편에 따라 조금 다를 수 있어요.
- 한 사람(기기)이 하루에 보낼 수 있는 횟수는 `js/config.js` 의 `dailyLimit`(기본 60)으로 정해요.
- 모델을 바꾸고 싶으면 Worker의 Variables에 `MODEL` 을 추가하세요. (기본: `@cf/google/gemma-4-26b-a4b-it`)
- 대화 내용은 답을 만들기 위해 Cloudflare로 보내져요. 앱 화면에도 그렇게 안내돼 있어요.
