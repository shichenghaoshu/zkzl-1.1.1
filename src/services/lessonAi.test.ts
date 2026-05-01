import { describe, expect, it, vi } from "vitest";
import type { ApiProviderConfig } from "../data/mockDatabase";
import {
  buildChatCompletionsUrl,
  generateLessonWithAi,
  getAiProviderStatus
} from "./lessonAi";

const baseProvider: ApiProviderConfig = {
  id: "api-real",
  name: "真实 OpenAI 兼容通道",
  provider: "OpenAI 兼容网关",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4.1-mini",
  apiKey: "sk-real-key",
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
  it("selects an enabled admin API provider and rejects demo keys", () => {
    const status = getAiProviderStatus([
      { ...baseProvider, id: "disabled", enabled: false },
      { ...baseProvider, id: "demo", apiKey: "sk-demo-keyou-ai-lesson" },
      baseProvider
    ]);

    expect(status.ok).toBe(true);
    expect(status.provider?.id).toBe("api-real");
  });

  it("explains that a real admin API key is required when only demo config exists", () => {
    const status = getAiProviderStatus([
      { ...baseProvider, id: "demo", apiKey: "sk-demo-keyou-ai-lesson" }
    ]);

    expect(status.ok).toBe(false);
    expect(status.message).toContain("管理员");
    expect(status.message).toContain("真实 API Key");
  });

  it("builds an OpenAI-compatible chat completions URL from the admin Base URL", () => {
    expect(buildChatCompletionsUrl("https://api.openai.com/v1")).toBe(
      "https://api.openai.com/v1/chat/completions"
    );
    expect(buildChatCompletionsUrl("https://gateway.example.com/openai/v1/")).toBe(
      "https://gateway.example.com/openai/v1/chat/completions"
    );
    expect(buildChatCompletionsUrl("https://gateway.example.com/v1/chat/completions")).toBe(
      "https://gateway.example.com/v1/chat/completions"
    );
  });

  it("posts the lesson prompt to the admin API and normalizes the returned JSON lesson", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: `\`\`\`json
{
  "title": "AI生成的分数闯关课",
  "grade": "小学中段",
  "subject": "数学",
  "gameMode": "闯关地图",
  "scenes": [
    {
      "title": "分数城堡入口",
      "description": "用生活里的蛋糕切分引入分数。",
      "questions": [
        {
          "prompt": "把一个蛋糕平均分成 4 份，取 1 份是多少？",
          "options": ["1/4", "1/2", "3/4"],
          "answer": "1/4"
        }
      ],
      "rewards": { "stars": 3, "coins": 20 }
    }
  ]
}
\`\`\``
            }
          }
        ]
      })
    });

    const result = await generateLessonWithAi(input, [baseProvider], fetchImpl);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.lesson.title).toBe("AI生成的分数闯关课");
    expect(result.lesson.scenes[0].questions[0].answer).toBe("1/4");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk-real-key"
        })
      })
    );

    const requestBody = JSON.parse(fetchImpl.mock.calls[0][1].body as string);
    expect(requestBody.model).toBe("gpt-4.1-mini");
    expect(requestBody.response_format).toEqual({ type: "json_object" });
    expect(JSON.stringify(requestBody.messages)).toContain("三年级数学：认识分数");
  });
});
