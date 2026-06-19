"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import NumberStepper from "./NumberStepper";
import DateTimeField from "./DateTimeField";
import { fmtDuration } from "@/lib/time";
import { useToast } from "./Toast";

const PRESETS = [60, 100, 120, 150];
const DURATION_PRESETS = [10, 15, 20, 30];

export default function PumpForm({
  initial,
}: {
  initial?: {
    id: number;
    started_at: number;
    ended_at: number;
    amount_ml: number;
    note: string | null;
  };
}) {
  const router = useRouter();
  const toast = useToast();
  const now = Date.now();
  const defaultStart = now - 15 * 60 * 1000;
  const [startedAt, setStartedAt] = useState<number>(initial?.started_at ?? defaultStart);
  const [endedAt, setEndedAt] = useState<number>(initial?.ended_at ?? now);
  const [ml, setMl] = useState<number>(initial?.amount_ml ?? 100);
  const [note, setNote] = useState<string>(initial?.note ?? "");
  const [saving, setSaving] = useState(false);

  const durationSec = useMemo(() => Math.max(0, Math.floor((endedAt - startedAt) / 1000)), [startedAt, endedAt]);
  const invalid = endedAt < startedAt;

  function applyDurationMinutes(min: number) {
    setEndedAt(startedAt + min * 60 * 1000);
  }

  async function save() {
    if (invalid) {
      toast.push("结束时间不能早于开始时间", "err");
      return;
    }
    setSaving(true);
    try {
      const url = initial ? `/api/pumps/${initial.id}` : "/api/pumps";
      const res = await fetch(url, {
        method: initial ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          started_at: startedAt,
          ended_at: endedAt,
          amount_ml: ml,
          note: note || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.push(j.error || "保存失败", "err");
        return;
      }
      toast.push("已记录 ✓");
      router.push("/");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-4 pt-2 pb-32 space-y-6 max-w-md mx-auto">
      <section>
        <div className="label">奶量</div>
        <NumberStepper value={ml} onChange={setMl} step={5} min={0} max={500} suffix="ml" />
        <div className="grid grid-cols-4 gap-2 mt-3">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setMl(p)}
              className={`tap rounded-xl border border-[var(--border)] py-2 text-sm tabular ${
                ml === p ? "bg-brand-500 text-white border-brand-500" : "bg-[var(--card)]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="label">开始时间</div>
        <DateTimeField value={startedAt} onChange={setStartedAt} />
      </section>

      <section>
        <div className="label">结束时间</div>
        <DateTimeField value={endedAt} onChange={setEndedAt} />
        <div className="grid grid-cols-4 gap-2 mt-3">
          {DURATION_PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => applyDurationMinutes(m)}
              className="tap rounded-xl border border-[var(--border)] bg-[var(--card)] py-2 text-sm"
            >
              +{m}分
            </button>
          ))}
        </div>
        <div className={`mt-2 text-sm pl-1 ${invalid ? "text-red-500" : "text-[var(--muted)]"}`}>
          {invalid ? "结束时间早于开始时间" : `时长 ${fmtDuration(durationSec)}`}
        </div>
      </section>

      <section>
        <div className="label">备注</div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="例如:左侧 / 右侧 / 双侧"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 text-base outline-none focus:border-brand-500"
        />
      </section>

      <div
        className="fixed inset-x-0 bottom-0 px-4 pt-2 bg-[var(--bg)]/95 backdrop-blur border-t border-[var(--border)]"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
      >
        <button
          onClick={save}
          disabled={saving || invalid}
          className="tap w-full rounded-2xl bg-brand-500 text-white py-4 text-lg font-semibold active:bg-brand-600 disabled:opacity-50"
        >
          {saving ? "保存中…" : initial ? "保存修改" : "保存记录"}
        </button>
      </div>

      <style jsx>{`
        .label {
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 8px;
          padding-left: 4px;
        }
      `}</style>
    </div>
  );
}
