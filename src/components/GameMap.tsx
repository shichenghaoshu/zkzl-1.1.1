type GameLevel = {
  id: string;
  name: string;
  stars: number;
  status: "done" | "current" | "locked";
};

type GameMapProps = {
  title?: string;
  subtitle?: string;
  levels?: GameLevel[];
  completedCount?: number;
  onSelect: (levelIndex: number) => void;
};

const levels: GameLevel[] = [
  { id: "level-1", name: "初识分数", stars: 3, status: "done" },
  { id: "level-2", name: "分数的意义", stars: 3, status: "done" },
  { id: "level-3", name: "分数的比较", stars: 2, status: "done" },
  { id: "level-4", name: "分数的加减法", stars: 2, status: "current" },
  { id: "level-5", name: "分数应用挑战", stars: 0, status: "locked" }
];

export function GameMap({
  title = "分数王国大冒险",
  subtitle = "闯关学分数，成为分数小达人！",
  levels: customLevels,
  completedCount = 4,
  onSelect
}: GameMapProps) {
  const activeLevels = customLevels?.length ? customLevels : levels;

  return (
    <section className="game-card min-h-[520px] bg-gradient-to-br from-sky-200 via-blue-100 to-emerald-100 p-5">
      <div className="absolute inset-0 soft-grid opacity-30" />
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 basis-full sm:basis-auto">
            <h2 className="max-w-full break-all text-2xl font-black leading-tight text-white drop-shadow-[0_3px_0_rgba(47,123,255,0.55)] sm:text-5xl">
              {title}
            </h2>
            <p className="mt-2 inline-flex max-w-full break-all rounded-full bg-white/88 px-4 py-2 text-xs font-black text-skybrand shadow-md sm:text-base">
              {subtitle}
            </p>
          </div>
          <div className="rounded-3xl bg-white/88 px-4 py-3 text-right shadow-lg">
            <div className="text-sm font-bold text-slate-500">已完成</div>
            <div className="text-2xl font-black text-mintbrand">{completedCount}/{activeLevels.length} 关</div>
          </div>
        </div>

        <div className="relative mt-4 min-h-[380px] overflow-hidden rounded-3xl bg-gradient-to-b from-sky-300 to-emerald-200 p-5 shadow-inner">
          <div className="map-path" />
          <div className="absolute left-8 top-10 text-7xl drop-shadow-lg">🏰</div>
          <div className="absolute bottom-10 right-10 text-6xl drop-shadow-lg">🎁</div>
          <div className="absolute right-20 top-14 text-5xl animate-pulse-star">⭐</div>
          <div className="absolute bottom-8 left-16 text-5xl">🪙</div>

          <div className="relative z-10 grid min-h-[330px] grid-cols-2 gap-4 pt-20 sm:grid-cols-5 sm:items-end">
            {activeLevels.map((level, index) => (
              <button
                key={level.id}
                onClick={() => level.status !== "locked" && onSelect(index)}
                disabled={level.status === "locked"}
                className={[
                  "group flex flex-col items-center gap-2 rounded-3xl p-3 transition-all",
                  index % 2 === 0 ? "self-start" : "self-end",
                  level.status === "locked"
                    ? "opacity-70"
                    : "hover:-translate-y-2 hover:scale-[1.02]"
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-16 w-16 items-center justify-center rounded-full border-4 border-white text-2xl font-black text-white shadow-xl",
                    level.status === "current"
                      ? "bg-gradient-to-br from-coralbrand to-sunbrand"
                      : level.status === "done"
                        ? "bg-gradient-to-br from-skybrand to-mintbrand"
                        : "bg-slate-400"
                  ].join(" ")}
                >
                  {level.status === "locked" ? "🔒" : index + 1}
                </span>
                <span className="rounded-2xl bg-white/92 px-3 py-2 text-center text-sm font-black text-ink shadow-lg">
                  {level.name}
                </span>
                <span className="rounded-full bg-white/78 px-3 py-1 text-sm">
                  {"⭐".repeat(level.stars)}
                  {level.stars < 3 ? "☆".repeat(3 - level.stars) : ""}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
