export type Student = {
  id: string;
  name: string;
  score: number;
  stars: number;
  progress: number;
  answers?: number;
  correctAnswers?: number;
};

export type Class = {
  id: string;
  name: string;
  studentCount: number;
  students: Student[];
};

export type Session = {
  id: string;
  lessonId: string;
  classId: string;
  pin: string;
  status: "draft" | "live" | "ended";
  participants: number;
  accuracy: number;
};

export const mockStudents: Student[] = [
  { id: "stu-001", name: "小宇", score: 98, stars: 15, progress: 5 },
  { id: "stu-002", name: "乐乐", score: 95, stars: 14, progress: 5 },
  { id: "stu-003", name: "小明", score: 93, stars: 13, progress: 5 },
  { id: "stu-004", name: "小星星", score: 90, stars: 12, progress: 4 },
  { id: "stu-005", name: "阳光男孩", score: 88, stars: 12, progress: 4 }
];

export const mockClass: Class = {
  id: "class-grade3-2",
  name: "三年级2班",
  studentCount: 38,
  students: mockStudents
};

export const mockSession: Session = {
  id: "session-abc123",
  lessonId: "lesson-fraction-001",
  classId: "class-grade3-2",
  pin: "735921",
  status: "live",
  participants: 38,
  accuracy: 84
};

export const levelAccuracy = [
  { name: "第1关", value: 78, color: "#2F7BFF" },
  { name: "第2关", value: 92, color: "#43D48A" },
  { name: "第3关", value: 80, color: "#FFC247" },
  { name: "第4关", value: 70, color: "#8B6CFF" },
  { name: "第5关", value: 68, color: "#3BA3FF" }
];

export const participation = [
  { name: "已完成", count: 35, percent: 92, color: "#43D48A" },
  { name: "进行中", count: 2, percent: 5, color: "#FFC247" },
  { name: "未参与", count: 1, percent: 3, color: "#CBD5E1" }
];
