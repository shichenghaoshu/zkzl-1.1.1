import { describe, expect, it, vi } from "vitest";
import type { ApiProviderConfig } from "../data/mockDatabase";
import {
  buildChatCompletionsUrl,
  createAiSession,
  generateLessonWithAi,
  getAiProviderStatus,
  refreshAiSessionForUser,
  testAiProviderConnection
} from "./lessonAi";

const baseProvider: ApiProviderConfig = {
  id: "api-real",
  name: "DeepSeek 课件生成",
  provider: "DeepSeek",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-chat",
  apiKey: "sk-deepseek-real-key",
  enabled: true,
  dailyLimit: 1000,
  monthlyCostCap: 500,
  updatedAt: "2026/05/01 10:00:00"
};

const input = {
  topic: "三年级数学：认识分数",
  grade: "小学中段",
  subject: "数学",
  mode: "闯关地图",
  studentCount: 30
};

describe("lesson AI generation", () => {
  it("selects an enabled DeepSeek provider that uses the server-stored key", () => {
    const status = getAiProviderStatus([
      { ...baseProvider, id: "disabled", enabled: false },
      { ...baseProvider, id: "demo", apiKey: "sk-demo-keyou-ai-lesson" },
      baseProvider
    ]);

    expect(status.ok).toBe(true);
    expect(status.provider?.id).toBe("demo");
  });

  it("still rejects non-DeepSeek demo-only browser config", () => {
    const status = getAiProviderStatus([
      {
        ...baseProvider,
        id: "demo",
        provider: "OpenAI compatible",
        baseUrl: "https://gateway.example.com",
        apiKey: "sk-demo-keyou-ai-lesson"
      }
    ]);

    expect(status.ok).toBe(false);
    expect(status.message).toContain("管理员");
    expect(status.message).toContain("真实 DeepSeek API Key");
  });

  it("builds the official DeepSeek chat completions URL", () => {
    expect(buildChatCompletionsUrl("https://api.deepseek.com")).toBe(
      "https://api.deepseek.com/chat/completions"
    );
    expect(buildChatCompletionsUrl("https://gateway.example.com/openai/v1/")).toBe(
      "https://gateway.example.com/openai/v1/chat/completions"
    );
    expect(buildChatCompletionsUrl("https://gateway.example.com/v1/chat/completions")).toBe(
      "https://gateway.example.com/v1/chat/completions"
    );
  });

  it("asks the same-origin DeepSeek proxy to generate a lesson without exposing the API key", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        lesson: {
          id: "lesson-ai-test",
          title: "AI生成的分数闯关课",
          grade: "小学中段",
          subject: "数学",
          gameMode: "闯关地图",
          scenes: [
            {
              id: "scene-ai-1",
              type: "story",
              title: "分数城堡入口",
              description: "用生活里的蛋糕切分引入分数。",
              questions: [
                {
                  id: "q-ai-1",
                  prompt: "把一个蛋糕平均分成 4 份，取 1 份是多少？",
                  options: ["1/4", "1/2", "3/4"],
                  answer: "1/4"
                }
              ],
              rewards: { stars: 3, coins: 20 }
            }
          ]
        },
        message: "DeepSeek 已生成课件。"
      })
    });

    const result = await generateLessonWithAi(input, [baseProvider], fetchImpl);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.lesson.title).toBe("AI生成的分数闯关课");
    expect(result.lesson.scenes[0].questions[0].answer).toBe("1/4");
    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/ai/generate-lesson",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json"
        })
      })
    );

    const requestBody = JSON.parse(fetchImpl.mock.calls[0][1].body as string);
    expect(requestBody.input.topic).toBe("三年级数学：认识分数");
    expect(JSON.stringify(requestBody)).not.toContain("sk-deepseek-real-key");
  });

  it("tests a DeepSeek provider through the same-origin proxy", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, message: "DeepSeek 连接测试通过。" })
    });

    const result = await testAiProviderConnection(baseProvider, fetchImpl);

    expect(result.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/ai/test-provider",
      expect.objectContaining({
        method: "POST"
      })
    );
    const requestBody = JSON.parse(fetchImpl.mock.calls[0][1].body as string);
    expect(requestBody.provider.apiKey).toBe("sk-deepseek-real-key");
  });

  it("does not send demo keys to the DeepSeek proxy", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, message: "DeepSeek 连接测试通过。" })
    });

    await testAiProviderConnection(
      { ...baseProvider, apiKey: "sk-demo-deepseek-key", secretStored: true },
      fetchImpl
    );

    const requestBody = JSON.parse(fetchImpl.mock.calls[0][1].body as string);
    expect(requestBody.provider.apiKey).toBe("");
  });

  it("reports a clear error when the AI session endpoint returns the SPA HTML fallback", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "<html><head></head><body>app</body></html>",
      json: async () => {
        throw new Error("should not parse json directly");
      }
    });

    const result = await createAiSession(
      { mode: "admin", username: "admin", password: "keyou2026" },
      fetchImpl
    );

    expect(result.ok).toBe(false);
    expect(result.message).toContain("本地 /api/ai 代理");
    expect(result.message).not.toContain("Unexpected token");
  });

  it("refreshes the teacher AI session from the stored invite user before generation", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, token: "session-fresh", message: "AI 会话已建立。" })
    });

    const result = await refreshAiSessionForUser(
      {
        id: "user-demo",
        name: "王老师",
        organizationName: "三年级数学教研组",
        role: "teacher",
        inviteCode: "KEYOU-DEMO-2026",
        createdAt: "2026-05-01T00:00:00.000Z"
      },
      fetchImpl
    );

    expect(result.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/ai/session",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          mode: "invite",
          inviteCode: "KEYOU-DEMO-2026",
          name: "王老师",
          organizationName: "三年级数学教研组"
        })
      })
    );
  });

  it("preserves flashcard, ordering, and memory scene types from AI response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        lesson: {
          id: "lesson-new-types",
          title: "新关卡类型课",
          grade: "小学中段",
          subject: "数学",
          gameMode: "闯关地图",
          scenes: [
            { id: "s1", type: "flashcard", title: "翻卡", description: "d", questions: [{ id: "q1", prompt: "p", options: ["a", "b"], answer: "a" }], rewards: { stars: 1, coins: 10 } },
            { id: "s2", type: "ordering", title: "排序", description: "d", questions: [{ id: "q2", prompt: "p", options: ["a", "b"], answer: "a" }], rewards: { stars: 2, coins: 15 } },
            { id: "s3", type: "memory", title: "记忆", description: "d", questions: [{ id: "q3", prompt: "p", options: ["a", "b"], answer: "a" }], rewards: { stars: 3, coins: 20 } }
          ]
        },
        message: "已生成课件。"
      })
    });

    const result = await generateLessonWithAi(input, [baseProvider], fetchImpl);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.lesson.scenes[0].type).toBe("flashcard");
    expect(result.lesson.scenes[1].type).toBe("ordering");
    expect(result.lesson.scenes[2].type).toBe("memory");
  });

  it("explains 401 generation failures as an expired AI session instead of an Ops config issue", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ ok: false, message: "请先登录后再使用 AI 服务。" }),
      json: async () => ({ ok: false, message: "请先登录后再使用 AI 服务。" })
    });

    const result = await generateLessonWithAi(input, [baseProvider], fetchImpl);

    expect(result.ok).toBe(false);
    expect(result.message).toContain("AI 会话已过期或未建立");
    expect(result.message).not.toContain("Base URL");
    expect(result.message).not.toContain("API Key");
  });
});
