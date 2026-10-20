const MODELS = ["@cf/google/gemma-4-26b-a4b-it", "@cf/qwen/qwen3-30b-a3b-fp8", "@cf/meta/llama-3.1-8b-instruct-fp8"];
const VISION_MODELS = [
  "@cf/meta/llama-4-scout-17b-16e-instruct",
  "@cf/mistralai/mistral-small-3.1-24b-instruct",
  "@cf/meta/llama-3.2-11b-vision-instruct"
];
const MAX_MSGS = 16;
const MAX_LEN = 240;
const PUSH_BATCH = 15;
const kstDay = () => (new Date()).toISOString().slice(0, 10);
const koreaNow = () => new Date(Date.now() + 9 * 3600 * 1e3);
const koreaDay = (off = 0) => new Date(Date.now() + 9 * 3600 * 1e3 + off * 864e5).toISOString().slice(0, 10);
async function bump(key, limit) {
  const cache = caches.default;
  const url = "https://hanamaru-ai.counter/" + encodeURIComponent(key);
  const hit = await cache.match(url);
  const n = hit ? parseInt(await hit.text(), 10) || 0 : 0;
  if (n >= limit) return { ok: false, n };
  await cache.put(url, new Response(String(n + 1), { headers: { "Cache-Control": "max-age=90000" } }));
  return { ok: true, n: n + 1 };
}
const clip = (s, n) => String(s || "").slice(0, n);
function prompts(task, lang, scene, text) {
  const L = lang === "en" ? "English" : "Japanese";
  const sc = scene || {};
  const who = `Scene: ${clip(sc.setting, 200)} You play: ${clip(sc.partner, 120)}. The learner plays: ${clip(sc.role, 80)}.`;
  if (task === "chat")
    return `You are a role-play partner in a language-learning app for Korean speakers who are beginners in ${L} (about JLPT N5-N4 / CEFR A2).
${who}
Stay in character. Reply ONLY in natural, short, easy ${L} (1-2 short sentences, common words${lang === "en" ? "" : ", polite です/ます unless the scene says タメ口"}). Move the conversation forward with a simple question when natural.
If the learner writes Korean or makes mistakes, do not correct them now — just understand and reply in ${L}.
Never output anything except this JSON: {"reply": "<your ${L} line>", "ko": "<natural Korean translation of your line>"}`;
  if (task === "hint")
    return `You help a Korean beginner learning ${L} in a role-play. ${who}
Read the conversation and suggest 3 different short, easy ${L} lines the LEARNER could say next (polite, natural, beginner level).
Output ONLY JSON: {"options": [{"reply": "<${L}>", "ko": "<Korean meaning>"}, ...]}`;
  if (task === "review")
    return `You are a kind ${L} teacher for Korean beginners. ${who}
Review ONLY the learner's lines (role "user") in the conversation. For each line that has a grammar mistake, wrong word, or sounds unnatural, give the corrected ${L} and a short reason in Korean. Skip lines that are fine, and skip lines written in Korean (instead show how to say them in ${L}, reason "이렇게 말해요").
Then give one encouraging overall tip in Korean (1-2 sentences).
Output ONLY JSON: {"items": [{"you": "<learner's original>", "fix": "<corrected ${L}>", "why": "<Korean reason>"}], "tip": "<Korean>"}`;
  if (task === "diary")
    return `You are a kind ${L} teacher for Korean beginners. The learner wrote a one-line diary in ${L} (it may contain Korean words they did not know in ${L}).
Correct it with minimal changes (keep their meaning), then give a more natural way a native speaker would say it (can be the same).
Output ONLY JSON: {"fixed": "<corrected ${L}>", "natural": "<natural ${L}>", "ko": "<Korean translation>", "notes": ["<short Korean explanation of each fix>", ...max 3], "good": "<one short warm compliment in Korean>"}`;
  if (task === "translate")
    return `Translate the following ${L} text into natural Korean. It may be a menu, sign or notice. Output only the Korean translation, no notes.`;
  if (task === "photo")
    return `You read photos of restaurant menus, signs, price tags and notices for Korean travelers who cannot read ${L}.
List the text items you can actually see in the photo (max 12, most important first: dish or product names with prices, then signs). Never invent items that are not in the photo.
For each item give: "t" = the text exactly as printed, ${lang === "en" ? '"r" = ""' : '"r" = its reading in hiragana (katakana words stay katakana)'}, "ko" = natural Korean name or meaning, "p" = the price as printed or "", "n" = a very short Korean note only if useful (e.g. 매운맛, 돼지고기, 세금 포함) or "".
Output ONLY JSON: {"kind": "menu" | "sign" | "other", "summary": "<one short Korean sentence about what this is>", "items": [{"t": "", "r": "", "ko": "", "p": "", "n": ""}]}
If you cannot read any ${L} text, output {"kind": "other", "summary": "글자를 읽지 못했어요. 더 가까이, 밝게 찍어 보세요.", "items": []}`;
  return null;
}
function cors(origin, allowed) {
  const ok = !allowed.length || allowed.includes(origin);
  return {
    ok,
    headers: {
      "Access-Control-Allow-Origin": ok ? origin || "*" : allowed[0],
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
      "Content-Type": "application/json; charset=utf-8"
    }
  };
}
const reply = (obj, status, headers) => new Response(JSON.stringify(obj), { status, headers });
const aiText = (out) => {
  let text = out && (out.response ?? out.result?.response ?? out.choices?.[0]?.message?.content);
  if (typeof text !== "string") text = text ? JSON.stringify(text) : "";
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
};
let DB_READY = false;
async function db(env) {
  if (!env.DB) return null;
  if (!DB_READY) {
    await env.DB.batch([
      env.DB.prepare("CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT)"),
      env.DB.prepare(
        "CREATE TABLE IF NOT EXISTS subs (id TEXT PRIMARY KEY, endpoint TEXT, p256dh TEXT, auth TEXT, hour INTEGER, lang TEXT, streak INTEGER, last_done TEXT, sent_day TEXT, created TEXT)"
      ),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS stats (day TEXT, k TEXT, n INTEGER, PRIMARY KEY (day, k))"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS backups (id TEXT PRIMARY KEY, data TEXT, size INTEGER, updated TEXT)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS groups (code TEXT PRIMARY KEY, name TEXT, created TEXT)"),
      env.DB.prepare(
        "CREATE TABLE IF NOT EXISTS members (code TEXT, mid TEXT, nick TEXT, week TEXT, xp INTEGER, updated TEXT, PRIMARY KEY (code, mid))"
      )
    ]);
    DB_READY = true;
  }
  return env.DB;
}
const enc = new TextEncoder();
const b64u = (buf) => {
  let s = "";
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const unb64u = (s) => {
  s = String(s).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};
const cat = (...parts) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};
async function vapidKeys(env) {
  const d = await db(env);
  const row = await d.prepare("SELECT v FROM meta WHERE k = 'vapid'").first();
  if (row) {
    const v = JSON.parse(row.v);
    return { pub: v.pub, key: await crypto.subtle.importKey("jwk", v.jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]) };
  }
  const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const jwk = await crypto.subtle.exportKey("jwk", kp.privateKey);
  const pub = b64u(await crypto.subtle.exportKey("raw", kp.publicKey));
  await d.prepare("INSERT OR IGNORE INTO meta (k, v) VALUES ('vapid', ?)").bind(JSON.stringify({ jwk, pub })).run();
  return vapidKeys(env);
}
async function vapidAuth(vk, endpoint, sub) {
  const aud = new URL(endpoint).origin;
  const head = b64u(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const body = b64u(enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1e3) + 12 * 3600, sub })));
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, vk.key, enc.encode(head + "." + body));
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${vk.pub}`;
}
async function hkdf(salt, ikm, info, len) {
  const k = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, k, len * 8));
}
async function encryptPush(sub, payload, eph) {
  const uaPub = unb64u(sub.p256dh), auth = unb64u(sub.auth);
  const uaKey = await crypto.subtle.importKey("raw", uaPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const secret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, eph.privateKey, 256));
  const ikm = await hkdf(auth, secret, cat(enc.encode("WebPush: info\0"), uaPub, eph.pub), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);
  const key = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, cat(enc.encode(payload), new Uint8Array([2])))
  );
  const head = new Uint8Array(21);
  head.set(salt);
  new DataView(head.buffer).setUint32(16, 4096);
  head[20] = 65;
  return cat(head, eph.pub, ct);
}
async function ephemeral() {
  const kp = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  return { privateKey: kp.privateKey, pub: new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey)) };
}
async function sendPush(env, vk, eph, sub, msg, subject, auths) {
  const aud = new URL(sub.endpoint).origin;
  if (!auths[aud]) auths[aud] = await vapidAuth(vk, sub.endpoint, subject);
  const body = await encryptPush(sub, JSON.stringify(msg), eph);
  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      Authorization: auths[aud],
      TTL: "14400",
      Urgency: "normal",
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream"
    },
    body
  });
  return res.status;
}
const PUSH_HOSTS = /(^|\.)push\.apple\.com$|^fcm\.googleapis\.com$|^(updates\.)?push\.services\.mozilla\.com$|\.notify\.windows\.com$/;
const subId = async (endpoint) => b64u(await crypto.subtle.digest("SHA-256", enc.encode(endpoint))).slice(0, 32);
const TIPS = {
  ja: [
    ["お疲れさまです", "수고하셨습니다"],
    ["いただきます", "잘 먹겠습니다"],
    ["すみません", "저기요 / 죄송합니다"],
    ["これください", "이거 주세요"],
    ["大丈夫です", "괜찮아요"],
    ["お会計お願いします", "계산해 주세요"],
    ["また来ます", "또 올게요"],
    ["よろしくお願いします", "잘 부탁드립니다"],
    ["おすすめは何ですか", "추천 메뉴가 뭐예요?"],
    ["ちょっと待ってください", "잠깐만 기다려 주세요"]
  ],
  en: [
    ["Could I get the check?", "계산서 주시겠어요?"],
    ["I’m just looking.", "그냥 구경하는 중이에요."],
    ["Can I try this on?", "입어 봐도 돼요?"],
    ["No worries.", "괜찮아요 / 신경 쓰지 마세요"],
    ["For here or to go?", "드시고 가세요, 가져가세요?"],
    ["I’ll have this one.", "이걸로 할게요."],
    ["Take your time.", "천천히 하세요."],
    ["Could you say that again?", "다시 말씀해 주시겠어요?"],
    ["It’s on me.", "내가 살게."],
    ["Sounds good!", "좋아요!"]
  ]
};
function pushMessage(sub, site) {
  const alive = sub.last_done === koreaDay(-1);
  const s = alive ? sub.streak || 1 : 0;
  const lang = sub.lang === "en" ? "en" : "ja";
  const tips = TIPS[lang];
  const [p, k] = tips[Math.floor(Date.now() / 864e5) % tips.length];
  if (s >= 2) return { title: `🔥 ${s}일 연속 공부 중!`, body: `오늘 5분만 하면 ${s + 1}일째예요. 끊기기 전에 잠깐 들러요.`, url: site };
  if (s === 1) return { title: "어제 시작한 공부, 오늘도 이어 가요", body: `5분이면 돼요. 오늘의 한마디: ${p} — ${k}`, url: site };
  return { title: "하나마루 · 오늘의 한마디", body: `${p} — ${k}. 눌러서 들어 보고 5분만 공부해요!`, url: site };
}
async function runPush(env) {
  const d = await db(env);
  if (!d) return { sent: 0 };
  const now = koreaNow(), hour = now.getUTCHours(), day = koreaDay();
  if (hour < 7) return { sent: 0 };
  const { results } = await d.prepare("SELECT * FROM subs WHERE hour <= ? AND (sent_day IS NULL OR sent_day != ?) AND (last_done IS NULL OR last_done != ?) LIMIT ?").bind(hour, day, day, PUSH_BATCH).all();
  if (!results || !results.length) return { sent: 0 };
  const vk = await vapidKeys(env), eph = await ephemeral(), auths = {};
  const site = siteOf(env);
  const subject = site || "mailto:hanamaru@example.com";
  const done = [], gone = [];
  await Promise.all(
    results.map(async (s) => {
      try {
        const st = await sendPush(env, vk, eph, s, pushMessage(s, site), subject, auths);
        if (st === 404 || st === 410) gone.push(s.id);
        else done.push(s.id);
        if (st >= 400 && st !== 404 && st !== 410) console.log("[push]", st, new URL(s.endpoint).host);
      } catch (e) {
        done.push(s.id);
        console.log("[push] error", String(e && e.message));
      }
    })
  );
  const stmts = [
    ...done.map((id) => d.prepare("UPDATE subs SET sent_day = ? WHERE id = ?").bind(day, id)),
    ...gone.map((id) => d.prepare("DELETE FROM subs WHERE id = ?").bind(id))
  ];
  if (stmts.length) await d.batch(stmts);
  return { sent: done.length, gone: gone.length };
}
const allowedList = (env) => String(env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim().replace(/\/$/, "")).filter(Boolean);
const siteOf = (env) => String(env.SITE || allowedList(env)[0] || "");
async function handlePush(req, env, path, c, ip) {
  const d = await db(env);
  if (!d) return reply({ error: "no-db" }, 404, c.headers);
  if (path === "/push/key") return reply({ key: (await vapidKeys(env)).pub }, 200, c.headers);
  if (req.method !== "POST") return reply({ error: "not found" }, 404, c.headers);
  if (!c.ok) return reply({ error: "forbidden" }, 403, c.headers);
  let b;
  try {
    b = JSON.parse((await req.text()).slice(0, 4e3));
  } catch (e) {
    return reply({ error: "bad request" }, 400, c.headers);
  }
  const endpoint = String(b.sub && b.sub.endpoint || b.endpoint || "");
  let host = "";
  try {
    host = new URL(endpoint).hostname;
  } catch (e) {
  }
  if (!host || !endpoint.startsWith("https://") || !PUSH_HOSTS.test(host)) return reply({ error: "bad endpoint" }, 400, c.headers);
  const id = await subId(endpoint);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(b.day || "") ? b.day : null;
  const streak = Math.max(0, Math.min(9999, parseInt(b.streak, 10) || 0));
  if (path === "/push/sub") {
    if (!(await bump(`psub:${kstDay()}:${ip}`, 20)).ok) return reply({ error: "too many" }, 429, c.headers);
    const k = b.sub && b.sub.keys || {};
    if (!k.p256dh || !k.auth) return reply({ error: "bad keys" }, 400, c.headers);
    const hour = Math.max(7, Math.min(23, parseInt(b.hour, 10) || 21));
    await d.prepare(
      `INSERT INTO subs (id, endpoint, p256dh, auth, hour, lang, streak, last_done, sent_day, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
         ON CONFLICT(id) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth, hour = excluded.hour, lang = excluded.lang, streak = excluded.streak, last_done = COALESCE(excluded.last_done, subs.last_done)`
    ).bind(id, endpoint, clip(k.p256dh, 200), clip(k.auth, 100), hour, b.lang === "en" ? "en" : "ja", streak, day, koreaDay()).run();
    return reply({ ok: true }, 200, c.headers);
  }
  if (path === "/push/unsub") {
    await d.prepare("DELETE FROM subs WHERE id = ?").bind(id).run();
    return reply({ ok: true }, 200, c.headers);
  }
  if (path === "/push/done") {
    if (!(await bump(`pdone:${kstDay()}:${ip}`, 30)).ok) return reply({ ok: true }, 200, c.headers);
    await d.prepare("UPDATE subs SET last_done = ?, streak = ?, lang = COALESCE(?, lang) WHERE id = ?").bind(day || koreaDay(), streak, b.lang === "en" || b.lang === "ja" ? b.lang : null, id).run();
    return reply({ ok: true }, 200, c.headers);
  }
  if (path === "/push/test") {
    if (!(await bump(`ptest:${kstDay()}:${ip}`, 3)).ok) return reply({ error: "테스트 알림은 하루 3번까지예요." }, 429, c.headers);
    const s = await d.prepare("SELECT * FROM subs WHERE id = ?").bind(id).first();
    if (!s) return reply({ error: "알림 등록 정보가 없어요. 알림을 껐다 다시 켜 주세요." }, 404, c.headers);
    const site = siteOf(env);
    const st = await sendPush(
      env,
      await vapidKeys(env),
      await ephemeral(),
      s,
      { title: "하나마루 알림이 잘 와요 👍", body: "정해 둔 시간에 오늘 공부를 아직 안 했으면 알려 드릴게요.", url: site },
      site || "mailto:hanamaru@example.com",
      {}
    );
    if (st === 404 || st === 410) await d.prepare("DELETE FROM subs WHERE id = ?").bind(id).run();
    return reply(st < 300 ? { ok: true } : { error: `알림 서버가 거절했어요 (${st})` }, st < 300 ? 200 : 502, c.headers);
  }
  return reply({ error: "not found" }, 404, c.headers);
}
const SYNC_CODE = /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;
const syncId = async (code) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode("hm-sync:" + code)))].map((b) => b.toString(16).padStart(2, "0")).join("");
async function handleSync(req, env, url, c, ip) {
  const d = await db(env);
  if (!d) return reply({ error: "no-db" }, 404, c.headers);
  if (!c.ok || !req.headers.get("Origin")) return reply({ error: "forbidden" }, 403, c.headers);
  const day = kstDay();
  if (req.method === "GET" && url.pathname === "/sync/load") {
    const code2 = String(url.searchParams.get("code") || "").toUpperCase();
    if (!SYNC_CODE.test(code2)) return reply({ error: "백업 코드 형식이 달라요. HANA 뒤의 12자리를 확인해 주세요." }, 400, c.headers);
    if (!(await bump(`syncload:${day}:${ip}`, 30)).ok)
      return reply({ error: "오늘은 더 불러올 수 없어요. 내일 다시 해 보세요." }, 429, c.headers);
    const row = await d.prepare("SELECT data, updated FROM backups WHERE id = ?").bind(await syncId(code2)).first();
    if (!row) return reply({ error: "이 코드로 저장된 백업이 없어요. 코드를 다시 확인해 주세요." }, 404, c.headers);
    return reply({ data: row.data, at: row.updated }, 200, c.headers);
  }
  if (req.method !== "POST") return reply({ error: "not found" }, 404, c.headers);
  let b;
  try {
    b = JSON.parse(await req.text());
  } catch (e) {
    return reply({ error: "bad request" }, 400, c.headers);
  }
  const code = String(b.code || "").toUpperCase();
  if (!SYNC_CODE.test(code)) return reply({ error: "bad code" }, 400, c.headers);
  const id = await syncId(code);
  if (url.pathname === "/sync/save") {
    const data = String(b.data || "");
    if (!data || data.length > 15e5) return reply({ error: "기록이 너무 커서 저장하지 못했어요." }, 413, c.headers);
    if (!(await bump(`syncsave:${day}:${ip}`, 40)).ok) return reply({ error: "too many" }, 429, c.headers);
    const at = (new Date()).toISOString();
    await d.prepare(
      "INSERT INTO backups (id, data, size, updated) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, size = excluded.size, updated = excluded.updated"
    ).bind(id, data, data.length, at).run();
    return reply({ ok: true, at }, 200, c.headers);
  }
  if (url.pathname === "/sync/delete") {
    await d.prepare("DELETE FROM backups WHERE id = ?").bind(id).run();
    return reply({ ok: true }, 200, c.headers);
  }
  return reply({ error: "not found" }, 404, c.headers);
}
const GRP_CODE = /^[A-Z2-9]{6}$/;
const MAX_MEMBERS = 30;
const cleanName = (s, n) => String(s || "").replace(/[<>&"'`\\]/g, "").replace(/\s+/g, " ").trim().slice(0, n);
function koreaWeek() {
  const k = koreaNow();
  const dow = (k.getUTCDay() + 6) % 7;
  return new Date(k.getTime() - dow * 864e5).toISOString().slice(0, 10);
}
async function handleGroup(req, env, url, c, ip) {
  const d = await db(env);
  if (!d) return reply({ error: "no-db" }, 404, c.headers);
  if (!c.ok || !req.headers.get("Origin")) return reply({ error: "forbidden" }, 403, c.headers);
  const day = kstDay(), week = koreaWeek();
  if (req.method === "GET" && url.pathname === "/grp/board") {
    const code2 = String(url.searchParams.get("code") || "").toUpperCase(), mid2 = String(url.searchParams.get("mid") || "");
    if (!(await bump(`grpb:${day}:${ip}`, 300)).ok) return reply({ error: "too many" }, 429, c.headers);
    const g2 = GRP_CODE.test(code2) && await d.prepare("SELECT name FROM groups WHERE code = ?").bind(code2).first();
    if (!g2) return reply({ error: "그룹을 찾을 수 없어요." }, 404, c.headers);
    const { results } = await d.prepare("SELECT mid, nick, week, xp FROM members WHERE code = ?").bind(code2).all();
    const members = (results || []).map((m) => ({ nick: m.nick, xp: m.week === week ? m.xp || 0 : 0, me: m.mid === mid2 })).sort((a, b2) => b2.xp - a.xp);
    return reply({ name: g2.name, code: code2, week, members }, 200, c.headers);
  }
  if (req.method !== "POST") return reply({ error: "not found" }, 404, c.headers);
  let b;
  try {
    b = JSON.parse((await req.text()).slice(0, 2e3));
  } catch (e) {
    return reply({ error: "bad request" }, 400, c.headers);
  }
  const mid = String(b.mid || "");
  if (!/^[a-z0-9]{12,32}$/.test(mid)) return reply({ error: "bad id" }, 400, c.headers);
  const nick = cleanName(b.nick, 12);
  const at = (new Date()).toISOString();
  if (url.pathname === "/grp/create") {
    const name = cleanName(b.name, 16);
    if (!name || !nick) return reply({ error: "그룹 이름과 닉네임을 써 주세요." }, 400, c.headers);
    if (!(await bump(`grpc:${day}:${ip}`, 5)).ok) return reply({ error: "그룹은 하루 5개까지 만들 수 있어요." }, 429, c.headers);
    const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code2 = "";
    for (let t = 0; t < 5 && !code2; t++) {
      const r = crypto.getRandomValues(new Uint8Array(6));
      const cand = [...r].map((x) => A[x % A.length]).join("");
      if (!await d.prepare("SELECT 1 FROM groups WHERE code = ?").bind(cand).first()) code2 = cand;
    }
    if (!code2) return reply({ error: "잠시 뒤 다시 해 보세요." }, 503, c.headers);
    await d.batch([
      d.prepare("INSERT INTO groups (code, name, created) VALUES (?, ?, ?)").bind(code2, name, at),
      d.prepare("INSERT INTO members (code, mid, nick, week, xp, updated) VALUES (?, ?, ?, ?, ?, ?)").bind(code2, mid, nick, week, Math.max(0, Math.min(1e5, parseInt(b.xp, 10) || 0)), at)
    ]);
    return reply({ ok: true, code: code2, name }, 200, c.headers);
  }
  const code = String(b.code || "").toUpperCase();
  if (!GRP_CODE.test(code)) return reply({ error: "그룹 코드는 6자리예요." }, 400, c.headers);
  const g = await d.prepare("SELECT name FROM groups WHERE code = ?").bind(code).first();
  if (!g) return reply({ error: "그 코드의 그룹이 없어요. 코드를 다시 확인해 주세요." }, 404, c.headers);
  const mine = await d.prepare("SELECT 1 FROM members WHERE code = ? AND mid = ?").bind(code, mid).first();
  if (url.pathname === "/grp/join") {
    if (!nick) return reply({ error: "닉네임을 써 주세요." }, 400, c.headers);
    if (!(await bump(`grpj:${day}:${ip}`, 20)).ok) return reply({ error: "too many" }, 429, c.headers);
    if (!mine) {
      const n = await d.prepare("SELECT COUNT(*) AS n FROM members WHERE code = ?").bind(code).first();
      if (n && n.n >= MAX_MEMBERS) return reply({ error: `그룹이 가득 찼어요 (최대 ${MAX_MEMBERS}명).` }, 409, c.headers);
    }
    await d.prepare(
      "INSERT INTO members (code, mid, nick, week, xp, updated) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(code, mid) DO UPDATE SET nick = excluded.nick, updated = excluded.updated"
    ).bind(code, mid, nick, week, Math.max(0, Math.min(1e5, parseInt(b.xp, 10) || 0)), at).run();
    return reply({ ok: true, code, name: g.name }, 200, c.headers);
  }
  if (!mine) return reply({ error: "이 그룹의 멤버가 아니에요." }, 403, c.headers);
  if (url.pathname === "/grp/score") {
    if (!(await bump(`grps:${day}:${ip}`, 120)).ok) return reply({ ok: true }, 200, c.headers);
    if (b.week !== week) return reply({ ok: true, week }, 200, c.headers);
    await d.prepare("UPDATE members SET xp = ?, week = ?, nick = COALESCE(NULLIF(?, ''), nick), updated = ? WHERE code = ? AND mid = ?").bind(Math.max(0, Math.min(1e5, parseInt(b.xp, 10) || 0)), week, nick, at, code, mid).run();
    return reply({ ok: true, week }, 200, c.headers);
  }
  if (url.pathname === "/grp/leave") {
    await d.prepare("DELETE FROM members WHERE code = ? AND mid = ?").bind(code, mid).run();
    const left = await d.prepare("SELECT COUNT(*) AS n FROM members WHERE code = ?").bind(code).first();
    if (!left || !left.n) await d.prepare("DELETE FROM groups WHERE code = ?").bind(code).run();
    return reply({ ok: true }, 200, c.headers);
  }
  return reply({ error: "not found" }, 404, c.headers);
}
const STAT_KEY = /^[a-z]:[a-z0-9_:.-]{1,40}$/;
async function handleStat(req, env, c, ip) {
  if (!c.ok) return new Response(null, { status: 204, headers: c.headers });
  const day = kstDay();
  if (!(await bump(`stat:${day}:${ip}`, 200)).ok || !(await bump(`statall:${day}`, 4e4)).ok)
    return new Response(null, { status: 204, headers: c.headers });
  let b = {};
  try {
    b = JSON.parse((await req.text()).slice(0, 6e3));
  } catch (e) {
  }
  const lang = b.lang === "en" ? "en" : "ja";
  const counts = {};
  for (const ev of (Array.isArray(b.ev) ? b.ev : []).slice(0, 60)) {
    const k = String(ev).slice(0, 44);
    if (STAT_KEY.test(k)) counts[lang + ":" + k] = (counts[lang + ":" + k] || 0) + 1;
  }
  const keys = Object.keys(counts);
  if (!keys.length) return new Response(null, { status: 204, headers: c.headers });
  const d = await db(env);
  if (!d) {
    console.log("[stat]", JSON.stringify(counts));
    return new Response(null, { status: 204, headers: c.headers });
  }
  await d.batch(
    keys.map(
      (k) => d.prepare("INSERT INTO stats (day, k, n) VALUES (?, ?, ?) ON CONFLICT(day, k) DO UPDATE SET n = n + excluded.n").bind(day, k, counts[k])
    )
  );
  return new Response(null, { status: 204, headers: c.headers });
}
const h = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
async function statsPage(env, url) {
  const page = (body, status = 200) => new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>하나마루 통계</title>
<style>body{font:15px/1.5 system-ui,-apple-system,'Apple SD Gothic Neo',sans-serif;margin:0;padding:16px;background:#f4f5f1;color:#19202c}h1{font-size:20px;margin:0 0 4px}h2{font-size:16px;margin:24px 0 6px}
table{border-collapse:collapse;width:100%;background:#fff;border-radius:10px;overflow:hidden;font-size:14px}th,td{padding:7px 9px;border-bottom:1px solid #e3e6de;text-align:right;white-space:nowrap}th:first-child,td:first-child{text-align:left}th{background:#eceee8;font-weight:600}
.wrap{overflow-x:auto}.n{color:#5b6371;font-size:13px}.bad{color:#b2352b}.good{color:#2c7a4d}@media(prefers-color-scheme:dark){body{background:#11151c;color:#e6e8ec}table{background:#1a202b}th{background:#232a36}th,td{border-color:#2d3543}.n{color:#9aa2b0}}</style>${body}`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
  );
  if (env.STATS_KEY && url.searchParams.get("k") !== env.STATS_KEY)
    return page("<h1>비밀번호가 필요해요</h1><p>주소 끝에 ?k=비밀번호 를 붙여 주세요.</p>", 403);
  const d = await db(env);
  if (!d)
    return page(
      "<h1>D1 데이터베이스가 아직 연결되지 않았어요</h1><p>AI_SETUP.md의 “공부 알림·통계 켜기”를 따라 해 주세요. 지금은 통계가 Workers Logs에 [stat]으로만 남아요.</p>"
    );
  const days = Math.max(1, Math.min(60, parseInt(url.searchParams.get("days"), 10) || 7));
  const from = new Date(Date.now() - (days - 1) * 864e5).toISOString().slice(0, 10);
  const { results } = await d.prepare("SELECT day, k, n FROM stats WHERE day >= ? ORDER BY day").bind(from).all();
  const subs = await d.prepare("SELECT COUNT(*) AS n, SUM(CASE WHEN lang = 'en' THEN 1 ELSE 0 END) AS en FROM subs").first();
  const tot = {}, byDay = {};
  for (const r of results || []) {
    tot[r.k] = (tot[r.k] || 0) + r.n;
    (byDay[r.day] = byDay[r.day] || {})[r.k] = r.n;
  }
  const g = (o, k) => o[k] || 0;
  const dayRows = Object.keys(byDay).sort().reverse().map((day) => {
    const o = byDay[day], sum = (t) => Object.keys(o).filter((k) => k.split(":")[1] === t).reduce((n, k) => n + o[k], 0);
    return `<tr><td>${day}</td><td>${g(o, "ja:v:new") + g(o, "en:v:new")}</td><td>${g(o, "ja:v:back") + g(o, "en:v:back")}</td><td>${g(o, "ja:v:app") + g(o, "en:v:app")}</td><td>${g(o, "ja:t:start") + g(o, "en:t:start")} → ${g(o, "ja:t:done") + g(o, "en:t:done")}</td><td>${sum("o")}</td><td>${sum("f")}</td></tr>`;
  }).join("");
  const mods = {};
  for (const k of Object.keys(tot)) {
    const [lang, t, ...rest] = k.split(":");
    if (!"ofud".includes(t) || t.length !== 1) continue;
    const m = lang + " · " + rest[0];
    const o = mods[m] = mods[m] || { o: 0, f: 0, u: 0, d: 0, why: {} };
    o[t] += tot[k];
    if (t === "d" && rest[1]) o.why[rest[1]] = (o.why[rest[1]] || 0) + tot[k];
  }
  const WHY = { hard: "어려워요", easy: "쉬워요", odd: "문제가 이상", boring: "지루해요", bug: "고장" };
  const modRows = Object.entries(mods).sort((a, b) => b[1].o - a[1].o).map(([m, o]) => {
    const fr = o.o ? Math.round(o.f / o.o * 100) : 0;
    const why = Object.entries(o.why).map(([w, n]) => `${WHY[w] || w} ${n}`).join(", ");
    return `<tr><td>${h(m)}</td><td>${o.o}</td><td>${o.f}</td><td class="${fr < 30 && o.o >= 10 ? "bad" : ""}">${o.o ? fr + "%" : "–"}</td><td class="good">${o.u || ""}</td><td class="bad">${o.d || ""}</td><td class="n" style="text-align:left">${h(why)}</td></tr>`;
  }).join("");
  return page(`<h1>하나마루 사용 통계</h1><p class="n">최근 ${days}일 (UTC 날짜 기준, 한국 오전 9시에 바뀜) · <a href="?${env.STATS_KEY ? "k=" + encodeURIComponent(url.searchParams.get("k")) + "&" : ""}days=30">30일 보기</a> · 공부 알림 켠 사람 ${subs ? subs.n : 0}명 (영어 ${subs ? subs.en || 0 : 0})</p>
<h2>날짜별</h2><div class="wrap"><table><tr><th>날짜</th><th>처음 온 사람</th><th>다시 온 사람</th><th>홈 화면 앱</th><th>첫 체험 시작 → 끝</th><th>연습 열기</th><th>끝까지</th></tr>${dayRows || '<tr><td colspan="7">아직 기록이 없어요</td></tr>'}</table></div>
<h2>연습별 (많이 연 순서)</h2><p class="n">끝까지 = 문제를 다 풀고 결과 화면까지 간 횟수. 열어 놓고 그만두는 연습은 끝까지 비율이 낮아요.</p>
<div class="wrap"><table><tr><th>연습</th><th>열기</th><th>끝까지</th><th>비율</th><th>👍</th><th>👎</th><th>👎 이유</th></tr>${modRows || '<tr><td colspan="7">아직 기록이 없어요</td></tr>'}</table></div>`);
}
async function ttsBytes(out) {
  if (!out) return null;
  if (out instanceof ArrayBuffer) return new Uint8Array(out);
  if (out instanceof Uint8Array) return out;
  if (typeof ReadableStream !== "undefined" && out instanceof ReadableStream) return new Uint8Array(await new Response(out).arrayBuffer());
  const b642 = out.audio || out.result && out.result.audio;
  if (typeof b642 === "string") return Uint8Array.from(atob(b642), (ch) => ch.charCodeAt(0));
  return null;
}
async function handleTTS(req, env, url, c, ip, ctx) {
  const origin = req.headers.get("Origin") || "";
  const audioHeaders = { ...c.headers, "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=2592000" };
  if (!env.AI || String(env.AI_OFF || "") === "1" || String(env.TTS_OFF || "") === "1") return reply({ error: "off" }, 503, c.headers);
  if (!origin || !c.ok) return reply({ error: "forbidden" }, 403, c.headers);
  const lang = url.searchParams.get("l") === "en" ? "en" : "ja";
  const text = clip(url.searchParams.get("t"), 140).trim();
  if (!text) return reply({ error: "empty" }, 400, c.headers);
  const key = `https://hanamaru-tts.cache/v1/${lang}/${encodeURIComponent(text)}`;
  const cache = caches.default;
  const hit = await cache.match(key);
  if (hit) return new Response(hit.body, { status: 200, headers: audioHeaders });
  const day = kstDay();
  if (!(await bump(`tts:${day}:${ip}`, 400)).ok || !(await bump(`ttsall:${day}`, Math.max(1, parseInt(env.TTS_CAP, 10) || 2e4))).ok)
    return reply({ error: "limit" }, 429, c.headers);
  let bytes = null, lastErr = "";
  for (const l of lang === "en" ? ["en"] : ["jp", "ja"]) {
    try {
      bytes = await ttsBytes(await env.AI.run("@cf/myshell-ai/melotts", { prompt: text, lang: l }));
      if (bytes && bytes.length > 100) break;
    } catch (e) {
      lastErr = String(e && e.message || e);
    }
  }
  if (!bytes || bytes.length <= 100) {
    console.log("[tts]", lang, lastErr.slice(0, 160));
    return reply({ error: "tts failed" }, 502, c.headers);
  }
  const res = new Response(bytes, { status: 200, headers: audioHeaders });
  const save = cache.put(
    key,
    new Response(bytes, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=2592000" } })
  );
  if (ctx && ctx.waitUntil) ctx.waitUntil(save);
  else await save;
  return res;
}
const STT_MAX_BYTES = 52e4;
const STT_JUNK = /^(ご視聴ありがとうございました|ご覧いただきありがとうございます|チャンネル登録|お疲れ様でした|thank you for watching|thanks for watching|you)[。.!！\s]*$/i;
function b64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 32768) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
  return btoa(s);
}
async function handleSTT(req, env, url, c, ip) {
  if (!c.ok) return reply({ error: "forbidden" }, 403, c.headers);
  if (!env.AI || String(env.AI_OFF || "") === "1" || String(env.STT_OFF || "") === "1")
    return reply({ error: "서버 음성 인식은 잠시 쉬는 중이에요. ⌨️ 글자로 해 주세요." }, 503, c.headers);
  if (+(req.headers.get("Content-Length") || 0) > STT_MAX_BYTES)
    return reply({ error: "녹음이 너무 길어요. 짧게 나눠서 말해 주세요." }, 413, c.headers);
  const lang = url.searchParams.get("l") === "en" ? "en" : "ja";
  const bytes = new Uint8Array(await req.arrayBuffer());
  if (bytes.length < 3200 || bytes.length > STT_MAX_BYTES || bytes[0] !== 82 || bytes[1] !== 73 || bytes[8] !== 87 || bytes[9] !== 65)
    return reply({ error: "녹음을 읽을 수 없어요. 다시 해 보세요." }, 400, c.headers);
  const day = kstDay();
  if (!(await bump(`stt:${day}:${ip}`, Math.max(1, parseInt(env.STT_DAILY_LIMIT, 10) || 80))).ok)
    return reply({ error: "오늘 서버 음성 인식 횟수를 다 썼어요. ⌨️ 글자로 해 주세요. 내일 다시 돼요!" }, 429, c.headers);
  if (!(await bump(`sttall:${day}`, Math.max(1, parseInt(env.STT_CAP, 10) || 600))).ok)
    return reply({ error: "오늘은 음성 인식을 쓰는 사람이 많아서 무료 사용량이 다 찼어요. ⌨️ 글자로 해 주세요." }, 429, c.headers);
  const tries = [
    ["@cf/openai/whisper-large-v3-turbo", { audio: b64(bytes), language: lang, task: "transcribe", vad_filter: true }],
    ["@cf/openai/whisper", { audio: Array.from(bytes) }]
  ];
  let lastErr = "";
  for (const [model, input] of tries) {
    try {
      const out = await env.AI.run(model, input);
      const r = out && out.result || out || {};
      let text = String(r.text || (Array.isArray(r.segments) ? r.segments.map((s) => s.text).join("") : "") || "").replace(/\s+/g, " ").trim();
      if (STT_JUNK.test(text)) text = "";
      return reply({ text: clip(text, 300), model }, 200, c.headers);
    } catch (e) {
      lastErr = String(e && e.message || e);
      console.log("[stt]", model, lastErr.slice(0, 160));
      if (/neurons|quota|daily|4006/i.test(lastErr))
        return reply({ error: "오늘 AI 무료 사용량이 다 찼어요. 내일(오전 9시 이후) 다시 해 보세요." }, 429, c.headers);
    }
  }
  return reply({ error: "알아듣지 못했어요. 잠시 뒤 다시 해 보세요.", detail: lastErr.slice(0, 200) }, 502, c.headers);
}
async function runVision(env, system, image) {
  const models = env.VISION_MODEL ? [env.VISION_MODEL, ...VISION_MODELS] : VISION_MODELS;
  let lastErr = "";
  for (const model of models) {
    const b642 = image.split(",")[1];
    const tries = /llama-3\.2-11b-vision/.test(model) ? [
      {
        messages: [
          { role: "system", content: system },
          { role: "user", content: "Read the text in this photo." }
        ],
        image: b642,
        max_tokens: 900,
        temperature: 0.1
      }
    ] : [
      {
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: [
              { type: "text", text: "Read the text in this photo." },
              { type: "image_url", image_url: { url: image } }
            ]
          }
        ],
        max_tokens: 900,
        temperature: 0.1
      }
    ];
    for (const input of tries) {
      try {
        let out;
        try {
          out = await env.AI.run(model, input);
        } catch (e) {
          if (!/agree/i.test(String(e && e.message))) throw e;
          await env.AI.run(model, { prompt: "agree" });
          out = await env.AI.run(model, input);
        }
        const text = aiText(out);
        if (text) return { text, model };
      } catch (e) {
        lastErr = String(e && e.message || e);
        console.log("[vision]", model, lastErr.slice(0, 160));
        if (/neurons|quota|daily/i.test(lastErr)) return { error: lastErr };
      }
    }
  }
  return { error: lastErr || "no model" };
}
export default {
  async fetch(req, env, ctx) {
    const allowed = allowedList(env);
    const origin = req.headers.get("Origin") || "";
    const c = cors(origin, allowed);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: c.headers });
    const url = new URL(req.url);
    const ip = req.headers.get("CF-Connecting-IP") || "unknown";
    if (url.pathname.startsWith("/push/")) return handlePush(req, env, url.pathname, c, ip);
    if (url.pathname.startsWith("/sync/")) return handleSync(req, env, url, c, ip);
    if (url.pathname.startsWith("/grp/")) return handleGroup(req, env, url, c, ip);
    if (url.pathname === "/stats" && req.method === "GET") return statsPage(env, url);
    if (url.pathname === "/tts" && req.method === "GET") return handleTTS(req, env, url, c, ip, ctx);
    if (url.pathname === "/stat" && req.method === "POST") return handleStat(req, env, c, ip);
    if (url.pathname === "/stt" && req.method === "POST") return handleSTT(req, env, url, c, ip);
    if (req.method === "GET") return reply({ ok: true, name: "hanamaru-ai", ai: !!env.AI, db: !!env.DB }, 200, c.headers);
    if (req.method === "POST" && url.pathname === "/log") {
      if (!c.ok) return new Response(null, { status: 403, headers: c.headers });
      const day2 = kstDay();
      if (!(await bump(`log:${day2}:${ip}`, 20)).ok || !(await bump(`logall:${day2}`, 3e3)).ok)
        return new Response(null, { status: 204, headers: c.headers });
      let e = {};
      try {
        e = JSON.parse((await req.text()).slice(0, 2e3));
      } catch (er) {
      }
      const pick = (k) => clip(e[k], k === "stack" ? 400 : 200);
      console.log(
        "[app-error]",
        JSON.stringify({
          msg: pick("msg"),
          at: pick("at"),
          stack: pick("stack"),
          ver: pick("ver"),
          mod: pick("mod"),
          lang: pick("lang"),
          dev: pick("dev"),
          app: pick("app")
        })
      );
      return new Response(null, { status: 204, headers: c.headers });
    }
    if (req.method !== "POST" || url.pathname !== "/ai") return reply({ error: "not found" }, 404, c.headers);
    if (!c.ok) return reply({ error: "허용되지 않은 주소에서 온 요청이에요." }, 403, c.headers);
    if (!env.AI) return reply({ error: "Worker에 Workers AI(AI) 연결이 아직 없어요." }, 500, c.headers);
    if (String(env.AI_OFF || "") === "1") return reply({ error: "AI 회화는 잠시 쉬는 중이에요. 나중에 다시 와 주세요!" }, 503, c.headers);
    if (+(req.headers.get("Content-Length") || 0) > 25e5) return reply({ error: "사진이 너무 커요." }, 413, c.headers);
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return reply({ error: "bad request" }, 400, c.headers);
    }
    const task = String(body.task || "");
    const lang = body.lang === "en" ? "en" : "ja";
    const system = prompts(task, lang, body.scene, body.text);
    if (!system) return reply({ error: "unknown task" }, 400, c.headers);
    const day = kstDay();
    if (task === "photo") {
      const image = String(body.image || "");
      if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image) || image.length > 2e6)
        return reply({ error: "사진을 읽을 수 없어요." }, 400, c.headers);
      const mine = await bump(`photo:${day}:${ip}`, Math.max(1, parseInt(env.PHOTO_DAILY_LIMIT, 10) || 3));
      if (!mine.ok)
        return reply(
          { error: "사진 읽기는 하루 " + (parseInt(env.PHOTO_DAILY_LIMIT, 10) || 3) + "장까지예요. 내일 다시 만나요!" },
          429,
          c.headers
        );
      const allP = await bump(`photoall:${day}`, Math.max(1, parseInt(env.PHOTO_CAP, 10) || 150));
      if (!allP.ok)
        return reply({ error: "오늘은 사진 읽기를 찾는 사람이 많아서 무료 사용량이 다 찼어요. 내일 다시 해 보세요." }, 429, c.headers);
      const all2 = await bump(`all:${day}`, Math.max(1, parseInt(env.DAILY_CAP, 10) || 600));
      if (!all2.ok) return reply({ error: "오늘은 AI를 찾는 사람이 많아서 무료 사용량이 다 찼어요. 내일 다시 해 보세요." }, 429, c.headers);
      const r = await runVision(env, system, image);
      if (r.text) return reply({ text: r.text, model: r.model }, 200, c.headers);
      if (/neurons|quota|daily/i.test(r.error || ""))
        return reply({ error: "오늘 AI 무료 사용량이 다 찼어요. 내일(오전 9시 이후) 다시 해 보세요." }, 429, c.headers);
      return reply({ error: "사진을 읽지 못했어요. 잠시 뒤 다시 해 보세요.", detail: String(r.error || "").slice(0, 200) }, 502, c.headers);
    }
    const perIp = await bump(`ip:${day}:${ip}`, Math.max(1, parseInt(env.IP_DAILY_LIMIT, 10) || 30));
    if (!perIp.ok) return reply({ error: "오늘 사용할 수 있는 AI 횟수를 다 썼어요. 내일 다시 만나요!" }, 429, c.headers);
    const all = await bump(`all:${day}`, Math.max(1, parseInt(env.DAILY_CAP, 10) || 600));
    if (!all.ok) return reply({ error: "오늘은 AI를 찾는 사람이 많아서 무료 사용량이 다 찼어요. 내일 다시 해 보세요." }, 429, c.headers);
    const messages = [{ role: "system", content: system }];
    if (task === "translate" || task === "diary") messages.push({ role: "user", content: clip(body.text, task === "diary" ? 200 : 400) });
    else {
      const hist = (Array.isArray(body.messages) ? body.messages : []).slice(-MAX_MSGS).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: clip(m.content, MAX_LEN)
      }));
      if (task === "chat") {
        const turns = [];
        for (const m of hist) {
          const last = turns[turns.length - 1];
          if (last && last.role === m.role) last.content += "\n" + m.content;
          else turns.push({ ...m });
        }
        if (turns[0] && turns[0].role === "assistant") turns.unshift({ role: "user", content: "(The scene starts. Please greet me.)" });
        messages.push(...turns);
      } else
        messages.push({
          role: "user",
          content: "Conversation:\n" + hist.map((m) => `${m.role === "assistant" ? "partner" : "learner"}: ${m.content}`).join("\n")
        });
    }
    const maxTokens = task === "review" ? 700 : task === "translate" ? 400 : task === "diary" ? 450 : task === "hint" ? 260 : 160;
    const models = env.MODEL ? [env.MODEL, ...MODELS] : MODELS;
    let lastErr = "";
    for (const model of models) {
      try {
        const out = await env.AI.run(model, { messages, max_tokens: maxTokens, temperature: task === "chat" ? 0.7 : 0.3 });
        const text = aiText(out);
        if (text) return reply({ text, model }, 200, c.headers);
      } catch (e) {
        lastErr = String(e && e.message || e);
        if (/limit|quota|429|neurons/i.test(lastErr))
          return reply({ error: "오늘 AI 무료 사용량이 다 찼어요. 내일(오전 9시 이후) 다시 해 보세요." }, 429, c.headers);
      }
    }
    return reply({ error: "AI가 답하지 못했어요. 잠시 뒤 다시 해 보세요.", detail: lastErr.slice(0, 200) }, 502, c.headers);
  },
  async scheduled(event, env, ctx) {
    if (!env.DB) return;
    ctx.waitUntil(runPush(env).then((r) => r.sent && console.log("[push] sent", JSON.stringify(r))));
  }
};
