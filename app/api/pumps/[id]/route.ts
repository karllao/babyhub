import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, PumpRow } from "@/lib/db";

export const runtime = "nodejs";

const Patch = z
  .object({
    started_at: z.number().int().positive().optional(),
    ended_at: z.number().int().positive().optional(),
    amount_ml: z.number().int().min(0).max(2000).optional(),
    note: z.string().max(500).nullable().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.started_at != null && v.ended_at != null && v.ended_at < v.started_at) {
      ctx.addIssue({ code: "custom", message: "结束时间不能早于开始时间", path: ["ended_at"] });
    }
  });

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const row = getDb().prepare("SELECT * FROM pumps WHERE id = ?").get(Number(params.id)) as PumpRow | undefined;
  if (!row) return NextResponse.json({ error: "未找到" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const parsed = Patch.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const id = Number(params.id);
  const existing = getDb().prepare("SELECT * FROM pumps WHERE id = ?").get(id) as PumpRow | undefined;
  if (!existing) return NextResponse.json({ error: "未找到" }, { status: 404 });

  const startedAt = parsed.data.started_at ?? existing.started_at;
  const endedAt = parsed.data.ended_at ?? existing.ended_at;
  if (endedAt < startedAt) {
    return NextResponse.json({ error: "结束时间不能早于开始时间" }, { status: 400 });
  }

  const fields: string[] = [];
  const args: (string | number | null)[] = [];
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v === undefined) continue;
    fields.push(`${k} = ?`);
    args.push(v as string | number | null);
  }
  if (!fields.length) return NextResponse.json({ ok: true });
  args.push(id);
  getDb().prepare(`UPDATE pumps SET ${fields.join(", ")} WHERE id = ?`).run(...args);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  getDb().prepare("DELETE FROM pumps WHERE id = ?").run(Number(params.id));
  return NextResponse.json({ ok: true });
}
