import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { chmod, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(fileURLToPath(new URL("..", import.meta.url)));
const distDir = resolve(rootDir, "dist");
const configPath = resolve(rootDir, ".keyou-ai-provider.local.json");
const sessions = new Map();
const sessionTtlMs = 1000 * 60 * 60 * 8;
const sceneTypes = ["story", "drag-classify", "match", "quiz-race", "boss", "flashcard", "ordering", "memory"];

const defaultDeepSeekProvider = {
  id: "api-deepseek",
  name: "DeepSeek 课件生成",
  provider: "DeepSeek",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-chat",
  apiKey: "",
  enabled: true,
  dailyLimit: 2000,
  monthlyCostCap: 3000,
  updatedAt: ""
};

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

await loadLocalEnvFiles();

const server = createServer(async (req, res) => {
  try {
    const handled = await handleApiRequest(req, res);
    if (handled) return;

    await serveStatic(req, res);
  } catch (error) {
    writeJson(res, 500, {
      ok: false,
      message: error instanceof Error ? error.message : "服务器异常。"
    });
  }
});

async function loadLocalEnvFiles() {
  const envFiles = [
    resolve(rootDir, ".env.production.local"),
    resolve(rootDir, ".env.local"),
    resolve(rootDir, ".env")
  ];

  for (const envPath of envFiles) {
    try {
      const raw = await readFile(envPath, "utf8");
      await assertSecretFileMode(envPath, raw);
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const separatorIndex = trimmed.indexOf("=");
        if (separatorIndex <= 0) continue;

        const key = trimmed.slice(0, separatorIndex).trim();
        const value = unquoteEnvValue(trimmed.slice(separatorIndex + 1).trim());
        if (!process.env[key]) process.env[key] = value;
      }
    } catch (error) {
      if (!isMissingFileError(error)) throw error;
      // Missing local env files are expected in managed deployments.
    }
  }
}

function unquoteEnvValue(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "0.0.0.0";

server.listen(port, host, () => {
  console.log(`课游AI production server listening on http://${host}:${port}`);
});

async function handleApiRequest(req, res) {
  const path = req.url?.split("?")[0] ?? "";
  if (!path.startsWith("/api/ai/")) return false;

  if (!isAllowedOrigin(req)) {
    return writeJson(res, 403, { ok: false, message: "AI 接口拒绝跨站请求。" });
  }

  if (req.method === "POST" && path === "/api/ai/session") {
    const result = await createSession(await readJsonBody(req));
    return writeJson(res, result.ok ? 200 : 401, result);
  }

  if (req.method === "POST" && path === "/api/ai/config") {
    const auth = requireSession(req, "admin");
    if (!auth.ok) return writeJson(res, auth.status, { ok: false, message: auth.message });
    const body = asRecord(await readJsonBody(req));
    const requestProvider = asRecord(body.provider);
    const savedProvider = await loadProviderConfig();
    const provider =
      !stringOr(requestProvider.apiKey, "") && savedProvider
        ? normalizeProvider({ ...requestProvider, apiKey: savedProvider.apiKey })
        : normalizeProvider(requestProvider);
    await saveProviderConfig(provider);
    return writeJson(res, 200, {
      ok: true,
      message: "DeepSeek 配置已保存到服务器后端，老师端生成会使用这份配置。"
    });
  }

  if (req.method === "POST" && path === "/api/ai/test-provider") {
    const auth = requireSession(req, "admin");
    if (!auth.ok) return writeJson(res, auth.status, { ok: false, message: auth.message });
    const body = asRecord(await readJsonBody(req));
    const requestProvider = asRecord(body.provider);
    const savedProvider = await loadProviderConfig();
    const provider =
      stringOr(requestProvider.apiKey, "") || !savedProvider
        ? normalizeProvider(requestProvider)
        : savedProvider;
    const result = await testDeepSeekProvider(provider);
    return writeJson(res, result.ok ? 200 : 400, result);
  }

  if (req.method === "POST" && path === "/api/ai/generate-lesson") {
    const auth = requireSession(req);
    if (!auth.ok) return writeJson(res, auth.status, { ok: false, message: auth.message });
    const body = asRecord(await readJsonBody(req));
    const input = normalizeInput(body.input);
    const provider = await loadProviderConfig();
    if (!provider) {
      return writeJson(res, 400, {
        ok: false,
        message: "还没有可用的 DeepSeek 配置，请先在 Ops 后台保存真实 API Key。"
      });
    }

    const result = await generateLessonViaDeepSeek(input, provider);
    return writeJson(res, result.ok ? 200 : 400, result);
  }

  return writeJson(res, 404, { ok: false, message: "未知 AI 接口。" });
}

async function serveStatic(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return writeJson(res, 405, { ok: false, message: "Method Not Allowed" });
  }

  const parsedUrl = new URL(req.url || "/", "http://localhost");
  const pathname = decodeURIComponent(parsedUrl.pathname);
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const staticPath = safeResolveDistPath(requestedPath);
  const filePath = await existingFileOrIndex(staticPath);
  const ext = extname(filePath).toLowerCase();

  res.statusCode = 200;
  res.setHeader("Content-Type", contentTypes[ext] || "application/octet-stream");
  if (req.method === "HEAD") return res.end();
  createReadStream(filePath).pipe(res);
}

