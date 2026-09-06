import { Link } from "@tanstack/react-router";
import { Sparkline } from "@/components/charts";
import { Delta } from "@/components/ui-kit";
import { formatValue, latest, type Indicator } from "@/lib/econ-data";

export function IndicatorCard({ indicator, onUse }: { indicator: Indicator; onUse?: () => void }) {
  const l = latest(indicator);
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold">{indicator.name}</p>
          <p className="text-[12px] text-muted-foreground">
            {indicator.country} · {indicator.category}
          </p>
        </div>
        <div className="text-right">
          <p className="tabular text-[20px] font-extrabold leading-none">
            {formatValue(indicator, l.value)}
            <span className="ml-1 text-[12px] font-semibold text-muted-foreground">{indicator.unit}</span>
          </p>
          <div className="mt-1.5">
            <Delta value={l.changeYoY} />
          </div>
        </div>
      </div>

      <div className="mt-2">
        <Sparkline data={indicator.series.slice(-24)} negative={l.changeYoY < 0} height={38} />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          {indicator.frequency} · {l.period} · {indicator.source}
        </p>
        <div className="flex items-center gap-2">
          <Link
            to="/data/$indicatorId"
            params={{ indicatorId: indicator.id }}
            className="rounded-lg px-2 py-1 text-[12px] font-bold text-muted-foreground hover:text-foreground"
          >
            View data
          </Link>
          {onUse ? (
            <button
              type="button"
              onClick={onUse}
              className="rounded-lg bg-primary-soft px-2.5 py-1 text-[12px] font-bold text-primary"
            >
              Use in analysis
            </button>
          ) : (
            <Link
              to="/analyze"
              search={{ target: indicator.id }}
              className="rounded-lg bg-primary-soft px-2.5 py-1 text-[12px] font-bold text-primary"
            >
              Use in analysis
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
