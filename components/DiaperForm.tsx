"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import DateTimeField from "./DateTimeField";
import Segmented from "./Segmented";
import { useToast } from "./Toast";

type Amount = "small" | "medium" | "large";

export default function DiaperForm({
  initial,
}: {
  initial?: {
    id: number;
    pee: boolean;
    poop: boolean;
    poop_amount: Amount | null;
    happened_at: number;
    note: string | null;
  };
}) {
  const router = useRouter();
  const toast = useToast();
  const [pee, setPee] = useState<boolean>(initial?.pee ?? true);
  const [poop, setPoop] = useState<boolean>(initial?.poop ?? false);
  const [amount, setAmount] = useState<Amount>(initial?.poop_amount ?? "medium");
  const [at, setAt] = useState<number>(initial?.happened_at ?? Date.now());
  const [note, setNote] = useState<string>(initial?.note ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!pee && !poop) {
      toast.push("至少选择尿尿或便便", "err");
      return;
    }
    setSaving(true);
    try {
      const body = {
        pee,
        poop,
        poop_amount: poop ? amount : null,
        happened_at: at,
        note: note || null,
      };
      const url = initial ? `/api/diapers/${initial.id}` : "/api/diapers";
      const res = await fetch(url, {
        method: initial ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
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
        <div className="label">本次内容(可多选)</div>
        <div className="grid grid-cols-2 gap-3">
          <ToggleCard
            active={pee}
            onClick={() => setPee((v) => !v)}
            emoji="💧"
            label="尿尿"
            activeColor="sky"
          />
          <ToggleCard
            active={poop}
            onClick={() => setPoop((v) => !v)}
            emoji="💩"
            label="便便"
            activeColor="amber"
          />
        </div>
      </section>

      {poop && (
        <section>
          <div className="label">便便量</div>
          <Segmented<Amount>
            value={amount}
            onChange={setAmount}
            options={[
              { value: "small", label: "偏少", emoji: "·" },
              { value: "medium", label: "中等", emoji: "··" },
              { value: "large", label: "偏多", emoji: "···" },
            ]}
          />
        </section>
      )}

      <section>
        <div className="label">时间</div>
        <DateTimeField value={at} onChange={setAt} />
      </section>

      <section>
        <div className="label">备注</div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="例如:颜色偏绿、有奶瓣"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 text-base outline-none focus:border-brand-500"
        />
      </section>

      <div
        className="fixed inset-x-0 bottom-0 px-4 pt-2 bg-[var(--bg)]/95 backdrop-blur border-t border-[var(--border)]"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
      >
        <button
          onClick={save}
          disabled={saving || (!pee && !poop)}
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

function ToggleCard({
  active,
  onClick,
  emoji,
  label,
  activeColor,
}: {
  active: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
  activeColor: "sky" | "amber";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "tap rounded-2xl border-2 py-6 flex flex-col items-center justify-center gap-2 transition-colors",
        active
          ? activeColor === "sky"
            ? "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200"
            : "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
          : "border-[var(--border)] bg-[var(--card)] text-[var(--muted)]"
      )}
    >
      <span className="text-4xl leading-none">{emoji}</span>
      <span className="font-semibold text-base">{label}</span>
    </button>
  );
}
