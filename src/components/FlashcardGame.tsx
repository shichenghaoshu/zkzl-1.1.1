import { useEffect, useMemo, useState } from "react";
import { Button } from "./Button";
import { Card } from "./Card";

type FlashcardGameProps = {
  config?: {
    prompt: string;
    cards: Array<{ front: string; back: string }>;
  };
  onComplete?: () => void;
  onNext?: () => void;
};

const defaultCards = [
  { front: "1/2", back: "把一个整体平均分成 2 份，取其中 1 份" },
  { front: "3/4", back: "把一个整体平均分成 4 份，取其中 3 份" },
  { front: "分子", back: "分数线上面的数，表示取了几份" },
  { front: "分母", back: "分数线下面的数，表示平均分成几份" },
];

export function FlashcardGame({ config, onComplete, onNext }: FlashcardGameProps) {
  const cards = config?.cards.length ? config.cards : defaultCards;
  const cardsKey = useMemo(() => cards.map((card) => `${card.front}:${card.back}`).join("|"), [cards]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  const current = cards[index];

  useEffect(() => {
    setIndex(0);
    setFlipped(false);
    setDone(false);
  }, [cardsKey]);

  const flip = () => setFlipped((v) => !v);

  const next = () => {
    if (index < cards.length - 1) {
      setIndex((i) => i + 1);
      setFlipped(false);
    } else if (!done) {
      setDone(true);
      onComplete?.();
    }
  };

  const prev = () => {
    if (index > 0) {
      setIndex((i) => i - 1);
      setFlipped(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-gradient-to-br from-amber-200 via-white to-sky-100 p-5 shadow-inner">
        <div className="mb-4 text-center">
          <h3 className="text-3xl font-black text-skybrand">翻卡学习</h3>
          <p className="mx-auto mt-2 max-w-xl rounded-full bg-white/90 px-4 py-2 text-sm font-black text-ink shadow-md">
            {config?.prompt ?? "点击卡片翻转，查看背面解释。"}
          </p>
        </div>

        <p className="mb-3 text-center text-sm font-bold text-slate-500">
          第 {index + 1} / {cards.length} 张
        </p>

        <button
          onClick={flip}
          className="mx-auto flex min-h-[220px] w-full max-w-md cursor-pointer items-center justify-center rounded-3xl border-2 border-blue-100 bg-white p-6 text-center shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl"
          aria-label={flipped ? "点击翻回正面" : "点击翻转查看背面"}
        >
          {flipped ? (
            <p className="text-xl font-black leading-8 text-ink">{current.back}</p>
          ) : (
            <p className="text-5xl font-black text-skybrand">{current.front}</p>
          )}
        </button>

        <p className="mt-3 text-center text-sm font-bold text-slate-400">
          {flipped ? "点击卡片翻回正面" : "点击卡片查看解释"}
        </p>

        <div className="mt-4 flex justify-center gap-3">
          <Button variant="ghost" size="sm" onClick={prev} disabled={index === 0}>
            上一张
          </Button>
          <Button variant="secondary" size="sm" onClick={flip}>
            翻转
          </Button>
          <Button variant="mint" size="sm" onClick={next}>
            {index < cards.length - 1 ? "下一张" : done ? "已完成" : "完成"}
          </Button>
        </div>
      </div>

      {done && (
        <Card tone="mint" className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-black text-emerald-700">翻卡完成！</p>
              <p className="mt-1 font-bold text-slate-600">获得 {cards.length} 张卡片的星星奖励</p>
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
