import type { ReportSummary } from "../data/liveClassReport";
import { Card } from "./Card";

type ChartProps = {
  summary: ReportSummary;
};

export function AccuracyBarChart({ summary }: ChartProps) {
  return (
    <Card className="min-h-[340px]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-skybrand">各关卡正确率</h3>
          <p className="text-sm font-semibold text-slate-500">实时识别薄弱环节</p>
        </div>
        <span className="text-3xl">👑</span>
      </div>
      <div className="flex h-56 items-end gap-4 rounded-3xl bg-gradient-to-b from-blue-50 to-white px-5 py-4">
        {summary.levelAccuracy.map((item) => (
          <div key={item.name} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <div className="text-sm font-black text-slate-700">{item.value}%</div>
            <div className="relative flex h-[150px] w-full items-end justify-center">
              <div className="absolute inset-x-0 top-1/4 border-t border-dashed border-blue-100" />
              <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-blue-100" />
              <div
                className="bar-shine w-full max-w-14 rounded-t-2xl shadow-lg"
                style={{
                  height: `${item.value}%`,
                  background: `linear-gradient(180deg, ${item.color}, ${item.color}cc)`
                }}
              />
            </div>
            <div className="text-xs font-bold text-slate-500 sm:text-sm">{item.name}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ParticipationDonut({ summary }: ChartProps) {
  const gradient = `conic-gradient(${summary.participation
    .map((item, index) => {
      const start = summary.participation.slice(0, index).reduce((sum, segment) => sum + segment.percent, 0);
      const end = start + item.percent;
      return `${item.color} ${start}% ${end}%`;
    })
    .join(", ")})`;
  const visibleGradient = summary.participants > 0 ? gradient : "conic-gradient(#CBD5E1 0% 100%)";

  return (
    <Card className="min-h-[340px]">
      <h3 className="text-xl font-black text-skybrand">参与状态</h3>
      <p className="text-sm font-semibold text-slate-500">学生点链接即参与，无需下载 App</p>
      <div className="mt-7 grid gap-6 sm:grid-cols-[180px_1fr] sm:items-center">
        <div
          className="mx-auto flex h-44 w-44 items-center justify-center rounded-full shadow-lg shadow-emerald-200/50"
          style={{ background: visibleGradient }}
        >
          <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
            <span className="text-4xl font-black text-ink">{summary.participants}</span>
            <span className="text-sm font-bold text-slate-500">总人数</span>
          </div>
        </div>
        <div className="space-y-4">
          {summary.participation.map((item) => (
            <div key={item.name} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
              <span className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: item.color }}
                />
                {item.name}
              </span>
              <span className="text-sm font-black text-ink">
                {item.count}人（{item.percent}%）
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function Leaderboard({ summary }: ChartProps) {
  return (
    <Card className="min-h-[340px]">
      <h3 className="text-xl font-black text-skybrand">课堂之星排行榜</h3>
      <p className="text-sm font-semibold text-slate-500">奖励激励，提高课堂参与感</p>
      <div className="mt-6 space-y-4">
        {summary.students.length ? (
          summary.students.slice(0, 3).map((student, index) => (
            <div
              key={student.id}
              className="flex items-center justify-between rounded-3xl bg-gradient-to-r from-blue-50 to-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-md">
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                </span>
                <span>
                  <span className="block text-lg font-black text-ink">{student.name}</span>
                  <span className="text-xs font-bold text-slate-500">
                    ⭐ {student.stars} · 进度 {student.progress}/{summary.levelCount}
                  </span>
                </span>
              </div>
              <span className="text-2xl font-black text-skybrand">{student.score}分</span>
            </div>
          ))
        ) : (
          <div className="rounded-3xl bg-blue-50 p-5 text-center">
            <p className="text-lg font-black text-ink">还没有学生作答</p>
            <p className="mt-2 text-sm font-bold text-slate-600">学生加入并完成关卡后，这里会自动更新。</p>
          </div>
        )}
      </div>
    </Card>
  );
}

export function DataChart({ summary }: ChartProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr_0.9fr]">
      <AccuracyBarChart summary={summary} />
      <ParticipationDonut summary={summary} />
      <Leaderboard summary={summary} />
    </div>
  );
}
