import { useEffect, useMemo, useState } from "react";
import { Button } from "./Button";
import { Card } from "./Card";

type OrderingGameProps = {
  config?: {
    prompt: string;
    items: string[];
    correctOrder: string[];
  };
  onComplete?: () => void;
  onNext?: () => void;
};

const defaultItems = ["1/4", "1/2", "3/4", "1"];
const defaultCorrect = ["1/4", "1/2", "3/4", "1"];

export function OrderingGame({ config, onComplete, onNext }: OrderingGameProps) {
  const sourceItems = config?.items.length ? config.items : defaultItems;
  const correctOrder = config?.correctOrder.length ? config.correctOrder : defaultCorrect;
  const orderKey = useMemo(
    () => `${sourceItems.join("|")}::${correctOrder.join("|")}`,
    [correctOrder, sourceItems]
  );

  const [items, setItems] = useState(() => shuffleArray([...sourceItems]));
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    setItems(shuffleArray([...sourceItems]));
    setDragIndex(null);
    setSubmitted(false);
    setIsCorrect(false);
  }, [orderKey]);

  const pick = (idx: number) => {
    if (submitted) return;
    if (dragIndex === null) {
      setDragIndex(idx);
    } else if (dragIndex === idx) {
      setDragIndex(null);
    } else {
      const next = [...items];
      [next[dragIndex], next[idx]] = [next[idx], next[dragIndex]];
      setItems(next);
      setDragIndex(null);
    }
  };

  const submit = () => {
    const correct = items.every((item, i) => item === correctOrder[i]);
    setIsCorrect(correct);
    setSubmitted(true);
    if (correct) onComplete?.();
  };

  const reset = () => {
    setItems(shuffleArray([...sourceItems]));
    setDragIndex(null);
    setSubmitted(false);
    setIsCorrect(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-gradient-to-br from-violet-200 via-white to-sky-100 p-5 shadow-inner">
        <div className="mb-4 text-center">
          <h3 className="text-3xl font-black text-violet-700">排序挑战</h3>
          <p className="mx-auto mt-2 max-w-xl rounded-full bg-white/90 px-4 py-2 text-sm font-black text-ink shadow-md">
            {config?.prompt ?? "把选项按正确顺序排列：先点一个，再点另一个交换位置。"}
          </p>
        </div>

        <div className="mx-auto flex max-w-md flex-col gap-3">
          {items.map((item, idx) => {
            const selected = dragIndex === idx;
            const correctPos = submitted && item === correctOrder[idx];
            const wrongPos = submitted && item !== correctOrder[idx];
            return (
              <button
                key={`${item}-${idx}`}
                onClick={() => pick(idx)}
                disabled={submitted}
                className={[
                  "flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left text-xl font-black shadow-md transition-all",
                  selected
                    ? "border-sunbrand bg-yellow-50 ring-4 ring-yellow-200"
                    : correctPos
                      ? "border-mintbrand bg-emerald-50"
                      : wrongPos
                        ? "border-coralbrand bg-orange-50"
                        : "border-blue-100 bg-white hover:-translate-y-0.5 hover:border-skybrand",
                  submitted ? "cursor-default" : "cursor-pointer"
                ].join(" ")}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-skybrand to-mintbrand text-lg font-black text-white">
                  {idx + 1}
                </span>
                <span className="flex-1">{item}</span>
                {submitted && <span>{correctPos ? "✅" : "❌"}</span>}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex justify-center gap-3">
          <Button variant="ghost" size="sm" onClick={reset}>
            重新排列
          </Button>
          {!submitted && (
            <Button variant="primary" size="sm" onClick={submit}>
              确认排序
            </Button>
          )}
        </div>
      </div>

      {submitted && (
        <Card tone={isCorrect ? "mint" : "coral"} className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className={`text-2xl font-black ${isCorrect ? "text-emerald-700" : "text-coralbrand"}`}>
                {isCorrect ? "排序正确！" : "顺序不对，再试试"}
              </p>
              {!isCorrect && (
                <p className="mt-1 font-bold text-slate-600">
                  正确顺序：{correctOrder.join(" → ")}
                </p>
              )}
            </div>
            {isCorrect && onNext ? (
              <Button variant="mint" onClick={onNext}>
                下一关
              </Button>
            ) : !isCorrect ? (
              <Button variant="coral" size="sm" onClick={reset}>
                重来
              </Button>
            ) : null}
          </div>
        </Card>
      )}
    </div>
  );
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
