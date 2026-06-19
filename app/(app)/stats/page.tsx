"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import clsx from "clsx";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Bucket = {
  date: string;
  feedCount: number;
  bottleMl: number;
  breastMin: number;
  pee: number;
  poop: number;
};

export default function StatsPage() {
  const [days, setDays] = useState<7 | 30>(7);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stats?days=${days}`)
      .then((r) => r.json())
      .then((j: { buckets: Bucket[] }) => setBuckets(j.buckets))
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <>
      <PageHeader title="统计" />
      <main className="px-4 pb-6 max-w-md mx-auto space-y-5">
        <div className="flex gap-2">
          {([7, 30] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={clsx(
                "tap flex-1 rounded-xl py-2 text-sm font-medium border",
                days === d
                  ? "bg-brand-500 text-white border-brand-500"
                  : "border-[var(--border)] bg-[var(--card)]"
              )}
            >
              近 {d} 天
            </button>
          ))}
        </div>

        {loading && <div className="text-center text-[var(--muted)] text-sm py-4">加载中…</div>}

        <ChartCard title="每日瓶喂总量 (ml)">
          <BarChart data={buckets} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
            <Bar dataKey="bottleMl" name="瓶喂量" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="每日亲喂时长 (分钟)">
          <BarChart data={buckets} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
            <Bar dataKey="breastMin" name="亲喂分钟" fill="#ec4899" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="每日尿布次数">
          <BarChart data={buckets} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="pee" name="尿尿" stackId="d" fill="#38bdf8" />
            <Bar dataKey="poop" name="便便" stackId="d" fill="#a16207" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
      </main>
    </>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-3">
      <div className="text-sm font-medium mb-2 pl-1">{title}</div>
      <div style={{ width: "100%", height: 180 }}>
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </div>
  );
}
