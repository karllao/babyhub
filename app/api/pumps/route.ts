import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, PumpRow } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PumpInput = z
  .object({
    started_at: z.number().int().positive(),
    ended_at: z.number().int().positive(),
    amount_ml: z.number().int().min(0).max(2000),
    note: z.string().max(500).nullable().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.ended_at < v.started_at) {
      ctx.addIssue({ code: "custom", message: "结束时间不能早于开始时间", path: ["ended_at"] });
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
  const sql = `SELECT * FROM pumps ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY started_at DESC LIMIT ?`;
  args.push(limit);
  const rows = db.prepare(sql).all(...args) as PumpRow[];
  return NextResponse.json({ items: rows });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const parsed = PumpInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const v = parsed.data;
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO pumps (started_at, ended_at, amount_ml, note, created_at)
     VALUES (?, ?, ?, ?, ?)`
  );
  const info = stmt.run(v.started_at, v.ended_at, v.amount_ml, v.note?.trim() || null, Date.now());
  return NextResponse.json({ id: info.lastInsertRowid });
}
