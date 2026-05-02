import { describe, expect, it } from "vitest";
import { mockClass, mockSession } from "./mockClassData";
import { mockLesson } from "./mockLessons";
import {
  createLiveClassReport,
  getAnswerOnlyItems,
  getReportSummary,
  recordLevelAnswer,
  recordStudentJoin
} from "./liveClassReport";

describe("live class report", () => {
  it("keeps only the correct answer for correct-answer classroom interactions", () => {
    expect(
      getAnswerOnlyItems({
        id: "q1",
        prompt: "下面哪个是四分之三？",
        options: ["1/2", "3/4", "1/4"],
        answer: "3/4"
      })
    ).toEqual(["3/4"]);
  });

  it("links student play progress into the class report summary", () => {
    const initial = createLiveClassReport(mockLesson, mockClass, mockSession);
    const joined = recordStudentJoin(initial, "小星星");
    const afterFirstLevel = recordLevelAnswer(joined.report, {
      studentId: joined.studentId,
      studentName: "小星星",
      levelIndex: 0,
      correct: true,
      stars: 3
    });

    const summary = getReportSummary(afterFirstLevel);

    expect(summary.participants).toBe(1);
    expect(summary.averageAccuracy).toBe(100);
    expect(summary.levelAccuracy[0].value).toBe(100);
    expect(summary.students[0]).toMatchObject({
      name: "小星星",
      progress: 1,
      stars: 3,
      score: 100
    });
  });
});