function safeResolveDistPath(pathname) {
  const normalized = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = resolve(distDir, `.${sep}${normalized}`);
  if (!filePath.startsWith(distDir + sep) && filePath !== distDir) {
    return resolve(distDir, "index.html");
  }
  return filePath;
}

async function existingFileOrIndex(filePath) {
  try {
    const fileStat = await stat(filePath);
    if (fileStat.isFile()) return filePath;
  } catch {
    return resolve(distDir, "index.html");
  }

  return resolve(distDir, "index.html");
}

async function generateLessonViaDeepSeek(input, provider, fetchImpl = fetch) {
  try {
    const normalizedProvider = normalizeProvider(provider);
    const response = await fetchImpl(buildChatCompletionsUrl(normalizedProvider.baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${normalizedProvider.apiKey}`
      },
      body: JSON.stringify({
        model: normalizedProvider.model,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: buildLessonMessages(input)
      })
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `DeepSeek 生成失败：${await readErrorText(response)}`
      };
    }

    const payload = await response.json();
    const content = extractAssistantText(payload);
    const lesson = normalizeLesson(parseJsonContent(content), input);
    return {
      ok: true,
      lesson,
      message: `DeepSeek 已生成《${lesson.title}》，可以继续编辑。`
    };
  } catch (error) {
    return {
      ok: false,
      message: `DeepSeek 生成失败：${error instanceof Error ? error.message : "未知错误"}`
    };
  }
}

async function testDeepSeekProvider(provider, fetchImpl = fetch) {
  try {
    const normalizedProvider = normalizeProvider(provider);
    const response = await fetchImpl(buildChatCompletionsUrl(normalizedProvider.baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${normalizedProvider.apiKey}`
      },
      body: JSON.stringify({
        model: normalizedProvider.model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "只返回 JSON。" },
          { role: "user", content: "返回 {\"ok\":true,\"service\":\"deepseek-lesson\"}，用于连接测试。" }
        ]
      })
    });

    if (!response.ok) {
      return { ok: false, message: `DeepSeek 连接失败：${await readErrorText(response)}` };
    }

    return { ok: true, message: `DeepSeek 连接测试通过：${normalizedProvider.model}` };
  } catch (error) {
    return {
      ok: false,
      message: `DeepSeek 连接失败：${error instanceof Error ? error.message : "未知错误"}`
    };
  }
}

async function saveProviderConfig(provider) {
  const normalizedProvider = normalizeProvider(provider);
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, JSON.stringify(normalizedProvider, null, 2), {
    encoding: "utf8",
    mode: 0o600
  });
  await chmod(configPath, 0o600);
}

