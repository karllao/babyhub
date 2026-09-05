import { NextResponse } from "next/server";
import { vapidPublicKey } from "@/lib/notifications";
export const runtime = "nodejs";
// VAPID 密钥来自容器运行时环境，不能在 next build 阶段静态化。
export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function GET() { return NextResponse.json({ publicKey: vapidPublicKey() }); }
