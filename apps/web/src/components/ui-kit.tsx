import { AlertTriangle, Check, Info, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] lg:p-5", className)}>
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  hint,
  right,
}: {
  title: string;
  hint?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-base font-bold tracking-tight">{title}</h2>
        {hint ? <p className="mt-0.5 text-[13px] text-muted-foreground">{hint}</p> : null}
      </div>
      {right}
    </div>
  );
}

/** Accessible term explainer — keyboard focusable, no color-only meaning. */
export function InfoTip({ term, children }: { term: string; children: string }) {
  return (
    <span className="group relative inline-flex items-center gap-1 align-middle">
      <button
        type="button"
        aria-label={`What is ${term}?`}
        className="grid h-4 w-4 place-items-center rounded-full border border-border text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Info className="h-2.5 w-2.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-xl border border-border bg-popover p-3 text-[12px] font-normal leading-relaxed text-popover-foreground opacity-0 shadow-[var(--shadow-float)] transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        <strong className="block pb-1 font-semibold">{term}</strong>
        {children}
      </span>
    </span>
  );
}

export function MetricCard({
  label,
  value,
  sub,
  tip,
}: {
  label: string;
  value: string;
  sub?: string;
  tip?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
        {tip ? <InfoTip term={label}>{tip}</InfoTip> : null}
      </div>
      <div className="tabular mt-1.5 text-[26px] font-extrabold leading-none tracking-tight">{value}</div>
      {sub ? <div className="mt-1 text-[12px] text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

export function Delta({ value, unit = "" }: { value: number; unit?: string }) {
  const up = value > 0;
  const flat = Math.abs(value) < 0.005;
  return (
    <span
      className={cn(
        "tabular inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-bold",
        flat ? "bg-muted text-muted-foreground" : up ? "bg-primary-soft text-primary" : "bg-negative/10 text-negative",
      )}
    >
      {flat ? "→" : up ? "↑" : "↓"} {Math.abs(value).toFixed(2)}
      {unit}
    </span>
  );
}

export function Chip({
  active,
  children,
  onClick,
  ...rest
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Button({
  variant = "primary",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-primary text-primary-foreground hover:opacity-90",
        variant === "outline" && "border border-border bg-card hover:border-primary/40",
        variant === "ghost" && "text-muted-foreground hover:bg-secondary hover:text-foreground",
        className,
      )}
      {...rest}
    />
  );
}

export function Warning({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <div className="min-w-0">
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  );
}

export function ErrorState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-negative/30 bg-negative/5 p-5">
      <p className="text-sm font-bold text-negative">{title}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
      <p className="text-sm font-bold">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-muted-foreground">{body}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

const RUN_STEPS = [
  "Preparing datasets",
  "Aligning time periods",
  "Estimating regression",
  "Testing model assumptions",
  "Generating insights",
];

export function LoadingState({ step }: { step: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <ul className="space-y-2">
        {RUN_STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2.5 text-[13px]">
            {i < step ? (
              <Check className="h-4 w-4 text-primary" />
            ) : i === step ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <span className="h-4 w-4 rounded-full border border-border" />
            )}
            <span className={i <= step ? "font-semibold" : "text-muted-foreground"}>{s}…</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const runStepCount = RUN_STEPS.length;

export function SignificanceTag({ significant }: { significant: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
        significant ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground",
      )}
    >
      {significant ? "Significant ✓" : "Not significant"}
    </span>
  );
}
