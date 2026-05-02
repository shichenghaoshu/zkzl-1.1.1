import type { ApiProviderConfig } from "../data/mockDatabase";
import type { AuthUser } from "../data/mockCommerce";
import type { Lesson, Question, Scene } from "../data/mockLessons";

export type LessonGenerationInput = {
  topic: string;
  grade: string;
  subject: string;
  mode: string;
  studentCount: number;
};

export type AiProviderStatus =
  | { ok: true; provider: ApiProviderConfig; message: string }
  | { ok: false; provider?: undefined; message: string };

export type AiLessonResult =
  | { ok: true; lesson: Lesson; message: string; providerName: string }
  | { ok: false; message: string; providerName?: string };

export const aiSessionStorageKey = "keyou-ai-session-token";

type FetchLike = (input: string, init: RequestInit) => Promise<ResponseLike>;

type ResponseLike = {
  ok: boolean;
  status?: number;
  statusText?: string;
  json: () => Promise<unknown>;
  text?: () => Promise<string>;
};

const sceneTypes: Scene["type"][] = ["story", "drag-classify", "match", "quiz-race", "boss", "flashcard", "ordering", "memory"];

export function getAiProviderStatus(providers: ApiProviderConfig[]): AiProviderStatus {
  const enabledProviders = providers.filter((provider) => provider.enabled);
  if (enabledProviders.length === 0) {
    return {
      ok: false,
      message: "管理员还没有启用 DeepSeek API 通道，请到 Ops 后台启用 DeepSeek 配置。"
    };
  }

  const provider = enabledProviders.find(
    (item) =>
      item.baseUrl.trim() &&
      item.model.trim() &&
      (usesServerStoredDeepSeekSecret(item) ||
        item.secretStored ||
        (item.apiKey.trim() && !isDemoApiKey(item.apiKey)))
  );

  if (!provider) {
    return {
      ok: false,
      message: "管理员需要先在 Ops 后台填写真实 DeepSeek API Key、Base URL 和模型，默认体验密钥不会用于真实 AI 生成。"
    };
  }

  return {
    ok: true,
    provider,
    message: `将使用管理员配置的 ${provider.name} 生成课件。`
  };
}

export function buildChatCompletionsUrl(baseUrl: string) {
  const normalized = baseUrl.trim().replace(/\/+$/, "");
  if (normalized.endsWith("/chat/completions")) return normalized;
  if (/^https:\/\/api\.deepseek\.com(?:\/v1)?$/i.test(normalized)) {
    return "https://api.deepseek.com/chat/completions";
  }
  if (/\/v\d+$/i.test(normalized)) return `${normalized}/chat/completions`;
  return `${normalized}/v1/chat/completions`;
}

export async function generateLessonWithAi(
  input: LessonGenerationInput,
  providers: ApiProviderConfig[],
  fetchImpl: FetchLike = fetch
): Promise<AiLessonResult> {
  const status = getAiProviderStatus(providers);
  if (!status.ok) return { ok: false, message: status.message };

  const provider = status.provider;

  try {
    const response = await fetchImpl("/api/ai/generate-lesson", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getSessionHeaders()
      },
      body: JSON.stringify({
        input,
        providerId: provider.id
      })
    });

    if (!response.ok) {
      const errorText = await readErrorText(response);
      if (response.status === 401 || errorText.includes("请先登录")) {
        return {
          ok: false,
          providerName: provider.name,
          message: `AI 会话已过期或未建立：${errorText}。请重新使用邀请码登录后再生成。`
        };
      }

      return {
        ok: false,
        providerName: provider.name,
        message: `AI 生成失败：${errorText}。请检查 Ops 后台的 DeepSeek Base URL、模型和 API Key。`
      };
    }

    const payload = await readJsonObject(response, "AI 生成接口");
    const data = asRecord(payload);
    const lesson = normalizeLesson(data.lesson, input);

    return {
      ok: true,
      lesson,
      providerName: provider.name,
      message: stringOr(data.message, `已通过 ${provider.name} 生成课件。`)
    };
  } catch (error) {
    return {
      ok: false,
      providerName: provider.name,
      message: `AI 生成失败：${error instanceof Error ? error.message : "未知错误"}。`
    };
  }
}

export async function testAiProviderConnection(
  provider: ApiProviderConfig,
  fetchImpl: FetchLike = fetch
): Promise<{ ok: boolean; message: string }> {
  const status = getAiProviderStatus([provider]);
  if (!status.ok) return { ok: false, message: status.message };

  try {
    const response = await fetchImpl("/api/ai/test-provider", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getSessionHeaders()
      },
      body: JSON.stringify({
        provider: sanitizeProviderForProxy(provider)
      })
    });

    if (!response.ok) {
      return { ok: false, message: `连接失败：${await readErrorText(response)}` };
    }

    const payload = asRecord(await readJsonObject(response, "DeepSeek 测试接口"));
    return {
      ok: payload.ok !== false,
      message: stringOr(payload.message, `连接测试通过：${provider.provider} / ${provider.model}`)
    };
  } catch (error) {
    return {
      ok: false,
      message: `连接失败：${error instanceof Error ? error.message : "未知错误"}`
    };
  }
}

