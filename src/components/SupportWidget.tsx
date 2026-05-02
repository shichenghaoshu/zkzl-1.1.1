import { useEffect, useState } from "react";
import type { AppRoute } from "../data/routes";

type SupportWidgetProps = {
  onNavigate: (route: AppRoute) => void;
};

export function SupportWidget({ onNavigate }: SupportWidgetProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (route: AppRoute) => {
    setOpen(false);
    onNavigate(route);
  };

  return (
    <div className="support-widget fixed bottom-4 right-4 z-50 print:hidden">
      {open ? (
        <div className="mb-3 w-[min(92vw,320px)] rounded-3xl border border-blue-100 bg-white p-4 shadow-2xl shadow-blue-200/50">
          <p className="text-lg font-black text-ink">需要帮助？</p>
          <div className="mt-3 grid gap-2">
            <button className="support-menu-button" onClick={() => go("help")}>查看教程</button>
            <button className="support-menu-button" onClick={() => go("help")}>常见问题</button>
            <button className="support-menu-button" onClick={() => go("help")}>反馈问题</button>
            <button className="support-menu-button" onClick={() => go("help")}>联系客服</button>
          </div>
          <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
            邮箱：support@keyouai.com<br />
            微信客服：课游AI助手
          </p>
        </div>
      ) : null}
      <button
        className="min-h-14 rounded-full bg-gradient-to-r from-skybrand to-blue-600 px-5 text-base font-black text-white shadow-xl shadow-blue-300/60 transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-blue-200"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="打开帮助菜单"
      >
        帮助
      </button>
    </div>
  );
}
