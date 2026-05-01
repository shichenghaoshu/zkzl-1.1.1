export type AppRoute =
  | "login"
  | "teacher-dashboard"
  | "generate"
  | "editor"
  | "share"
  | "student"
  | "play"
  | "report"
  | "backend"
  | "ops";

export const routePaths: Record<AppRoute, string> = {
  login: "/login",
  "teacher-dashboard": "/teacher-dashboard",
  generate: "/generate",
  editor: "/editor",
  share: "/share",
  student: "/student",
  play: "/play",
  report: "/report",
  backend: "/backend",
  ops: "/ops"
};

export const pathToRoute = (path: string): AppRoute => {
  const found = (Object.entries(routePaths) as Array<[AppRoute, string]>).find(
    ([, routePath]) => routePath === path
  );
  return found?.[0] ?? "teacher-dashboard";
};

export const mainNavItems: Array<{
  route: AppRoute;
  label: string;
  icon: string;
  description: string;
}> = [
  {
    route: "login",
    label: "登录验证",
    icon: "🔐",
    description: "邀请码注册"
  },
  {
    route: "teacher-dashboard",
    label: "我的课件",
    icon: "📚",
    description: "老师端首页"
  },
  {
    route: "generate",
    label: "AI生成",
    icon: "✨",
    description: "输入知识点"
  },
  {
    route: "editor",
    label: "课件编辑器",
    icon: "🛠️",
    description: "调整内容"
  },
  {
    route: "share",
    label: "快速分享",
    icon: "📨",
    description: "链接二维码 PIN"
  },
  {
    route: "student",
    label: "学生加入",
    icon: "📱",
    description: "无需下载 App"
  },
  {
    route: "play",
    label: "互动闯关",
    icon: "🎮",
    description: "游戏化学习"
  },
  {
    route: "report",
    label: "数据报告",
    icon: "📊",
    description: "班级实时反馈"
  },
  {
    route: "backend",
    label: "权益核销",
    icon: "⚙️",
    description: "额度与码库"
  },
  {
    route: "ops",
    label: "Ops后台",
    icon: "🗄️",
    description: "数据库与码库"
  }
];
