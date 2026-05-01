import { mainNavItems, type AppRoute } from "../data/routes";
import type { AuthUser, UsageAccount } from "../data/mockCommerce";
import { getPlanLabel } from "../data/mockCommerce";

type SidebarProps = {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  user: AuthUser | null;
  usage: UsageAccount | null;
  onLogout: () => void;
};

export function Sidebar({ activeRoute, onNavigate, user, usage, onLogout }: SidebarProps) {
  const visibleNavItems = mainNavItems.filter((item) => item.route !== "ops" || user?.role === "admin");

  return (
    <aside className="glass-panel sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 overflow-y-auto rounded-3xl p-4 shadow-xl shadow-blue-200/30 lg:block">
      <button
        className="mb-6 flex w-full items-center gap-3 rounded-3xl bg-white/70 p-3 text-left"
        onClick={() => onNavigate("teacher-dashboard")}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-skybrand to-mintbrand text-xl text-white shadow-lg">
          🎯
        </span>
        <span>
          <span className="block text-2xl font-black text-skybrand">课游AI</span>
          <span className="block text-xs font-semibold text-slate-500">
            互动游戏课件平台
          </span>
        </span>
      </button>

      <nav className="space-y-2">
        {visibleNavItems.map((item) => (
          <button
            key={item.route}
            onClick={() => onNavigate(item.route)}
            className={[
              "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all",
              activeRoute === item.route
                ? "bg-gradient-to-r from-skybrand to-blue-500 text-white shadow-lg shadow-blue-300/40"
                : "text-slate-600 hover:bg-white/78 hover:text-skybrand"
            ].join(" ")}
          >
            <span className="text-xl">{item.icon}</span>
            <span>
              <span className="block text-sm font-black">{item.label}</span>
              <span
                className={[
                  "block text-xs",
                  activeRoute === item.route ? "text-blue-50" : "text-slate-400"
                ].join(" ")}
              >
                {item.description}
              </span>
            </span>
          </button>
        ))}
      </nav>

      {user && usage ? (
        <div className="mt-6 rounded-3xl bg-gradient-to-br from-yellow-100 to-orange-100 p-4">
          <div className="text-3xl">🏆</div>
          <p className="mt-2 text-sm font-black text-ink">{user.name}</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            {getPlanLabel(usage.plan)} · 点券 {usage.points}
          </p>
          <button
            className="mt-3 rounded-2xl bg-white/80 px-3 py-2 text-xs font-black text-coralbrand"
            onClick={onLogout}
          >
            退出登录
          </button>
        </div>
      ) : (
        <div className="mt-6 rounded-3xl bg-gradient-to-br from-blue-100 to-emerald-100 p-4">
          <div className="text-3xl">🔐</div>
          <p className="mt-2 text-sm font-black text-ink">未登录</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            使用邀请码注册登录后，可生成课件并核销权益。
          </p>
          <button
            className="mt-3 rounded-2xl bg-white/80 px-3 py-2 text-xs font-black text-skybrand"
            onClick={() => onNavigate("login")}
          >
            邀请码登录
          </button>
        </div>
      )}
    </aside>
  );
}
