import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Mascot } from "../components/Mascot";
import { ProgressBar } from "../components/ProgressBar";
import {
  canGenerateLesson,
  getPlanLabel,
  getRemainingMonthlyQuota,
  type AuthUser,
  type RedeemResult,
  type UsageAccount
} from "../data/mockCommerce";
import type { ApiProviderConfig } from "../data/mockDatabase";
import type { Lesson } from "../data/mockLessons";
import type { AppRoute } from "../data/routes";
import {
  gradeOptions,
  subjectOptions,
  courseTypeOptions,
  gameFormatOptions,
  validateGenerationFields,
  buildGenerationHint
} from "../data/generationOptions";
import { generateLessonWithAi, getAiProviderStatus, refreshAiSessionForUser } from "../services/lessonAi";

type GenerateLessonProps = {
  user: AuthUser | null;
  usage: UsageAccount;
  apiProviders: ApiProviderConfig[];
  onConsumeGeneration: () => RedeemResult;
  onGeneratedLesson: (lesson: Lesson) => void;
  onNavigate: (route: AppRoute) => void;
};

const stages = ["AI 正在分析知识点", "AI 正在设计关卡", "AI 正在生成题目", "AI 正在匹配游戏模板"];

type Tab = "basic" | "gameplay";

export function GenerateLesson({
  user,
  usage,
  apiProviders,
  onConsumeGeneration,
  onGeneratedLesson,
  onNavigate
}: GenerateLessonProps) {
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [courseType, setCourseType] = useState("");
  const [gameFormat, setGameFormat] = useState("");
  const [studentCount, setStudentCount] = useState(30);
  const [activeTab, setActiveTab] = useState<Tab>("basic");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [usageNotice, setUsageNotice] = useState(canGenerateLesson(usage).message);
  const apiStatus = getAiProviderStatus(apiProviders);

  const validation = validateGenerationFields({ topic, grade, subject, courseType, gameFormat });
  const hint = buildGenerationHint(validation.errors);
  const canSubmit = validation.ok && !generating;

  const generate = async () => {
    if (!canSubmit) return;

    const quotaCheck = canGenerateLesson(usage);
    setUsageNotice(quotaCheck.message);
    if (!quotaCheck.ok) return;

    setGenerating(true);
    setProgress(8);
    setStageIndex(0);

    const session = await refreshAiSessionForUser(user);
    if (!session.ok) {
      setGenerating(false);
      setUsageNotice(session.message);
      return;
    }

    const fullTopic = courseType ? `${courseType}：${topic}` : topic;

    const aiResult = await generateLessonWithAi(
      { topic: fullTopic, grade, subject, mode: gameFormat, studentCount },
      apiProviders
    );

    if (!aiResult.ok) {
      setGenerating(false);
      setUsageNotice(aiResult.message);
      return;
    }

    const usageResult = onConsumeGeneration();
    if (!usageResult.ok) {
      setGenerating(false);
      setUsageNotice(usageResult.message);
      return;
    }

    setProgress(100);
    setStageIndex(stages.length - 1);
    setUsageNotice(`${aiResult.message} ${usageResult.message}`);
    onGeneratedLesson(aiResult.lesson);
    window.setTimeout(() => onNavigate("editor"), 500);
  };

  useEffect(() => {
    if (!generating) return;

    const interval = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(92, current + 7);
        setStageIndex(Math.min(stages.length - 1, Math.floor(next / 25)));
        return next;
      });
    }, 450);

    return () => {
      window.clearInterval(interval);
    };
  }, [generating]);

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-skybrand sm:text-6xl">AI 生成课件</h1>
          <p className="mt-3 text-lg font-bold text-ink">填写信息，一键生成游戏课件</p>
        </div>
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-4xl">🎫</span>
            <div>
              <p className="text-sm font-black text-slate-500">当前权益：{getPlanLabel(usage.plan)}</p>
              <p className="text-lg font-black text-ink">
                月额度 {getRemainingMonthlyQuota(usage)} 次 · 点券 {usage.points}
              </p>
            </div>
            <Button size="sm" variant="white" onClick={() => onNavigate("backend")}>
              去核销
            </Button>
          </div>
        </Card>
      </section>

      <Card className="p-4 sm:p-6">
        <div className="mb-5 flex gap-2">
          {([["basic", "基本信息"], ["gameplay", "玩法设置"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={[
                "rounded-2xl px-6 py-3 text-lg font-black transition-all",
                activeTab === key
                  ? "bg-skybrand text-white shadow-md"
                  : "bg-white text-slate-500 hover:bg-blue-50 hover:text-skybrand"
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">
          <div className="rounded-3xl bg-white/74 p-5 shadow-inner">
            {activeTab === "basic" ? (
              <div className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-lg font-black text-ink">课题</span>
                  <input
                    className="min-h-14 w-full rounded-2xl border border-blue-100 bg-white px-4 text-lg font-bold text-ink outline-none transition focus:border-skybrand focus:ring-4 focus:ring-blue-100"
                    placeholder="如：三年级数学 · 认识分数"
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                  />
                </label>

                <OptionGroup label="学段" options={[...gradeOptions]} value={grade} onChange={setGrade} />
                <OptionGroup label="学科" options={[...subjectOptions]} value={subject} onChange={setSubject} />
                <OptionGroup label="课程类型" options={[...courseTypeOptions]} value={courseType} onChange={setCourseType} />
              </div>
            ) : (
              <div className="space-y-5">
                <OptionGroup label="游戏形式" options={[...gameFormatOptions]} value={gameFormat} onChange={setGameFormat} />

                <div className="rounded-3xl bg-gradient-to-r from-blue-50 to-emerald-50 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-ink">班级人数</span>
                    <span className="rounded-2xl bg-white px-4 py-2 text-xl font-black text-skybrand shadow-sm">
                      {studentCount} 人
                    </span>
                  </div>
                  <input
                    className="mt-5 w-full accent-skybrand"
                    type="range"
                    min={20}
                    max={50}
                    value={studentCount}
                    onChange={(event) => setStudentCount(Number(event.target.value))}
                  />
                  <div className="mt-2 flex justify-between text-sm font-bold text-slate-500">
                    <span>20</span>
                    <span>50</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Card tone="blue" className="relative overflow-hidden">
            <div className="absolute -right-4 -top-6 opacity-90">
              <Mascot size={130} />
            </div>
            <div className="relative z-10 max-w-sm">
              <h2 className="text-2xl font-black text-skybrand">生成预览</h2>
            </div>

            <div className="relative z-10 mt-4 space-y-3">
              {[
                ["课题", topic || "待填写", "📝"],
                ["学段", grade || "待选择", "🎓"],
                ["学科", subject || "待选择", "📚"],
                ["课程类型", courseType || "待选择", "🏷️"],
                ["游戏形式", gameFormat || "待选择", "🎮"]
              ].map(([label, value, icon]) => (
                <div key={label} className="rounded-2xl bg-white/82 p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-xl">
                      {icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-500">{label}</p>
                      <p className="truncate font-black text-ink">{value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hint ? (
              <div className="relative z-10 mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-700">
                {hint}
              </div>
            ) : null}

            <Button
              fullWidth
              size="lg"
              className="relative z-10 mt-4"
              onClick={generate}
              disabled={!canSubmit}
            >
              {generating ? "正在生成" : "✨ 一键生成游戏课"}
            </Button>
            <div className="relative z-10 mt-3 rounded-2xl bg-white/82 p-3 text-sm font-black text-slate-600">
              {usageNotice}
            </div>
            <div className="relative z-10 mt-2 rounded-2xl bg-white/70 p-3 text-xs font-black text-slate-500">
              {apiStatus.ok ? "AI 服务已就绪" : "AI 服务未就绪，请联系管理员配置"}
            </div>
          </Card>
        </div>
      </Card>

      {generating ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/28 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-xl text-center">
            <div className="mx-auto flex justify-center">
              <Mascot size={160} />
            </div>
            <h2 className="mt-4 text-3xl font-black text-skybrand">正在生成游戏课件</h2>
            <p className="mt-2 text-lg font-bold text-ink">{stages[stageIndex]}</p>
            <div className="mt-6">
              <ProgressBar value={progress} label="生成进度" color="mint" animated />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2" aria-hidden="true">
              {stages.map((stage, index) => (
                <span
                  key={stage}
                  className={[
                    "h-2 rounded-full transition-all",
                    index <= stageIndex ? "bg-mintbrand" : "bg-blue-100"
                  ].join(" ")}
                />
              ))}
            </div>
            <div className="mt-5 flex justify-center gap-3 text-3xl">
              <span className="animate-pulse-star">⭐</span>
              <span className="animate-bounce-soft">🪙</span>
              <span className="animate-pulse-star">🎮</span>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

type OptionGroupProps = {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

function OptionGroup({ label, options, value, onChange }: OptionGroupProps) {
  return (
    <div>
      <p className="mb-3 text-lg font-black text-ink">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={[
              "rounded-2xl border px-4 py-2.5 font-bold transition-all",
              value === option
                ? "border-skybrand bg-blue-50 text-skybrand ring-4 ring-blue-100"
                : "border-slate-200 bg-white text-slate-600 hover:border-skybrand"
            ].join(" ")}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
