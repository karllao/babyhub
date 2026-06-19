"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import RecordCard, { RecordItem } from "@/components/RecordCard";
import { dayjs, fmtDay } from "@/lib/time";
import { useToast } from "@/components/Toast";
import clsx from "clsx";

type Filter = "all" | "feed" | "diaper" | "pump";

const VALID_FILTERS: Filter[] = ["all", "feed", "diaper", "pump"];

export default function HistoryPage() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialFilter = (() => {
    const t = searchParams?.get("tab");
    return (VALID_FILTERS as string[]).includes(t || "") ? (t as Filter) : "all";
  })();
  const [day, setDay] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [items, setItems] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);

  const since = dayjs(day).startOf("day").valueOf();
  const until = dayjs(day).endOf("day").valueOf();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all: RecordItem[] = [];
      if (filter === "all" || filter === "feed") {
        const r = await fetch(`/api/feeds?since=${since}&until=${until}&limit=500`, { cache: "no-store" });
        const j = await r.json();
        for (const f of j.items as Array<{
          id: number;
          method: "bottle" | "breast";
          content: "formula" | "breastmilk" | null;
          amount_ml: number | null;
          side: "left" | "right" | "both" | null;
          duration_s: number | null;
          started_at: number;
          note: string | null;
        }>) {
          all.push({
            kind: "feed",
            id: f.id,
            method: f.method,
            content: f.content,
            amount_ml: f.amount_ml,
            side: f.side,
            duration_s: f.duration_s,
            ts: f.started_at,
            note: f.note,
          });
        }
      }
      if (filter === "all" || filter === "diaper") {
        const r = await fetch(`/api/diapers?since=${since}&until=${until}&limit=500`, { cache: "no-store" });
        const j = await r.json();
        for (const d of j.items as Array<{
          id: number;
          pee: number;
          poop: number;
          poop_amount: "small" | "medium" | "large" | null;
          happened_at: number;
          note: string | null;
        }>) {
          all.push({
            kind: "diaper",
            id: d.id,
            pee: !!d.pee,
            poop: !!d.poop,
            poop_amount: d.poop_amount,
            ts: d.happened_at,
            note: d.note,
          });
        }
      }
      if (filter === "all" || filter === "pump") {
        const r = await fetch(`/api/pumps?since=${since}&until=${until}&limit=500`, { cache: "no-store" });
        const j = await r.json();
        for (const p of j.items as Array<{
          id: number;
          started_at: number;
          ended_at: number;
          amount_ml: number;
          note: string | null;
        }>) {
          all.push({
            kind: "pump",
            id: p.id,
            amount_ml: p.amount_ml,
            started_at: p.started_at,
            ended_at: p.ended_at,
            ts: p.started_at,
            note: p.note,
          });
        }
      }
      all.sort((a, b) => b.ts - a.ts);
      setItems(all);
    } finally {
      setLoading(false);
    }
  }, [since, until, filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function doDelete(item: RecordItem) {
    if (!confirm("确认删除这条记录?")) return;
    const url =
      item.kind === "feed"
        ? `/api/feeds/${item.id}`
        : item.kind === "diaper"
        ? `/api/diapers/${item.id}`
        : `/api/pumps/${item.id}`;
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) {
      toast.push("已删除");
      setItems((s) => s.filter((x) => !(x.kind === item.kind && x.id === item.id)));
    } else {
      toast.push("删除失败", "err");
    }
  }

  const grouped = useMemo(() => {
    const map = new Map<string, RecordItem[]>();
    for (const it of items) {
      const d = fmtDay(it.ts);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(it);
    }
    return Array.from(map.entries());
  }, [items]);

  return (
    <>
      <PageHeader title="历史记录" />
      <main className="px-4 pb-6 max-w-md mx-auto">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setDay(dayjs(day).subtract(1, "day").format("YYYY-MM-DD"))}
            aria-label="前一天"
            className="tap rounded-xl border border-[var(--border)] bg-[var(--card)] px-2 flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="flex-1 min-w-0 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-base tabular outline-none focus:border-brand-500"
          />
          <button
            onClick={() => setDay(dayjs(day).add(1, "day").format("YYYY-MM-DD"))}
            aria-label="后一天"
            disabled={dayjs(day).isSame(dayjs(), "day")}
            className="tap rounded-xl border border-[var(--border)] bg-[var(--card)] px-2 flex items-center justify-center disabled:opacity-40"
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={() => setDay(dayjs().format("YYYY-MM-DD"))}
            className="tap rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm"
          >
            今天
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {(["all", "feed", "diaper", "pump"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "tap flex-1 rounded-xl py-2 text-sm font-medium border",
                filter === f
                  ? "bg-brand-500 text-white border-brand-500"
                  : "border-[var(--border)] bg-[var(--card)]"
              )}
            >
              {f === "all" ? "全部" : f === "feed" ? "喂奶" : f === "diaper" ? "尿布" : "吸奶"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-[var(--muted)] py-8 text-sm">加载中…</div>
        ) : items.length === 0 ? (
          <div className="text-center text-[var(--muted)] py-12 text-sm">这一天还没有记录</div>
        ) : (
          <div className="space-y-5">
            {grouped.map(([d, list]) => (
              <div key={d}>
                <div className="text-xs text-[var(--muted)] mb-2 pl-1">{d}</div>
                <div className="space-y-2">
                  {list.map((it) => (
                    <RecordCard key={`${it.kind}-${it.id}`} item={it} onDelete={doDelete} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
