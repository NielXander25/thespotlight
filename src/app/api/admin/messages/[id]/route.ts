import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Only the read flag can change. Retention (expires_at) is deliberately not
// editable: a message stays for its full 30 days or until it's deleted.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({}));
  if (typeof body.is_read !== "boolean") {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("messages")
    .update({ is_read: body.is_read })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    console.error("update message failed", error);
    return NextResponse.json({ error: "Failed to update message." }, { status: 500 });
  }

  return NextResponse.json({ message: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getAdminClient();
  const { error } = await supabase.from("messages").delete().eq("id", params.id);

  if (error) {
    console.error("delete message failed", error);
    return NextResponse.json({ error: "Failed to delete message." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
