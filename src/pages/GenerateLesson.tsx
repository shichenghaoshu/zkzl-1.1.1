import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Mascot } from "../components/Mascot";
import { ProgressBar } from "../components/ProgressBar";
import {
  canGenerateLesson,
  getPlanLabel,
  getRemainingMonthlyQuota,
  type RedeemResult,
  type UsageAccount
} from "../data/mockCommerce";
import type { AppRoute } from "../data/routes";

type GenerateLessonProps = {
  usage: UsageAccount;
  onConsumeGeneration: () => RedeemResult;
  onNavigate: (route: AppRoute) => void;
};

const stages = ["AI 正在分析知识点", "AI 正在设计关卡", "AI 正在生成题目", "AI 正在匹配游戏模板"];
const gradeOptions = ["小学低段", "小学中段", "小学高段"];
const subjects = ["数学", "英语", "科学", "班会"];
const modes = ["闯关地图", "竞速答题", "拖拽分类", "翻卡记忆", "知识配对", "转盘挑战"];

export function GenerateLesson({ usage, onConsumeGeneration, onNavigate }: GenerateLessonProps) {
  const [topic, setTopic] = useState("三年级数学：认识分数");
  const [grade, setGrade] = useState("小学中段");
  const [subject, setSubject] = useState("数学");
  const [mode, setMode] = useState("闯关地图");
  const [studentCount, setStudentCount] = useState(30);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [usageNotice, setUsageNotice] = useState(canGenerateLesson(usage).message);

  const generate = () => {
    const result = onConsumeGeneration();
    setUsageNotice(result.message);
    if (!result.ok) return;
    setGenerating(true);
  };

  useEffect(() => {
    if (!generating) return;

    setProgress(0);
    setStageIndex(0);
    const interval = window.setInterval(() => {
      setProgress((current) => Math.min(100, current + 12.5));
      setStageIndex((current) => Math.min(stages.length - 1, current + 1));
    }, 350);

    const timer = window.setTimeout(() => {
      window.clearInterval(interval);
      onNavigate("editor");
    }, 2200);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timer);
    };
  }, [generating, onNavigate]);

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
                自动拆解教学目标、题目与游戏模板
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
              ✨ 一键生成游戏课
            </Button>
            <div className="relative z-10 mt-4 rounded-2xl bg-white/82 p-3 text-sm font-black text-slate-600">
              {usageNotice}
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
