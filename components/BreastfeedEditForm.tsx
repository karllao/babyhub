"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Segmented from "./Segmented";
import DateTimeField from "./DateTimeField";
import { useToast } from "./Toast";
import { fmtDuration } from "@/lib/time";

type Side = "left" | "right" | "both";

export default function BreastfeedEditForm({
  id,
  duration_s,
  side,
  started_at,
  note,
}: {
  id: number;
  duration_s: number;
  side: Side;
  started_at: number;
  note: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [s, setS] = useState<Side>(side);
  const [dur, setDur] = useState<number>(Math.max(1, Math.round(duration_s / 60)));
  const [at, setAt] = useState<number>(started_at);
  const [n, setN] = useState<string>(note ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/feeds/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ side: s, duration_s: dur * 60, started_at: at, note: n || null }),
      });
      if (!res.ok) {
        toast.push("保存失败", "err");
        return;
      }
      toast.push("已保存");
      router.push("/history");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-4 pt-2 pb-32 space-y-6 max-w-md mx-auto">
      <section>
        <div className="text-xs text-[var(--muted)] mb-2 pl-1">哺乳侧</div>
        <Segmented<Side>
          value={s}
          onChange={setS}
          options={[
            { value: "left", label: "左侧" },
            { value: "right", label: "右侧" },
            { value: "both", label: "两侧" },
          ]}
        />
      </section>

      <section>
        <div className="text-xs text-[var(--muted)] mb-2 pl-1">时长(分钟)</div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDur((v) => Math.max(1, v - 1))}
            className="tap w-12 h-12 rounded-full border border-[var(--border)] bg-[var(--card)]"
          >
            −
          </button>
          <div className="flex-1 text-center">
            <div className="text-4xl font-bold tabular">{dur}</div>
            <div className="text-xs text-[var(--muted)] mt-1">{fmtDuration(dur * 60)}</div>
          </div>
          <button
            type="button"
            onClick={() => setDur((v) => Math.min(360, v + 1))}
            className="tap w-12 h-12 rounded-full border border-[var(--border)] bg-[var(--card)]"
          >
            +
          </button>
        </div>
      </section>

      <section>
        <div className="text-xs text-[var(--muted)] mb-2 pl-1">开始时间</div>
        <DateTimeField value={at} onChange={setAt} />
      </section>

      <section>
        <div className="text-xs text-[var(--muted)] mb-2 pl-1">备注</div>
        <input
          value={n}
          onChange={(e) => setN(e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 outline-none focus:border-brand-500"
        />
      </section>

      <div
        className="fixed inset-x-0 bottom-0 px-4 pt-2 bg-[var(--bg)]/95 backdrop-blur border-t border-[var(--border)]"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
      >
        <button
          onClick={save}
          disabled={saving}
          className="tap w-full rounded-2xl bg-brand-500 text-white py-4 text-lg font-semibold disabled:opacity-50"
        >
          {saving ? "保存中…" : "保存修改"}
        </button>
      </div>
    </div>
  );
}
