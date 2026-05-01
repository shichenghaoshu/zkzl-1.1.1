import type { HTMLAttributes, ReactNode } from "react";

type CardTone = "white" | "blue" | "mint" | "sun" | "violet" | "coral";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  tone?: CardTone;
};

const toneClasses: Record<CardTone, string> = {
  white: "bg-white/86 border-white/80",
  blue: "bg-gradient-to-br from-blue-50/95 to-white/90 border-blue-100",
  mint: "bg-gradient-to-br from-emerald-50/95 to-white/90 border-emerald-100",
  sun: "bg-gradient-to-br from-yellow-50/95 to-white/90 border-yellow-100",
  violet: "bg-gradient-to-br from-violet-50/95 to-white/90 border-violet-100",
  coral: "bg-gradient-to-br from-orange-50/95 to-white/90 border-orange-100"
};

export function Card({ children, className = "", tone = "white", ...props }: CardProps) {
  return (
    <div
      className={[
        "rounded-3xl border p-5 shadow-lg shadow-blue-200/30 backdrop-blur-md",
        toneClasses[tone],
        className
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
