import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const ALLOWED_FIELDS = ["status", "featured", "identity_revealed"] as const;
type AllowedField = (typeof ALLOWED_FIELDS)[number];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({}));
  const update: Partial<Record<AllowedField, unknown>> = {};

  for (const field of ALLOWED_FIELDS) {
    if (field in body) update[field] = body[field];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }
  if ("status" in update && !["visible", "hidden"].includes(update.status as string)) {
    return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("submissions")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    console.error("update submission failed", error);
    return NextResponse.json({ error: "Failed to update submission." }, { status: 500 });
  }

  return NextResponse.json({ submission: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getAdminClient();
  const { error } = await supabase.from("submissions").delete().eq("id", params.id);

  if (error) {
    console.error("delete submission failed", error);
    return NextResponse.json({ error: "Failed to delete submission." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
