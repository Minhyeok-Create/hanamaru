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
- 한 사람(기기)이 하루에 보낼 수 있는 횟수는 `js/config.js` 의 `dailyLimit`(기본 30)으로 정해요.
- 모델을 바꾸고 싶으면 Worker의 Variables에 `MODEL` 을 추가하세요. (기본: `@cf/google/gemma-4-26b-a4b-it`)
- 대화 내용은 답을 만들기 위해 Cloudflare로 보내져요. 앱 화면에도 그렇게 안내돼 있어요.

## 사용량 제한 (SNS 등에 공개할 때)
서버 코드에 하루 제한이 들어 있어요. 따로 설정하지 않으면 아래 기본값으로 동작해요.

| 설정 이름 (Variables) | 기본값 | 뜻 |
|---|---|---|
| `IP_DAILY_LIMIT` | 30 | 한 접속 주소(IP)가 하루에 보낼 수 있는 횟수 |
| `DAILY_CAP` | 600 | 서버 전체가 하루에 받는 최대 횟수 (무료 사용량 10,000 뉴런 안쪽으로 잡은 값) |
| `AI_OFF` | (없음) | `1`로 넣으면 AI를 바로 꺼요. 이상한 요청이 몰릴 때 쓰는 비상 스위치 |

- 숫자를 바꾸려면 Worker → Settings → Variables and Secrets에서 같은 이름으로 추가하면 돼요(Secret 체크 없이).
- 앱에도 기기당 하루 30번 제한이 있어요(`js/config.js`의 `dailyLimit`).
- 날짜는 한국 시간 자정이 아니라 **오전 9시**(Cloudflare 무료 사용량 초기화 시각)에 바뀌는 것과 거의 맞춰져 있어요.
- 사용량은 Cloudflare 대시보드 → AI → Workers AI에서 볼 수 있어요.
- 무료 플랜이면 한도를 넘어도 요금은 나가지 않아요. **유료 플랜으로 바꾸지만 않으면 돼요.**

## 공부 알림 · 사용 통계 켜기 (D1 데이터베이스, 무료)
매일 공부 알림과 기능별 사용 통계는 알림 받을 사람 목록과 숫자를 저장할 곳이 필요해서 **D1 데이터베이스**를 하나 연결해요. 표(테이블)는 서버가 처음 쓸 때 알아서 만들어요.

1. Cloudflare 왼쪽 메뉴 **Storage & Databases → D1 SQL Database** → **Create database** → 이름 `hanamaru` → Create.
2. Worker 화면 → **Settings → Bindings → Add binding → D1 database** → 변수 이름 `DB`, 데이터베이스 `hanamaru` → 저장.
3. Worker 화면 → **Settings → Trigger events(또는 Triggers) → Add → Cron Triggers** → 직접 입력에 `* * * * *` (매분) → 저장.
   알림은 1분마다 최대 15명씩(시간당 900명) 보내요. 정한 시각이 지났는데 그날 공부를 안 한 사람에게만 하루 한 번 가요.
4. 확인: 브라우저로 `https://hanamaru-ai.내아이디.workers.dev/push/key` 를 열어 `{"key":"B..."}` 가 보이면 준비 끝.
   알림 암호 열쇠는 서버가 처음 한 번 만들어 D1에 보관해요. 따로 넣을 비밀번호는 없어요.

- 앱: **설정 → 공부 알림**에서 켜요. 아이폰은 홈 화면에 추가한 하나마루 아이콘으로 열었을 때만(iOS 16.4 이상) 켤 수 있어요.
- 무료 사용량: D1 무료(하루 쓰기 10만 줄, 읽기 500만 줄), Cron 무료. 이 앱 규모에서는 넉넉해요.

### 통계 보기
- 브라우저로 `https://hanamaru-ai.내아이디.workers.dev/stats` 를 열면 날짜별 방문(처음/다시/홈 화면 앱), 첫 체험 시작→끝, 연습별 열기·끝까지·👍·👎(이유)가 표로 나와요. `?days=30` 을 붙이면 30일치.
- 남이 못 보게 하려면 Variables에 `STATS_KEY` = 아무 비밀번호 를 넣고 `/stats?k=비밀번호` 로 열어요.
- 통계에는 숫자만 있어요. 누가 했는지는 남지 않아요. (앱 설정 → 개인정보에서 사용자가 끌 수도 있어요)

## 메뉴판 사진 읽기
- 따로 설정할 건 없어요. Workers AI의 사진을 읽는 모델(`@cf/meta/llama-4-scout-17b-16e-instruct`, 안 되면 `@cf/mistralai/mistral-small-3.1-24b-instruct`)을 써요.
- 사진은 텍스트보다 무료 사용량을 많이 써서 따로 제한해요.

| 설정 이름 | 기본값 | 뜻 |
|---|---|---|
| `PHOTO_DAILY_LIMIT` | 3 | 한 사람(IP)이 하루에 읽을 수 있는 사진 수 |
| `PHOTO_CAP` | 150 | 서버 전체 하루 사진 수 |
| `VISION_MODEL` | (없음) | 다른 사진 모델을 먼저 쓰고 싶을 때 |

- 사진 읽기가 계속 실패하면 Worker → Logs에서 `[vision]` 으로 검색하면 이유가 보여요.
