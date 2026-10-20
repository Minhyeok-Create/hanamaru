// 하나마루 AI 서버 — Cloudflare Worker (무료 플랜 + Workers AI 무료 사용량으로 동작)
// 설정 방법은 AI_SETUP.md 를 보세요. 이 파일 전체를 Worker 편집 화면에 붙여넣으면 돼요.
//
// 필요한 설정 (Worker → Settings):
//   - Bindings → Workers AI 추가, 변수 이름: AI
//   - Variables → ALLOWED_ORIGINS = https://minhyeok-create.github.io   (앱 주소. 여러 개면 쉼표로)
//   - (선택) Variables → MODEL = 사용할 모델 이름 (비우면 아래 기본값)

const MODELS = ['@cf/google/gemma-4-26b-a4b-it', '@cf/qwen/qwen3-30b-a3b-fp8', '@cf/meta/llama-3.1-8b-instruct-fp8'];
const MAX_MSGS = 26; // 대화에서 최근 몇 줄까지 보낼지
const MAX_LEN = 400; // 한 줄 최대 글자 수

const clip = (s, n) => String(s || '').slice(0, n);
function prompts(task, lang, scene, text) {
  const L = lang === 'en' ? 'English' : 'Japanese';
  const sc = scene || {};
  const who = `Scene: ${clip(sc.setting, 200)} You play: ${clip(sc.partner, 120)}. The learner plays: ${clip(sc.role, 80)}.`;
  if (task === 'chat')
    return `You are a role-play partner in a language-learning app for Korean speakers who are beginners in ${L} (about JLPT N5-N4 / CEFR A2).
${who}
Stay in character. Reply ONLY in natural, short, easy ${L} (1-2 short sentences, common words${lang === 'en' ? '' : ', polite です/ます unless the scene says タメ口'}). Move the conversation forward with a simple question when natural.
If the learner writes Korean or makes mistakes, do not correct them now — just understand and reply in ${L}.
Never output anything except this JSON: {"reply": "<your ${L} line>", "ko": "<natural Korean translation of your line>"}`;
  if (task === 'hint')
    return `You help a Korean beginner learning ${L} in a role-play. ${who}
Read the conversation and suggest 3 different short, easy ${L} lines the LEARNER could say next (polite, natural, beginner level).
Output ONLY JSON: {"options": [{"reply": "<${L}>", "ko": "<Korean meaning>"}, ...]}`;
  if (task === 'review')
    return `You are a kind ${L} teacher for Korean beginners. ${who}
Review ONLY the learner's lines (role "user") in the conversation. For each line that has a grammar mistake, wrong word, or sounds unnatural, give the corrected ${L} and a short reason in Korean. Skip lines that are fine, and skip lines written in Korean (instead show how to say them in ${L}, reason "이렇게 말해요").
Then give one encouraging overall tip in Korean (1-2 sentences).
Output ONLY JSON: {"items": [{"you": "<learner's original>", "fix": "<corrected ${L}>", "why": "<Korean reason>"}], "tip": "<Korean>"}`;
  if (task === 'translate')
    return `Translate the following ${L} text into natural Korean. It may be a menu, sign or notice. Output only the Korean translation, no notes.`;
  return null;
}
function cors(origin, allowed) {
  const ok = !allowed.length || allowed.includes(origin);
  return {
    ok,
    headers: {
      'Access-Control-Allow-Origin': ok ? origin || '*' : allowed[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
      'Content-Type': 'application/json; charset=utf-8'
    }
  };
}
const reply = (obj, status, headers) => new Response(JSON.stringify(obj), { status, headers });

export default {
  async fetch(req, env) {
    const allowed = String(env.ALLOWED_ORIGINS || '')
      .split(',')
      .map(s => s.trim().replace(/\/$/, ''))
      .filter(Boolean);
    const origin = req.headers.get('Origin') || '';
    const c = cors(origin, allowed);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: c.headers });
    const url = new URL(req.url);
    if (req.method === 'GET') return reply({ ok: true, name: 'hanamaru-ai' }, 200, c.headers); // 연결 확인용
    if (req.method !== 'POST' || url.pathname !== '/ai') return reply({ error: 'not found' }, 404, c.headers);
    if (!c.ok) return reply({ error: '허용되지 않은 주소에서 온 요청이에요.' }, 403, c.headers);
    if (!env.AI) return reply({ error: 'Worker에 Workers AI(AI) 연결이 아직 없어요.' }, 500, c.headers);

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return reply({ error: 'bad request' }, 400, c.headers);
    }
    const task = String(body.task || '');
    const lang = body.lang === 'en' ? 'en' : 'ja';
    const system = prompts(task, lang, body.scene, body.text);
    if (!system) return reply({ error: 'unknown task' }, 400, c.headers);

    const messages = [{ role: 'system', content: system }];
    if (task === 'translate') messages.push({ role: 'user', content: clip(body.text, 600) });
    else {
      const hist = (Array.isArray(body.messages) ? body.messages : []).slice(-MAX_MSGS).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: clip(m.content, MAX_LEN)
      }));
      if (task === 'chat') {
        // many chat templates need user/assistant turns to alternate and to start with the user
        const turns = [];
        for (const m of hist) {
          const last = turns[turns.length - 1];
          if (last && last.role === m.role) last.content += '\n' + m.content;
          else turns.push({ ...m });
        }
        if (turns[0] && turns[0].role === 'assistant') turns.unshift({ role: 'user', content: '(The scene starts. Please greet me.)' });
        messages.push(...turns);
      } else
        messages.push({
          role: 'user',
          content: 'Conversation:\n' + hist.map(m => `${m.role === 'assistant' ? 'partner' : 'learner'}: ${m.content}`).join('\n')
        });
    }
    const maxTokens = task === 'review' ? 900 : task === 'translate' ? 500 : task === 'hint' ? 350 : 220;
    const models = env.MODEL ? [env.MODEL, ...MODELS] : MODELS;
    let lastErr = '';
    for (const model of models) {
      try {
        const out = await env.AI.run(model, { messages, max_tokens: maxTokens, temperature: task === 'chat' ? 0.7 : 0.3 });
        let text = out && (out.response ?? out.result?.response ?? out.choices?.[0]?.message?.content);
        if (typeof text !== 'string') text = text ? JSON.stringify(text) : '';
        text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        if (text) return reply({ text, model }, 200, c.headers);
      } catch (e) {
        lastErr = String((e && e.message) || e);
        if (/limit|quota|429|neurons/i.test(lastErr))
          return reply({ error: '오늘 AI 무료 사용량이 다 찼어요. 내일(오전 9시 이후) 다시 해 보세요.' }, 429, c.headers);
      }
    }
    return reply({ error: 'AI가 답하지 못했어요. 잠시 뒤 다시 해 보세요.', detail: lastErr.slice(0, 200) }, 502, c.headers);
  }
};
