export const gradeOptions = ["小学低段", "小学中段", "小学高段"] as const;

export const subjectOptions = ["数学", "英语", "语文", "科学", "班会", "道法"] as const;

export const courseTypeOptions = [
  "数学复习",
  "英语单词",
  "语文识字",
  "科学分类",
  "班会安全",
  "古诗背诵",
  "口算训练",
  "教培体验课",
  "公开展示课"
] as const;

export const gameFormatOptions = [
  "闯关地图",
  "竞速答题",
  "拖拽分类",
  "配对连线",
  "翻卡记忆",
  "排序挑战",
  "情景故事",
  "小组抢答"
] as const;

export type GenerationFieldErrors = {
  topic?: string;
  grade?: string;
  subject?: string;
  courseType?: string;
  gameFormat?: string;
};

export function validateGenerationFields(fields: {
  topic: string;
  grade: string;
  subject: string;
  courseType: string;
  gameFormat: string;
}): { ok: boolean; errors: GenerationFieldErrors } {
  const errors: GenerationFieldErrors = {};

  if (!fields.topic.trim()) {
    errors.topic = "请输入课题名称";
  }
  if (!fields.grade) {
    errors.grade = "请选择学段";
  }
  if (!fields.subject) {
    errors.subject = "请选择学科";
  }
  if (!fields.courseType) {
    errors.courseType = "请选择课程类型";
  }
  if (!fields.gameFormat) {
    errors.gameFormat = "请选择游戏形式";
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

export function buildGenerationHint(errors: GenerationFieldErrors): string {
  const missing: string[] = [];
  if (errors.topic) missing.push("课题");
  if (errors.grade) missing.push("学段");
  if (errors.subject) missing.push("学科");
  if (errors.courseType) missing.push("课程类型");
  if (errors.gameFormat) missing.push("游戏形式");
  if (missing.length === 0) return "";
  return `请填写：${missing.join("、")}`;
}
