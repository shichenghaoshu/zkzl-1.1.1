import { useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ProgressBar } from "../components/ProgressBar";
import {
  generateInviteCode,
  getPlanLabel,
  getRemainingMonthlyQuota,
  type AuthUser,
  type BillingPlan,
  type InviteCode,
  type RedeemCode,
  type RedeemResult,
  type UsageAccount
} from "../data/mockCommerce";
import type { AppRoute } from "../data/routes";

type BackendConsoleProps = {
  user: AuthUser | null;
  usage: UsageAccount | null;
  redeemedCodes: string[];
  redeemCodes: RedeemCode[];
  onRedeemCode: (code: string) => RedeemResult;
  onCreateInvite: (invite: InviteCode) => void;
  onNavigate: (route: AppRoute) => void;
};

export function BackendConsole({
  user,
  usage,
  redeemedCodes,
  redeemCodes,
  onRedeemCode,
  onCreateInvite,
  onNavigate
}: BackendConsoleProps) {
  const [redeemCode, setRedeemCode] = useState("MONTH-735921");
  const [redeemMessage, setRedeemMessage] = useState("输入核销码后，系统会按月付或点券规则更新账户权益。");
  const [inviteOrg, setInviteOrg] = useState("星河小学");
  const [invitePlan, setInvitePlan] = useState<BillingPlan>("monthly");
  const [generatedInvites, setGeneratedInvites] = useState<InviteCode[]>([]);

  const monthlyRemaining = usage ? getRemainingMonthlyQuota(usage) : 0;
  const usagePercent = usage && usage.monthlyQuota > 0 ? (usage.monthlyUsed / usage.monthlyQuota) * 100 : 0;

  const redeem = () => {
    if (!usage) {
      setRedeemMessage("请先使用邀请码登录老师账号，再核销月付码或点券码。");
      return;
    }

    const result = onRedeemCode(redeemCode);
    setRedeemMessage(result.message);
  };

  const createInvite = () => {
    const code = generateInviteCode(inviteOrg, invitePlan);
    const invite: InviteCode = {
      code,
      name: `${inviteOrg} ${getPlanLabel(invitePlan)}邀请码`,
      plan: invitePlan,
      monthlyQuota: invitePlan === "monthly" ? 300 : invitePlan === "trial" ? 20 : 0,
      points: invitePlan === "points" ? 1000 : invitePlan === "trial" ? 120 : 0,
      valid: true
    };

    onCreateInvite(invite);
    setGeneratedInvites((current) => [invite, ...current]);
    setRedeemMessage(`已生成 ${inviteOrg} 的 ${getPlanLabel(invitePlan)} 邀请码：${code}`);
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-skybrand sm:text-6xl">权益与核销中心</h1>
          <p className="mt-3 text-xl font-bold text-ink">
            免登录生成邀请码；登录后可核销月付/点券
          </p>
        </div>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-500">{user ? "当前租户" : "当前状态"}</p>
          <p className="text-xl font-black text-ink">{user?.organizationName ?? "未登录，可生成邀请码"}</p>
          <Button className="mt-3" size="sm" variant="white" onClick={() => onNavigate(user ? "login" : "ops")}>
            {user ? "切换账号" : "管理员入口"}
          </Button>
        </Card>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card tone="sun">
          <h2 className="text-2xl font-black text-ink">当前账户权益</h2>
          {usage ? (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <Stat label="账户类型" value={getPlanLabel(usage.plan)} icon="🎫" />
                <Stat label="月额度剩余" value={`${monthlyRemaining} 次`} icon="📅" />
                <Stat label="点券余额" value={`${usage.points} 点`} icon="🪙" />
              </div>
              <div className="mt-5">
                <ProgressBar value={usagePercent} label={`月度使用 ${usage.monthlyUsed}/${usage.monthlyQuota}`} color="sun" />
              </div>
              <p className="mt-4 rounded-2xl bg-white/76 p-3 text-sm font-bold text-slate-600">
                月付用户：生成课件扣减月度额度。次付用户：每次生成扣减 80 点券。
              </p>
            </>
          ) : (
            <div className="mt-4 rounded-3xl bg-white/78 p-5 font-bold leading-7 text-slate-600">
              生成邀请码不需要登录。需要核销月付码、查看余额或生成 AI 课件时，再使用邀请码登录老师账号。
              <Button className="mt-5" variant="white" onClick={() => onNavigate("login")}>
                去老师登录
              </Button>
            </div>
          )}
        </Card>

        <Card tone="blue">
          <h2 className="text-2xl font-black text-ink">AI 服务由管理员统一配置</h2>
          <p className="mt-4 rounded-3xl bg-white/80 p-4 font-bold leading-7 text-slate-600">
            老师端只负责生成课件、核销额度和管理邀请码，不展示 API Key、模型或接口设置。
            如需配置真实 AI 通道，请使用管理员账号进入独立 `/ops` 后台。
          </p>
          <Button className="mt-5" variant="white" onClick={() => onNavigate("ops")}>
            打开 /ops
          </Button>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card tone="blue">
          <h2 className="text-2xl font-black text-ink">邀请码生成器</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_180px]">
            <label>
              <span className="mb-2 block text-sm font-black text-slate-600">机构名称</span>
              <input
                className="min-h-12 w-full rounded-2xl border border-blue-100 bg-white px-3 font-bold outline-none focus:border-skybrand focus:ring-4 focus:ring-blue-100"
                value={inviteOrg}
                onChange={(event) => setInviteOrg(event.target.value)}
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-black text-slate-600">套餐类型</span>
              <select
                className="min-h-12 w-full rounded-2xl border border-blue-100 bg-white px-3 font-bold outline-none"
                value={invitePlan}
                onChange={(event) => setInvitePlan(event.target.value as BillingPlan)}
              >
                <option value="trial">试用账户</option>
                <option value="monthly">月付用户</option>
                <option value="points">次付点券</option>
              </select>
            </label>
          </div>
          <Button className="mt-4" fullWidth variant="secondary" onClick={createInvite}>
            ✨ 生成邀请码
          </Button>
          <div className="mt-4 space-y-3">
            {generatedInvites.length === 0 ? (
              <p className="rounded-2xl bg-white/76 p-4 text-sm font-bold text-slate-500">
                生成后会在这里出现，真实后端可写入邀请码表并设置有效期。
              </p>
            ) : (
              generatedInvites.map((invite) => (
                <div key={invite.code} className="rounded-2xl bg-white/82 p-4 shadow-sm">
                  <p className="font-black text-ink">{invite.name}</p>
                  <p className="mt-1 break-all text-lg font-black text-skybrand">{invite.code}</p>
                  <p className="text-sm font-bold text-slate-500">{getPlanLabel(invite.plan)}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card tone="mint">
          <h2 className="text-2xl font-black text-ink">月付 / 点券核销中心</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
            <label>
              <span className="mb-2 block text-sm font-black text-slate-600">核销码</span>
              <input
                className="min-h-14 w-full rounded-2xl border border-blue-100 bg-white px-4 text-lg font-black uppercase tracking-wide text-ink outline-none focus:border-skybrand focus:ring-4 focus:ring-blue-100"
                value={redeemCode}
                onChange={(event) => setRedeemCode(event.target.value)}
              />
            </label>
            <div className="flex items-end">
              <Button size="lg" variant="mint" onClick={redeem}>
                ✅ 核销
              </Button>
            </div>
          </div>
          <div className="mt-4 rounded-3xl bg-white/82 p-4 font-black text-slate-700 shadow-sm">
            {redeemMessage}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {redeemCodes.map((item) => (
              <button
                key={item.code}
                onClick={() => setRedeemCode(item.code)}
                className="rounded-3xl bg-white/82 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-ink">{item.label}</p>
                  <span className="text-xl">{item.type === "monthly" ? "📅" : "🪙"}</span>
                </div>
                <p className="mt-2 break-all text-sm font-black text-skybrand">{item.code}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {redeemedCodes.includes(item.code) ? "本会话已使用" : "可点击填入"}
                </p>
              </button>
            ))}
          </div>
        </Card>
      </div>

    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-3xl bg-white/82 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <p className="text-sm font-black text-slate-500">{label}</p>
          <p className="text-2xl font-black text-ink">{value}</p>
        </div>
      </div>
    </div>
  );
}
