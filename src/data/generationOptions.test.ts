import { describe, expect, it } from "vitest";
import {
  gradeOptions,
  subjectOptions,
  courseTypeOptions,
  gameFormatOptions,
  validateGenerationFields,
  buildGenerationHint
} from "./generationOptions";

describe("generation option constants", () => {
  it("includes all required grade options", () => {
    expect(gradeOptions).toContain("小学低段");
    expect(gradeOptions).toContain("小学中段");
    expect(gradeOptions).toContain("小学高段");
  });

  it("includes expanded subject options for Chinese primary schools", () => {
    expect(subjectOptions).toContain("数学");
    expect(subjectOptions).toContain("英语");
    expect(subjectOptions).toContain("语文");
    expect(subjectOptions).toContain("科学");
    expect(subjectOptions).toContain("班会");
    expect(subjectOptions).toContain("道法");
  });

  it("includes course types for primary school and training orgs", () => {
    expect(courseTypeOptions).toContain("数学复习");
    expect(courseTypeOptions).toContain("英语单词");
    expect(courseTypeOptions).toContain("语文识字");
    expect(courseTypeOptions).toContain("科学分类");
    expect(courseTypeOptions).toContain("班会安全");
    expect(courseTypeOptions).toContain("古诗背诵");
    expect(courseTypeOptions).toContain("口算训练");
    expect(courseTypeOptions).toContain("教培体验课");
    expect(courseTypeOptions).toContain("公开展示课");
  });

  it("includes richer game format choices", () => {
    expect(gameFormatOptions).toContain("闯关地图");
    expect(gameFormatOptions).toContain("竞速答题");
    expect(gameFormatOptions).toContain("拖拽分类");
    expect(gameFormatOptions).toContain("配对连线");
    expect(gameFormatOptions).toContain("翻卡记忆");
    expect(gameFormatOptions).toContain("排序挑战");
    expect(gameFormatOptions).toContain("情景故事");
    expect(gameFormatOptions).toContain("小组抢答");
  });
});

describe("validateGenerationFields", () => {
  const validFields = {
    topic: "认识分数",
    grade: "小学中段",
    subject: "数学",
    courseType: "数学复习",
    gameFormat: "闯关地图"
  };

  it("passes when all fields are filled", () => {
    const result = validateGenerationFields(validFields);
    expect(result.ok).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it("fails when topic is empty", () => {
    const result = validateGenerationFields({ ...validFields, topic: "" });
    expect(result.ok).toBe(false);
    expect(result.errors.topic).toBe("请输入课题名称");
  });

  it("fails when topic is whitespace only", () => {
    const result = validateGenerationFields({ ...validFields, topic: "   " });
    expect(result.ok).toBe(false);
    expect(result.errors.topic).toBe("请输入课题名称");
  });

  it("fails when grade is missing", () => {
    const result = validateGenerationFields({ ...validFields, grade: "" });
    expect(result.ok).toBe(false);
    expect(result.errors.grade).toBe("请选择学段");
  });

  it("fails when subject is missing", () => {
    const result = validateGenerationFields({ ...validFields, subject: "" });
    expect(result.ok).toBe(false);
    expect(result.errors.subject).toBe("请选择学科");
  });

  it("fails when courseType is missing", () => {
    const result = validateGenerationFields({ ...validFields, courseType: "" });
    expect(result.ok).toBe(false);
    expect(result.errors.courseType).toBe("请选择课程类型");
  });

  it("fails when gameFormat is missing", () => {
    const result = validateGenerationFields({ ...validFields, gameFormat: "" });
    expect(result.ok).toBe(false);
    expect(result.errors.gameFormat).toBe("请选择游戏形式");
  });

  it("reports all missing fields at once", () => {
    const result = validateGenerationFields({
      topic: "",
      grade: "",
      subject: "",
      courseType: "",
      gameFormat: ""
    });
    expect(result.ok).toBe(false);
    expect(Object.keys(result.errors)).toHaveLength(5);
  });
});

describe("buildGenerationHint", () => {
  it("returns empty string when no errors", () => {
    expect(buildGenerationHint({})).toBe("");
  });

  it("lists missing fields in Chinese", () => {
    const hint = buildGenerationHint({
      topic: "请输入课题名称",
      grade: "请选择学段"
    });
    expect(hint).toBe("请填写：课题、学段");
  });

  it("lists all five missing fields", () => {
    const hint = buildGenerationHint({
      topic: "请输入课题名称",
      grade: "请选择学段",
      subject: "请选择学科",
      courseType: "请选择课程类型",
      gameFormat: "请选择游戏形式"
    });
    expect(hint).toBe("请填写：课题、学段、学科、课程类型、游戏形式");
  });
});
