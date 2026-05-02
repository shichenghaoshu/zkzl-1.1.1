import { useEffect, useRef, useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { DragClassifyGame } from "../components/DragClassifyGame";
import { GameMap } from "../components/GameMap";
import { ProgressBar } from "../components/ProgressBar";
import { QuizRaceGame } from "../components/QuizRaceGame";
import { getAnswerOnlyItems } from "../data/liveClassReport";
import { mockLesson, type Lesson, type Question, type Scene } from "../data/mockLessons";
import type { AppRoute } from "../data/routes";

type StudentPlayProps = {
  lesson: Lesson | null;
  student: { id: string; name: string } | null;
  onNavigate: (route: AppRoute) => void;
  onRecordAnswer: (levelIndex: number, correct: boolean, stars: number) => void;
  onViewReport: () => void;
};

export function StudentPlay({ lesson, student, onNavigate, onRecordAnswer, onViewReport }: StudentPlayProps) {
  const activeLesson = lesson ?? mockLesson;
  const levelCount = activeLesson.scenes.length;
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [stars, setStars] = useState(0);
  const [coins, setCoins] = useState(0);
  const [progress, setProgress] = useState(0);
  const [largeMode, setLargeMode] = useState(false);
  const rewardedLevelRef = useRef<Set<number>>(new Set());
  const activeScene = activeLevel === null ? null : activeLesson.scenes[activeLevel];
  const activeQuestion = activeScene?.questions[0];
  const loadFailed = activeLesson.scenes.length === 0;
  const mapLevels = activeLesson.scenes.map((scene, index) => ({
    id: scene.id,
    name: scene.title,
    stars: index < progress ? scene.rewards.stars : 0,
    status:
      index < progress
        ? "done"
        : index === progress
          ? "current"
          : "locked"
  })) satisfies Array<{ id: string; name: string; stars: number; status: "done" | "current" | "locked" }>;

  const reward = () => {
    if (activeLevel === null || rewardedLevelRef.current.has(activeLevel)) return;

    rewardedLevelRef.current.add(activeLevel);
    const earnedStars = activeScene?.rewards.stars ?? 3;
    setStars((value) => value + earnedStars);
    setCoins((value) => value + (activeScene?.rewards.coins ?? 20));
    setProgress((value) => Math.min(levelCount, Math.max(value, activeLevel + 1)));
    onRecordAnswer(activeLevel, true, earnedStars);
  };

  const nextLevel = () => {
    if (activeLevel === null) return;
    if (activeLevel >= levelCount - 1) {
      setActiveLevel(null);
      return;
    }
    setActiveLevel(activeLevel + 1);
  };

  useEffect(() => {
    document.body.classList.toggle("keyou-bigscreen", largeMode);
    return () => document.body.classList.remove("keyou-bigscreen");
  }, [largeMode]);

  if (loadFailed) {
    return (
      <div className="rounded-3xl bg-white/88 p-6 text-center shadow-xl">
        <h1 className="text-3xl font-black text-ink">课件加载失败，请检查链接或联系老师</h1>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={() => window.location.reload()}>重新加载</Button>
          <Button size="lg" variant="white" onClick={() => onNavigate("student")}>返回学生加入页</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={["student-play-page space-y-6", largeMode ? "student-play-large" : ""].join(" ")}>
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-skybrand sm:text-6xl">互动闯关课堂</h1>
          <p className="mt-3 text-xl font-bold text-ink">
            {activeLesson.title}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={largeMode ? "sun" : "white"}
            size="lg"
            onClick={() => setLargeMode((value) => !value)}
            aria-pressed={largeMode}
          >
            {largeMode ? "退出大屏模式" : "大屏模式"}
          </Button>
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 select-none items-center justify-center rounded-full bg-gradient-to-br from-sky-200 to-yellow-100 text-3xl" aria-hidden="true">
                🧒
              </span>
              <div>
                <p className="text-sm font-bold text-slate-700">昵称：{student?.name ?? "小星星"}</p>
                <p className="text-lg font-black text-ink">⭐ {stars} · 🪙 {coins}</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <Card className="p-4">
        <ProgressBar value={(progress / levelCount) * 100} label={`已完成 ${progress}/${levelCount} 关`} color="mint" />
      </Card>

      {activeLevel === null ? (
        <GameMap
          title={activeLesson.title}
          subtitle={`${activeLesson.grade} · ${activeLesson.subject} · ${activeLesson.gameMode}`}
          levels={mapLevels}
          completedCount={progress}
          onSelect={(levelIndex) => setActiveLevel(levelIndex)}
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
          <div>
            {activeLevel === 0 || activeLevel === 1 ? (
              <DragClassifyGame
                key={activeLevel}
                mode="student"
                config={buildDragConfig(activeScene, activeQuestion)}
                onComplete={reward}
                onNext={nextLevel}
              />
            ) : (
              <QuizRaceGame
                key={activeLevel}
                config={buildQuizConfig(activeQuestion)}
                onAnswer={(_, correct) => {
                  if (!correct) onRecordAnswer(activeLevel, false, 0);
                }}
                onSuccess={reward}
                onNext={nextLevel}
              />
            )}
          </div>
          <div className="space-y-5">
            <Card tone="sun">
              <h3 className="text-2xl font-black text-ink">闯关奖励</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-3xl bg-white/80 p-4 text-center">
                  <div className="text-4xl">⭐⭐⭐</div>
                  <p className="mt-2 font-black text-ink">获得 3 颗星</p>
                </div>
                <div className="rounded-3xl bg-white/80 p-4 text-center">
                  <div className="text-4xl">🪙</div>
                  <p className="mt-2 font-black text-ink">金币 +20</p>
                </div>
              </div>
            </Card>
            <Card tone="mint">
              <h3 className="text-2xl font-black text-ink">即时反馈</h3>
              <p className="mt-2 font-bold leading-7 text-slate-600">
                答对立即获得奖励，答错会给出温和提示和简单解析，帮助你再试一次。
              </p>
              <Button className="mt-5" fullWidth variant="secondary" onClick={() => setActiveLevel(null)}>
                返回地图
              </Button>
              <Button className="mt-3" fullWidth variant="mint" onClick={onViewReport}>
                完成课堂，查看报告
              </Button>
            </Card>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["关卡推进", "一路挑战更有目标", "🚀"],
          ["即时反馈", "答完马上知道结果", "⚡"],
          ["奖励激励", "星星金币驱动参与", "🎁"],
          ["高参与感", "课堂像一场小冒险", "😊"]
        ].map(([title, text, icon]) => (
          <Card key={title} className="p-4">
            <div className="flex items-center gap-3">
              <span className="select-none text-3xl" aria-hidden="true">{icon}</span>
              <div>
                <p className="font-black text-ink">{title}</p>
                <p className="text-sm font-bold text-slate-500">{text}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function buildDragConfig(scene: Scene | null | undefined, question: Question | undefined) {
  const answerItems = getAnswerOnlyItems(question);
  return {
    prompt: question?.prompt || scene?.description || "请选择正确答案。",
    categories: ["正确选项"],
    items: answerItems,
    answerMap: answerItems.reduce<Record<string, string>>((acc, option) => {
      acc[option] = "正确选项";
      return acc;
    }, {})
  };
}

function buildQuizConfig(question: Question | undefined) {
  const options = question?.options.length ? question.options : ["A", "B", "C", "D"];
  const answer = question?.answer && options.includes(question.answer) ? question.answer : options[0];

  return {
    prompt: question?.prompt || "请选择正确答案。",
    options,
    answer,
    explanation: question?.explanation
  };
}
