import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({}));

  const status = "status" in body ? body.status : null;
  const featured = typeof body.featured === "boolean" ? body.featured : null;
  const identityRevealed = typeof body.identity_revealed === "boolean" ? body.identity_revealed : null;

  if (status === null && featured === null && identityRevealed === null) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }
  if (status !== null && !["visible", "hidden"].includes(status)) {
    return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
  }

  try {
    // coalesce keeps any field that wasn't sent.
    const [submission] = await getSql()`
      update submissions set
        status = coalesce(${status}, status),
        featured = coalesce(${featured}, featured),
        identity_revealed = coalesce(${identityRevealed}, identity_revealed)
      where id::text = ${params.id}
      returning *
    `;
    if (!submission) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }
    return NextResponse.json({ submission });
  } catch (error) {
    console.error("update submission failed", error);
    return NextResponse.json({ error: "Failed to update submission." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await getSql()`delete from submissions where id::text = ${params.id}`;
  } catch (error) {
    console.error("delete submission failed", error);
    return NextResponse.json({ error: "Failed to delete submission." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
