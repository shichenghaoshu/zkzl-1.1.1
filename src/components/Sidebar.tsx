import { mainNavItems, type AppRoute } from "../data/routes";
import type { AuthUser, UsageAccount } from "../data/mockCommerce";
import { getPlanLabel } from "../data/mockCommerce";

type SidebarProps = {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  user: AuthUser | null;
  usage: UsageAccount | null;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export function Sidebar({
  activeRoute,
  onNavigate,
  user,
  usage,
  onLogout,
  collapsed,
  onToggleCollapse
}: SidebarProps) {
  return (
    <aside
      className={[
        "app-sidebar glass-panel sticky top-4 hidden shrink-0 overflow-hidden rounded-3xl shadow-xl shadow-blue-200/30 transition-all duration-300 lg:block",
        collapsed ? "w-[72px] p-3" : "w-64 p-4"
      ].join(" ")}
      style={{ height: "calc(100vh - 2rem)" }}
    >
      {/* Header: logo + toggle */}
      <div className={["flex items-center", collapsed ? "mb-4 flex-col gap-2" : "mb-6 gap-3"].join(" ")}>
        <button
          className={[
            "flex select-none items-center justify-center rounded-2xl bg-gradient-to-br from-skybrand to-mintbrand text-xl text-white shadow-lg",
            collapsed ? "h-10 w-10" : "h-12 w-12"
          ].join(" ")}
          onClick={() => onNavigate("teacher-dashboard")}
          aria-label="课游AI 首页"
        >
          🎯
        </button>
        {!collapsed && (
          <button className="text-left" onClick={() => onNavigate("teacher-dashboard")}>
            <span className="block text-2xl font-black text-skybrand">课游AI</span>
            <span className="block text-xs font-semibold text-slate-500">
              互动游戏课件平台
            </span>
          </button>
        )}
        <button
          className={[
            "flex items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/70 hover:text-skybrand",
            collapsed ? "mt-1 h-8 w-8" : "ml-auto h-8 w-8"
          ].join(" ")}
          onClick={onToggleCollapse}
          aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
          title={collapsed ? "展开" : "收起"}
        >
          <span className="text-lg">{collapsed ? "»" : "«"}</span>
        </button>
      </div>

      {/* Nav items */}
      <nav className="space-y-1">
        {mainNavItems.map((item) => (
          <button
            key={item.route}
            onClick={() => onNavigate(item.route)}
            title={collapsed ? item.label : undefined}
            aria-label={collapsed ? item.label : undefined}
            className={[
              "flex w-full items-center rounded-2xl text-left transition-all",
              collapsed
                ? "justify-center px-0 py-3"
                : "gap-3 px-4 py-3",
              activeRoute === item.route
                ? "bg-gradient-to-r from-skybrand to-blue-500 text-white shadow-lg shadow-blue-300/40"
                : "text-slate-600 hover:bg-white/78 hover:text-skybrand"
            ].join(" ")}
          >
            <span className="select-none text-xl" aria-hidden="true">
              {item.icon}
            </span>
            {!collapsed && (
              <span className="min-w-0">
                <span className="block truncate text-sm font-black">{item.label}</span>
                <span
                  className={[
                    "block truncate text-xs",
                    activeRoute === item.route ? "text-blue-50" : "text-slate-400"
                  ].join(" ")}
                >
                  {item.description}
                </span>
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* User / Login section */}
      {user && usage ? (
        <div
          className={[
            "mt-6 rounded-3xl bg-gradient-to-br from-yellow-100 to-orange-100",
            collapsed ? "p-2 text-center" : "p-4"
          ].join(" ")}
        >
          {collapsed ? (
            <button
              className="text-2xl"
              onClick={onLogout}
              aria-label={`${user.name}，点击退出`}
              title={`${user.name} · 退出`}
            >
              🏆
            </button>
          ) : (
            <>
              <div className="text-3xl">🏆</div>
              <p className="mt-2 truncate text-sm font-black text-ink">{user.name}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                {getPlanLabel(usage.plan)} · {usage.points}点
              </p>
              <button
                className="mt-3 rounded-2xl bg-white/80 px-3 py-2 text-xs font-black text-coralbrand"
                onClick={onLogout}
              >
                退出登录
              </button>
            </>
          )}
        </div>
      ) : (
        <div
          className={[
            "mt-6 rounded-3xl bg-gradient-to-br from-blue-100 to-emerald-100",
            collapsed ? "p-2 text-center" : "p-4"
          ].join(" ")}
        >
          {collapsed ? (
            <button
              className="text-2xl"
              onClick={() => onNavigate("login")}
              aria-label="登录"
              title="登录"
            >
              🔐
            </button>
          ) : (
            <>
              <div className="text-3xl">🔐</div>
              <p className="mt-2 text-sm font-black text-ink">未登录</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                使用邀请码登录后可生成课件
              </p>
              <button
                className="mt-3 rounded-2xl bg-white/80 px-3 py-2 text-xs font-black text-skybrand"
                onClick={() => onNavigate("login")}
              >
                登录
              </button>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
