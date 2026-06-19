"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import PumpForm from "@/components/PumpForm";

type Pump = {
  id: number;
  started_at: number;
  ended_at: number;
  amount_ml: number;
  note: string | null;
};

export default function EditPumpPage() {
  const params = useParams<{ id: string }>();
  const [pump, setPump] = useState<Pump | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/pumps/${params.id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((j: Pump) => setPump(j))
      .catch(() => setErr("未找到记录"));
  }, [params.id]);

  return (
    <>
      <PageHeader title="编辑吸奶记录" back="/history" />
      {err && <div className="px-4 py-6 text-center text-red-500">{err}</div>}
      {pump && (
        <PumpForm
          initial={{
            id: pump.id,
            started_at: pump.started_at,
            ended_at: pump.ended_at,
            amount_ml: pump.amount_ml,
            note: pump.note,
          }}
        />
      )}
    </>
  );
}
