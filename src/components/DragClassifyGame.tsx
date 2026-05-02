import { useEffect, useMemo, useState } from "react";
import { Button } from "./Button";
import { Card } from "./Card";

type DragMode = "editor" | "student";

type DragClassifyGameProps = {
  mode?: DragMode;
  config?: DragConfig;
  onComplete?: () => void;
  onNext?: () => void;
};

type DragConfig = {
  prompt: string;
  categories: string[];
  items: string[];
  answerMap: Record<string, string>;
};

const configs: Record<DragMode, DragConfig> = {
  editor: {
    prompt: "把下面的分数拖到对应的分类中吧！",
    categories: ["真分数", "假分数 / 带分数"],
    items: ["1/2", "3/4", "5/4", "7/3", "2 1/3"],
    answerMap: {
      "1/2": "真分数",
      "3/4": "真分数",
      "5/4": "假分数 / 带分数",
      "7/3": "假分数 / 带分数",
      "2 1/3": "假分数 / 带分数"
    }
  },
  student: {
    prompt: "将分数拖到对应的图形中",
    categories: ["二分之一", "四分之三"],
    items: ["1/2", "2/4", "3/4"],
    answerMap: {
      "1/2": "二分之一",
      "2/4": "二分之一",
      "3/4": "四分之三"
    }
  }
};

export function DragClassifyGame({ mode = "editor", config: customConfig, onComplete, onNext }: DragClassifyGameProps) {
  const config = customConfig ?? configs[mode];
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("先点一个选项，再点正确选项框，就像拖拽一样。");
  const [completed, setCompleted] = useState(false);

  const grouped = useMemo(
    () =>
      config.categories.reduce<Record<string, string[]>>((acc, category) => {
        acc[category] = Object.entries(placements)
          .filter(([, placedCategory]) => placedCategory === category)
          .map(([item]) => item);
        return acc;
      }, {}),
    [config.categories, placements]
  );

  const remainingItems = config.items.filter((item) => !placements[item]);
  const isComplete = remainingItems.length === 0;

  useEffect(() => {
    if (isComplete && !completed) {
      setCompleted(true);
      setFeedback("太棒了，全部分类正确！获得星星奖励 ⭐⭐⭐");
      onComplete?.();
    }
  }, [completed, isComplete, onComplete]);

  const placeItem = (category: string) => {
    if (!selectedItem) {
      setFeedback("先选择一个选项卡片哦。");
      return;
    }

    if (config.answerMap[selectedItem] === category) {
      setPlacements((current) => ({ ...current, [selectedItem]: category }));
      setSelectedItem(null);
      setFeedback(`答对啦！${selectedItem} 属于「${category}」。`);
      return;
    }

    setFeedback("再想一想哦");
  };

  const reset = () => {
    setSelectedItem(null);
    setPlacements({});
    setCompleted(false);
    setFeedback("先点一个选项，再点正确选项框，就像拖拽一样。");
  };

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.prompt, config.items.join("|"), config.categories.join("|")]);

  return (
    <div className="space-y-4">
      <div
        className={[
          "rounded-3xl p-5 shadow-inner",
          mode === "student"
            ? "bg-gradient-to-br from-sky-200 via-white to-emerald-100"
            : "bg-gradient-to-b from-sky-300 to-emerald-200"
        ].join(" ")}
      >
        <div className="mb-4 text-center">
          <h3
            className={[
              "font-black",
              mode === "student"
                ? "text-3xl text-skybrand"
                : "text-4xl text-white drop-shadow-[0_3px_0_rgba(47,123,255,0.45)]"
            ].join(" ")}
          >
            {mode === "student" ? "拖拽分类" : "分数闯关"}
          </h3>
          <p className="mx-auto mt-2 max-w-xl rounded-full bg-white/90 px-4 py-2 text-sm font-black text-ink shadow-md">
            {config.prompt}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {config.categories.map((category) => (
            <button
              key={category}
              onClick={() => placeItem(category)}
              className={[
                "min-h-36 rounded-3xl border-4 border-dashed bg-white/88 p-4 text-left shadow-lg transition-all hover:-translate-y-1",
                category.includes("真") || category.includes("二") || category.includes("正确")
                  ? "border-mintbrand"
                  : "border-coralbrand"
              ].join(" ")}
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={[
                    "rounded-2xl px-4 py-2 text-lg font-black text-white",
                    category.includes("真") || category.includes("二") || category.includes("正确")
                      ? "bg-mintbrand"
                      : "bg-coralbrand"
                  ].join(" ")}
                >
                  {category}
                </span>
                <span className="text-2xl">⭐</span>
              </div>
              <div className="flex min-h-16 flex-wrap gap-2">
                {grouped[category]?.length ? (
                  grouped[category].map((item) => (
                    <span
                      key={item}
                      className="rounded-2xl bg-white px-4 py-3 text-xl font-black text-ink shadow-md"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-sm font-bold text-slate-500">点击这里放入正确选项</span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {config.items.map((item) => {
            const placed = Boolean(placements[item]);
            return (
              <button
                key={item}
                onClick={() => !placed && setSelectedItem(item)}
                disabled={placed}
                className={[
                  "min-h-14 min-w-20 rounded-2xl border-2 bg-white px-5 text-2xl font-black shadow-lg transition-all",
                  selectedItem === item
                    ? "border-sunbrand ring-4 ring-yellow-200"
                    : "border-blue-100 hover:-translate-y-1 hover:border-skybrand",
                  placed ? "opacity-35" : ""
                ].join(" ")}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      <Card tone={isComplete ? "mint" : feedback === "再想一想哦" ? "coral" : "blue"} className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-500">即时反馈</p>
            <p className="text-lg font-black text-ink">{feedback}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={reset}>
              重来一次
            </Button>
            {isComplete && onNext ? (
              <Button variant="mint" size="sm" onClick={onNext}>
                下一关
              </Button>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  );
}
