import { useCallback, useEffect, useState } from "react";
import { Layout } from "./components/Layout";
import {
  consumeLessonGeneration,
  type InviteCode,
  redeemUsageCode,
  type AuthUser,
  type RedeemResult,
  type UsageAccount
} from "./data/mockCommerce";
import {
  addAuditLog,
  addUsageLog,
  databaseStorageKey,
  readStoredDatabase,
  type MockDatabase,
  type TenantRecord
} from "./data/mockDatabase";
import { mockClass, mockSession } from "./data/mockClassData";
import {
  createLiveClassReport,
  ensureLiveClassReport,
  recordLevelAnswer,
  recordStudentJoin,
  type LiveClassReport
} from "./data/liveClassReport";
import { pathToRoute, routePaths, type AppRoute } from "./data/routes";
import { mockLesson, type Lesson } from "./data/mockLessons";
import { AuthPage } from "./pages/AuthPage";
import { BackendConsole } from "./pages/BackendConsole";
import { ClassReport } from "./pages/ClassReport";
import { GenerateLesson } from "./pages/GenerateLesson";
import { HelpCenter } from "./pages/HelpCenter";
import { LessonEditor } from "./pages/LessonEditor";
import { LegalPage } from "./pages/LegalPage";
import { LessonLoadErrorPage } from "./pages/LessonLoadErrorPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { OpsConsole } from "./pages/OpsConsole";
import { OpsLoginPage } from "./pages/OpsLoginPage";
import { ShareLesson } from "./pages/ShareLesson";
import { StudentJoin } from "./pages/StudentJoin";
import { StudentPlay } from "./pages/StudentPlay";
import { TeacherDashboard } from "./pages/TeacherDashboard";
import { clearAiSessionToken } from "./services/lessonAi";

function getInitialRoute() {
  if (window.location.pathname === "/") return "teacher-dashboard" as AppRoute;
  return pathToRoute(window.location.pathname);
}

const protectedRoutes = new Set<AppRoute>([
  "teacher-dashboard",
  "generate",
  "editor",
  "share",
  "report"
]);

const readStoredJson = <T,>(key: string): T | null => {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
};

function setMeta(name: string, content: string, attribute: "name" | "property" = "name") {
  const selector = `meta[${attribute}="${name}"]`;
  let element = document.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.content = content;
}

const accountStoreKey = "keyou-account-store";
const generatedLessonKey = "keyou-generated-lesson";
const liveClassReportKey = "keyou-live-class-report";
const activeStudentKey = "keyou-active-student";

type StoredAccountRecord = {
  user: AuthUser;
  usage: UsageAccount;
};

type ActiveStudent = {
  id: string;
  name: string;
};

