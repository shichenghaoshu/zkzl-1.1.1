import { useState, type ReactNode } from "react";
import type { AuthUser, UsageAccount } from "../data/mockCommerce";
import { getPlanLabel } from "../data/mockCommerce";
import { mainNavItems, type AppRoute } from "../data/routes";
import { AppFooter } from "./AppFooter";
import { Sidebar } from "./Sidebar";
import { SupportWidget } from "./SupportWidget";

type LayoutProps = {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  user: AuthUser | null;
  usage: UsageAccount | null;
  onLogout: () => void;
  children: ReactNode;
};

export function Layout({ activeRoute, onNavigate, user, usage, onLogout, children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="app-background">
      <div className="cloud cloud-one" aria-hidden="true" />
      <div className="cloud cloud-two" aria-hidden="true" />
      <div className="star-dust" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex max-w-[1480px] gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <Sidebar
          activeRoute={activeRoute}
          onNavigate={onNavigate}
          user={user}
          usage={usage}
          onLogout={onLogout}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        />
        <main className="min-w-0 flex-1">
          <header className="mobile-header glass-panel sticky top-3 z-30 mb-5 rounded-3xl px-3 py-3 shadow-lg shadow-blue-200/30 lg:hidden">
            <div className="mb-3 flex items-center justify-between">
              <button
                className="flex items-center gap-2 text-left"
                onClick={() => onNavigate("teacher-dashboard")}
              >
                <span className="flex h-10 w-10 select-none items-center justify-center rounded-2xl bg-skybrand text-white" aria-hidden="true">
                  🎯
                </span>
                <span className="text-xl font-black text-skybrand">课游AI</span>
              </button>
              {user && usage ? (
                <button
                  className="rounded-2xl bg-white/70 px-3 py-2 text-sm font-bold text-slate-600"
                  onClick={() => onNavigate("backend")}
                >
                  {getPlanLabel(usage.plan)}
                </button>
              ) : (
                <button
                  className="rounded-2xl bg-white/70 px-3 py-2 text-sm font-bold text-slate-600"
                  onClick={() => onNavigate("login")}
                >
                  登录
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {mainNavItems.map((item) => (
                <button
                  key={item.route}
                  onClick={() => onNavigate(item.route)}
                  className={[
                    "shrink-0 rounded-2xl px-3 py-2 text-sm font-bold",
                    activeRoute === item.route
                      ? "bg-skybrand text-white"
                      : "bg-white/70 text-slate-600"
                  ].join(" ")}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </div>
          </header>
          {children}
          <AppFooter onNavigate={onNavigate} />
        </main>
      </div>
      <SupportWidget onNavigate={onNavigate} />
    </div>
  );
}
