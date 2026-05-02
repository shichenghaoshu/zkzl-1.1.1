import type { CSSProperties } from "react";

type MascotProps = {
  size?: number;
  className?: string;
  label?: string;
};

export function Mascot({ size = 148, className = "", label = "AI" }: MascotProps) {
  return (
    <div
      className={["mascot-wrap animate-bounce-soft", className].join(" ")}
      style={{ "--mascot-size": `${size}px` } as CSSProperties}
      aria-label="课游AI小熊助手"
      role="img"
    >
      <div className="mascot-ear mascot-ear-left" />
      <div className="mascot-ear mascot-ear-right" />
      <div className="mascot-head">
        <div className="mascot-headset" />
        <div className="mascot-eye mascot-eye-left" />
        <div className="mascot-eye mascot-eye-right" />
        <div className="mascot-smile" />
      </div>
      <div className="mascot-body">
        <div className="mascot-badge">{label}</div>
      </div>
      <div className="mascot-wand" />
    </div>
  );
}
