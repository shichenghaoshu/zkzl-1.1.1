import { Button } from "./Button";
import { Mascot } from "./Mascot";

type ErrorStateProps = {
  title: string;
  description: string;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
};

export function ErrorState({
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary
}: ErrorStateProps) {
  return (
    <section className="mx-auto flex min-h-[62vh] max-w-3xl flex-col items-center justify-center rounded-3xl border border-blue-100 bg-white/88 p-8 text-center shadow-xl shadow-blue-200/30">
      <Mascot size={150} label="课游" />
      <h1 className="mt-5 text-4xl font-black text-ink sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-xl text-lg font-bold leading-8 text-slate-700">{description}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={onPrimary}>{primaryLabel}</Button>
        <Button size="lg" variant="white" onClick={onSecondary}>{secondaryLabel}</Button>
      </div>
    </section>
  );
}
