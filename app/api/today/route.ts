import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { endOfDayMs, startOfDayMs } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const now = Date.now();
  const s = startOfDayMs(now);
  const e = endOfDayMs(now);

  const feedAgg = db
    .prepare(
      `SELECT
         COUNT(*) AS count,
         COALESCE(SUM(CASE WHEN method='bottle' THEN amount_ml ELSE 0 END), 0) AS bottle_ml,
         COALESCE(SUM(CASE WHEN method='breast' THEN duration_s ELSE 0 END), 0) AS breast_s,
         SUM(CASE WHEN method='bottle' THEN 1 ELSE 0 END) AS bottle_count,
         SUM(CASE WHEN method='breast' THEN 1 ELSE 0 END) AS breast_count
       FROM feeds WHERE started_at BETWEEN ? AND ?`
    )
    .get(s, e) as {
    count: number;
    bottle_ml: number;
    breast_s: number;
    bottle_count: number;
    breast_count: number;
  };

  const diaperAgg = db
    .prepare(
      `SELECT
         COUNT(*) AS count,
         SUM(pee) AS pee,
         SUM(poop) AS poop
       FROM diapers WHERE happened_at BETWEEN ? AND ?`
    )
    .get(s, e) as { count: number; pee: number; poop: number };

  const lastFeed = db.prepare("SELECT started_at FROM feeds ORDER BY started_at DESC LIMIT 1").get() as
    | { started_at: number }
    | undefined;
  const lastDiaper = db.prepare("SELECT happened_at FROM diapers ORDER BY happened_at DESC LIMIT 1").get() as
    | { happened_at: number }
    | undefined;

  return NextResponse.json({
    feed: feedAgg,
    diaper: diaperAgg,
    lastFeedAt: lastFeed?.started_at ?? null,
    lastDiaperAt: lastDiaper?.happened_at ?? null,
  });
}
