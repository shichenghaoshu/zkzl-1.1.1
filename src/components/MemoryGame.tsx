import { useEffect, useMemo, useState } from "react";
import { Button } from "./Button";
import { Card } from "./Card";

type MemoryGameProps = {
  config?: {
    prompt: string;
    pairs: Array<{ left: string; right: string }>;
  };
  onComplete?: () => void;
  onNext?: () => void;
};

const defaultPairs = [
  { left: "1/2", right: "50%" },
  { left: "3/4", right: "75%" },
  { left: "1/4", right: "25%" },
  { left: "1", right: "100%" },
];

export function MemoryGame({ config, onComplete, onNext }: MemoryGameProps) {
  const pairs = config?.pairs.length ? config.pairs : defaultPairs;
  const pairsKey = useMemo(() => pairs.map((p) => `${p.left}:${p.right}`).join("|"), [pairs]);

  const cards = useMemo(() => {
    const items: Array<{ id: string; text: string; pairKey: string }> = [];
    for (const p of pairs) {
      items.push({ id: `l-${p.left}`, text: p.left, pairKey: p.left });
      items.push({ id: `r-${p.right}`, text: p.right, pairKey: p.left });
    }
    return shuffleArray(items);
  }, [pairsKey]);

  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [lock, setLock] = useState(false);
  const [firstPick, setFirstPick] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const isComplete = matched.size === cards.length;

  useEffect(() => {
    setFlipped(new Set());
    setMatched(new Set());
    setFirstPick(null);
    setLock(false);
    setCompleted(false);
  }, [pairsKey]);

  useEffect(() => {
    if (!isComplete || completed) return;
    setCompleted(true);
    onComplete?.();
  }, [completed, isComplete, onComplete]);

  const flipCard = (id: string, pairKey: string) => {
    if (lock || flipped.has(id) || matched.has(id)) return;

    const nextFlipped = new Set(flipped);
    nextFlipped.add(id);
    setFlipped(nextFlipped);

    if (firstPick === null) {
      setFirstPick(id);
      return;
    }

    const firstCard = cards.find((c) => c.id === firstPick);
    if (!firstCard) {
      setFirstPick(id);
      return;
    }

    if (firstCard.pairKey === pairKey && firstPick !== id) {
      const nextMatched = new Set(matched);
      nextMatched.add(firstPick);
      nextMatched.add(id);
      setMatched(nextMatched);
      setFirstPick(null);
    } else {
      setLock(true);
      setTimeout(() => {
        setFlipped((prev) => {
          const next = new Set(prev);
          next.delete(firstPick!);
          next.delete(id);
          return next;
        });
        setFirstPick(null);
        setLock(false);
      }, 800);
    }
  };

  const reset = () => {
    setFlipped(new Set());
    setMatched(new Set());
    setFirstPick(null);
    setLock(false);
    setCompleted(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-200 via-white to-amber-100 p-5 shadow-inner">
        <div className="mb-4 text-center">
          <h3 className="text-3xl font-black text-emerald-700">记忆翻牌</h3>
          <p className="mx-auto mt-2 max-w-xl rounded-full bg-white/90 px-4 py-2 text-sm font-black text-ink shadow-md">
            {config?.prompt ?? "翻开两张卡片，找到配对的一组。"}
          </p>
        </div>

        <p className="mb-3 text-center text-sm font-bold text-slate-500">
          已配对 {matched.size / 2} / {pairs.length} 对
        </p>

        <div className="mx-auto grid max-w-lg grid-cols-4 gap-3">
          {cards.map((card) => {
            const show = flipped.has(card.id) || matched.has(card.id);
            const done = matched.has(card.id);
            return (
              <button
                key={card.id}
                onClick={() => flipCard(card.id, card.pairKey)}
                className={[
                  "flex min-h-[80px] items-center justify-center rounded-2xl border-2 p-3 text-center text-lg font-black shadow-md transition-all",
                  done
                    ? "border-mintbrand bg-emerald-50 text-emerald-700"
                    : show
                      ? "border-skybrand bg-blue-50 text-skybrand"
                      : "border-blue-100 bg-gradient-to-br from-skybrand to-violetbrand text-white hover:-translate-y-0.5",
                  done || show ? "cursor-default" : "cursor-pointer"
                ].join(" ")}
              >
                {show ? card.text : "?"}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex justify-center gap-3">
          <Button variant="ghost" size="sm" onClick={reset}>
            重新开始
          </Button>
        </div>
      </div>

      {isComplete && (
        <Card tone="mint" className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-black text-emerald-700">全部翻开！</p>
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
