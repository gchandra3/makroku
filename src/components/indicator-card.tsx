import { Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Sparkline } from "@/components/charts";
import type { Indicator } from "@/lib/macro-data";
import { cn } from "@/lib/utils";

export function ChangePill({ change, className }: { change: number; className?: string }) {
  const up = change >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular",
        up ? "bg-primary-soft text-accent-foreground" : "bg-secondary text-negative",
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {up ? "+" : ""}
      {change.toFixed(1)}%
    </span>
  );
}

export function IndicatorCard({ indicator }: { indicator: Indicator }) {
  return (
    <Link
      to="/indicators/$indicatorId"
      params={{ indicatorId: indicator.id }}
      className="surface-card flex items-center gap-3 px-4 py-3.5 transition-transform active:scale-[0.99]"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold">{indicator.name}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-extrabold tabular">
            {indicator.value}
            {indicator.unit}
          </span>
          <ChangePill change={indicator.change} />
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Updated {indicator.updated} · {indicator.frequency}
        </p>
      </div>
      <div className="h-10 w-20 shrink-0">
        <Sparkline data={indicator.series.slice(-20)} negative={indicator.change < 0} />
      </div>
    </Link>
  );
}
