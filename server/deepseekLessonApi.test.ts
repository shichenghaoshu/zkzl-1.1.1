import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { generateLessonViaDeepSeek, handleDeepSeekApiRequest } from "./deepseekLessonApi";

const provider = {
  id: "api-deepseek",
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

describe("DeepSeek lesson API proxy", () => {
  it("calls DeepSeek chat completions and returns a normalized editable lesson", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: "DeepSeek 分数闯关课",
                grade: "小学中段",
                subject: "数学",
                gameMode: "闯关地图",
                scenes: [
                  {
                    title: "平均分城门",
                    description: "从平均分蛋糕理解几分之一。",
                    questions: [
                      {
                        prompt: "一个圆平均分成 4 份，1 份写作什么？",
                        options: ["1/4", "1/2", "4/1"],
                        answer: "1/4",
                        explanation: "平均分成 4 份，取其中 1 份就是四分之一。"
                      }
                    ],
                    rewards: { stars: 3, coins: 20 }
                  }
                ]
              })
            }
          }
        ]
      })
    });

    const result = await generateLessonViaDeepSeek(input, provider, fetchImpl);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.lesson.title).toBe("DeepSeek 分数闯关课");
    expect(result.lesson.scenes[0].questions[0].prompt).toContain("平均分成 4 份");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.deepseek.com/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk-deepseek-real-key"
        })
      })
    );

    const requestBody = JSON.parse(fetchImpl.mock.calls[0][1].body as string);
    expect(requestBody.model).toBe("deepseek-chat");
    expect(requestBody.response_format).toEqual({ type: "json_object" });
    expect(JSON.stringify(requestBody.messages)).toContain("三年级数学：认识分数");
  });

  it("prompt includes flashcard, ordering, and memory scene types", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ title: "t", scenes: [{ title: "s", questions: [{ prompt: "q", answer: "a" }] }] }) } }]
      })
    });

    await generateLessonViaDeepSeek(input, provider, fetchImpl);
    const messages = JSON.parse(fetchImpl.mock.calls[0][1].body as string).messages;
    const promptText = messages.map((m: { content: string }) => m.content).join("\n");
    expect(promptText).toContain("flashcard");
    expect(promptText).toContain("ordering");
    expect(promptText).toContain("memory");
  });

  it("normalizes flashcard, ordering, and memory scene types from DeepSeek response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: "新关卡类型课",
                grade: "小学中段",
                subject: "数学",
                gameMode: "闯关地图",
                scenes: [
                  { type: "flashcard", title: "翻卡", questions: [{ prompt: "q1", options: ["a", "b"], answer: "a" }], rewards: { stars: 1, coins: 10 } },
                  { type: "ordering", title: "排序", questions: [{ prompt: "q2", options: ["a", "b"], answer: "a" }], rewards: { stars: 2, coins: 15 } },
                  { type: "memory", title: "记忆", questions: [{ prompt: "q3", options: ["a", "b"], answer: "a" }], rewards: { stars: 3, coins: 20 } }
                ]
              })
            }
          }
        ]
      })
    });

    const result = await generateLessonViaDeepSeek(input, provider, fetchImpl);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.lesson.scenes[0].type).toBe("flashcard");
    expect(result.lesson.scenes[1].type).toBe("ordering");
    expect(result.lesson.scenes[2].type).toBe("memory");
  });

  it("rejects non-DeepSeek outbound base URLs", async () => {
    const fetchImpl = vi.fn();
    const result = await generateLessonViaDeepSeek(
      input,
      { ...provider, baseUrl: "https://example.com" },
      fetchImpl
    );

    expect(result.ok).toBe(false);
    expect(result.message).toContain("api.deepseek.com");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("requires a login session before generating lessons", async () => {
    const response = await callHandler("/api/ai/generate-lesson", { input });

    expect(response.handled).toBe(true);
    expect(response.status).toBe(401);
    expect(response.body.message).toContain("请先登录");
  });

  it("rejects cross-site API calls", async () => {
    const response = await callHandler(
      "/api/ai/session",
      { mode: "admin", username: "admin", password: "keyou2026" },
      { origin: "https://evil.example" }
    );

    expect(response.status).toBe(403);
    expect(response.body.message).toContain("跨站");
  });

  it("prevents teacher sessions from saving DeepSeek configuration", async () => {
    const session = await callHandler("/api/ai/session", {
      mode: "invite",
      inviteCode: "KEYOU-DEMO-2026",
      name: "王老师",
      organizationName: "三年级数学教研组"
    });

    const response = await callHandler(
      "/api/ai/config",
      { provider },
      { "x-keyou-session": String(session.body.token) }
    );

    expect(response.status).toBe(403);
    expect(response.body.message).toContain("管理员");
  });
});

async function callHandler(
  url: string,
  body: unknown,
  headers: Record<string, string> = {}
) {
  const req = Object.assign(
    Readable.from([JSON.stringify(body)]),
    {
      method: "POST",
      url,
      headers: {
        host: "localhost:5173",
        ...headers
      }
    }
  ) as IncomingMessage;
  const chunks: string[] = [];
  const res = {
    statusCode: 200,
    setHeader: vi.fn(),
    end: vi.fn((chunk?: string) => {
      chunks.push(chunk ?? "");
    })
  } as unknown as ServerResponse;

  const handled = await handleDeepSeekApiRequest(req, res);
  return {
    handled,
    status: res.statusCode,
    body: JSON.parse(chunks.join(""))
  };
}
