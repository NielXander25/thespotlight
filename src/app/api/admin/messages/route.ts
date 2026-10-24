import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { getSessionAccount } from "@/lib/session";

// Reads live data — never prerender.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sql = getSql();
  const channel = req.nextUrl.searchParams.get("channel");
  const account = await getSessionAccount();
  // "Talk to the Founder" messages are readable by the founder account only.
  const isFounder = account === "founder";
  const channelFilter = isFounder
    ? channel === "anonymous" || channel === "founder"
      ? channel
      : null
    : "anonymous";

  // Enforce the 30-day retention on every inbox load, so expiry works
  // without a scheduler. Failure here shouldn't block reading.
  try {
    await sql`select purge_expired_messages()`;
  } catch (error) {
    console.error("purge expired messages failed", error);
  }

  try {
    const messages = await sql`
      select * from messages
      where expires_at > now()
        and (${channelFilter}::text is null or channel = ${channelFilter})
      order by created_at desc
    `;
    return NextResponse.json({ messages, account });
  } catch (error) {
    console.error("list messages failed", error);
    return NextResponse.json({ error: "Failed to load messages." }, { status: 500 });
  }
}
