import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Mascot } from "../components/Mascot";
import type { AuthUser, UsageAccount } from "../data/mockCommerce";
import { getPlanLabel, getRemainingMonthlyQuota } from "../data/mockCommerce";
import { recentLessons } from "../data/mockLessons";
import type { AppRoute } from "../data/routes";

type TeacherDashboardProps = {
  user: AuthUser | null;
  usage: UsageAccount | null;
  onNavigate: (route: AppRoute) => void;
};

export function TeacherDashboard({ user, usage, onNavigate }: TeacherDashboardProps) {
  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-skybrand sm:text-6xl">老师端首页</h1>
          <p className="mt-3 text-xl font-bold text-ink">
            清晰工作台，快速开始一节互动游戏课
          </p>
        </div>
        <div className="hidden rounded-full bg-white/80 px-5 py-3 text-sm font-black text-slate-600 shadow-lg md:block">
          输入知识点，一键生成可玩的互动课件
        </div>
      </section>

      <Card className="overflow-hidden p-0">
        <div className="relative grid min-h-[260px] gap-6 bg-gradient-to-br from-sky-100 via-white to-emerald-100 p-6 sm:p-8 lg:grid-cols-[1fr_260px]">
          <div className="absolute right-10 top-8 text-3xl animate-pulse-star">⭐</div>
          <div className="absolute bottom-8 left-1/2 text-4xl">🪙</div>
          <div className="relative z-10 flex flex-col justify-center">
            <p className="text-sm font-black text-mintbrand">今日备课任务</p>
            <h2 className="mt-2 text-3xl font-black text-ink sm:text-5xl">
              欢迎回来，{user?.name ?? "王老师"}
            </h2>
            <p className="mt-3 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
              今天也要和孩子们一起，开心学习，快乐成长！从知识点出发，几步生成游戏化课堂，快速分享给班级。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => onNavigate("generate")}>
                ✨ 新建游戏课件
              </Button>
              <Button variant="white" size="lg" onClick={() => onNavigate("share")}>
                📨 快速分享
              </Button>
              <Button variant="mint" size="lg" onClick={() => onNavigate("backend")}>
                ⚙️ 后台配置
              </Button>
            </div>
          </div>
          <div className="relative flex items-end justify-center">
            <Mascot size={210} />
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.8fr_0.9fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-ink">最近课件</h2>
              <p className="text-sm font-bold text-slate-500">
                课后自动沉淀数据报告，便于复用与优化
              </p>
            </div>
            <button
              className="text-sm font-black text-skybrand hover:underline"
              onClick={() => onNavigate("editor")}
            >
              查看全部
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {recentLessons.map((lesson, index) => (
              <button
                key={lesson.id}
                className="group rounded-3xl bg-gradient-to-b from-blue-50 to-white p-3 text-left shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
                onClick={() => onNavigate(index === 0 ? "editor" : "generate")}
              >
                <div className="flex h-28 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-200 to-emerald-100 text-5xl">
                  {lesson.cover}
                </div>
                <h3 className="mt-3 text-lg font-black text-ink">{lesson.title}</h3>
                <p className="mt-1 text-sm font-bold text-slate-500">{lesson.grade}</p>
                <p className="mt-1 text-sm font-bold text-skybrand">{lesson.time}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card tone="blue">
          <h2 className="text-2xl font-black text-ink">快捷操作</h2>
          <div className="mt-4 space-y-3">
            <Button fullWidth variant="secondary" onClick={() => onNavigate("generate")}>
              ✨ 生成新课件
            </Button>
            <Button fullWidth variant="white" onClick={() => onNavigate("editor")}>
              📄 导入 PPT / PDF
            </Button>
            <Button fullWidth variant="mint" onClick={() => onNavigate("student")}>
              👥 创建班级
            </Button>
            <Button fullWidth variant="white" onClick={() => onNavigate("backend")}>
              🔐 登录 / 核销 / API
            </Button>
          </div>
        </Card>

        <Card tone="sun">
          <h2 className="text-2xl font-black text-ink">账户权益</h2>
          <div className="mt-4 space-y-3">
            {[
              ["当前套餐", usage ? getPlanLabel(usage.plan) : "未登录", "🎫"],
              ["月额度", usage ? `${getRemainingMonthlyQuota(usage)} 次可用` : "登录后查看", "📅"],
              ["点券余额", usage ? `${usage.points} 点` : "登录后查看", "🪙"]
            ].map(([title, text, icon]) => (
              <div key={title} className="rounded-2xl bg-white/78 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="font-black text-ink">{title}</p>
                    <p className="text-sm font-bold text-slate-500">{text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["清晰布局", "核心信息一目了然", "🧭", "blue"],
          ["常用功能", "快捷入口触手可及", "🏠", "mint"],
          ["课堂动态", "重要提醒及时掌握", "🔔", "violet"],
          ["数据驱动", "教学决策更有依据", "📈", "coral"]
        ].map(([title, text, icon, tone]) => (
          <Card key={title} tone={tone as "blue" | "mint" | "violet" | "coral"} className="p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-md">
                {icon}
              </span>
              <div>
                <p className="font-black text-ink">{title}</p>
                <p className="text-sm font-bold text-slate-500">{text}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
