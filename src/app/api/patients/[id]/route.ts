import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { patients } from "@/db/schema";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isFinite(pid)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  await db.delete(patients).where(eq(patients.id, pid));
  return NextResponse.json({ ok: true });
}
