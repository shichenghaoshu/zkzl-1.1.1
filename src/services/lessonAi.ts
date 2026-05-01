import type { ApiProviderConfig } from "../data/mockDatabase";
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

type FetchLike = (input: string, init: RequestInit) => Promise<ResponseLike>;

type ResponseLike = {
  ok: boolean;
  status?: number;
  statusText?: string;
  json: () => Promise<unknown>;
  text?: () => Promise<string>;
};

const sceneTypes: Scene["type"][] = ["story", "drag-classify", "match", "quiz-race", "boss"];

export function getAiProviderStatus(providers: ApiProviderConfig[]): AiProviderStatus {
  const enabledProviders = providers.filter((provider) => provider.enabled);
  if (enabledProviders.length === 0) {
    return {
      ok: false,
      message: "管理员还没有启用 AI API 通道，请到 Ops 后台启用一个 OpenAI 兼容通道。"
    };
  }

  const provider = enabledProviders.find(
    (item) => item.baseUrl.trim() && item.model.trim() && item.apiKey.trim() && !isDemoApiKey(item.apiKey)
  );

  if (!provider) {
    return {
      ok: false,
      message: "管理员需要先在 Ops 后台填写真实 API Key、Base URL 和模型，默认 demo key 不会用于真实 AI 生成。"
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
    const response = await fetchImpl(buildChatCompletionsUrl(provider.baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: provider.model,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: buildLessonMessages(input)
      })
    });

    if (!response.ok) {
      return {
        ok: false,
        providerName: provider.name,
        message: `AI 生成失败：${await readErrorText(response)}。请检查 Ops 后台的 Base URL、模型、API Key 或浏览器跨域策略。`
      };
    }

    const payload = await response.json();
    const content = extractAssistantText(payload);
    const lesson = normalizeLesson(parseJsonContent(content), input);

    return {
      ok: true,
      lesson,
      providerName: provider.name,
      message: `已通过 ${provider.name} 生成课件。`
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
    const response = await fetchImpl(buildChatCompletionsUrl(provider.baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: provider.model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "只返回 JSON。"
          },
          {
            role: "user",
            content: "返回 {\"ok\":true,\"service\":\"lesson-ai\"}，用于连接测试。"
          }
        ]
      })
    });

    if (!response.ok) {
      return { ok: false, message: `连接失败：${await readErrorText(response)}` };
    }

    return { ok: true, message: `连接测试通过：${provider.provider} / ${provider.model}` };
  } catch (error) {
    return {
      ok: false,
      message: `连接失败：${error instanceof Error ? error.message : "未知错误"}`
    };
  }
}

function isDemoApiKey(apiKey: string) {
  const normalized = apiKey.trim().toLowerCase();
  return !normalized || normalized.includes("demo") || normalized.includes("placeholder");
}

function buildLessonMessages(input: LessonGenerationInput) {
  return [
    {
      role: "system",
      content:
        "你是面向小学老师的互动游戏课件生成引擎。必须只返回合法 JSON，不要 Markdown，不要解释。"
    },
    {
      role: "user",
      content: [
        "请生成一节可编辑的互动游戏课件 JSON。",
        `课题：${input.topic}`,
        `学段：${input.grade}`,
        `学科：${input.subject}`,
        `玩法：${input.mode}`,
        `班级人数：${input.studentCount}`,
        "JSON 字段必须包含：title, grade, subject, gameMode, scenes。",
        "scenes 为 5 个关卡，每个关卡包含 title, description, questions, rewards。",
        "questions 每题包含 prompt, options, answer, explanation；options 为 3-4 个短选项。",
        "rewards 包含 stars 和 coins。内容必须适合中国小学课堂。"
      ].join("\n")
    }
  ];
}

function extractAssistantText(payload: unknown) {
  const data = asRecord(payload);
  const choices = Array.isArray(data.choices) ? data.choices : [];
  const firstChoice = asRecord(choices[0]);
  const message = asRecord(firstChoice.message);
  const chatContent = message.content;
  if (typeof chatContent === "string" && chatContent.trim()) return chatContent;

  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text;

  const output = Array.isArray(data.output) ? data.output : [];
  for (const item of output) {
    const content = asRecord(item).content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      const text = asRecord(block).text;
      if (typeof text === "string" && text.trim()) return text;
    }
  }

  throw new Error("AI 返回中没有可解析的文本内容");
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
