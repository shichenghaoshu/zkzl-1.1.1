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
const gradeOptions = ["小学低段", "小学中段", "小学高段"];
const subjects = ["数学", "英语", "科学", "班会"];
const modes = ["闯关地图", "竞速答题", "拖拽分类", "翻卡记忆", "知识配对", "转盘挑战"];

export function GenerateLesson({
  user,
  usage,
  apiProviders,
  onConsumeGeneration,
  onGeneratedLesson,
  onNavigate
}: GenerateLessonProps) {
  const [topic, setTopic] = useState("三年级数学：认识分数");
  const [grade, setGrade] = useState("小学中段");
  const [subject, setSubject] = useState("数学");
  const [mode, setMode] = useState("闯关地图");
  const [studentCount, setStudentCount] = useState(30);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [usageNotice, setUsageNotice] = useState(canGenerateLesson(usage).message);
  const apiStatus = getAiProviderStatus(apiProviders);

  const generate = async () => {
    if (generating) return;

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

    const aiResult = await generateLessonWithAi(
      {
        topic,
        grade,
        subject,
        mode,
        studentCount
      },
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
          <h1 className="text-4xl font-black text-skybrand sm:text-6xl">AI 生成课件向导</h1>
          <p className="mt-3 text-xl font-bold text-ink">
            输入知识点，几步生成完整游戏课
          </p>
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
        <div className="mb-6 grid gap-3 md:grid-cols-4">
          {["输入主题", "选择学段", "选择玩法", "生成预览"].map((step, index) => (
            <div
              key={step}
              className={[
                "flex items-center gap-3 rounded-2xl p-3 font-black",
                index === 0
                  ? "bg-blue-50 text-skybrand"
                  : index === 1
                    ? "bg-emerald-50 text-emerald-600"
                    : index === 2
                      ? "bg-violet-50 text-violet-600"
                      : "bg-yellow-50 text-orange-500"
              ].join(" ")}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                {index + 1}
              </span>
              {step}
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">
          <div className="rounded-3xl bg-white/74 p-5 shadow-inner">
            <label className="block">
              <span className="mb-2 block text-lg font-black text-ink">课题</span>
              <input
                className="min-h-14 w-full rounded-2xl border border-blue-100 bg-white px-4 text-lg font-bold text-ink outline-none transition focus:border-skybrand focus:ring-4 focus:ring-blue-100"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
              />
            </label>

            <div className="mt-5 grid gap-5">
              <OptionGroup label="学段" options={gradeOptions} value={grade} onChange={setGrade} />
              <OptionGroup label="学科" options={subjects} value={subject} onChange={setSubject} />
              <OptionGroup label="玩法" options={modes} value={mode} onChange={setMode} />
            </div>

            <div className="mt-6 rounded-3xl bg-gradient-to-r from-blue-50 to-emerald-50 p-5">
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-ink">班级人数 slider</span>
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

          <Card tone="blue" className="relative overflow-hidden">
            <div className="absolute -right-4 -top-6 opacity-90">
              <Mascot size={130} />
            </div>
            <div className="relative z-10 max-w-sm">
              <h2 className="text-3xl font-black text-skybrand">AI生成结果 ✨</h2>
              <p className="mt-2 text-sm font-bold text-slate-500">
                由管理员统一配置 AI 服务，老师端不暴露密钥设置
              </p>
            </div>

            <div className="relative z-10 mt-6 space-y-4">
              {[
                ["课程目标", "理解分数概念，能读写简单分数", "🎯"],
                ["关卡结构", "5 大关 · 16 小关", "🧩"],
                ["题目数量", "32 题", "📄"],
                ["预计时长", "约 30 分钟", "⏰"]
              ].map(([title, text, icon]) => (
                <div key={title} className="rounded-3xl bg-white/82 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                      {icon}
                    </span>
                    <div>
                      <p className="font-black text-ink">{title}</p>
                      <p className="text-sm font-bold text-slate-600">{text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              fullWidth
              size="lg"
              className="relative z-10 mt-6"
              onClick={generate}
              disabled={generating}
            >
              {generating ? "正在生成" : "✨ 一键生成游戏课"}
            </Button>
            <div className="relative z-10 mt-4 rounded-2xl bg-white/82 p-3 text-sm font-black text-slate-600">
              {usageNotice}
            </div>
            <div className="relative z-10 mt-3 rounded-2xl bg-white/70 p-3 text-xs font-black text-slate-500">
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
              <ProgressBar value={progress} label="生成进度" color="mint" />
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
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={[
              "rounded-2xl border px-5 py-3 font-black transition-all",
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
