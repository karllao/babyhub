"use client";

import { useMemo } from "react";
import { dayjs } from "@/lib/time";

export default function DateTimeField({
  value,
  onChange,
}: {
  value: number;
  onChange: (ts: number) => void;
}) {
  const dateStr = useMemo(() => dayjs(value).format("YYYY-MM-DD"), [value]);
  const timeStr = useMemo(() => dayjs(value).format("HH:mm"), [value]);

  function setDate(d: string) {
    if (!d) return;
    const ts = dayjs(`${d}T${timeStr}`).valueOf();
    if (!isNaN(ts)) onChange(ts);
  }

  function setTime(t: string) {
    if (!t) return;
    const ts = dayjs(`${dateStr}T${t}`).valueOf();
    if (!isNaN(ts)) onChange(ts);
  }

  return (
    <div className="flex gap-2">
      <input
        type="date"
        value={dateStr}
        onChange={(e) => setDate(e.target.value)}
        className="flex-[3] min-w-0 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 text-base tabular outline-none focus:border-brand-500"
      />
      <input
        type="time"
        value={timeStr}
        onChange={(e) => setTime(e.target.value)}
        className="flex-[2] min-w-0 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 text-base tabular text-center outline-none focus:border-brand-500"
      />
      <button
        type="button"
        onClick={() => onChange(Date.now())}
        className="tap shrink-0 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--muted)] active:bg-brand-50 dark:active:bg-brand-900/30"
        aria-label="重置为现在"
      >
        现在
      </button>
    </div>
  );
}
