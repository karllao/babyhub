import { NextRequest, NextResponse } from "next/server";
import { sendDueNotifications, ensureDailySummaryJob } from "@/lib/notifications";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("x-cron-secret") !== secret) return NextResponse.json({ error: "未授权" }, { status: 401 });
  ensureDailySummaryJob();
  return NextResponse.json(await sendDueNotifications());
}
