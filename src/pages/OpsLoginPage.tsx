import { useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { createAdminUserFromPassword, type AuthUser, type UsageAccount } from "../data/mockCommerce";
import type { AppRoute } from "../data/routes";
import { createAiSession } from "../services/lessonAi";

type OpsLoginPageProps = {
  onLogin: (user: AuthUser, usage: UsageAccount, nextRoute: AppRoute) => void;
  onNavigate: (route: AppRoute) => void;
};

export function OpsLoginPage({ onLogin, onNavigate }: OpsLoginPageProps) {
  const [adminName, setAdminName] = useState("admin");
  const [adminPassword, setAdminPassword] = useState("keyou2026");
  const [message, setMessage] = useState("Ops 运营后台仅限管理员账号进入。");

  const submitAdmin = async () => {
    const result = createAdminUserFromPassword(adminName, adminPassword);
    if (!result) {
      setMessage("管理员账号或密码错误。");
      return;
    }

    const session = await createAiSession({ mode: "admin", username: adminName, password: adminPassword });
    if (!session.ok) {
      console.warn(session.message);
      setMessage(`管理员登录成功，但 AI 代理未连接：${session.message}`);
    } else {
      setMessage("管理员登录成功，正在进入 Ops 后台。");
    }

    onLogin(result.user, result.usage, "ops");
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-4xl font-black text-skybrand sm:text-6xl">管理员登录</h1>
          <p className="mt-3 max-w-3xl text-lg font-bold leading-8 text-ink sm:text-xl">
            DeepSeek、套餐、用户点数、邀请码库和核销码库统一在 Ops 管理。
          </p>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[520px_1fr]">
        <Card tone="blue" className="p-6 sm:p-8">
          <h2 className="text-3xl font-black text-ink">Ops 账号</h2>
          <div className="mt-6 grid gap-5">
            <label>
              <span className="mb-2 block text-sm font-black text-slate-600">账号</span>
              <input
                className="min-h-14 w-full rounded-2xl border border-blue-100 bg-white px-4 text-lg font-black text-ink outline-none focus:border-skybrand focus:ring-4 focus:ring-blue-100"
                value={adminName}
                onChange={(event) => setAdminName(event.target.value)}
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-black text-slate-600">密码</span>
              <input
                className="min-h-14 w-full rounded-2xl border border-blue-100 bg-white px-4 text-lg font-black text-ink outline-none focus:border-skybrand focus:ring-4 focus:ring-blue-100"
                type="password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
              />
            </label>
            <Button fullWidth size="lg" onClick={submitAdmin}>
              进入 Ops 后台
            </Button>
          </div>
          <div className="mt-5 rounded-3xl bg-white/78 p-4 text-sm font-black text-slate-600">
            {message}
          </div>
        </Card>

        <Card tone="sun" className="p-6 sm:p-8">
          <h2 className="text-3xl font-black text-ink">普通老师入口</h2>
          <p className="mt-4 font-bold leading-7 text-slate-600">
            老师不需要进入 Ops。生成邀请码可直接打开「权益核销」，注册/登录请使用「登录验证」。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="white" onClick={() => onNavigate("backend")}>
              生成邀请码
            </Button>
            <Button variant="mint" onClick={() => onNavigate("login")}>
              老师登录
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
