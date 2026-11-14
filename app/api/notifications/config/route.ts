import { NextRequest, NextResponse } from "next/server";
import { saveNotificationSettings, vapidPublicKey } from "@/lib/notifications";
import { getNotificationSettings, NotificationSettingsInput } from "@/lib/notification-settings";
export const runtime = "nodejs";
// VAPID 密钥来自容器运行时环境，不能在 next build 阶段静态化。
export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function GET() {
  return NextResponse.json({ publicKey: vapidPublicKey(), ...getNotificationSettings() });
}

export async function PUT(req: NextRequest) {
  const parsed = NotificationSettingsInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "提醒间隔须为 0.5–24 小时（每次递增 0.5 小时），统计时间须为 HH:mm 格式" }, { status: 400 });
  }
  saveNotificationSettings(parsed.data);
  return NextResponse.json(getNotificationSettings());
}
