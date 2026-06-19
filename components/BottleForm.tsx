"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NumberStepper from "./NumberStepper";
import Segmented from "./Segmented";
import DateTimeField from "./DateTimeField";
import { useToast } from "./Toast";

type Content = "formula" | "breastmilk";

const PRESETS = [60, 90, 120, 150];

export default function BottleForm({
  defaultContent = "formula",
  initial,
}: {
  defaultContent?: Content;
  initial?: {
    id: number;
    content: Content;
    amount_ml: number;
    started_at: number;
    note: string | null;
  };
}) {
  const router = useRouter();
  const toast = useToast();
  const [content, setContent] = useState<Content>(initial?.content ?? defaultContent);
  const [ml, setMl] = useState<number>(initial?.amount_ml ?? 60);
  const [at, setAt] = useState<number>(initial?.started_at ?? Date.now());
  const [note, setNote] = useState<string>(initial?.note ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const body = {
        method: "bottle" as const,
        content,
        amount_ml: ml,
        started_at: at,
        note: note || null,
      };
      const url = initial ? `/api/feeds/${initial.id}` : "/api/feeds";
      const res = await fetch(url, {
        method: initial ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(initial ? { content, amount_ml: ml, started_at: at, note: note || null } : body),
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
        <div className="label">奶瓶内容</div>
        <Segmented<Content>
          size="lg"
          value={content}
          onChange={setContent}
          options={[
            { value: "formula", label: "奶粉", emoji: "🥛" },
            { value: "breastmilk", label: "母乳", emoji: "🍼" },
          ]}
        />
      </section>

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
        <div className="label">时间</div>
        <DateTimeField value={at} onChange={setAt} />
      </section>

      <section>
        <div className="label">备注</div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="例如:吐了一点、吃得很急"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 text-base outline-none focus:border-brand-500"
        />
      </section>

      <div
        className="fixed inset-x-0 bottom-0 px-4 pt-2 bg-[var(--bg)]/95 backdrop-blur border-t border-[var(--border)]"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
      >
        <button
          onClick={save}
          disabled={saving || ml <= 0}
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
