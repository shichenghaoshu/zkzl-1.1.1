export type BillingPlan = "trial" | "monthly" | "points";

export type PlanDefinition = {
  id: BillingPlan;
  name: string;
  priceText: string;
  monthlyQuota: number;
  points: number;
  generationCostText: string;
  audience: string;
};

export type InviteCode = {
  code: string;
  name: string;
  plan: BillingPlan;
  monthlyQuota: number;
  points: number;
  valid: boolean;
};

export type AuthUser = {
  id: string;
  name: string;
  organizationName: string;
  role: "teacher" | "admin";
  inviteCode: string;
  createdAt: string;
};

export type AdminCredential = {
  username: string;
  password: string;
  name: string;
  organizationName: string;
};

export type UsageAccount = {
  plan: BillingPlan;
  monthlyQuota: number;
  monthlyUsed: number;
  points: number;
  expiresAt?: string;
  lastRedeemedCode?: string;
};

export const planDefinitions: PlanDefinition[] = [
  {
    id: "trial",
    name: "试用套餐",
    priceText: "免费体验",
    monthlyQuota: 20,
    points: 120,
    generationCostText: "每次生成扣 1 次月额度",
    audience: "单个老师体验完整生成与编辑链路"
  },
  {
    id: "monthly",
    name: "机构月付",
    priceText: "按月订阅",
    monthlyQuota: 300,
    points: 0,
    generationCostText: "每次生成扣 1 次月额度",
    audience: "学校、教培机构、教研组"
  },
  {
    id: "points",
    name: "点数套餐",
    priceText: "按量充值",
    monthlyQuota: 0,
    points: 1000,
    generationCostText: "每次生成扣 80 点",
    audience: "低频使用或临时项目制备课"
  }
];

export const adminCredentials: AdminCredential[] = [
  {
    username: "admin",
    password: "keyou2026",
    name: "管理员",
    organizationName: "课游AI 运营后台"
  }
];

export type RedeemCode = {
  code: string;
  type: "monthly" | "points";
  label: string;
  monthlyQuota?: number;
  points?: number;
  durationDays?: number;
  active?: boolean;
  used?: boolean;
  usedAt?: string;
  tenantName?: string;
  createdAt?: string;
};

export type RedeemResult = {
  ok: boolean;
  message: string;
  usage?: UsageAccount;
};

export const mockInviteCodes: InviteCode[] = [
  {
    code: "KEYOU-DEMO-2026",
    name: "试用邀请码",
    plan: "trial",
    monthlyQuota: 20,
    points: 120,
    valid: true
  },
  {
    code: "MONTH-TEACHER-2026",
    name: "月付老师邀请码",
    plan: "monthly",
    monthlyQuota: 300,
    points: 0,
    valid: true
  },
  {
    code: "POINTS-ORG-2026",
    name: "次付点券邀请码",
    plan: "points",
    monthlyQuota: 0,
    points: 1000,
    valid: true
  }
];

export const mockRedeemCodes: RedeemCode[] = [
  {
    code: "MONTH-735921",
    type: "monthly",
    label: "月付用户核销码",
    monthlyQuota: 300,
    durationDays: 31
  },
  {
    code: "MONTH-PLUS-888",
    type: "monthly",
    label: "机构月度加量码",
    monthlyQuota: 800,
    durationDays: 31
  },
  {
    code: "POINT-1000-KY",
    type: "points",
    label: "次付点券核销码",
    points: 1000
  },
  {
    code: "POINT-300-DEMO",
    type: "points",
    label: "体验点券核销码",
    points: 300
  }
];

export const createUserFromInvite = (
  inviteCode: string,
  name: string,
  organizationName: string,
  inviteCodes: InviteCode[] = mockInviteCodes
): { user: AuthUser; usage: UsageAccount } | null => {
  const invite = inviteCodes.find(
    (item) => item.valid && item.code.toUpperCase() === inviteCode.trim().toUpperCase()
  );

  if (!invite) return null;

  const user: AuthUser = {
    id: `user-${invite.code.toLowerCase().replace(/-/g, "")}`,
    name: name.trim() || "王老师",
    organizationName: organizationName.trim() || "课游AI 体验学校",
    role: "teacher",
    inviteCode: invite.code,
    createdAt: new Date().toISOString()
  };

  const usage: UsageAccount = {
    plan: invite.plan,
    monthlyQuota: invite.monthlyQuota,
    monthlyUsed: invite.plan === "monthly" ? 12 : 0,
    points: invite.points,
    expiresAt: invite.plan === "monthly" ? addDays(31) : undefined
  };

  return { user, usage };
};

