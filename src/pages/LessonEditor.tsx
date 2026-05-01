import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { DragClassifyGame } from "../components/DragClassifyGame";
import { mockLesson, type Lesson } from "../data/mockLessons";
import type { AppRoute } from "../data/routes";

type LessonEditorProps = {
  lesson: Lesson | null;
  onUpdateLesson: (lesson: Lesson) => void;
  onNavigate: (route: AppRoute) => void;
};

const levelIcons = ["🏡", "🍎", "🧩", "⏱️", "👾", "⭐"];

export function LessonEditor({ lesson, onUpdateLesson, onNavigate }: LessonEditorProps) {
  const activeLesson = lesson ?? mockLesson;
  const [selectedLevel, setSelectedLevel] = useState(0);
  const selectedScene = activeLesson.scenes[selectedLevel] ?? activeLesson.scenes[0];
  const firstQuestion = selectedScene?.questions[0];
  const [optionCount, setOptionCount] = useState(5);
  const [timeLimit, setTimeLimit] = useState(60);
  const [difficulty, setDifficulty] = useState("标准");
  const [notice, setNotice] = useState("已生成一节完整互动游戏课，老师可以快速改题、换关卡、调顺序。");
  const levelList = useMemo(
    () =>
      activeLesson.scenes.map((scene, index) => [
        scene.title,
        scene.description || "AI 生成关卡",
        levelIcons[index] ?? "⭐"
      ]),
    [activeLesson]
  );
  const totalStars = activeLesson.scenes.reduce((sum, scene) => sum + scene.rewards.stars, 0);
  const previewConfig = useMemo(() => {
    const options = firstQuestion?.options?.length ? firstQuestion.options : ["选项 A", "选项 B", "选项 C"];
    const categories = ["正确答案", "其他选项"];
    return {
      prompt: firstQuestion?.prompt || selectedScene?.description || "编辑题目后可在这里预览。",
      categories,
      items: options,
      answerMap: options.reduce<Record<string, string>>((acc, option) => {
        acc[option] = option === firstQuestion?.answer ? "正确答案" : "其他选项";
        return acc;
      }, {})
    };
  }, [firstQuestion, selectedScene?.description]);

  useEffect(() => {
    if (selectedLevel >= activeLesson.scenes.length) {
      setSelectedLevel(0);
    }
  }, [activeLesson.scenes.length, selectedLevel]);

  useEffect(() => {
    setOptionCount(firstQuestion?.options.length || 4);
  }, [firstQuestion, selectedScene]);

  useEffect(() => {
    if (lesson) {
      setNotice(`已载入 AI 生成课件：${lesson.title}，可继续编辑题目、关卡和奖励。`);
    }
  }, [lesson]);

  const updateLesson = (updater: (current: Lesson) => Lesson) => {
    const nextLesson = updater(activeLesson);
    onUpdateLesson(nextLesson);
    setNotice("已更新课件内容，生成后的关卡和题目会保存在本机。");
  };

  const updateSelectedScene = (updater: (scene: Lesson["scenes"][number]) => Lesson["scenes"][number]) => {
    updateLesson((current) => ({
      ...current,
      scenes: current.scenes.map((scene, index) => (index === selectedLevel ? updater(scene) : scene))
    }));
  };

  const updateFirstQuestion = (updater: (question: NonNullable<typeof firstQuestion>) => NonNullable<typeof firstQuestion>) => {
    updateSelectedScene((scene) => {
      const fallbackQuestion = {
        id: `q-${scene.id || selectedLevel + 1}-1`,
        prompt: "",
        options: ["选项 A", "选项 B", "选项 C"],
        answer: "选项 A"
      };
      const questions = scene.questions.length ? scene.questions : [fallbackQuestion];
      return {
        ...scene,
        questions: questions.map((question, index) => (index === 0 ? updater(question) : question))
      };
    });
  };

  const updateOption = (optionIndex: number, value: string) => {
    updateFirstQuestion((question) => ({
      ...question,
      options: question.options.map((option, index) => (index === optionIndex ? value : option))
    }));
  };

  const resizeOptions = (nextCount: number) => {
    const safeCount = Math.max(2, Math.min(8, nextCount));
    setOptionCount(safeCount);
    updateFirstQuestion((question) => {
      const nextOptions = [...question.options];
      while (nextOptions.length < safeCount) nextOptions.push(`选项 ${nextOptions.length + 1}`);
      return {
        ...question,
        options: nextOptions.slice(0, safeCount)
      };
    });
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-skybrand sm:text-6xl">课件编辑器</h1>
          <p className="mt-3 text-xl font-bold text-ink">
            所见即所得，老师可以快速改题、换关卡、调顺序
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="white" onClick={() => setNotice("预览模式已打开：学生看到的是当前画布内容。")}>
            👁️ 预览
          </Button>
          <Button variant="secondary" onClick={() => setNotice("保存成功：课件已进入待分享列表。")}>
            💾 保存
          </Button>
          <Button variant="mint" onClick={() => onNavigate("share")}>
            📨 分享
          </Button>
          <Button onClick={() => onNavigate("student")}>▶ 开始上课</Button>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[280px_1fr_320px]">
        <Card className="h-fit">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-ink">关卡 / 页面列表</h2>
            <button className="rounded-2xl bg-blue-50 px-3 py-2 text-sm font-black text-skybrand">
              + 新增页面
            </button>
          </div>
          <div className="space-y-3">
            {levelList.map(([title, desc, icon], index) => (
              <button
                key={title}
                onClick={() => setSelectedLevel(index)}
                className={[
                  "flex w-full items-center gap-3 rounded-3xl border p-3 text-left transition-all",
                  selectedLevel === index
                    ? "border-skybrand bg-blue-50 shadow-lg shadow-blue-100"
                    : "border-slate-100 bg-white/70 hover:border-blue-200 hover:bg-white"
                ].join(" ")}
              >
                <span className="flex h-14 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-emerald-100 text-3xl">
                  {icon}
                </span>
                <span>
                  <span className="block font-black text-ink">{title}</span>
                  <span className="block text-sm font-bold text-slate-500">{desc}</span>
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-ink">编辑画布（实时预览）</h2>
              <p className="text-sm font-bold text-slate-500">{activeLesson.title}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-2 text-sm font-black text-skybrand shadow-sm">
              ⭐ {totalStars}
            </div>
          </div>

          <div className="mb-4 rounded-3xl bg-blue-50 p-4">
            <input
              className="w-full rounded-2xl border border-blue-100 bg-white px-3 py-2 font-black text-ink outline-none focus:border-skybrand focus:ring-4 focus:ring-blue-100"
              value={selectedScene?.title ?? ""}
              onChange={(event) => updateSelectedScene((scene) => ({ ...scene, title: event.target.value }))}
            />
            <textarea
              className="mt-3 min-h-20 w-full rounded-2xl border border-blue-100 bg-white p-3 text-sm font-bold leading-6 text-slate-600 outline-none focus:border-skybrand focus:ring-4 focus:ring-blue-100"
              value={selectedScene?.description ?? ""}
              onChange={(event) => updateSelectedScene((scene) => ({ ...scene, description: event.target.value }))}
            />
          </div>

          <DragClassifyGame
            mode="editor"
            config={previewConfig}
            onComplete={() => setNotice("学生答对后会显示星星奖励，课堂参与数据同步进入报告。")}
          />

          <div className="mt-4 flex flex-wrap justify-center gap-2 rounded-3xl bg-white/80 p-3 shadow-inner">
            {["🖱️", "T", "🖼️", "🎵", "⭐", "↩", "↪"].map((tool) => (
              <button
                key={tool}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-lg font-black text-skybrand transition hover:bg-blue-100"
              >
                {tool}
              </button>
            ))}
          </div>
        </Card>

        <Card className="h-fit">
          <h2 className="text-xl font-black text-ink">内容设置</h2>
          <div className="mt-5 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-600">题目输入框</span>
              <textarea
                className="min-h-24 w-full rounded-2xl border border-blue-100 bg-white p-3 font-bold text-ink outline-none focus:border-skybrand focus:ring-4 focus:ring-blue-100"
                value={firstQuestion?.prompt ?? ""}
                onChange={(event) => updateFirstQuestion((question) => ({ ...question, prompt: event.target.value }))}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-600">选项数量</span>
              <input
                className="min-h-12 w-full rounded-2xl border border-blue-100 bg-white px-3 font-bold outline-none focus:border-skybrand focus:ring-4 focus:ring-blue-100"
                type="number"
                min={2}
                max={8}
                value={optionCount}
                onChange={(event) => resizeOptions(Number(event.target.value))}
              />
            </label>
            <div className="space-y-3 rounded-2xl bg-blue-50 p-3">
              <p className="font-black text-slate-600">选项</p>
              {(firstQuestion?.options ?? []).map((option, index) => (
                <input
                  key={`${firstQuestion?.id ?? "question"}-${index}`}
                  className="min-h-11 w-full rounded-2xl border border-blue-100 bg-white px-3 text-sm font-bold text-ink outline-none focus:border-skybrand focus:ring-4 focus:ring-blue-100"
                  value={option}
                  onChange={(event) => updateOption(index, event.target.value)}
                />
              ))}
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-600">正确答案</span>
              <input
                className="min-h-12 w-full rounded-2xl border border-blue-100 bg-white px-3 font-bold text-ink outline-none focus:border-skybrand focus:ring-4 focus:ring-blue-100"
                value={firstQuestion?.answer ?? ""}
                onChange={(event) => updateFirstQuestion((question) => ({ ...question, answer: event.target.value }))}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-600">答案解释</span>
              <textarea
                className="min-h-20 w-full rounded-2xl border border-blue-100 bg-white p-3 text-sm font-bold text-ink outline-none focus:border-skybrand focus:ring-4 focus:ring-blue-100"
                value={firstQuestion?.explanation ?? ""}
                onChange={(event) =>
                  updateFirstQuestion((question) => ({ ...question, explanation: event.target.value }))
                }
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-600">时间限制：{timeLimit} 秒</span>
              <input
                className="w-full accent-skybrand"
                type="range"
                min={30}
                max={120}
                step={10}
                value={timeLimit}
                onChange={(event) => setTimeLimit(Number(event.target.value))}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-600">
                奖励星星：{selectedScene?.rewards.stars ?? 3} 星
              </span>
              <input
                className="w-full accent-sunbrand"
                type="range"
                min={1}
                max={5}
                value={selectedScene?.rewards.stars ?? 3}
                onChange={(event) =>
                  updateSelectedScene((scene) => ({
                    ...scene,
                    rewards: { ...scene.rewards, stars: Number(event.target.value) }
                  }))
                }
              />
            </label>
            <div>
              <span className="mb-2 block text-sm font-black text-slate-600">难度选择</span>
              <div className="grid grid-cols-3 gap-2">
                {["简单", "标准", "挑战"].map((item) => (
                  <button
                    key={item}
                    onClick={() => setDifficulty(item)}
                    className={[
                      "rounded-2xl px-3 py-3 text-sm font-black transition-all",
                      difficulty === item
                        ? "bg-skybrand text-white shadow-lg shadow-blue-200"
                        : "bg-slate-50 text-slate-500 hover:bg-blue-50"
                    ].join(" ")}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card tone="mint" className="p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💡</span>
          <p className="font-black text-ink">{notice}</p>
        </div>
      </Card>
    </div>
  );
}