async function loadProviderConfig() {
  const envProvider = providerFromEnv();
  if (envProvider) return envProvider;

  try {
    await assertSecretFileMode(configPath);
    const raw = await readFile(configPath, "utf8");
    return normalizeProvider(JSON.parse(raw));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return null;
    }
    if (error instanceof SyntaxError) return null;
    throw error;
  }
}

function isMissingFileError(error) {
  return error && typeof error === "object" && "code" in error && error.code === "ENOENT";
}

async function assertSecretFileMode(filePath, rawContent) {
  const content = rawContent ?? await readFile(filePath, "utf8");
  const containsSecret = /DEEPSEEK_API_KEY\s*=|\"apiKey\"\s*:\s*\"sk-/i.test(content);
  if (!containsSecret) return;

  const fileStat = await stat(filePath);
  const mode = fileStat.mode & 0o777;
  if ((mode & 0o077) !== 0) {
    throw new Error(`${filePath} 包含密钥但权限过宽，请执行 chmod 600 ${filePath}`);
  }
}

function providerFromEnv() {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) return null;

  return normalizeProvider({
    ...defaultDeepSeekProvider,
    apiKey,
    baseUrl: process.env.DEEPSEEK_BASE_URL?.trim() || defaultDeepSeekProvider.baseUrl,
    model: process.env.DEEPSEEK_MODEL?.trim() || defaultDeepSeekProvider.model,
    updatedAt: new Date().toLocaleString("zh-CN", { hour12: false })
  });
}

function createSession(value) {
  const body = asRecord(value);
  const mode = stringOr(body.mode, "");
  const validUser =
    mode === "admin"
      ? createAdminUserFromPassword(stringOr(body.username, ""), stringOr(body.password, ""))
      : mode === "invite"
        ? createInviteSessionFromPayload(body)
        : null;

  if (!validUser) {
    return { ok: false, message: "登录信息无效，无法建立 AI 会话。" };
  }

  const token = randomUUID();
  sessions.set(token, { role: validUser.role, createdAt: Date.now() });
  return { ok: true, token, message: "AI 会话已建立。" };
}

function createAdminUserFromPassword(username, password) {
  const expectedUsername = process.env.KEYOU_ADMIN_USERNAME || "admin";
  const expectedPassword = process.env.KEYOU_ADMIN_PASSWORD || "keyou2026";
  if (username.trim().toLowerCase() !== expectedUsername.toLowerCase()) return null;
  if (password !== expectedPassword) return null;
  return { role: "admin" };
}

function createInviteSessionFromPayload(body) {
  const inviteCode = stringOr(body.inviteCode, "").toUpperCase();
  if (!/^(KEYOU|MONTH|POINTS|TRIAL)-/.test(inviteCode)) return null;
  return { role: "teacher" };
}

function requireSession(req, role) {
  const token = req.headers["x-keyou-session"];
  const session = typeof token === "string" ? sessions.get(token) : undefined;
  if (!session) {
    return { ok: false, status: 401, message: "请先登录后再使用 AI 服务。" };
  }

  if (Date.now() - session.createdAt > sessionTtlMs) {
    sessions.delete(token);
    return { ok: false, status: 401, message: "AI 会话已过期，请重新登录。" };
  }

  if (role && session.role !== role) {
    return { ok: false, status: 403, message: "只有管理员可以配置 DeepSeek。" };
  }

  return { ok: true, status: 200, message: "ok" };
}

function isAllowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    return originUrl.host === req.headers.host;
  } catch {
    return false;
  }
}

