import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { dayjs } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const days = Math.min(Math.max(Number(req.nextUrl.searchParams.get("days") || 7), 1), 90);
  const db = getDb();

  const end = dayjs().endOf("day").valueOf();
  const start = dayjs().subtract(days - 1, "day").startOf("day").valueOf();

  const feedRows = db
    .prepare(
      `SELECT method, content, amount_ml, duration_s, started_at FROM feeds
       WHERE started_at BETWEEN ? AND ?`
    )
    .all(start, end) as {
    method: "bottle" | "breast";
    content: string | null;
    amount_ml: number | null;
    duration_s: number | null;
    started_at: number;
  }[];

  const diaperRows = db
    .prepare(
      `SELECT pee, poop, happened_at FROM diapers WHERE happened_at BETWEEN ? AND ?`
    )
    .all(start, end) as { pee: number; poop: number; happened_at: number }[];

  const pumpRows = db
    .prepare(
      `SELECT started_at, ended_at, amount_ml FROM pumps WHERE started_at BETWEEN ? AND ?`
    )
    .all(start, end) as { started_at: number; ended_at: number; amount_ml: number }[];

  // 按日聚合
  type DayBucket = {
    date: string;
    feedCount: number;
    bottleMl: number;
    breastMin: number;
    pee: number;
    poop: number;
    pumpMl: number;
    pumpMin: number;
    pumpCount: number;
  };
  const buckets: Record<string, DayBucket> = {};
  for (let i = 0; i < days; i++) {
    const d = dayjs(start).add(i, "day").format("MM-DD");
    buckets[d] = {
      date: d,
      feedCount: 0,
      bottleMl: 0,
      breastMin: 0,
      pee: 0,
      poop: 0,
      pumpMl: 0,
      pumpMin: 0,
      pumpCount: 0,
    };
  }
  for (const f of feedRows) {
    const d = dayjs(f.started_at).format("MM-DD");
    if (!buckets[d]) continue;
    buckets[d].feedCount += 1;
    if (f.method === "bottle") buckets[d].bottleMl += f.amount_ml || 0;
    else buckets[d].breastMin += Math.round((f.duration_s || 0) / 60);
  }
  for (const r of diaperRows) {
    const d = dayjs(r.happened_at).format("MM-DD");
    if (!buckets[d]) continue;
    if (r.pee) buckets[d].pee += 1;
    if (r.poop) buckets[d].poop += 1;
  }
  for (const p of pumpRows) {
    const d = dayjs(p.started_at).format("MM-DD");
    if (!buckets[d]) continue;
    buckets[d].pumpMl += p.amount_ml || 0;
    buckets[d].pumpMin += Math.round(Math.max(0, p.ended_at - p.started_at) / 60000);
    buckets[d].pumpCount += 1;
  }

  return NextResponse.json({
    days,
    buckets: Object.values(buckets),
  });
}
