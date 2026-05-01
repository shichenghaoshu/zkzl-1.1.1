import { Card } from "../components/Card";
import { DataChart } from "../components/DataChart";

export function ClassReport() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-4xl font-black text-skybrand sm:text-6xl">班级数据报告</h1>
        <p className="mt-3 text-xl font-bold text-ink">
          老师实时看结果，课后沉淀班级学习反馈
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["参与人数", "38 人", "👥", "blue"],
          ["完成率", "92%", "✅", "mint"],
          ["平均正确率", "84%", "🎯", "sun"],
          ["最受欢迎关卡", "第 2 关", "👑", "violet"]
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

      <DataChart />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card tone="coral">
          <h2 className="text-2xl font-black text-skybrand">薄弱知识点</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {["分数大小比较", "图形识别"].map((item) => (
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
            建议下次增加第2关练习，复习分数大小比较。系统会自动沉淀课后数据报告，帮助老师定位班级共性问题。
          </p>
        </Card>
      </div>
    </div>
  );
}
