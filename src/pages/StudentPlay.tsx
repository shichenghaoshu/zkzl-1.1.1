import { useRef, useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { DragClassifyGame } from "../components/DragClassifyGame";
import { GameMap } from "../components/GameMap";
import { ProgressBar } from "../components/ProgressBar";
import { QuizRaceGame } from "../components/QuizRaceGame";
import type { AppRoute } from "../data/routes";

type StudentPlayProps = {
  onNavigate: (route: AppRoute) => void;
  onViewReport: () => void;
};

export function StudentPlay({ onNavigate, onViewReport }: StudentPlayProps) {
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [stars, setStars] = useState(125);
  const [coins, setCoins] = useState(860);
  const [progress, setProgress] = useState(4);
  const rewardedLevelRef = useRef<Set<number>>(new Set());

  const reward = () => {
    if (activeLevel === null || rewardedLevelRef.current.has(activeLevel)) return;

    rewardedLevelRef.current.add(activeLevel);
    setStars((value) => value + 3);
    setCoins((value) => value + 20);
    setProgress((value) => Math.min(5, Math.max(value, activeLevel + 1)));
  };

  const nextLevel = () => {
    if (activeLevel === null) return;
    if (activeLevel >= 3) {
      setActiveLevel(null);
      return;
    }
    setActiveLevel(activeLevel + 1);
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-skybrand sm:text-6xl">学生端游戏课件页</h1>
          <p className="mt-3 text-xl font-bold text-ink">
            一节课就是一场小冒险，孩子边玩边学
          </p>
        </div>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-200 to-yellow-100 text-3xl">
              🧒
            </span>
            <div>
              <p className="text-sm font-bold text-slate-500">昵称：小星星</p>
              <p className="text-lg font-black text-ink">⭐ {stars} · 🪙 {coins}</p>
            </div>
          </div>
        </Card>
      </section>

      <Card className="p-4">
        <ProgressBar value={(progress / 5) * 100} label={`已完成 ${progress}/5 关`} color="mint" />
      </Card>

      {activeLevel === null ? (
        <GameMap onSelect={(levelIndex) => setActiveLevel(levelIndex)} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
          <div>
            {activeLevel === 0 || activeLevel === 1 ? (
              <DragClassifyGame key={activeLevel} mode="student" onComplete={reward} onNext={nextLevel} />
            ) : (
              <QuizRaceGame key={activeLevel} onSuccess={reward} onNext={nextLevel} />
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
              <span className="text-3xl">{icon}</span>
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