export default function App() {
  const [route, setRoute] = useState<AppRoute>(getInitialRoute);
  const [authUser, setAuthUser] = useState<AuthUser | null>(() =>
    readStoredJson<AuthUser>("keyou-auth-user")
  );
  const [usageAccount, setUsageAccount] = useState<UsageAccount | null>(() =>
    readStoredJson<UsageAccount>("keyou-usage-account")
  );
  const [redeemedCodes, setRedeemedCodes] = useState<string[]>(() =>
    readStoredJson<string[]>("keyou-redeemed-codes") ?? []
  );
  const [accountStore, setAccountStore] = useState<Record<string, StoredAccountRecord>>(
    () => readStoredJson<Record<string, StoredAccountRecord>>(accountStoreKey) ?? {}
  );
  const [opsDatabase, setOpsDatabase] = useState<MockDatabase>(() => readStoredDatabase());
  const [generatedLesson, setGeneratedLesson] = useState<Lesson | null>(() =>
    readStoredJson<Lesson>(generatedLessonKey)
  );
  const [liveClassReport, setLiveClassReport] = useState<LiveClassReport | null>(() =>
    readStoredJson<LiveClassReport>(liveClassReportKey)
  );
  const [activeStudent, setActiveStudent] = useState<ActiveStudent | null>(() =>
    readStoredJson<ActiveStudent>(activeStudentKey)
  );
  const [studentReportUnlocked, setStudentReportUnlocked] = useState(false);
  const activeLesson = generatedLesson ?? mockLesson;

  const navigate = useCallback((nextRoute: AppRoute) => {
    setRoute(nextRoute);
    const nextPath = routePaths[nextRoute];
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ route: nextRoute }, "", nextPath);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const onPopState = () => setRoute(getInitialRoute());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const titles: Record<AppRoute, string> = {
      login: "邀请码注册登录",
      "teacher-dashboard": "老师端首页",
      generate: "AI 生成课件向导",
      editor: "课件编辑器",
      share: "快速分享与班级发布",
      student: "学生端加入页",
      play: "学生端游戏课件页",
      report: "班级数据报告",
      backend: "权益与核销中心",
      ops: "Ops 运营后台",
      help: "帮助中心",
      legalPrivacy: "隐私政策",
      legalTerms: "用户服务协议",
      legalChildren: "儿童个人信息保护说明",
      legalCopyright: "版权与内容使用说明",
      lessonLoadError: "课件加载失败",
      notFound: "页面未找到"
    };
    const defaultTitle = "课游AI｜AI互动游戏课件生成平台";
    const defaultDescription =
      "课游AI面向小学老师和教培机构，支持输入知识点一键生成闯关、竞答、拖拽、配对等互动游戏课件。学生点链接即可参与，老师实时查看班级反馈。";
    const pageTitle =
      route === "play"
        ? `${generatedLesson?.title ?? "分数闯关挑战"}｜课游AI互动游戏课件`
        : route === "teacher-dashboard"
          ? defaultTitle
          : `${titles[route]}｜课游AI`;
    const pageDescription =
      route === "play"
        ? `${generatedLesson?.grade ?? "三年级数学"}${generatedLesson?.subject ?? "认识分数"}互动闯关课，学生点击链接即可参与课堂游戏。`
        : defaultDescription;

    document.title = pageTitle;
    setMeta("description", pageDescription);
    setMeta("og:title", pageTitle, "property");
    setMeta("og:description", pageDescription, "property");
    setMeta("og:url", `https://savegpa.online${window.location.pathname}`, "property");
    setMeta("twitter:title", pageTitle);
    setMeta("twitter:description", pageDescription);
  }, [route, generatedLesson]);

  useEffect(() => {
    if (authUser) {
      window.localStorage.setItem("keyou-auth-user", JSON.stringify(authUser));
    } else {
      window.localStorage.removeItem("keyou-auth-user");
    }
  }, [authUser]);

  useEffect(() => {
    if (usageAccount) {
      window.localStorage.setItem("keyou-usage-account", JSON.stringify(usageAccount));
    } else {
      window.localStorage.removeItem("keyou-usage-account");
    }
  }, [usageAccount]);

  useEffect(() => {
    window.localStorage.setItem("keyou-redeemed-codes", JSON.stringify(redeemedCodes));
  }, [redeemedCodes]);

  useEffect(() => {
    window.localStorage.setItem(accountStoreKey, JSON.stringify(accountStore));
  }, [accountStore]);

  useEffect(() => {
    if (!authUser || !usageAccount) return;
    setAccountStore((current) => ({
      ...current,
      [authUser.inviteCode.toUpperCase()]: {
        user: authUser,
        usage: usageAccount
      }
    }));
  }, [authUser, usageAccount]);

  useEffect(() => {
    window.localStorage.setItem(databaseStorageKey, JSON.stringify(opsDatabase));
  }, [opsDatabase]);

  useEffect(() => {
    if (generatedLesson) {
      window.localStorage.setItem(generatedLessonKey, JSON.stringify(generatedLesson));
    }
  }, [generatedLesson]);

  useEffect(() => {
    setLiveClassReport((current) =>
      ensureLiveClassReport(current, activeLesson, mockClass, mockSession)
    );
  }, [activeLesson]);

  useEffect(() => {
    if (liveClassReport) {
      window.localStorage.setItem(liveClassReportKey, JSON.stringify(liveClassReport));
    }
  }, [liveClassReport]);

  useEffect(() => {
    if (activeStudent) {
      window.localStorage.setItem(activeStudentKey, JSON.stringify(activeStudent));
    } else {
      window.localStorage.removeItem(activeStudentKey);
    }
  }, [activeStudent]);

  const login = (user: AuthUser, usage: UsageAccount, nextRoute: AppRoute) => {
    const accountKey = user.inviteCode.toUpperCase();
    const existingAccount = accountStore[accountKey];
    const nextUser = existingAccount
      ? {
          ...existingAccount.user,
          name: user.name,
          organizationName: user.organizationName
        }
      : user;
    const nextUsage = existingAccount?.usage ?? usage;

    setAuthUser(nextUser);
    setUsageAccount(nextUsage);
    setAccountStore((current) => ({
      ...current,
      [accountKey]: {
        user: nextUser,
        usage: nextUsage
      }
    }));
    navigate(nextRoute);
  };

  const logout = () => {
    setAuthUser(null);
    setUsageAccount(null);
    setRedeemedCodes([]);
    clearAiSessionToken();
    navigate("login");
  };

  const consumeGeneration = (): RedeemResult => {
    if (!usageAccount) {
      return { ok: false, message: "请先通过邀请码登录。" };
    }

    const result = consumeLessonGeneration(usageAccount);
    if (result.ok && result.usage) {
      setUsageAccount(result.usage);
      setOpsDatabase((current) =>
        addUsageLog(
          current,
          authUser?.organizationName ?? "当前机构",
          "generate_lesson",
          usageAccount.plan === "points" ? "点券 -80" : "月额度 -1"
        )
      );
    }
    return result;
  };

  const redeemCode = (code: string): RedeemResult => {
    if (!usageAccount) {
      return { ok: false, message: "请先通过邀请码登录。" };
    }

    const normalizedCode = code.trim().toUpperCase();
    const result = redeemUsageCode(usageAccount, code, redeemedCodes, opsDatabase.redeemCodes);
    if (result.ok && result.usage) {
      setUsageAccount(result.usage);
      setRedeemedCodes((current) => [...current, normalizedCode]);
      setOpsDatabase((current) => {
        const match = current.redeemCodes.find((item) => item.code === normalizedCode);
        const withRedeem = {
          ...current,
          redeemCodes: current.redeemCodes.map((item) =>
            item.code === normalizedCode
              ? {
                  ...item,
                  used: true,
                  usedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
                  tenantName: authUser?.organizationName ?? item.tenantName
                }
              : item
          )
        };
        const action = match?.type === "points" ? "redeem_points" : "redeem_monthly";
        const cost = match?.type === "points" ? `点券 +${match.points ?? 0}` : `月额度 +${match?.monthlyQuota ?? 0}`;
        return addAuditLog(
          addUsageLog(withRedeem, authUser?.organizationName ?? "当前机构", action, cost),
          authUser?.name ?? "当前用户",
          "核销权益码",
          normalizedCode
        );
      });
    }
    return result;
  };

  const updateOpsDatabase = (database: MockDatabase) => {
    setOpsDatabase(database);
  };

  const createInviteFromBackend = (invite: InviteCode) => {
    setOpsDatabase((current) =>
      addAuditLog(
        {
          ...current,
          inviteCodes: current.inviteCodes.some((item) => item.code === invite.code)
            ? current.inviteCodes
            : [invite, ...current.inviteCodes]
        },
        authUser?.name ?? "当前用户",
        "租户后台生成邀请码",
        invite.code
      )
    );
  };

  const applyTenantEntitlements = (tenant: TenantRecord) => {
    if (!authUser || !usageAccount) return;
    if (authUser.organizationName !== tenant.name) return;

    setUsageAccount({
      ...usageAccount,
      plan: tenant.plan,
      monthlyQuota: tenant.monthlyQuota,
      points: tenant.points
    });
  };

  const handleGeneratedLesson = (lesson: Lesson) => {
    setGeneratedLesson(lesson);
    setLiveClassReport(createLiveClassReport(lesson, mockClass, mockSession));
    setActiveStudent(null);
  };

  const joinStudent = (nickname: string) => {
    const result = recordStudentJoin(
      ensureLiveClassReport(liveClassReport, activeLesson, mockClass, mockSession),
      nickname
    );
    const studentName =
      result.report.students.find((student) => student.id === result.studentId)?.name || "同学";
    setLiveClassReport(result.report);
    setActiveStudent({ id: result.studentId, name: studentName });
  };

  const recordStudentAnswer = (levelIndex: number, correct: boolean, stars: number) => {
    let baseReport = ensureLiveClassReport(liveClassReport, activeLesson, mockClass, mockSession);
    let student = activeStudent;

    if (!student) {
      const joined = recordStudentJoin(baseReport, "小星星");
      const studentName =
        joined.report.students.find((item) => item.id === joined.studentId)?.name || "小星星";
      baseReport = joined.report;
      student = { id: joined.studentId, name: studentName };
      setActiveStudent(student);
    }

    setLiveClassReport(
      recordLevelAnswer(baseReport, {
        studentId: student.id,
        studentName: student.name,
        levelIndex,
        correct,
        stars
      })
    );
  };

  const openStudentReport = () => {
    setStudentReportUnlocked(true);
    navigate("report");
  };

  const routeRequiresAuth = protectedRoutes.has(route) && !(route === "report" && studentReportUnlocked);
  const needsAuth = routeRequiresAuth && !authUser;

  return (
    <Layout activeRoute={route} onNavigate={navigate} user={authUser} usage={usageAccount} onLogout={logout}>
      {needsAuth ? (
        <AuthPage
          currentUser={authUser}
          usage={usageAccount}
          redirectRoute={route}
          onLogin={login}
          onLogout={logout}
          onNavigate={navigate}
          inviteCodes={opsDatabase.inviteCodes}
        />
      ) : null}
      {!needsAuth && route === "login" ? (
        <AuthPage
          currentUser={authUser}
          usage={usageAccount}
          redirectRoute="teacher-dashboard"
          onLogin={login}
          onLogout={logout}
          onNavigate={navigate}
          inviteCodes={opsDatabase.inviteCodes}
        />
      ) : null}
      {!needsAuth && route === "teacher-dashboard" ? (
        <TeacherDashboard user={authUser} usage={usageAccount} onNavigate={navigate} />
      ) : null}
      {!needsAuth && route === "generate" && usageAccount ? (
        <GenerateLesson
          user={authUser}
          usage={usageAccount}
          apiProviders={opsDatabase.apiProviders}
          onConsumeGeneration={consumeGeneration}
          onGeneratedLesson={handleGeneratedLesson}
          onNavigate={navigate}
        />
      ) : null}
      {!needsAuth && route === "editor" ? (
        <LessonEditor lesson={generatedLesson} onUpdateLesson={setGeneratedLesson} onNavigate={navigate} />
      ) : null}
      {!needsAuth && route === "share" ? <ShareLesson lesson={generatedLesson} onNavigate={navigate} /> : null}
      {route === "student" ? <StudentJoin onNavigate={navigate} onJoinStudent={joinStudent} /> : null}
      {route === "play" ? (
        <StudentPlay
          lesson={generatedLesson}
          student={activeStudent}
          onNavigate={navigate}
          onRecordAnswer={recordStudentAnswer}
          onViewReport={openStudentReport}
        />
      ) : null}
      {!needsAuth && route === "report" ? (
        <ClassReport report={ensureLiveClassReport(liveClassReport, activeLesson, mockClass, mockSession)} />
      ) : null}
      {!needsAuth && route === "backend" ? (
        <BackendConsole
          user={authUser}
          usage={usageAccount}
          redeemedCodes={redeemedCodes}
          redeemCodes={opsDatabase.redeemCodes}
          onRedeemCode={redeemCode}
          onCreateInvite={createInviteFromBackend}
          onNavigate={navigate}
        />
      ) : null}
      {!needsAuth && route === "ops" && authUser?.role === "admin" ? (
        <OpsConsole
          database={opsDatabase}
          onUpdateDatabase={updateOpsDatabase}
          onApplyTenantEntitlements={applyTenantEntitlements}
        />
      ) : null}
      {!needsAuth && route === "ops" && authUser?.role !== "admin" ? (
        <OpsLoginPage onLogin={login} onNavigate={navigate} />
      ) : null}
      {route === "help" ? <HelpCenter /> : null}
      {route === "legalPrivacy" ? <LegalPage kind="privacy" onNavigate={navigate} /> : null}
      {route === "legalTerms" ? <LegalPage kind="terms" onNavigate={navigate} /> : null}
      {route === "legalChildren" ? <LegalPage kind="children" onNavigate={navigate} /> : null}
      {route === "legalCopyright" ? <LegalPage kind="copyright" onNavigate={navigate} /> : null}
      {route === "lessonLoadError" ? <LessonLoadErrorPage onNavigate={navigate} /> : null}
      {route === "notFound" ? <NotFoundPage onNavigate={navigate} /> : null}
    </Layout>
  );
}
