import { useCallback, useEffect, useState } from "react";
import type { AnalysisResult } from "@/lib/analysis.functions";

const KEY = "macrocast.analyses.v1";

export type SavedAnalysis = AnalysisResult & { savedAt: string; note?: string | undefined };

function read(): SavedAnalysis[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as SavedAnalysis[];
  } catch {
    return [];
  }
}

function write(list: SavedAnalysis[]) {
  window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, 30)));
  window.dispatchEvent(new Event("macrocast:analyses"));
}

export function useSavedAnalyses() {
  const [items, setItems] = useState<SavedAnalysis[]>([]);

  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    window.addEventListener("macrocast:analyses", sync);
    return () => window.removeEventListener("macrocast:analyses", sync);
  }, []);

  const save = useCallback((result: AnalysisResult, note?: string) => {
    const list = read().filter((a) => a.id !== result.id);
    write([{ ...result, savedAt: new Date().toISOString(), note }, ...list]);
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((a) => a.id !== id));
  }, []);

  return { items, save, remove };
}

export function latestAnalysis(): SavedAnalysis | undefined {
  return read()[0];
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
