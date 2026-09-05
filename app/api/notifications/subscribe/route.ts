import { NextRequest, NextResponse } from "next/server";
import { saveSubscription } from "@/lib/notifications";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) return NextResponse.json({ error: "订阅数据无效" }, { status: 400 });
  saveSubscription(body); return NextResponse.json({ ok: true });
}
