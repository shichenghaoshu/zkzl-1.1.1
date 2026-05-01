import type { LessonGenerationInput } from "../src/services/lessonAi";

export const lessonGenerationSkill = {
  name: "keyou-deepseek-lesson-generation",
  version: "2026-05-01",
  outputContract: {
    title: "string",
    grade: "string",
    subject: "string",
    gameMode: "string",
    scenes: "5 editable scenes with type, title, description, questions, rewards"
  }
};

export function buildLessonMessages(input: LessonGenerationInput) {
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
        `Skill：${lessonGenerationSkill.name}`,
        `版本：${lessonGenerationSkill.version}`,
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
        "- type: 只能从 story, drag-classify, match, quiz-race, boss 中选择",
        "- title: 适合老师识别的关卡名",
        "- description: 面向课堂的关卡说明",
        "- questions: 1-3 道题",
        "- rewards: { stars: number, coins: number }",
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
