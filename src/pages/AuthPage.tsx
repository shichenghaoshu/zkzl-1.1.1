import { useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Mascot } from "../components/Mascot";
import {
  createUserFromInvite,
  getPlanLabel,
  planDefinitions,
  type InviteCode,
  type AuthUser,
  type UsageAccount
} from "../data/mockCommerce";
import type { AppRoute } from "../data/routes";
import { createAiSession } from "../services/lessonAi";

type AuthPageProps = {
  onLogin: (user: AuthUser, usage: UsageAccount, nextRoute: AppRoute) => void;
  onNavigate: (route: AppRoute) => void;
  redirectRoute?: AppRoute;
  currentUser: AuthUser | null;
  usage: UsageAccount | null;
  inviteCodes: InviteCode[];
  onLogout: () => void;
};

const routeTitles: Record<string, string> = {
  "teacher-dashboard": "老师端首页",
  generate: "AI课件生成",
  editor: "课件编辑器",
  share: "分享课件",
  report: "班级报告"
};

type TabKey = "login" | "account" | "plans" | "invite";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "login", label: "老师登录" },
  { key: "account", label: "当前账号" },
  { key: "plans", label: "套餐" },
  { key: "invite", label: "邀请码" }
];

export function AuthPage({
  onLogin,
  onNavigate,
  redirectRoute = "teacher-dashboard",
  currentUser,
  usage,
  inviteCodes,
  onLogout
}: AuthPageProps) {
  const [name, setName] = useState("王老师");
  const [organizationName, setOrganizationName] = useState("三年级数学教研组");
  const [inviteCode, setInviteCode] = useState("KEYOU-DEMO-2026");
  const [message, setMessage] = useState("输入有效邀请码即可登录。");
  const [activeTab, setActiveTab] = useState<TabKey>("login");

  const isRedirected = redirectRoute !== "teacher-dashboard";
  const redirectLabel = routeTitles[redirectRoute] ?? redirectRoute;

  const submit = async () => {
    const result = createUserFromInvite(inviteCode, name, organizationName, inviteCodes);
    if (!result) {
      setMessage("邀请码无效，请检查后重试");
      return;
    }

    const session = await createAiSession({ mode: "invite", inviteCode, name, organizationName });
    if (!session.ok) {
      console.warn(session.message);
    }

    setMessage(session.ok ? "登录成功，正在进入..." : `登录成功，AI代理未连接：${session.message}`);
    onLogin(result.user, result.usage, redirectRoute);
  };

  return (
    <div className="space-y-5">
      {/* Redirect banner */}
      {isRedirected && currentUser === null && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
          此页面需要老师登录，登录后将跳转至「{redirectLabel}」
        </div>
      )}

      {/* Header */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-black text-skybrand sm:text-4xl">老师登录</h1>
          <p className="mt-2 text-base font-bold text-ink">
            使用邀请码登录 · 学生端无需登录
          </p>
        </div>
        <Mascot size={96} />
      </section>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl bg-white/60 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={[
              "flex-1 rounded-xl px-3 py-2 text-sm font-black transition-all",
              activeTab === tab.key
                ? "bg-skybrand text-white shadow-md"
                : "text-slate-500 hover:bg-white/80"
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Login */}
      {activeTab === "login" && (
        <Card className="p-6">
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <label className="block">
              <span className="mb-1 block text-sm font-black text-slate-600">姓名</span>
              <input
                className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-base font-bold text-ink outline-none focus:border-skybrand focus:ring-4 focus:ring-blue-100"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-black text-slate-600">学校 / 机构</span>
              <input
                className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-base font-bold text-ink outline-none focus:border-skybrand focus:ring-4 focus:ring-blue-100"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-black text-slate-600">邀请码</span>
              <input
                className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-base font-bold uppercase tracking-wide text-ink outline-none focus:border-skybrand focus:ring-4 focus:ring-blue-100"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
            </label>
            <p className="text-xs font-bold text-slate-500">
              登录即表示同意
              <button type="button" className="mx-1 text-skybrand underline-offset-4 hover:underline" onClick={() => onNavigate("legalTerms")}>《用户协议》</button>
              <button type="button" className="text-skybrand underline-offset-4 hover:underline" onClick={() => onNavigate("legalPrivacy")}>《隐私政策》</button>
            </p>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" size="lg">登录</Button>
              <Button variant="white" size="lg" onClick={() => onNavigate("backend")}>
                公开生成邀请码
              </Button>
            </div>
          </form>
          <div className="mt-4 rounded-2xl bg-blue-50 p-3 text-sm font-bold text-slate-600">
            {message}
          </div>

          {/* Quick invite code buttons */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-black text-slate-500">体验码</p>
            <div className="flex flex-wrap gap-2">
              {inviteCodes.map((item) => (
                <button
                  key={item.code}
                  onClick={() => setInviteCode(item.code)}
                  className="rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-skybrand transition hover:-translate-y-0.5 hover:shadow-sm"
                >
                  {item.code}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Tab: Current Account */}
      {activeTab === "account" && (
        <Card className="p-6">
          {currentUser && usage ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
                <p className="text-lg font-black text-ink">{currentUser.name}</p>
                <p className="mt-1 text-sm font-bold text-slate-600">{currentUser.organizationName}</p>
                <p className="mt-1 text-sm font-bold text-skybrand">
                  {getPlanLabel(usage.plan)} · {usage.points}点券
                </p>
              </div>
              <Button fullWidth variant="coral" onClick={onLogout}>退出登录</Button>
            </div>
          ) : (
            <p className="text-center font-bold text-slate-500">未登录，请先在「老师登录」标签页登录</p>
          )}
        </Card>
      )}

      {/* Tab: Plans */}
      {activeTab === "plans" && (
        <Card tone="sun" className="p-6">
          <h3 className="text-xl font-black text-ink">套餐计划</h3>
          <div className="mt-4 space-y-3">
            {planDefinitions.map((plan) => (
              <div key={plan.id} className="rounded-2xl bg-white/82 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-black text-ink">{plan.name}</p>
                  <span className="rounded-xl bg-yellow-50 px-3 py-1 text-xs font-black text-orange-500">
                    {plan.priceText}
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold text-slate-600">
                  {plan.monthlyQuota}次额度 · {plan.points}点 · {plan.generationCostText}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">{plan.audience}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab: Invite */}
      {activeTab === "invite" && (
        <Card tone="blue" className="p-6">
          <h3 className="text-xl font-black text-ink">邀请码与核销</h3>
          <p className="mt-3 text-sm font-bold text-slate-600">
            生成体验邀请码不需要老师登录。管理员配置请进入独立 Ops 页面。
          </p>
          <div className="mt-4 flex gap-3">
            <Button variant="white" onClick={() => onNavigate("backend")}>打开邀请码/核销</Button>
            <Button variant="white" onClick={() => onNavigate("ops")}>管理员登录 /ops</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
