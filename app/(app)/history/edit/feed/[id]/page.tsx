"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import BottleForm from "@/components/BottleForm";
import BreastfeedTimerEditForm from "@/components/BreastfeedEditForm";

type Feed = {
  id: number;
  method: "bottle" | "breast";
  content: "formula" | "breastmilk" | null;
  amount_ml: number | null;
  side: "left" | "right" | "both" | null;
  duration_s: number | null;
  started_at: number;
  note: string | null;
};

export default function EditFeedPage() {
  const params = useParams<{ id: string }>();
  const [feed, setFeed] = useState<Feed | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/feeds/${params.id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((j: Feed) => setFeed(j))
      .catch(() => setErr("未找到记录"));
  }, [params.id]);

  return (
    <>
      <PageHeader title="编辑喂奶记录" back="/history" />
      {err && <div className="px-4 py-6 text-center text-red-500">{err}</div>}
      {feed?.method === "bottle" && (
        <BottleForm
          defaultContent={feed.content ?? "formula"}
          initial={{
            id: feed.id,
            content: feed.content ?? "formula",
            amount_ml: feed.amount_ml ?? 0,
            started_at: feed.started_at,
            note: feed.note,
          }}
        />
      )}
      {feed?.method === "breast" && (
        <BreastfeedTimerEditForm
          id={feed.id}
          duration_s={feed.duration_s ?? 0}
          side={feed.side ?? "left"}
          started_at={feed.started_at}
          note={feed.note}
        />
      )}
    </>
  );
}
