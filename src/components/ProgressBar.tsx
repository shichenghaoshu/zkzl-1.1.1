type ProgressBarProps = {
  value: number;
  label?: string;
  color?: "blue" | "mint" | "sun" | "violet" | "coral";
};

const colors = {
  blue: "from-skybrand to-blue-400",
  mint: "from-mintbrand to-emerald-400",
  sun: "from-sunbrand to-orange-400",
  violet: "from-violetbrand to-purple-400",
  coral: "from-coralbrand to-pink-400"
};

export function ProgressBar({ value, label, color = "blue" }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className="space-y-2">
      {label ? (
        <div className="flex items-center justify-between text-sm font-bold text-slate-600">
          <span>{label}</span>
          <span>{Math.round(safeValue)}%</span>
        </div>
      ) : null}
      <div className="h-3 overflow-hidden rounded-full bg-blue-100">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colors[color]} transition-all duration-500 bar-shine`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
