import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "mint"
  | "sun"
  | "coral"
  | "ghost"
  | "white";

type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-skybrand to-blue-500 text-white shadow-lg shadow-blue-300/40 hover:-translate-y-0.5 hover:shadow-xl",
  secondary:
    "bg-blue-50 text-skybrand ring-1 ring-blue-100 hover:bg-blue-100 hover:-translate-y-0.5",
  mint:
    "bg-gradient-to-r from-mintbrand to-emerald-400 text-white shadow-lg shadow-emerald-200/60 hover:-translate-y-0.5",
  sun:
    "bg-gradient-to-r from-sunbrand to-orange-400 text-white shadow-lg shadow-yellow-200/70 hover:-translate-y-0.5",
  coral:
    "bg-gradient-to-r from-coralbrand to-pink-400 text-white shadow-lg shadow-orange-200/60 hover:-translate-y-0.5",
  ghost:
    "bg-white/50 text-ink ring-1 ring-slate-200 hover:bg-white hover:-translate-y-0.5",
  white:
    "bg-white text-skybrand ring-1 ring-blue-100 shadow-md shadow-blue-100/70 hover:-translate-y-0.5 hover:shadow-lg"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-10 px-4 text-base",
  md: "min-h-12 px-5 text-base",
  lg: "min-h-14 px-7 text-lg"
};

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  fullWidth = false,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
