"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fmtDuration, fmtRelative } from "@/lib/time";

type Summary = {
  feed: { count: number; bottle_ml: number; breast_s: number; bottle_count: number; breast_count: number };
  diaper: { count: number; pee: number; poop: number };
  pump: { count: number; total_ml: number; total_s: number };
  lastFeedAt: number | null;
  lastDiaperAt: number | null;
  lastPumpAt: number | null;
};

type StatTab = "feed" | "diaper" | "pump";

function Stat({
  label,
  value,
  sub,
  onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap text-left rounded-2xl bg-[var(--card)] border border-[var(--border)] px-3 py-3 flex-1 active:scale-[0.98] transition"
    >
      <div className="text-xs text-[var(--muted)]">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular leading-none">{value}</div>
      {sub && <div className="mt-1 text-xs text-[var(--muted)]">{sub}</div>}
    </button>
  );
}

export default function TodaySummary() {
  const router = useRouter();
  const [data, setData] = useState<Summary | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    async function load() {
      const res = await fetch("/api/today", { cache: "no-store" });
      if (!res.ok) return;
      const j = (await res.json()) as Summary;
      if (alive) setData(j);
    }
    load();
    const i = setInterval(load, 30_000);
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => {
      alive = false;
      clearInterval(i);
      clearInterval(t);
    };
  }, []);

  if (!data) {
    return <div className="h-32 rounded-2xl bg-[var(--card)] border border-[var(--border)] animate-pulse" />;
  }

  const breastMin = Math.round(data.feed.breast_s / 60);
  const go = (tab: StatTab) => router.push(`/history?tab=${tab}`);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Stat
          label="今日喂奶"
          value={data.feed.count}
          sub={`瓶 ${data.feed.bottle_count} · 亲 ${data.feed.breast_count}`}
          onClick={() => go("feed")}
        />
        <Stat label="瓶喂总量" value={`${data.feed.bottle_ml}`} sub="ml" onClick={() => go("feed")} />
      </div>
      <div className="flex gap-2">
        <Stat label="亲喂时长" value={breastMin} sub="分钟" onClick={() => go("feed")} />
        <Stat
          label="今日尿布"
          value={data.diaper.count}
          sub={`尿 ${data.diaper.pee} · 便 ${data.diaper.poop}`}
          onClick={() => go("diaper")}
        />
      </div>
      <div className="flex gap-2">
        <Stat
          label="今日吸奶"
          value={`${data.pump.total_ml}`}
          sub={`ml · ${data.pump.count} 次`}
          onClick={() => go("pump")}
        />
        <Stat
          label="吸奶时长"
          value={Math.round(data.pump.total_s / 60)}
          sub="分钟"
          onClick={() => go("pump")}
        />
      </div>
      <div className="flex gap-2 text-sm">
        <div className="flex-1 rounded-xl bg-[var(--card)] border border-[var(--border)] px-3 py-2">
          上次喂奶:
          <span className="ml-1 text-[var(--muted)]">
            {data.lastFeedAt ? fmtRelative(data.lastFeedAt) : "暂无"}
          </span>
        </div>
        <div className="flex-1 rounded-xl bg-[var(--card)] border border-[var(--border)] px-3 py-2">
          上次尿布:
          <span className="ml-1 text-[var(--muted)]">
            {data.lastDiaperAt ? fmtRelative(data.lastDiaperAt) : "暂无"}
          </span>
        </div>
      </div>
      <div className="flex gap-2 text-sm">
        <div className="flex-1 rounded-xl bg-[var(--card)] border border-[var(--border)] px-3 py-2">
          上次吸奶:
          <span className="ml-1 text-[var(--muted)]">
            {data.lastPumpAt ? fmtRelative(data.lastPumpAt) : "暂无"}
          </span>
        </div>
      </div>
      {data.lastFeedAt && (
        <div className="text-center text-xs text-[var(--muted)]">
          距上次喂奶 {fmtDuration(Math.floor((Date.now() - data.lastFeedAt) / 1000))}
        </div>
      )}
    </div>
  );
}
