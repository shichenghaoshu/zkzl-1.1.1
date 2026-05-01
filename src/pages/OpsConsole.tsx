import { useMemo, useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import {
  addAuditLog,
  createInitialDatabase,
  createInviteRecord,
  createRedeemRecord,
  type ApiProviderConfig,
  type MockDatabase,
  type TenantRecord
} from "../data/mockDatabase";
import { getPlanLabel, maskCredential, planDefinitions, type BillingPlan } from "../data/mockCommerce";
import { saveAiProviderConfig, testAiProviderConnection } from "../services/lessonAi";

type OpsConsoleProps = {
  database: MockDatabase;
  onUpdateDatabase: (database: MockDatabase) => void;
  onApplyTenantEntitlements?: (tenant: TenantRecord) => void;
};

type OpsTab = "api" | "users" | "plans" | "invite" | "redeem" | "database" | "logs";

export function OpsConsole({ database, onUpdateDatabase, onApplyTenantEntitlements }: OpsConsoleProps) {
  const [activeTab, setActiveTab] = useState<OpsTab>("api");
  const [selectedApiId, setSelectedApiId] = useState(database.apiProviders[0]?.id ?? "");
  const selectedApi = database.apiProviders.find((item) => item.id === selectedApiId) ?? database.apiProviders[0];
  const [apiDraft, setApiDraft] = useState<ApiProviderConfig>(selectedApi);
  const [message, setMessage] = useState("Ops 改动会写入浏览器 localStorage 模拟数据库。");
  const [savingApi, setSavingApi] = useState(false);
  const [testingApi, setTestingApi] = useState(false);
  const [inviteOrg, setInviteOrg] = useState("晨光教培中心");
  const [invitePlan, setInvitePlan] = useState<BillingPlan>("monthly");
  const [redeemTenant, setRedeemTenant] = useState("星河小学");
  const [redeemType, setRedeemType] = useState<"monthly" | "points">("monthly");
  const [redeemAmount, setRedeemAmount] = useState(300);
  const [tenantDrafts, setTenantDrafts] = useState<Record<string, TenantRecord>>({});

  const tableCards = useMemo(
    () => [
      ["api_providers", database.apiProviders.length, "AI API供应商、模型、密钥、限额"],
      ["invite_codes", database.inviteCodes.length, "注册邀请码、套餐、有效状态"],
      ["redeem_codes", database.redeemCodes.length, "月付核销码、点券核销码、使用状态"],
      ["tenants", database.tenants.length, "学校/机构租户、套餐、余额"],
      ["usage_logs", database.usageLogs.length, "生成课件和核销消耗记录"],
      ["audit_logs", database.auditLogs.length, "Ops 操作审计日志"]
    ],
    [database]
  );

  const switchApi = (id: string) => {
    const next = database.apiProviders.find((item) => item.id === id);
    if (!next) return;
    setSelectedApiId(id);
    setApiDraft(next);
  };

  const saveApi = async () => {
    setSavingApi(true);
    setMessage("正在保存 DeepSeek 配置到本地后端...");
    const result = await saveAiProviderConfig(apiDraft);
    if (!result.ok) {
      setMessage(result.message);
      setSavingApi(false);
      return;
    }

    const savedDraft = {
      ...apiDraft,
      apiKey: "",
      secretStored: true,
      updatedAt: new Date().toLocaleString("zh-CN", { hour12: false })
    };
    const nextDb = addAuditLog(
      {
        ...database,
        apiProviders: database.apiProviders.map((item) => (item.id === apiDraft.id ? savedDraft : item))
      },
      "Ops管理员",
      "保存 DeepSeek 配置",
      apiDraft.name
    );
    onUpdateDatabase(nextDb);
    setApiDraft(savedDraft);
    setMessage(result.message);
    setSavingApi(false);
  };

  const testApi = async () => {
    setTestingApi(true);
    setMessage("正在请求管理员配置的 AI 通道...");
    const result = await testAiProviderConnection(apiDraft);
    const nextDb = addAuditLog(
      database,
      "Ops管理员",
      result.ok ? "测试 AI API 连接" : "AI API 连接失败",
      `${apiDraft.name}：${result.message}`
    );
    onUpdateDatabase(nextDb);
    setMessage(result.message);
    setTestingApi(false);
  };

  const addInvite = () => {
    const invite = createInviteRecord(
      inviteOrg,
      invitePlan,
      invitePlan === "monthly" ? 300 : invitePlan === "trial" ? 20 : 0,
      invitePlan === "points" ? 1000 : invitePlan === "trial" ? 120 : 0
    );
    const nextDb = addAuditLog(
      { ...database, inviteCodes: [invite, ...database.inviteCodes] },
      "Ops管理员",
      "生成邀请码",
      invite.code
    );
    onUpdateDatabase(nextDb);
    setMessage(`已生成邀请码：${invite.code}`);
  };

  const toggleInvite = (code: string) => {
    const nextDb = addAuditLog(
      {
        ...database,
        inviteCodes: database.inviteCodes.map((item) =>
          item.code === code ? { ...item, valid: !item.valid } : item
        )
      },
      "Ops管理员",
      "切换邀请码状态",
      code
    );
    onUpdateDatabase(nextDb);
  };

  const addRedeem = () => {
    const redeem = createRedeemRecord(redeemType, redeemTenant, redeemAmount);
    const nextDb = addAuditLog(
      { ...database, redeemCodes: [redeem, ...database.redeemCodes] },
      "Ops管理员",
      "生成核销码",
      redeem.code
    );
    onUpdateDatabase(nextDb);
    setMessage(`已生成核销码：${redeem.code}`);
  };

  const toggleRedeem = (code: string) => {
    const nextDb = addAuditLog(
      {
        ...database,
        redeemCodes: database.redeemCodes.map((item) =>
          item.code === code ? { ...item, active: item.active === false } : item
        )
      },
      "Ops管理员",
      "切换核销码状态",
      code
    );
    onUpdateDatabase(nextDb);
  };

  const resetDb = () => {
    onUpdateDatabase(addAuditLog(createInitialDatabase(), "Ops管理员", "重置模拟数据库", "全部表"));
    setMessage("模拟数据库已恢复为初始种子数据。");
  };

  const getTenantDraft = (tenant: TenantRecord) => tenantDrafts[tenant.id] ?? tenant;

  const updateTenantDraft = (tenant: TenantRecord, patch: Partial<TenantRecord>) => {
    setTenantDrafts((current) => ({
      ...current,
      [tenant.id]: {
        ...getTenantDraft(tenant),
        ...patch
      }
    }));
  };

  const saveTenant = (tenant: TenantRecord) => {
    const draft = getTenantDraft(tenant);
    const nextDb = addAuditLog(
      {
        ...database,
        tenants: database.tenants.map((item) => (item.id === draft.id ? draft : item))
      },
      "Ops管理员",
      "调整用户点数和套餐",
      `${draft.name}：${getPlanLabel(draft.plan)} / ${draft.monthlyQuota} 次 / ${draft.points} 点`
    );
    onUpdateDatabase(nextDb);
    onApplyTenantEntitlements?.(draft);
    setMessage(`已更新 ${draft.name}：${getPlanLabel(draft.plan)}，月额度 ${draft.monthlyQuota} 次，点数 ${draft.points}。`);
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-skybrand sm:text-6xl">Ops 运营后台</h1>
          <p className="mt-3 text-xl font-bold text-ink">
            管理 DeepSeek API、邀请码、月付核销码与点券码
          </p>
        </div>
        <Button variant="coral" onClick={resetDb}>
          ♻️ 重置模拟数据库
        </Button>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["AI API", database.apiProviders.length, "🤖"],
          ["用户", database.tenants.length, "👤"],
          ["邀请码", database.inviteCodes.length, "🔐"],
          ["核销码", database.redeemCodes.length, "🎫"]
        ].map(([label, value, icon]) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{icon}</span>
              <div>
                <p className="text-sm font-black text-slate-500">{label}</p>
                <p className="text-3xl font-black text-ink">{value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-3">
        <div className="flex gap-2 overflow-x-auto">
          {[
            ["api", "AI API管理"],
            ["users", "用户点数"],
            ["plans", "套餐计划"],
            ["invite", "邀请码库"],
            ["redeem", "核销码库"],
            ["database", "数据库表"],
            ["logs", "日志"]
          ].map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as OpsTab)}
              className={[
                "shrink-0 rounded-2xl px-4 py-3 text-sm font-black transition",
                activeTab === tab ? "bg-skybrand text-white shadow-lg" : "bg-white/70 text-slate-600"
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card tone="mint" className="p-4">
        <p className="font-black text-ink">{message}</p>
      </Card>

      {activeTab === "api" ? (
        <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
          <Card>
            <h2 className="text-2xl font-black text-ink">API 通道列表</h2>
            <div className="mt-4 space-y-3">
              {database.apiProviders.map((api) => (
                <button
                  key={api.id}
                  onClick={() => switchApi(api.id)}
                  className={[
                    "w-full rounded-3xl p-4 text-left shadow-sm transition",
                    selectedApiId === api.id ? "bg-blue-50 ring-2 ring-skybrand" : "bg-white/78"
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-ink">{api.name}</p>
                    <span className={api.enabled ? "text-emerald-600" : "text-slate-400"}>
                      {api.enabled ? "启用" : "停用"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-500">{api.model}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-black text-ink">AI API 配置编辑</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="通道名称" value={apiDraft.name} onChange={(value) => setApiDraft({ ...apiDraft, name: value })} />
              <Field label="供应商" value={apiDraft.provider} onChange={(value) => setApiDraft({ ...apiDraft, provider: value })} />
              <Field label="Base URL" value={apiDraft.baseUrl} onChange={(value) => setApiDraft({ ...apiDraft, baseUrl: value })} />
              <Field label="默认模型" value={apiDraft.model} onChange={(value) => setApiDraft({ ...apiDraft, model: value })} />
              <Field label="API Key" value={apiDraft.apiKey} onChange={(value) => setApiDraft({ ...apiDraft, apiKey: value })} />
              <Field
                label="每日限额"
                type="number"
                value={String(apiDraft.dailyLimit)}
                onChange={(value) => setApiDraft({ ...apiDraft, dailyLimit: Number(value) })}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 font-black text-slate-600">
                <input
                  type="checkbox"
                  checked={apiDraft.enabled}
                  onChange={(event) => setApiDraft({ ...apiDraft, enabled: event.target.checked })}
                />
                启用该 API 通道
              </label>
              <span className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-500 shadow-sm">
                密钥展示：{maskCredential(apiDraft.apiKey)}
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={saveApi} disabled={savingApi}>
                {savingApi ? "保存中" : "💾 保存 DeepSeek 配置"}
              </Button>
              <Button variant="mint" onClick={testApi} disabled={testingApi}>
                {testingApi ? "测试中" : "🧪 测试连接"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === "users" ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {database.tenants.map((tenant) => {
            const draft = getTenantDraft(tenant);
            return (
              <Card key={tenant.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black text-ink">{draft.name}</h2>
                    <p className="mt-1 text-sm font-bold text-slate-500">负责人：{draft.owner}</p>
                  </div>
                  <span className="rounded-2xl bg-blue-50 px-3 py-2 text-sm font-black text-skybrand">
                    {draft.status === "active" ? "启用" : "暂停"}
                  </span>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-black text-slate-600">套餐</span>
                    <select
                      className="min-h-12 w-full rounded-2xl border border-blue-100 bg-white px-3 font-bold outline-none"
                      value={draft.plan}
                      onChange={(event) => updateTenantDraft(tenant, { plan: event.target.value as BillingPlan })}
                    >
                      {planDefinitions.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-black text-slate-600">状态</span>
                    <select
                      className="min-h-12 w-full rounded-2xl border border-blue-100 bg-white px-3 font-bold outline-none"
                      value={draft.status}
                      onChange={(event) => updateTenantDraft(tenant, { status: event.target.value as TenantRecord["status"] })}
                    >
                      <option value="active">启用</option>
                      <option value="paused">暂停</option>
                    </select>
                  </label>
                  <Field
                    label="月度生成额度"
                    type="number"
                    value={String(draft.monthlyQuota)}
                    onChange={(value) => updateTenantDraft(tenant, { monthlyQuota: Number(value) })}
                  />
                  <Field
                    label="点数余额"
                    type="number"
                    value={String(draft.points)}
                    onChange={(value) => updateTenantDraft(tenant, { points: Number(value) })}
                  />
                </div>
                <Button className="mt-5" fullWidth variant="mint" onClick={() => saveTenant(tenant)}>
                  保存用户点数和套餐
                </Button>
              </Card>
            );
          })}
        </div>
      ) : null}

      {activeTab === "plans" ? (
        <div className="grid gap-5 lg:grid-cols-3">
          {planDefinitions.map((plan) => (
            <Card key={plan.id} tone={plan.id === "monthly" ? "blue" : plan.id === "points" ? "sun" : "mint"}>
              <h2 className="text-2xl font-black text-ink">{plan.name}</h2>
              <p className="mt-2 text-sm font-black text-skybrand">{plan.priceText}</p>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-white/82 p-4">
                  <p className="text-sm font-black text-slate-500">月度额度</p>
                  <p className="mt-1 text-3xl font-black text-ink">{plan.monthlyQuota}</p>
                </div>
                <div className="rounded-2xl bg-white/82 p-4">
                  <p className="text-sm font-black text-slate-500">初始点数</p>
                  <p className="mt-1 text-3xl font-black text-ink">{plan.points}</p>
                </div>
                <p className="rounded-2xl bg-white/76 p-3 text-sm font-bold text-slate-600">
                  {plan.generationCostText}
                </p>
                <p className="text-sm font-bold leading-6 text-slate-600">{plan.audience}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {activeTab === "invite" ? (
        <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
          <Card tone="blue">
            <h2 className="text-2xl font-black text-ink">生成邀请码</h2>
            <div className="mt-5 space-y-4">
              <Field label="机构名称" value={inviteOrg} onChange={setInviteOrg} />
              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-600">套餐</span>
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
              <Button fullWidth onClick={addInvite}>✨ 写入邀请码表</Button>
            </div>
          </Card>
          <Card>
            <CodeTable
              title="invite_codes"
              rows={database.inviteCodes.map((item) => ({
                key: item.code,
                cols: [item.name, getPlanLabel(item.plan), item.valid ? "有效" : "停用"],
                actionLabel: item.valid ? "停用" : "启用",
                onAction: () => toggleInvite(item.code)
              }))}
            />
          </Card>
        </div>
      ) : null}

      {activeTab === "redeem" ? (
        <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
          <Card tone="sun">
            <h2 className="text-2xl font-black text-ink">生成核销码</h2>
            <div className="mt-5 space-y-4">
              <Field label="绑定机构" value={redeemTenant} onChange={setRedeemTenant} />
              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-600">核销类型</span>
                <select
                  className="min-h-12 w-full rounded-2xl border border-blue-100 bg-white px-3 font-bold outline-none"
                  value={redeemType}
                  onChange={(event) => setRedeemType(event.target.value as "monthly" | "points")}
                >
                  <option value="monthly">月付额度</option>
                  <option value="points">点券充值</option>
                </select>
              </label>
              <Field
                label={redeemType === "monthly" ? "月度生成额度" : "点券数量"}
                type="number"
                value={String(redeemAmount)}
                onChange={(value) => setRedeemAmount(Number(value))}
              />
              <Button fullWidth variant="sun" onClick={addRedeem}>🎫 写入核销码表</Button>
            </div>
          </Card>
          <Card>
            <CodeTable
              title="redeem_codes"
              rows={database.redeemCodes.map((item) => ({
                key: item.code,
                cols: [
                  item.label,
                  item.type === "monthly" ? `${item.monthlyQuota ?? 0} 次/月` : `${item.points ?? 0} 点券`,
                  item.used ? "已核销" : item.active === false ? "停用" : "可用"
                ],
                actionLabel: item.active === false ? "启用" : "停用",
                onAction: () => toggleRedeem(item.code)
              }))}
            />
          </Card>
        </div>
      ) : null}

      {activeTab === "database" ? (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {tableCards.map(([table, count, desc]) => (
            <Card key={table as string}>
              <p className="text-sm font-black text-slate-500">表</p>
              <h2 className="mt-1 text-2xl font-black text-skybrand">{table}</h2>
              <p className="mt-3 text-4xl font-black text-ink">{count} 行</p>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{desc}</p>
            </Card>
          ))}
          <Card className="lg:col-span-2 xl:col-span-3">
            <h2 className="text-2xl font-black text-ink">数据库 JSON 预览</h2>
            <pre className="mt-4 max-h-96 overflow-auto rounded-3xl bg-slate-950 p-4 text-xs leading-6 text-emerald-100">
              {JSON.stringify(database, null, 2)}
            </pre>
          </Card>
        </div>
      ) : null}

      {activeTab === "logs" ? (
        <div className="grid gap-5 xl:grid-cols-2">
          <LogList
            title="usage_logs"
            rows={database.usageLogs.map((log) => [
              log.createdAt,
              log.tenantName,
              log.action,
              log.cost,
              log.status
            ])}
          />
          <LogList
            title="audit_logs"
            rows={database.auditLogs.map((log) => [
              log.createdAt,
              log.actor,
              log.action,
              log.target
            ])}
          />
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-600">{label}</span>
      <input
        className="min-h-12 w-full rounded-2xl border border-blue-100 bg-white px-3 font-bold outline-none focus:border-skybrand focus:ring-4 focus:ring-blue-100"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function CodeTable({
  title,
  rows
}: {
  title: string;
  rows: Array<{ key: string; cols: string[]; actionLabel: string; onAction: () => void }>;
}) {
  return (
    <div>
      <h2 className="text-2xl font-black text-ink">{title}</h2>
      <div className="mt-4 overflow-hidden rounded-3xl border border-blue-100 bg-white/82">
        {rows.map((row) => (
          <div
            key={row.key}
            className="grid gap-3 border-b border-blue-50 p-4 last:border-b-0 xl:grid-cols-[1.2fr_1fr_1fr_0.8fr_auto] xl:items-center"
          >
            <div>
              <p className="break-all font-black text-skybrand">{row.key}</p>
            </div>
            {row.cols.map((col) => (
              <p key={`${row.key}-${col}`} className="text-sm font-bold text-slate-600">
                {col}
              </p>
            ))}
            <Button size="sm" variant="white" onClick={row.onAction}>
              {row.actionLabel}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogList({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <Card>
      <h2 className="text-2xl font-black text-ink">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.map((row, index) => (
          <div key={`${title}-${index}`} className="rounded-2xl bg-white/78 p-4 shadow-sm">
            {row.map((item) => (
              <span
                key={item}
                className="mr-2 mt-2 inline-flex rounded-xl bg-blue-50 px-3 py-1 text-xs font-black text-slate-600"
              >
                {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}