export const createAdminUserFromPassword = (
  username: string,
  password: string,
  credentials: AdminCredential[] = adminCredentials
): { user: AuthUser; usage: UsageAccount } | null => {
  const credential = credentials.find(
    (item) =>
      item.username.toLowerCase() === username.trim().toLowerCase() &&
      item.password === password
  );

  if (!credential) return null;

  return {
    user: {
      id: `admin-${credential.username.toLowerCase()}`,
      name: credential.name,
      organizationName: credential.organizationName,
      role: "admin",
      inviteCode: `ADMIN-${credential.username.toUpperCase()}`,
      createdAt: new Date().toISOString()
    },
    usage: {
      plan: "monthly",
      monthlyQuota: 300,
      monthlyUsed: 0,
      points: 1000,
      expiresAt: addDays(365)
    }
  };
};

export const generateInviteCode = (organizationName: string, plan: BillingPlan) => {
  const prefix = plan === "monthly" ? "MONTH" : plan === "points" ? "POINTS" : "TRIAL";
  const orgMark = organizationName
    .trim()
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "")
    .slice(0, 4)
    .toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${orgMark || "ORG"}-${random}`;
};

export const maskCredential = (credential: string) => {
  if (!credential) return "未生成";
  if (credential.length <= 12) return credential;
  return `${credential.slice(0, 9)}••••${credential.slice(-4)}`;
};

export const getPlanLabel = (plan: BillingPlan) => {
  if (plan === "monthly") return "月付用户";
  if (plan === "points") return "次付点券";
  return "试用账户";
};

export const getRemainingMonthlyQuota = (usage: UsageAccount) =>
  Math.max(0, usage.monthlyQuota - usage.monthlyUsed);

export const canGenerateLesson = (usage: UsageAccount): { ok: boolean; message: string } => {
  if (usage.plan === "monthly" || usage.plan === "trial") {
    const remaining = getRemainingMonthlyQuota(usage);
    return remaining > 0
      ? { ok: true, message: `本次生成将消耗 1 次月度额度，剩余 ${remaining - 1} 次。` }
      : { ok: false, message: "月度额度不足，请到后端配置中心核销月付码或切换点券。"}
  }

  return usage.points >= 80
    ? { ok: true, message: `本次生成将消耗 80 点券，剩余 ${usage.points - 80} 点。` }
    : { ok: false, message: "点券不足，请到后端配置中心核销点券码。"}
};

export const consumeLessonGeneration = (usage: UsageAccount): RedeemResult => {
  const check = canGenerateLesson(usage);
  if (!check.ok) return { ok: false, message: check.message };

  if (usage.plan === "points") {
    return {
      ok: true,
      message: check.message,
      usage: { ...usage, points: usage.points - 80 }
    };
  }

  return {
    ok: true,
    message: check.message,
    usage: { ...usage, monthlyUsed: usage.monthlyUsed + 1 }
  };
};

export const redeemUsageCode = (
  usage: UsageAccount,
  code: string,
  redeemedCodes: string[],
  redeemCodes: RedeemCode[] = mockRedeemCodes
): RedeemResult => {
  const normalizedCode = code.trim().toUpperCase();
  const match = redeemCodes.find((item) => item.code === normalizedCode);

  if (!match) {
    return { ok: false, message: "核销码不存在，请检查大小写和横杠。" };
  }

  if (match.active === false) {
    return { ok: false, message: "该核销码已被 Ops 后台停用。" };
  }

  if (match.used) {
    return { ok: false, message: "该核销码已被核销，不能重复使用。" };
  }

  if (redeemedCodes.includes(match.code)) {
    return { ok: false, message: "该核销码已在当前 Demo 会话中使用。" };
  }

  if (match.type === "monthly") {
    return {
      ok: true,
      message: `核销成功：已开通 ${match.durationDays} 天月付权益，增加 ${match.monthlyQuota} 次生成额度。`,
      usage: {
        ...usage,
        plan: "monthly",
        monthlyQuota: (usage.plan === "monthly" ? usage.monthlyQuota : 0) + (match.monthlyQuota ?? 0),
        monthlyUsed: usage.plan === "monthly" ? usage.monthlyUsed : 0,
        expiresAt: addDays(match.durationDays ?? 31),
        lastRedeemedCode: match.code
      }
    };
  }

  return {
    ok: true,
    message: `核销成功：已为次付账户增加 ${match.points} 点券。`,
    usage: {
      ...usage,
      plan: usage.plan === "monthly" ? "monthly" : "points",
      points: usage.points + (match.points ?? 0),
      lastRedeemedCode: match.code
    }
  };
};

const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};
