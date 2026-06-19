import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, FeedRow } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FeedInput = z
  .object({
    method: z.enum(["bottle", "breast"]),
    content: z.enum(["formula", "breastmilk"]).nullable().optional(),
    amount_ml: z.number().int().min(0).max(2000).nullable().optional(),
    side: z.enum(["left", "right", "both"]).nullable().optional(),
    duration_s: z.number().int().min(0).max(60 * 60 * 6).nullable().optional(),
    started_at: z.number().int().positive(),
    note: z.string().max(500).nullable().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.method === "bottle") {
      if (!v.content) ctx.addIssue({ code: "custom", message: "瓶喂需选择内容", path: ["content"] });
      if (v.amount_ml == null) ctx.addIssue({ code: "custom", message: "瓶喂需填写量", path: ["amount_ml"] });
    } else {
      if (!v.side) ctx.addIssue({ code: "custom", message: "亲喂需选择哺乳侧", path: ["side"] });
      if (v.duration_s == null) ctx.addIssue({ code: "custom", message: "亲喂需填写时长", path: ["duration_s"] });
    }
  });

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const since = sp.get("since");
  const until = sp.get("until");
  const limit = Math.min(Number(sp.get("limit") || 200), 500);
  const db = getDb();

  const where: string[] = [];
  const args: (string | number)[] = [];
  if (since) {
    where.push("started_at >= ?");
    args.push(Number(since));
  }
  if (until) {
    where.push("started_at <= ?");
    args.push(Number(until));
  }
  const sql = `SELECT * FROM feeds ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY started_at DESC LIMIT ?`;
  args.push(limit);
  const rows = db.prepare(sql).all(...args) as FeedRow[];
  return NextResponse.json({ items: rows });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const parsed = FeedInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const v = parsed.data;
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO feeds (method, content, amount_ml, side, duration_s, started_at, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const info = stmt.run(
    v.method,
    v.method === "bottle" ? v.content ?? null : null,
    v.method === "bottle" ? v.amount_ml ?? null : null,
    v.method === "breast" ? v.side ?? null : null,
    v.method === "breast" ? v.duration_s ?? null : null,
    v.started_at,
    v.note?.trim() || null,
    Date.now()
  );
  return NextResponse.json({ id: info.lastInsertRowid });
}