export async function saveAiProviderConfig(
  provider: ApiProviderConfig,
  fetchImpl: FetchLike = fetch
): Promise<{ ok: boolean; message: string }> {
  const status = getAiProviderStatus([provider]);
  if (!status.ok) return { ok: false, message: status.message };

  try {
    const response = await fetchImpl("/api/ai/config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getSessionHeaders()
      },
      body: JSON.stringify({ provider: sanitizeProviderForProxy(provider) })
    });

    if (!response.ok) {
      return { ok: false, message: `保存失败：${await readErrorText(response)}` };
    }

    const payload = asRecord(await readJsonObject(response, "DeepSeek 配置接口"));
    return {
      ok: payload.ok !== false,
      message: stringOr(payload.message, "DeepSeek 配置已保存到本地后端。")
    };
  } catch (error) {
    return {
      ok: false,
      message: `保存失败：${error instanceof Error ? error.message : "未知错误"}`
    };
  }
}

export async function createAiSession(
  payload:
    | { mode: "invite"; inviteCode: string; name: string; organizationName: string }
    | { mode: "admin"; username: string; password: string },
  fetchImpl: FetchLike = fetch
): Promise<{ ok: boolean; message: string; token?: string }> {
  try {
    const response = await fetchImpl("/api/ai/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = asRecord(await readJsonObject(response, "AI 会话接口"));
    const token = typeof data.token === "string" ? data.token : undefined;
    if (response.ok && token) {
      saveAiSessionToken(token);
      return { ok: true, token, message: stringOr(data.message, "AI 会话已建立。") };
    }

    return { ok: false, message: stringOr(data.message, "AI 会话建立失败。") };
  } catch (error) {
    return {
      ok: false,
      message: `AI 会话建立失败：${error instanceof Error ? error.message : "未知错误"}`
    };
  }
}

export async function refreshAiSessionForUser(
  user: AuthUser | null,
  fetchImpl: FetchLike = fetch
): Promise<{ ok: boolean; message: string; token?: string }> {
  if (!user) {
    return { ok: false, message: "请先使用邀请码登录后再生成课件。" };
  }

  if (user.role !== "teacher") {
    return { ok: false, message: "请使用老师邀请码账号生成课件；管理员账号仅用于 Ops 配置。" };
  }

  return createAiSession(
    {
      mode: "invite",
      inviteCode: user.inviteCode,
      name: user.name,
      organizationName: user.organizationName
    },
    fetchImpl
  );
}

export function saveAiSessionToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(aiSessionStorageKey, token);
}

export function clearAiSessionToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(aiSessionStorageKey);
}

function isDemoApiKey(apiKey: string) {
  const normalized = apiKey.trim().toLowerCase();
  return !normalized || normalized.includes("demo") || normalized.includes("placeholder");
}

function usesServerStoredDeepSeekSecret(provider: ApiProviderConfig) {
  return (
    provider.provider.trim().toLowerCase() === "deepseek" &&
    /^https:\/\/api\.deepseek\.com(?:\/)?$/i.test(provider.baseUrl.trim())
  );
}

function sanitizeProviderForProxy(provider: ApiProviderConfig): ApiProviderConfig {
  return isDemoApiKey(provider.apiKey) ? { ...provider, apiKey: "" } : provider;
}

function getSessionHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem(aiSessionStorageKey);
  return token ? { "X-Keyou-Session": token } : {};
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
    throw new Error("AI 返回不是 JSON 对象");
  }
  return JSON.parse(withoutFence.slice(start, end + 1)) as unknown;
}

function normalizeLesson(payload: unknown, input: LessonGenerationInput): Lesson {
  const data = asRecord(payload);
  const lessonData = asRecord(data.lesson ?? data);
  const rawScenes = Array.isArray(lessonData.scenes) ? lessonData.scenes : [];
  const scenes = rawScenes.map(normalizeScene).filter(Boolean).slice(0, 6) as Scene[];

  if (scenes.length === 0) {
    throw new Error("AI 返回缺少 scenes 关卡数据");
  }

  return {
    id: `lesson-ai-${Date.now()}`,
    title: stringOr(lessonData.title, input.topic),
    grade: stringOr(lessonData.grade, input.grade),
    subject: stringOr(lessonData.subject, input.subject),
    gameMode: stringOr(lessonData.gameMode, input.mode),
    scenes
  };
}

function normalizeScene(rawScene: unknown, index: number): Scene | null {
  const scene = asRecord(rawScene);
  const title = stringOr(scene.title, `第${index + 1}关`);
  const description = stringOr(scene.description, "AI 生成的课堂关卡。");
  const rawQuestions = Array.isArray(scene.questions) ? scene.questions : [];
  const questions = rawQuestions.map(normalizeQuestion).filter(Boolean).slice(0, 5) as Question[];
  const rewards = asRecord(scene.rewards);

  return {
    id: stringOr(scene.id, `scene-ai-${index + 1}`),
    type: normalizeSceneType(scene.type, index),
    title,
    description,
    questions,
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
    id: stringOr(question.id, `q-ai-${index + 1}`),
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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function stringOr(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function numberOr(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

async function readErrorText(response: ResponseLike) {
  const statusText = [response.status, response.statusText].filter(Boolean).join(" ");
  try {
    if (response.text) {
      const body = await response.text();
      return body.trim() ? `${statusText || "HTTP 错误"} ${body.slice(0, 160)}` : statusText || "HTTP 错误";
    }
  } catch {
    return statusText || "HTTP 错误";
  }
  return statusText || "HTTP 错误";
}

async function readJsonObject(response: ResponseLike, label: string) {
  if (response.text) {
    const raw = await response.text();
    const trimmed = raw.trim();
    if (!trimmed) {
      throw new Error(`${label}没有返回内容。`);
    }

    if (trimmed.startsWith("<")) {
      throw new Error(
        `${label}返回了 HTML 页面，说明当前页面没有连到本地 /api/ai 代理。请使用 npm run dev 或 npm run preview 打开的 localhost 地址。`
      );
    }

    return JSON.parse(trimmed) as unknown;
  }

  return response.json();
}
