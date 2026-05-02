import type { AppRoute } from "../data/routes";

type AppFooterProps = {
  onNavigate: (route: AppRoute) => void;
};

const footerLinks: Array<{ label: string; route: AppRoute }> = [
  { label: "隐私政策", route: "legalPrivacy" },
  { label: "用户协议", route: "legalTerms" },
  { label: "儿童信息保护", route: "legalChildren" },
  { label: "版权说明", route: "legalCopyright" },
  { label: "联系我们", route: "help" }
];

export function AppFooter({ onNavigate }: AppFooterProps) {
  return (
    <footer className="app-footer mt-8 rounded-3xl border border-blue-100 bg-white/82 px-5 py-5 text-sm font-bold text-slate-700 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-base font-black text-ink">课游AI · AI互动游戏课件平台</p>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            面向小学老师和教培机构，帮助课堂链接、二维码、PIN 码稳定分享。
          </p>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="页脚链接">
          {footerLinks.map((item) => (
            <button
              key={item.route}
              className="rounded-2xl px-3 py-2 text-sm font-black text-skybrand transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-200"
              onClick={() => onNavigate(item.route)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </footer>
  );
}
