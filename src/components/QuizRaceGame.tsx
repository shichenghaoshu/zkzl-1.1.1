import { useState } from "react";
import { Button } from "./Button";
import { Card } from "./Card";

type QuizRaceGameProps = {
  config?: {
    prompt: string;
    options: string[];
    answer: string;
    explanation?: string;
  };
  onAnswer?: (option: string, correct: boolean) => void;
  onSuccess?: () => void;
  onNext?: () => void;
};

const options = ["A. 1/2", "B. 2/3", "C. 3/4", "D. 1/3"];
const correctAnswer = "C. 3/4";

export function QuizRaceGame({ config, onAnswer, onSuccess, onNext }: QuizRaceGameProps) {
  const activeOptions = config?.options.length ? config.options : options;
  const activeAnswer = config?.answer || correctAnswer;
  const activePrompt = config?.prompt || "下面哪个分数最大？";
  const activeExplanation = config?.explanation || "3/4 更接近 1，比 2/3、1/2、1/3 都大。";
  const [selected, setSelected] = useState<string | null>(null);
  const [hasSucceeded, setHasSucceeded] = useState(false);

  const choose = (option: string) => {
    setSelected(option);
    onAnswer?.(option, option === activeAnswer);
    if (option === activeAnswer && !hasSucceeded) {
      setHasSucceeded(true);
      onSuccess?.();
    }
  };

  const isWrong = selected !== null && selected !== activeAnswer;
  const isCorrect = selected === activeAnswer;

  return (
    <Card className="overflow-hidden p-0">
      <div className="bg-gradient-to-br from-emerald-400 via-sky-400 to-blue-500 p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white/80">竞速答题 · 第 3 / 5 题</p>
            <h3 className="mt-1 text-3xl font-black">{activePrompt}</h3>
          </div>
          <div className="rounded-2xl bg-white/22 px-4 py-2 text-xl font-black">⏱️ 00:18</div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/28">
          <div className="h-full w-2/3 rounded-full bg-white" />
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2">
        {activeOptions.map((option) => {
          const active = selected === option;
          const correct = option === activeAnswer && isCorrect;
          return (
            <button
              key={option}
              onClick={() => choose(option)}
              className={[
                "flex min-h-20 items-center justify-between rounded-3xl border-2 bg-white px-5 text-left text-2xl font-black shadow-md transition-all hover:-translate-y-1",
                active && correct
                  ? "border-mintbrand bg-emerald-50 text-emerald-700 ring-4 ring-emerald-100"
                  : active
                    ? "border-coralbrand bg-orange-50 text-coralbrand ring-4 ring-orange-100"
                    : "border-blue-100 text-ink"
              ].join(" ")}
            >
              {option}
              <span>{active && correct ? "✅" : active ? "💡" : "⭐"}</span>
            </button>
          );
        })}
      </div>

      <div className="px-5 pb-5">
        {isCorrect ? (
          <Card tone="mint" className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-2xl font-black text-emerald-700">闯关成功！</p>
                <p className="mt-1 font-bold text-slate-600">获得 3 颗星 ⭐⭐⭐ · 金币 +20 🪙</p>
              </div>
              {onNext ? (
                <Button variant="mint" onClick={onNext}>
                  下一关
                </Button>
              ) : null}
            </div>
          </Card>
        ) : null}

        {isWrong ? (
          <Card tone="coral" className="p-4">
            <p className="text-xl font-black text-coralbrand">再试一次</p>
            <p className="mt-1 font-bold text-slate-600">
              解析：{activeExplanation}
            </p>
          </Card>
        ) : null}
      </div>
    </Card>
  );
}