function normalizeProvider(value) {
  const provider = asRecord(value);
  const apiKey = stringOr(provider.apiKey, "");
  if (isDemoApiKey(apiKey)) {
    throw new Error("请在 Ops 后台填写真实 DeepSeek API Key。");
  }

  const baseUrl = stringOr(provider.baseUrl, defaultDeepSeekProvider.baseUrl);
  assertDeepSeekBaseUrl(baseUrl);
  const model = stringOr(provider.model, defaultDeepSeekProvider.model);
  if (!model.startsWith("deepseek-")) {
    throw new Error("模型名称必须使用 DeepSeek 模型。");
  }

  return {
    id: stringOr(provider.id, defaultDeepSeekProvider.id),
    name: stringOr(provider.name, defaultDeepSeekProvider.name),
    provider: "DeepSeek",
    baseUrl,
    model,
    apiKey,
    enabled: provider.enabled !== false,
    dailyLimit: numberOr(provider.dailyLimit, defaultDeepSeekProvider.dailyLimit),
    monthlyCostCap: numberOr(provider.monthlyCostCap, defaultDeepSeekProvider.monthlyCostCap),
    updatedAt: stringOr(provider.updatedAt, new Date().toLocaleString("zh-CN", { hour12: false }))
  };
}

function assertDeepSeekBaseUrl(baseUrl) {
  let parsed;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error("DeepSeek Base URL 格式不正确。");
  }

  if (parsed.protocol !== "https:" || parsed.hostname !== "api.deepseek.com") {
    throw new Error("DeepSeek Base URL 只能使用 https://api.deepseek.com。");
  }
}

function buildChatCompletionsUrl(baseUrl) {
  const normalized = baseUrl.trim().replace(/\/+$/, "");
  if (normalized.endsWith("/chat/completions")) return normalized;
  if (/^https:\/\/api\.deepseek\.com(?:\/v1)?$/i.test(normalized)) {
    return "https://api.deepseek.com/chat/completions";
  }
  if (/\/v\d+$/i.test(normalized)) return `${normalized}/chat/completions`;
  return `${normalized}/v1/chat/completions`;
}

function buildLessonMessages(input) {
  return [
    {
      role: "system",
      content: [
        "你是面向中国小学老师的互动游戏课件生成引擎。",
        "你必须只返回合法 JSON，不要 Markdown，不要解释。",
        "输出必须能被老师继续编辑，并能直接进入课堂游戏。"
      ].join("\n")
    },
    {
      role: "user",
      content: [
        "Skill：keyou-deepseek-lesson-generation",
        "版本：2026-05-01",
        "",
        "任务：生成一节老师可继续编辑的互动游戏课件 JSON。",
        `课题：${input.topic}`,
        `学段：${input.grade}`,
        `学科：${input.subject}`,
        `玩法：${input.mode}`,
        `班级人数：${input.studentCount}`,
        "",
        "输出 JSON 字段：",
        "- title: 课件标题",
        "- grade: 学段",
        "- subject: 学科",
        "- gameMode: 玩法",
        "- scenes: 必须 5 个关卡",
        "",
        "每个 scene 必须包含：",
        "- type: 只能从 story, drag-classify, match, quiz-race, boss, flashcard, ordering, memory 中选择",
        "- title: 适合老师识别的关卡名",
        "- description: 面向课堂的关卡说明",
        "- questions: 1-3 道题",
        "- rewards: { stars: number, coins: number }",
        "- match/memory 的 options 使用“左项:右项”形式；ordering 的 answer 使用逗号分隔的正确顺序；flashcard 使用 prompt/answer 作为卡片正反面",
        "",
        "每个 question 必须包含：",
        "- prompt: 小学生能读懂的题干",
        "- options: 3-4 个短选项",
        "- answer: 正确答案，必须完全匹配一个选项或明确答案文本",
        "- explanation: 1-2 句讲解",
        "",
        "内容要求：",
        "- 贴近中国小学课堂",
        "- 难度与学段匹配",
        "- 题干、选项、解释都要具体，不要空泛",
        "- 避免生成成人化、营销化、平台说明类内容",
        "- 不要输出除 JSON 对象之外的任何字符"
      ].join("\n")
    }
  ];
}

