import { useEffect, useMemo, useState } from "react";
import { Button } from "./Button";
import { Card } from "./Card";

type MatchGameProps = {
  config?: {
    prompt: string;
    pairs: Array<{ left: string; right: string }>;
  };
  onComplete?: () => void;
  onNext?: () => void;
};

const defaultPairs = [
  { left: "1/2", right: "二分之一" },
  { left: "3/4", right: "四分之三" },
  { left: "1/4", right: "四分之一" },
  { left: "2/3", right: "三分之二" },
];

export function MatchGame({ config, onComplete, onNext }: MatchGameProps) {
  const pairs = config?.pairs.length ? config.pairs : defaultPairs;
  const pairsKey = useMemo(() => pairs.map((p) => `${p.left}:${p.right}`).join("|"), [pairs]);
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<[string, string] | null>(null);
  const [completed, setCompleted] = useState(false);

  const rightMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of pairs) m.set(p.left, p.right);
    return m;
  }, [pairs]);

  const leftMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of pairs) m.set(p.right, p.left);
    return m;
  }, [pairs]);

  const shuffledRight = useMemo(
    () => shuffleArray(pairs.map((p) => p.right)),
    [pairsKey]
  );

  const isComplete = matched.size === pairs.length * 2;

  useEffect(() => {
    setSelected(null);
    setMatched(new Set());
    setWrongPair(null);
    setCompleted(false);
  }, [pairsKey]);

  useEffect(() => {
    if (!isComplete || completed) return;
    setCompleted(true);
    onComplete?.();
  }, [completed, isComplete, onComplete]);

  const pickItem = (item: string, side: "left" | "right") => {
    if (matched.has(item) || isComplete) return;

    if (selected === null) {
      setSelected(item);
      setWrongPair(null);
      return;
    }

    const firstSide = pairs.some((p) => p.left === selected) ? "left" : "right";
    if (firstSide === side) {
      setSelected(item);
      setWrongPair(null);
      return;
    }

    const leftItem = firstSide === "left" ? selected : item;
    const rightItem = firstSide === "right" ? selected : item;

    if (rightMap.get(leftItem) === rightItem) {
      setMatched((prev) => {
        const next = new Set(prev);
        next.add(leftItem);
        next.add(rightItem);
        return next;
      });
      setSelected(null);
      setWrongPair(null);
    } else {
      setWrongPair([leftItem, rightItem]);
      setSelected(null);
    }
  };

  const reset = () => {
    setSelected(null);
    setMatched(new Set());
    setWrongPair(null);
    setCompleted(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-gradient-to-br from-pink-200 via-white to-sky-100 p-5 shadow-inner">
        <div className="mb-4 text-center">
          <h3 className="text-3xl font-black text-pink-600">配对挑战</h3>
          <p className="mx-auto mt-2 max-w-xl rounded-full bg-white/90 px-4 py-2 text-sm font-black text-ink shadow-md">
            {config?.prompt ?? "分别从左右两边各选一个，配成正确的一对。"}
          </p>
        </div>

        <p className="mb-3 text-center text-sm font-bold text-slate-500">
          已配对 {matched.size / 2} / {pairs.length} 对
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-center text-sm font-black text-slate-500">左侧</p>
            {pairs.map((p) => {
              const done = matched.has(p.left);
              const sel = selected === p.left;
              return (
                <button
                  key={p.left}
                  onClick={() => pickItem(p.left, "left")}
                  disabled={done}
                  className={[
                    "flex min-h-[52px] w-full items-center justify-center rounded-2xl border-2 px-4 text-lg font-black shadow-md transition-all",
                    done
                      ? "border-mintbrand bg-emerald-50 text-emerald-700 opacity-60"
                      : sel
                        ? "border-sunbrand bg-yellow-50 ring-4 ring-yellow-200"
                        : "border-blue-100 bg-white hover:-translate-y-0.5 hover:border-skybrand",
                    done ? "cursor-default" : "cursor-pointer"
                  ].join(" ")}
                >
                  {p.left}
                  {done && " ✅"}
                </button>
              );
            })}
          </div>
          <div className="space-y-2">
            <p className="text-center text-sm font-black text-slate-500">右侧</p>
            {shuffledRight.map((right) => {
              const done = matched.has(right);
              const sel = selected === right;
              const isWrong = wrongPair && wrongPair[1] === right;
              return (
                <button
                  key={right}
                  onClick={() => pickItem(right, "right")}
                  disabled={done}
                  className={[
                    "flex min-h-[52px] w-full items-center justify-center rounded-2xl border-2 px-4 text-lg font-black shadow-md transition-all",
                    done
                      ? "border-mintbrand bg-emerald-50 text-emerald-700 opacity-60"
                      : sel
                        ? "border-sunbrand bg-yellow-50 ring-4 ring-yellow-200"
                        : isWrong
                          ? "border-coralbrand bg-orange-50"
                          : "border-blue-100 bg-white hover:-translate-y-0.5 hover:border-skybrand",
                    done ? "cursor-default" : "cursor-pointer"
                  ].join(" ")}
                >
                  {right}
                  {done && " ✅"}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-3">
          <Button variant="ghost" size="sm" onClick={reset}>
            重新配对
          </Button>
        </div>
      </div>

      {isComplete && (
        <Card tone="mint" className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-black text-emerald-700">全部配对成功！</p>
              <p className="mt-1 font-bold text-slate-600">获得 {pairs.length} 对的星星奖励</p>
            </div>
            {onNext ? (
              <Button variant="mint" onClick={onNext}>
                下一关
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
