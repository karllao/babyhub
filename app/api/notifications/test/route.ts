import { NextResponse } from "next/server";
import { enqueueJob } from "@/lib/notifications";
export const runtime = "nodejs";
export async function POST() { enqueueJob("daily_summary", Date.now(), `test-${Date.now()}`, { title: "宝宝喂养助手", body: "通知已开启", url: "/settings", tag: "test" }); return NextResponse.json({ ok: true }); }
