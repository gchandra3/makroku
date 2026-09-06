import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, Home, LineChart, Lightbulb, Search, Settings, Sparkles, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Home", mobileLabel: "Home", icon: Home },
  { to: "/analyze", label: "Analyze", mobileLabel: "Analyze", icon: Sparkles },
  { to: "/data", label: "Data", mobileLabel: "Data", icon: BarChart3 },
  { to: "/predictions", label: "Predictions", mobileLabel: "Predict", icon: TrendingUp },
  { to: "/insights", label: "Insights", mobileLabel: "Insights", icon: Lightbulb },
] as const;

function isActive(path: string, to: string) {
  return to === "/" ? path === "/" : path.startsWith(to);
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 lg:px-6">
          <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <LineChart className="h-4 w-4" strokeWidth={2.6} />
            </span>
            <span className="text-[15px]">MacroCast</span>
          </Link>

          <Link
            to="/data"
            className="ml-auto flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 sm:max-w-md"
          >
            <Search className="h-4 w-4" />
            <span className="truncate">Search economic indicators…</span>
          </Link>

          <Link
            to="/profile"
            aria-label="Profile and settings"
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-card transition-colors hover:border-primary/40",
              path.startsWith("/profile") && "border-primary/50 text-primary",
            )}
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px]">
        {/* Desktop sidebar */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 border-r border-border px-3 py-5 lg:block">
          <nav>
            <ul className="space-y-1">
              {nav.map(({ to, label, icon: Icon }) => {
                const active = isActive(path, to);
                return (
                  <li key={to}>
                    <Link
                      to={to}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                        active
                          ? "bg-primary-soft text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 1.9} />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-6 border-t border-border pt-4">
            <Link
              to="/profile"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Settings className="h-[18px] w-[18px]" strokeWidth={1.9} />
              Settings
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-24 lg:pb-12">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md lg:hidden">
        <ul className="mx-auto flex w-full max-w-md items-stretch justify-between px-2 py-1.5">
          {nav.map(({ to, mobileLabel, icon: Icon }) => {
            const active = isActive(path, to);
            return (
              <li key={to} className="flex-1">
                <Link
                  to={to}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-xl py-1 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                      active && "bg-primary-soft",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 1.8} />
                  </span>
                  {mobileLabel}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-4xl px-4 py-5 lg:max-w-5xl lg:px-8 lg:py-8">{children}</div>;
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[22px] font-extrabold tracking-tight lg:text-[28px]">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-xl text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
