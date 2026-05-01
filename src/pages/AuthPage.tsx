import { useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Mascot } from "../components/Mascot";
import {
  createUserFromInvite,
  getPlanLabel,
  type InviteCode,
  type AuthUser,
  type UsageAccount
} from "../data/mockCommerce";
import type { AppRoute } from "../data/routes";

type AuthPageProps = {
  onLogin: (user: AuthUser, usage: UsageAccount, nextRoute: AppRoute) => void;
  onNavigate: (route: AppRoute) => void;
  redirectRoute?: AppRoute;
  currentUser: AuthUser | null;
  usage: UsageAccount | null;
  inviteCodes: InviteCode[];
  onLogout: () => void;
};

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
  const [message, setMessage] = useState("输入有效邀请码即可注册并登录 Demo 账户。");

  const submit = () => {
    const result = createUserFromInvite(inviteCode, name, organizationName, inviteCodes);
    if (!result) {
      setMessage("邀请码校验失败：请使用下方 Demo 邀请码，或到后台生成新邀请码。");
      return;
    }

    setMessage("登录成功，正在进入工作台。");
    onLogin(result.user, result.usage, redirectRoute);
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-skybrand sm:text-6xl">邀请码注册登录</h1>
          <p className="mt-3 text-xl font-bold text-ink">
            老师端需要登录验证，学生端仍然点链接即参与
          </p>
        </div>
        <Mascot size={124} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.82fr]">
        <Card className="p-6 sm:p-8">
          <h2 className="text-3xl font-black text-ink">注册 / 登录</h2>
          <p className="mt-2 font-bold leading-7 text-slate-600">
            使用机构发放的邀请码开通账号。月付用户可通过核销码开通月度额度；次付用户可通过点券核销码充值。
          </p>

          <div className="mt-6 grid gap-5">
            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-600">老师姓名</span>
              <input
                className="min-h-14 w-full rounded-2xl border border-blue-100 bg-white px-4 text-lg font-black text-ink outline-none focus:border-skybrand focus:ring-4 focus:ring-blue-100"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-600">学校 / 机构 / 教研组</span>
              <input
                className="min-h-14 w-full rounded-2xl border border-blue-100 bg-white px-4 text-lg font-black text-ink outline-none focus:border-skybrand focus:ring-4 focus:ring-blue-100"
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-600">邀请码</span>
              <input
                className="min-h-14 w-full rounded-2xl border border-blue-100 bg-white px-4 text-lg font-black uppercase tracking-wide text-ink outline-none focus:border-skybrand focus:ring-4 focus:ring-blue-100"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" onClick={submit}>
              🔐 邀请码登录
            </Button>
            <Button variant="white" size="lg" onClick={() => onNavigate("backend")}>
              ⚙️ 去后台生成邀请码
            </Button>
          </div>

          <div className="mt-5 rounded-3xl bg-blue-50 p-4 text-sm font-black text-slate-600">
            {message}
          </div>
        </Card>

        <div className="space-y-5">
          <Card tone="mint">
            <h3 className="text-2xl font-black text-skybrand">可用 Demo 邀请码</h3>
            <div className="mt-4 space-y-3">
              {inviteCodes.map((item) => (
                <button
                  key={item.code}
                  onClick={() => setInviteCode(item.code)}
                  className="flex w-full items-center justify-between gap-3 rounded-3xl bg-white/82 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span>
                    <span className="block font-black text-ink">{item.name}</span>
                    <span className="block text-sm font-bold text-slate-500">{item.code}</span>
                  </span>
                  <span className="rounded-2xl bg-blue-50 px-3 py-2 text-sm font-black text-skybrand">
                    {getPlanLabel(item.plan)}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          <Card tone={currentUser ? "sun" : "blue"}>
            <h3 className="text-2xl font-black text-ink">当前登录态</h3>
            {currentUser && usage ? (
              <div className="mt-4 space-y-3">
                <p className="text-lg font-black text-skybrand">{currentUser.name}</p>
                <p className="font-bold text-slate-600">{currentUser.organizationName}</p>
                <p className="font-bold text-slate-600">
                  账户类型：{getPlanLabel(usage.plan)} · 点券 {usage.points}
                </p>
                <Button fullWidth variant="coral" onClick={onLogout}>
                  退出登录
                </Button>
              </div>
            ) : (
              <p className="mt-3 font-bold leading-7 text-slate-600">
                未登录时访问老师端功能会进入本页；学生端加入和闯关不需要登录。
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
