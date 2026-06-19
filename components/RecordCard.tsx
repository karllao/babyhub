"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { fmtTime, fmtDuration } from "@/lib/time";

export type RecordItem =
  | {
      kind: "feed";
      id: number;
      method: "bottle" | "breast";
      content: "formula" | "breastmilk" | null;
      amount_ml: number | null;
      side: "left" | "right" | "both" | null;
      duration_s: number | null;
      ts: number;
      note: string | null;
    }
  | {
      kind: "diaper";
      id: number;
      pee: boolean;
      poop: boolean;
      poop_amount: "small" | "medium" | "large" | null;
      ts: number;
      note: string | null;
    }
  | {
      kind: "pump";
      id: number;
      amount_ml: number;
      started_at: number;
      ended_at: number;
      ts: number;
      note: string | null;
    };

const amountText: Record<string, string> = { small: "偏少", medium: "中等", large: "偏多" };

export default function RecordCard({
  item,
  onDelete,
}: {
  item: RecordItem;
  onDelete: (item: RecordItem) => void;
}) {
  const editHref =
    item.kind === "feed"
      ? `/history/edit/feed/${item.id}`
      : item.kind === "diaper"
      ? `/history/edit/diaper/${item.id}`
      : `/history/edit/pump/${item.id}`;

  let icon = "";
  let title = "";
  let detail = "";

  if (item.kind === "feed") {
    if (item.method === "bottle") {
      icon = item.content === "formula" ? "🥛" : "🍼";
      title = item.content === "formula" ? "瓶喂奶粉" : "瓶喂母乳";
      detail = `${item.amount_ml ?? 0} ml`;
    } else {
      icon = "🤱";
      title = "亲喂";
      const sideText = item.side === "both" ? "左右" : item.side === "left" ? "左侧" : "右侧";
      detail = `${sideText} · ${fmtDuration(item.duration_s ?? 0)}`;
    }
  } else if (item.kind === "diaper") {
    icon = item.pee && item.poop ? "💧💩" : item.poop ? "💩" : "💧";
    title = item.pee && item.poop ? "尿尿 + 便便" : item.poop ? "便便" : "尿尿";
    detail = item.poop ? `量:${amountText[item.poop_amount || "medium"]}` : "";
  } else {
    icon = "🥤";
    title = "吸奶";
    const durSec = Math.max(0, Math.floor((item.ended_at - item.started_at) / 1000));
    detail = `${item.amount_ml} ml · ${fmtDuration(durSec)}`;
  }

  return (
    <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] px-4 py-3 flex items-center gap-3">
      <div className="text-3xl leading-none w-10 text-center">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold">{title}</span>
          <span className="text-sm text-[var(--muted)] tabular">{fmtTime(item.ts)}</span>
        </div>
        {detail && <div className="text-sm text-[var(--muted)] mt-0.5">{detail}</div>}
        {item.note && <div className="text-sm mt-1 truncate">📝 {item.note}</div>}
      </div>
      <Link
        href={editHref}
        aria-label="编辑"
        className="tap w-10 h-10 flex items-center justify-center text-[var(--muted)]"
      >
        <Pencil size={18} />
      </Link>
      <button
        onClick={() => onDelete(item)}
        aria-label="删除"
        className="tap w-10 h-10 flex items-center justify-center text-red-500"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
