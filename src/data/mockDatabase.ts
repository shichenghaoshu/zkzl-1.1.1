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
      id: "api-openai-compatible",
      name: "默认 AI 课件生成网关",
      provider: "OpenAI 兼容网关",
      baseUrl: "https://api.keyou-ai.local/v1",
      model: "keyou-lesson-pro",
      apiKey: "sk-demo-keyou-ai-lesson",
      enabled: true,
      dailyLimit: 2000,
      monthlyCostCap: 3000,
      updatedAt: nowText()
    },
    {
      id: "api-backup",
      name: "备用多模态生成网关",
      provider: "多模型备用通道",
      baseUrl: "https://backup.keyou-ai.local/v1",
      model: "keyou-lesson-lite",
      apiKey: "sk-demo-backup-channel",
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
    return {
      ...createInitialDatabase(),
      ...parsed,
      inviteCodes: parsed.inviteCodes?.length ? parsed.inviteCodes : createInitialDatabase().inviteCodes,
      redeemCodes: parsed.redeemCodes?.length ? parsed.redeemCodes : createInitialDatabase().redeemCodes,
      apiProviders: parsed.apiProviders?.length ? parsed.apiProviders : createInitialDatabase().apiProviders
    };
  } catch {
    return createInitialDatabase();
  }
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
