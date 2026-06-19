import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, DiaperRow } from "@/lib/db";

export const runtime = "nodejs";

const Patch = z.object({
  pee: z.boolean().optional(),
  poop: z.boolean().optional(),
  poop_amount: z.enum(["small", "medium", "large"]).nullable().optional(),
  happened_at: z.number().int().positive().optional(),
  note: z.string().max(500).nullable().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const row = getDb().prepare("SELECT * FROM diapers WHERE id = ?").get(Number(params.id)) as DiaperRow | undefined;
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
  const fields: string[] = [];
  const args: (string | number | null)[] = [];
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v === undefined) continue;
    if (k === "pee" || k === "poop") {
      fields.push(`${k} = ?`);
      args.push(v ? 1 : 0);
    } else {
      fields.push(`${k} = ?`);
      args.push(v as string | number | null);
    }
  }
  if (!fields.length) return NextResponse.json({ ok: true });
  args.push(Number(params.id));
  getDb().prepare(`UPDATE diapers SET ${fields.join(", ")} WHERE id = ?`).run(...args);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  getDb().prepare("DELETE FROM diapers WHERE id = ?").run(Number(params.id));
  return NextResponse.json({ ok: true });
}
