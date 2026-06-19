"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import DiaperForm from "@/components/DiaperForm";

type D = {
  id: number;
  pee: number;
  poop: number;
  poop_amount: "small" | "medium" | "large" | null;
  happened_at: number;
  note: string | null;
};

export default function EditDiaperPage() {
  const params = useParams<{ id: string }>();
  const [d, setD] = useState<D | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/diapers/${params.id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((j: D) => setD(j))
      .catch(() => setErr("未找到记录"));
  }, [params.id]);

  return (
    <>
      <PageHeader title="编辑尿布记录" back="/history" />
      {err && <div className="px-4 py-6 text-center text-red-500">{err}</div>}
      {d && (
        <DiaperForm
          initial={{
            id: d.id,
            pee: !!d.pee,
            poop: !!d.poop,
            poop_amount: d.poop_amount,
            happened_at: d.happened_at,
            note: d.note,
          }}
        />
      )}
    </>
  );
}