function normalizeInput(value) {
  const input = asRecord(value);
  return {
    topic: stringOr(input.topic, "三年级数学：认识分数"),
    grade: stringOr(input.grade, "小学中段"),
    subject: stringOr(input.subject, "数学"),
    mode: stringOr(input.mode, "闯关地图"),
    studentCount: numberOr(input.studentCount, 30)
  };
}

function extractAssistantText(payload) {
  const data = asRecord(payload);
  const choices = Array.isArray(data.choices) ? data.choices : [];
  const firstChoice = asRecord(choices[0]);
  const message = asRecord(firstChoice.message);
  const chatContent = message.content;
  if (typeof chatContent === "string" && chatContent.trim()) return chatContent;

  throw new Error("DeepSeek 返回中没有可解析的文本内容");
}

function parseJsonContent(content) {
  const withoutFence = content
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("DeepSeek 返回不是 JSON 对象");
  }
  return JSON.parse(withoutFence.slice(start, end + 1));
}

function normalizeLesson(payload, input) {
  const data = asRecord(payload);
  const lessonData = asRecord(data.lesson ?? data);
  const rawScenes = Array.isArray(lessonData.scenes) ? lessonData.scenes : [];
  const scenes = rawScenes.map(normalizeScene).filter(Boolean).slice(0, 6);

  if (scenes.length === 0) {
    throw new Error("DeepSeek 返回缺少 scenes 关卡数据");
  }

  return {
    id: `lesson-deepseek-${Date.now()}`,
    title: stringOr(lessonData.title, input.topic),
    grade: stringOr(lessonData.grade, input.grade),
    subject: stringOr(lessonData.subject, input.subject),
    gameMode: stringOr(lessonData.gameMode, input.mode),
    scenes
  };
}

function normalizeScene(rawScene, index) {
  const scene = asRecord(rawScene);
  const rewards = asRecord(scene.rewards);
  const rawQuestions = Array.isArray(scene.questions) ? scene.questions : [];

  return {
    id: stringOr(scene.id, `scene-deepseek-${index + 1}`),
    type: normalizeSceneType(scene.type, index),
    title: stringOr(scene.title, `第${index + 1}关`),
    description: stringOr(scene.description, "DeepSeek 生成的课堂关卡。"),
    questions: rawQuestions.map(normalizeQuestion).filter(Boolean).slice(0, 5),
    rewards: {
      stars: numberOr(rewards.stars, index === 0 ? 1 : 3),
      coins: numberOr(rewards.coins, index === 0 ? 10 : 20)
    }
  };
}

function normalizeQuestion(rawQuestion, index) {
  const question = asRecord(rawQuestion);
  const prompt = stringOr(question.prompt, "");
  if (!prompt) return null;

  return {
    id: stringOr(question.id, `q-deepseek-${index + 1}`),
    prompt,
    options: normalizeOptions(question.options),
    answer: stringOr(question.answer, "待老师确认"),
    explanation: typeof question.explanation === "string" ? question.explanation : undefined
  };
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) return [];
  return options.map((item) => String(item)).filter(Boolean).slice(0, 6);
}

function normalizeSceneType(type, index) {
  if (typeof type === "string" && sceneTypes.includes(type)) return type;
  return sceneTypes[Math.min(index, sceneTypes.length - 1)];
}

function isDemoApiKey(apiKey) {
  const normalized = apiKey.trim().toLowerCase();
  return !normalized || normalized.includes("demo") || normalized.includes("placeholder");
}

function asRecord(value) {
  return value && typeof value === "object" ? value : {};
}

function stringOr(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function numberOr(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? JSON.parse(raw) : {};
}

function writeJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
  return true;
}

async function readErrorText(response) {
  const statusText = [response.status, response.statusText].filter(Boolean).join(" ");
  try {
    const body = await response.text();
    return body.trim() ? `${statusText || "HTTP 错误"} ${body.slice(0, 180)}` : statusText || "HTTP 错误";
  } catch {
    return statusText || "HTTP 错误";
  }
}
