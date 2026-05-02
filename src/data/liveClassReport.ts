import type { Class, Session, Student } from "./mockClassData";
import type { Lesson, Question } from "./mockLessons";

export type LiveLevelStat = {
  id: string;
  name: string;
  attempts: number;
  correct: number;
  completed: number;
};

export type LiveClassReport = {
  lessonId: string;
  lessonTitle: string;
  classId: string;
  className: string;
  totalSeats: number;
  pin: string;
  levelCount: number;
  students: Student[];
  levels: LiveLevelStat[];
  updatedAt: string;
};

export type LevelAnswerInput = {
  studentId: string;
  studentName: string;
  levelIndex: number;
  correct: boolean;
  stars: number;
};

export type ReportSummary = {
  participants: number;
  completionRate: number;
  averageAccuracy: number;
  favoriteLevel: string;
  weakestLevels: string[];
  levelCount: number;
  students: Student[];
  levelAccuracy: Array<{ name: string; value: number; color: string }>;
  participation: Array<{ name: string; count: number; percent: number; color: string }>;
};

const levelColors = ["#2563EB", "#22C55E", "#FACC15", "#8B5CF6", "#FB923C", "#0EA5E9"];

export function createLiveClassReport(lesson: Lesson, classInfo: Class, session: Session): LiveClassReport {
  return {
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    classId: classInfo.id,
    className: classInfo.name,
    totalSeats: classInfo.studentCount,
    pin: session.pin,
    levelCount: lesson.scenes.length,
    students: [],
    levels: lesson.scenes.map((scene) => ({
      id: scene.id,
      name: scene.title,
      attempts: 0,
      correct: 0,
      completed: 0
    })),
    updatedAt: new Date().toISOString()
  };
}

export function ensureLiveClassReport(
  current: LiveClassReport | null,
  lesson: Lesson,
  classInfo: Class,
  session: Session
) {
  if (!current || current.lessonId !== lesson.id || current.levelCount !== lesson.scenes.length) {
    return createLiveClassReport(lesson, classInfo, session);
  }

  return {
    ...current,
    lessonTitle: lesson.title,
    levels: lesson.scenes.map((scene, index) => ({
      id: scene.id,
      name: scene.title,
      attempts: current.levels[index]?.attempts ?? 0,
      correct: current.levels[index]?.correct ?? 0,
      completed: current.levels[index]?.completed ?? 0
    }))
  };
}

export function recordStudentJoin(report: LiveClassReport, nickname: string) {
  const cleanName = sanitizeNickname(nickname);
  const studentId = `student-${hashText(cleanName)}`;
  const existingStudent = report.students.find((student) => student.id === studentId);
  const students = existingStudent
    ? report.students.map((student) => (student.id === studentId ? { ...student, name: cleanName } : student))
    : [
        ...report.students,
        {
          id: studentId,
          name: cleanName,
          score: 0,
          stars: 0,
          progress: 0,
          answers: 0,
          correctAnswers: 0
        }
      ];

  return {
    studentId,
    report: touchReport({ ...report, students })
  };
}

export function recordLevelAnswer(report: LiveClassReport, input: LevelAnswerInput) {
  const safeLevelIndex = Math.max(0, Math.min(report.levels.length - 1, input.levelIndex));
  const studentIndex = report.students.findIndex((student) => student.id === input.studentId);
  const students =
    studentIndex >= 0
      ? [...report.students]
      : [
          ...report.students,
          {
            id: input.studentId,
            name: sanitizeNickname(input.studentName),
            score: 0,
            stars: 0,
            progress: 0,
            answers: 0,
            correctAnswers: 0
          }
        ];
  const targetIndex = studentIndex >= 0 ? studentIndex : students.length - 1;
  const previousStudent = students[targetIndex];
  const nextAnswers = (previousStudent.answers ?? 0) + 1;
  const nextCorrectAnswers = (previousStudent.correctAnswers ?? 0) + (input.correct ? 1 : 0);

  students[targetIndex] = {
    ...previousStudent,
    name: sanitizeNickname(input.studentName),
    progress: input.correct ? Math.max(previousStudent.progress, safeLevelIndex + 1) : previousStudent.progress,
    stars: input.correct ? previousStudent.stars + input.stars : previousStudent.stars,
    answers: nextAnswers,
    correctAnswers: nextCorrectAnswers,
    score: Math.round((nextCorrectAnswers / Math.max(1, nextAnswers)) * 100)
  };

  return touchReport({
    ...report,
    students,
    levels: report.levels.map((level, index) =>
      index === safeLevelIndex
        ? {
            ...level,
            attempts: level.attempts + 1,
            correct: level.correct + (input.correct ? 1 : 0),
            completed: level.completed + (input.correct ? 1 : 0)
          }
        : level
    )
  });
}

export function getAnswerOnlyItems(question: Question | undefined) {
  const fallback = question?.options[0] ?? "正确答案";
  const answer = question?.answer?.trim() || fallback;
  return [answer];
}

export function getReportSummary(report: LiveClassReport): ReportSummary {
  const participants = report.students.length;
  const completedCount = report.students.filter((student) => student.progress >= report.levelCount).length;
  const inProgressCount = report.students.filter(
    (student) => student.progress > 0 && student.progress < report.levelCount
  ).length;
  const notStartedCount = Math.max(0, report.totalSeats - participants);
  const attempts = report.levels.reduce((sum, level) => sum + level.attempts, 0);
  const correct = report.levels.reduce((sum, level) => sum + level.correct, 0);
  const averageAccuracy = attempts ? Math.round((correct / attempts) * 100) : 0;
  const completionRate = participants ? Math.round((completedCount / participants) * 100) : 0;
  const sortedLevels = [...report.levels].sort((a, b) => b.completed - a.completed);
  const favoriteLevel = sortedLevels[0]?.completed ? sortedLevels[0].name : "等待学生闯关";
  const weakestLevels = report.levels
    .filter((level) => level.attempts > 0)
    .sort((a, b) => a.correct / a.attempts - b.correct / b.attempts)
    .slice(0, 2)
    .map((level) => level.name);

  return {
    participants,
    completionRate,
    averageAccuracy,
    favoriteLevel,
    weakestLevels: weakestLevels.length ? weakestLevels : ["等待学生答题"],
    levelCount: report.levelCount,
    students: [...report.students].sort((a, b) => b.score - a.score || b.stars - a.stars).slice(0, 5),
    levelAccuracy: report.levels.map((level, index) => ({
      name: `第${index + 1}关`,
      value: level.attempts ? Math.round((level.correct / level.attempts) * 100) : 0,
      color: levelColors[index % levelColors.length]
    })),
    participation: [
      {
        name: "已完成",
        count: completedCount,
        percent: percentOf(completedCount, report.totalSeats),
        color: "#22C55E"
      },
      {
        name: "进行中",
        count: inProgressCount,
        percent: percentOf(inProgressCount, report.totalSeats),
        color: "#FACC15"
      },
      {
        name: "未参与",
        count: notStartedCount,
        percent: percentOf(notStartedCount, report.totalSeats),
        color: "#CBD5E1"
      }
    ]
  };
}

function sanitizeNickname(value: string) {
  const clean = value.trim().replace(/\s+/g, "");
  return clean || "同学";
}

function hashText(value: string) {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash.toString(36);
}

function touchReport(report: LiveClassReport) {
  return {
    ...report,
    updatedAt: new Date().toISOString()
  };
}

function percentOf(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}
