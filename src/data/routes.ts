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
  | "ops"
  | "help"
  | "legalPrivacy"
  | "legalTerms"
  | "legalChildren"
  | "legalCopyright"
  | "lessonLoadError"
  | "notFound";

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
  ops: "/ops",
  help: "/help",
  legalPrivacy: "/legal/privacy",
  legalTerms: "/legal/terms",
  legalChildren: "/legal/children",
  legalCopyright: "/legal/copyright",
  lessonLoadError: "/lesson-error",
  notFound: "/404"
};

export const pathToRoute = (path: string): AppRoute => {
  const found = (Object.entries(routePaths) as Array<[AppRoute, string]>).find(
    ([, routePath]) => routePath === path
  );
  return found?.[0] ?? "notFound";
};

export const mainNavItems: Array<{
  route: AppRoute;
  label: string;
  icon: string;
  description: string;
}> = [
  {
    route: "login",
    label: "登录",
    icon: "🔐",
    description: "邀请码"
  },
  {
    route: "teacher-dashboard",
    label: "课件",
    icon: "📚",
    description: "首页"
  },
  {
    route: "generate",
    label: "AI生成",
    icon: "✨",
    description: "生成课件"
  },
  {
    route: "editor",
    label: "编辑",
    icon: "🛠️",
    description: "调整内容"
  },
  {
    route: "share",
    label: "分享",
    icon: "📨",
    description: "链接二维码"
  },
  {
    route: "student",
    label: "学生",
    icon: "📱",
    description: "加入课堂"
  },
  {
    route: "play",
    label: "闯关",
    icon: "🎮",
    description: "互动学习"
  },
  {
    route: "report",
    label: "报告",
    icon: "📊",
    description: "班级数据"
  },
  {
    route: "backend",
    label: "核销",
    icon: "⚙️",
    description: "邀请码管理"
  },
  {
    route: "ops",
    label: "管理",
    icon: "🗄️",
    description: "Ops后台"
  }
];
