import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { getSessionAccount } from "@/lib/session";

export const dynamic = "force-dynamic";

// Only the read flag can change. Retention (expires_at) is deliberately not
// editable: a message stays for its full 30 days or until it's deleted.
// Founder-channel messages can only be touched by the founder account.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({}));
  if (typeof body.is_read !== "boolean") {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  const isFounder = (await getSessionAccount()) === "founder";
  try {
    const [message] = await getSql()`
      update messages set is_read = ${body.is_read}
      where id::text = ${params.id} and (channel = 'anonymous' or ${isFounder})
      returning *
    `;
    if (!message) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }
    return NextResponse.json({ message });
  } catch (error) {
    console.error("update message failed", error);
    return NextResponse.json({ error: "Failed to update message." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const isFounder = (await getSessionAccount()) === "founder";
  try {
    await getSql()`
      delete from messages
      where id::text = ${params.id} and (channel = 'anonymous' or ${isFounder})
    `;
  } catch (error) {
    console.error("delete message failed", error);
    return NextResponse.json({ error: "Failed to delete message." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
