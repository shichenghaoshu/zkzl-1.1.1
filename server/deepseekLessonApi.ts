import { chmod, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { dirname, resolve } from "node:path";
import type { ApiProviderConfig } from "../src/data/mockDatabase";
import type { Lesson, Question, Scene } from "../src/data/mockLessons";
import { createAdminUserFromPassword, createUserFromInvite } from "../src/data/mockCommerce";
import { buildLessonMessages } from "./lessonPrompt";
import {
  buildChatCompletionsUrl,
  type LessonGenerationInput
} from "../src/services/lessonAi";

type FetchLike = (input: string, init: RequestInit) => Promise<ResponseLike>;

type ResponseLike = {
  ok: boolean;
  status?: number;
  statusText?: string;
  json: () => Promise<unknown>;
  text?: () => Promise<string>;
};

type ApiResult =
  | { ok: true; lesson: Lesson; message: string }
  | { ok: false; message: string };

const sceneTypes: Scene["type"][] = ["story", "drag-classify", "match", "quiz-race", "boss", "flashcard", "ordering", "memory"];
const configPath = resolve(process.cwd(), ".keyou-ai-provider.local.json");
const sessions = new Map<string, { role: "teacher" | "admin"; createdAt: number }>();
const sessionTtlMs = 1000 * 60 * 60 * 8;

export const defaultDeepSeekProvider: ApiProviderConfig = {
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

export async function handleDeepSeekApiRequest(req: IncomingMessage, res: ServerResponse) {
  const path = req.url?.split("?")[0] ?? "";
  if (!path.startsWith("/api/ai/")) return false;

  try {
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
        message: "DeepSeek 配置已保存到本地后端，老师端生成会使用这份配置。"
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
  } catch (error) {
    return writeJson(res, 500, {
      ok: false,
      message: error instanceof Error ? error.message : "AI 服务异常。"
    });
  }
}

export async function generateLessonViaDeepSeek(
  input: LessonGenerationInput,
  provider: ApiProviderConfig,
  fetchImpl: FetchLike = fetch
): Promise<ApiResult> {
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

export async function testDeepSeekProvider(
  provider: ApiProviderConfig,
  fetchImpl: FetchLike = fetch
) {
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

export async function saveProviderConfig(provider: ApiProviderConfig) {
  const normalizedProvider = normalizeProvider(provider);
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, JSON.stringify(normalizedProvider, null, 2), {
    encoding: "utf8",
    mode: 0o600
  });
  await chmod(configPath, 0o600);
}

export async function loadProviderConfig() {
  const envProvider = providerFromEnv();
  if (envProvider) return envProvider;

  try {
    await assertSecretFileMode(configPath);
    const raw = await readFile(configPath, "utf8");
    return normalizeProvider(JSON.parse(raw));
  } catch (error) {
    if (isMissingFileError(error) || error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }
}

function isMissingFileError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "ENOENT"
  );
}

async function assertSecretFileMode(filePath: string) {
  const raw = await readFile(filePath, "utf8");
  if (!/"apiKey"\s*:\s*"sk-/i.test(raw)) return;

  const fileStat = await stat(filePath);
  const mode = fileStat.mode & 0o777;
  if ((mode & 0o077) !== 0) {
    throw new Error(`${filePath} 包含密钥但权限过宽，请执行 chmod 600 ${filePath}`);
  }
}

function providerFromEnv(): ApiProviderConfig | null {
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

function normalizeProvider(value: unknown): ApiProviderConfig {
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

async function createSession(value: unknown) {
  const body = asRecord(value);
  const mode = stringOr(body.mode, "");
  const validUser =
    mode === "admin"
      ? createAdminUserFromPassword(stringOr(body.username, ""), stringOr(body.password, ""))
      : mode === "invite"
        ? createUserFromInvite(
            stringOr(body.inviteCode, ""),
            stringOr(body.name, ""),
            stringOr(body.organizationName, "")
          ) ?? createInviteSessionFromPayload(body)
        : null;

  if (!validUser) {
    return { ok: false, message: "登录信息无效，无法建立 AI 会话。" };
  }

  const token = randomUUID();
  sessions.set(token, { role: validUser.user.role, createdAt: Date.now() });
  return { ok: true, token, message: "AI 会话已建立。" };
}

function createInviteSessionFromPayload(body: Record<string, unknown>) {
  const inviteCode = stringOr(body.inviteCode, "").toUpperCase();
  if (!/^(KEYOU|MONTH|POINTS|TRIAL)-/.test(inviteCode)) return null;

  return {
    user: {
      role: "teacher" as const
    }
  };
}

function requireSession(req: IncomingMessage, role?: "admin") {
  const token = req.headers["x-keyou-session"];
  const session = typeof token === "string" ? sessions.get(token) : undefined;
  if (!session) {
    return { ok: false as const, status: 401, message: "请先登录后再使用 AI 服务。" };
  }

  if (Date.now() - session.createdAt > sessionTtlMs) {
    sessions.delete(typeof token === "string" ? token : "");
    return { ok: false as const, status: 401, message: "AI 会话已过期，请重新登录。" };
  }

  if (role && session.role !== role) {
    return { ok: false as const, status: 403, message: "只有管理员可以配置 DeepSeek。" };
  }

  return { ok: true as const, status: 200, message: "ok" };
}

function isAllowedOrigin(req: IncomingMessage) {
  const origin = req.headers.origin;
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    return originUrl.host === req.headers.host;
  } catch {
    return false;
  }
}

function assertDeepSeekBaseUrl(baseUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error("DeepSeek Base URL 格式不正确。");
  }

  if (parsed.protocol !== "https:" || parsed.hostname !== "api.deepseek.com") {
    throw new Error("DeepSeek Base URL 只能使用 https://api.deepseek.com。");
  }
}

function normalizeInput(value: unknown): LessonGenerationInput {
  const input = asRecord(value);
  return {
    topic: stringOr(input.topic, "三年级数学：认识分数"),
    grade: stringOr(input.grade, "小学中段"),
    subject: stringOr(input.subject, "数学"),
    mode: stringOr(input.mode, "闯关地图"),
    studentCount: numberOr(input.studentCount, 30)
  };
}

function extractAssistantText(payload: unknown) {
  const data = asRecord(payload);
  const choices = Array.isArray(data.choices) ? data.choices : [];
  const firstChoice = asRecord(choices[0]);
  const message = asRecord(firstChoice.message);
  const chatContent = message.content;
  if (typeof chatContent === "string" && chatContent.trim()) return chatContent;

  throw new Error("DeepSeek 返回中没有可解析的文本内容");
}

function parseJsonContent(content: string) {
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
  return JSON.parse(withoutFence.slice(start, end + 1)) as unknown;
}

function normalizeLesson(payload: unknown, input: LessonGenerationInput): Lesson {
  const data = asRecord(payload);
  const lessonData = asRecord(data.lesson ?? data);
  const rawScenes = Array.isArray(lessonData.scenes) ? lessonData.scenes : [];
  const scenes = rawScenes.map(normalizeScene).filter(Boolean).slice(0, 6) as Scene[];

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

function normalizeScene(rawScene: unknown, index: number): Scene {
  const scene = asRecord(rawScene);
  const rewards = asRecord(scene.rewards);
  const rawQuestions = Array.isArray(scene.questions) ? scene.questions : [];

  return {
    id: stringOr(scene.id, `scene-deepseek-${index + 1}`),
    type: normalizeSceneType(scene.type, index),
    title: stringOr(scene.title, `第${index + 1}关`),
    description: stringOr(scene.description, "DeepSeek 生成的课堂关卡。"),
    questions: rawQuestions.map(normalizeQuestion).filter(Boolean).slice(0, 5) as Question[],
    rewards: {
      stars: numberOr(rewards.stars, index === 0 ? 1 : 3),
      coins: numberOr(rewards.coins, index === 0 ? 10 : 20)
    }
  };
}

function normalizeQuestion(rawQuestion: unknown, index: number): Question | null {
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

function normalizeOptions(options: unknown) {
  if (!Array.isArray(options)) return [];
  return options.map((item) => String(item)).filter(Boolean).slice(0, 6);
}

function normalizeSceneType(type: unknown, index: number): Scene["type"] {
  if (typeof type === "string" && sceneTypes.includes(type as Scene["type"])) {
    return type as Scene["type"];
  }
  return sceneTypes[Math.min(index, sceneTypes.length - 1)];
}

function isDemoApiKey(apiKey: string) {
  const normalized = apiKey.trim().toLowerCase();
  return !normalized || normalized.includes("demo") || normalized.includes("placeholder");
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function stringOr(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function numberOr(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

async function readJsonBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? JSON.parse(raw) : {};
}

function writeJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
  return true;
}

async function readErrorText(response: ResponseLike) {
  const statusText = [response.status, response.statusText].filter(Boolean).join(" ");
  try {
    if (response.text) {
      const body = await response.text();
      return body.trim() ? `${statusText || "HTTP 错误"} ${body.slice(0, 180)}` : statusText || "HTTP 错误";
    }
  } catch {
    return statusText || "HTTP 错误";
  }
  return statusText || "HTTP 错误";
}
