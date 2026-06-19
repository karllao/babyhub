import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, DiaperRow } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DiaperInput = z
  .object({
    pee: z.boolean(),
    poop: z.boolean(),
    poop_amount: z.enum(["small", "medium", "large"]).nullable().optional(),
    happened_at: z.number().int().positive(),
    note: z.string().max(500).nullable().optional(),
  })
  .superRefine((v, ctx) => {
    if (!v.pee && !v.poop) {
      ctx.addIssue({ code: "custom", message: "至少选择尿尿或便便", path: ["pee"] });
    }
    if (v.poop && !v.poop_amount) {
      ctx.addIssue({ code: "custom", message: "请选择便便量", path: ["poop_amount"] });
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
    where.push("happened_at >= ?");
    args.push(Number(since));
  }
  if (until) {
    where.push("happened_at <= ?");
    args.push(Number(until));
  }
  const sql = `SELECT * FROM diapers ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY happened_at DESC LIMIT ?`;
  args.push(limit);
  const rows = db.prepare(sql).all(...args) as DiaperRow[];
  return NextResponse.json({ items: rows });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const parsed = DiaperInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const v = parsed.data;
  const info = getDb()
    .prepare(
      `INSERT INTO diapers (pee, poop, poop_amount, happened_at, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      v.pee ? 1 : 0,
      v.poop ? 1 : 0,
      v.poop ? v.poop_amount ?? null : null,
      v.happened_at,
      v.note?.trim() || null,
      Date.now()
    );
  return NextResponse.json({ id: info.lastInsertRowid });
}
