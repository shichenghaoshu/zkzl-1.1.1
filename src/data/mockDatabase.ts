import {
  generateInviteCode,
  mockInviteCodes,
  mockRedeemCodes,
  type BillingPlan,
  type InviteCode,
  type RedeemCode
} from "./mockCommerce";

export type ApiProviderConfig = {
  id: string;
  name: string;
  provider: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  secretStored?: boolean;
  enabled: boolean;
  dailyLimit: number;
  monthlyCostCap: number;
  updatedAt: string;
};

export type TenantRecord = {
  id: string;
  name: string;
  plan: BillingPlan;
  owner: string;
  status: "active" | "paused";
  monthlyQuota: number;
  points: number;
};

export type UsageLog = {
  id: string;
  tenantName: string;
  action: "generate_lesson" | "redeem_monthly" | "redeem_points" | "api_test";
  cost: string;
  status: "success" | "blocked";
  createdAt: string;
};

export type AuditLog = {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
};

export type MockDatabase = {
  apiProviders: ApiProviderConfig[];
  inviteCodes: InviteCode[];
  redeemCodes: RedeemCode[];
  tenants: TenantRecord[];
  usageLogs: UsageLog[];
  auditLogs: AuditLog[];
};

export const databaseStorageKey = "keyou-ops-database";

export const createInitialDatabase = (): MockDatabase => ({
  apiProviders: [
    {
      id: "api-deepseek",
      name: "DeepSeek 课件生成",
      provider: "DeepSeek",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-chat",
      apiKey: "sk-demo-deepseek-key",
      secretStored: false,
      enabled: true,
      dailyLimit: 2000,
      monthlyCostCap: 3000,
      updatedAt: nowText()
    },
    {
      id: "api-backup",
      name: "DeepSeek 备用模型",
      provider: "DeepSeek",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-chat",
      apiKey: "sk-demo-deepseek-backup",
      secretStored: false,
      enabled: false,
      dailyLimit: 600,
      monthlyCostCap: 800,
      updatedAt: nowText()
    }
  ],
  inviteCodes: mockInviteCodes.map((item) => ({ ...item })),
  redeemCodes: mockRedeemCodes.map((item) => ({
    ...item,
    active: true,
    used: false,
    tenantName: "未绑定",
    createdAt: nowText()
  })),
  tenants: [
    {
      id: "tenant-xinghe",
      name: "星河小学",
      plan: "monthly",
      owner: "王老师",
      status: "active",
      monthlyQuota: 300,
      points: 0
    },
    {
      id: "tenant-demo",
      name: "课游AI 体验学校",
      plan: "trial",
      owner: "体验老师",
      status: "active",
      monthlyQuota: 20,
      points: 120
    }
  ],
  usageLogs: [
    {
      id: "usage-001",
      tenantName: "星河小学",
      action: "generate_lesson",
      cost: "月额度 -1",
      status: "success",
      createdAt: nowText()
    },
    {
      id: "usage-002",
      tenantName: "课游AI 体验学校",
      action: "redeem_points",
      cost: "点券 +300",
      status: "success",
      createdAt: nowText()
    }
  ],
  auditLogs: [
    {
      id: "audit-001",
      actor: "系统",
      action: "初始化模拟数据库",
      target: "api_providers / invite_codes / redeem_codes",
      createdAt: nowText()
    }
  ]
});

export const readStoredDatabase = (): MockDatabase => {
  try {
    const stored = window.localStorage.getItem(databaseStorageKey);
    if (!stored) return createInitialDatabase();
    const parsed = JSON.parse(stored) as MockDatabase;
    const initialDatabase = createInitialDatabase();
    return {
      ...initialDatabase,
      ...parsed,
      inviteCodes: parsed.inviteCodes?.length ? parsed.inviteCodes : initialDatabase.inviteCodes,
      redeemCodes: parsed.redeemCodes?.length ? parsed.redeemCodes : initialDatabase.redeemCodes,
      apiProviders: normalizeStoredApiProviders(parsed.apiProviders, initialDatabase.apiProviders)
    };
  } catch {
    return createInitialDatabase();
  }
};

const normalizeStoredApiProviders = (
  providers: ApiProviderConfig[] | undefined,
  fallback: ApiProviderConfig[]
) => {
  if (!providers?.length) return fallback;

  const hasOldDemoGateway = providers.some(
    (provider) =>
      provider.baseUrl.includes("keyou-ai.local") ||
      provider.model.includes("keyou-lesson") ||
      provider.id === "api-openai-compatible"
  );

  return hasOldDemoGateway
    ? fallback
    : providers.map((provider) => {
        const hasRealBrowserKey =
          provider.apiKey.trim() &&
          !provider.apiKey.toLowerCase().includes("demo") &&
          !provider.apiKey.toLowerCase().includes("placeholder") &&
          !provider.secretStored;

        return hasRealBrowserKey
          ? { ...provider, apiKey: "", secretStored: true }
          : provider;
      });
};

export const createInviteRecord = (
  organizationName: string,
  plan: BillingPlan,
  monthlyQuota: number,
  points: number
): InviteCode => ({
  code: generateInviteCode(organizationName, plan),
  name: `${organizationName} ${plan === "monthly" ? "月付" : plan === "points" ? "点券" : "试用"}邀请码`,
  plan,
  monthlyQuota,
  points,
  valid: true
});

export const createRedeemRecord = (
  type: "monthly" | "points",
  tenantName: string,
  amount: number
): RedeemCode => {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  if (type === "monthly") {
    return {
      code: `MONTH-OPS-${random}`,
      type,
      label: `${tenantName} 月付核销码`,
      monthlyQuota: amount,
      durationDays: 31,
      active: true,
      used: false,
      tenantName,
      createdAt: nowText()
    };
  }

  return {
    code: `POINT-${amount}-${random}`,
    type,
    label: `${tenantName} 点券核销码`,
    points: amount,
    active: true,
    used: false,
    tenantName,
    createdAt: nowText()
  };
};

export const addAuditLog = (
  database: MockDatabase,
  actor: string,
  action: string,
  target: string
): MockDatabase => ({
  ...database,
  auditLogs: [
    {
      id: `audit-${Date.now()}`,
      actor,
      action,
      target,
      createdAt: nowText()
    },
    ...database.auditLogs
  ].slice(0, 30)
});

export const addUsageLog = (
  database: MockDatabase,
  tenantName: string,
  action: UsageLog["action"],
  cost: string,
  status: UsageLog["status"] = "success"
): MockDatabase => ({
  ...database,
  usageLogs: [
    {
      id: `usage-${Date.now()}`,
      tenantName,
      action,
      cost,
      status,
      createdAt: nowText()
    },
    ...database.usageLogs
  ].slice(0, 30)
});

const nowText = () => new Date().toLocaleString("zh-CN", { hour12: false });
