import { Card } from "../components/Card";
import { DataChart } from "../components/DataChart";
import { getReportSummary, type LiveClassReport } from "../data/liveClassReport";

type ClassReportProps = {
  report: LiveClassReport;
};

export function ClassReport({ report }: ClassReportProps) {
  const summary = getReportSummary(report);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-4xl font-black text-skybrand sm:text-6xl">班级数据报告</h1>
        <p className="mt-3 text-xl font-bold text-ink">
          {report.className} · {report.lessonTitle} · 老师实时看结果
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["参与人数", `${summary.participants} 人`, "👥", "blue"],
          ["完成率", `${summary.completionRate}%`, "✅", "mint"],
          ["平均正确率", `${summary.averageAccuracy}%`, "🎯", "sun"],
          ["最受欢迎关卡", summary.favoriteLevel, "👑", "violet"]
        ].map(([title, value, icon, tone]) => (
          <Card key={title} tone={tone as "blue" | "mint" | "sun" | "violet"}>
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-3xl shadow-lg">
                {icon}
              </span>
              <div>
                <p className="text-sm font-black text-slate-500">{title}</p>
                <p className="mt-1 text-4xl font-black text-ink">{value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <DataChart summary={summary} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card tone="coral">
          <h2 className="text-2xl font-black text-skybrand">薄弱知识点</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {summary.weakestLevels.map((item) => (
              <span
                key={item}
                className="rounded-2xl bg-white px-5 py-3 text-lg font-black text-coralbrand shadow-md"
              >
                {item}
              </span>
            ))}
          </div>
        </Card>
        <Card tone="blue">
          <h2 className="text-2xl font-black text-skybrand">老师建议</h2>
          <p className="mt-4 text-lg font-bold leading-8 text-slate-700">
            {summary.participants > 0
              ? `当前已有 ${summary.participants} 名学生参与，平均正确率 ${summary.averageAccuracy}%。建议优先关注「${summary.weakestLevels[0]}」，课后可针对这一关补充讲解或再生成一组练习。`
              : "学生加入课堂并完成关卡后，报告会自动更新参与人数、正确率、完成率和排行榜。"}
          </p>
        </Card>
      </div>
    </div>
  );
}
