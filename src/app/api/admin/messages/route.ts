import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

// Reads live data with the service-role key — never prerender.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = getAdminClient();
  const channel = req.nextUrl.searchParams.get("channel");

  // Enforce the 30-day retention on every inbox load, so expiry works even
  // if no pg_cron job is scheduled. Failure here shouldn't block reading.
  const { error: purgeError } = await supabase.rpc("purge_expired_messages");
  if (purgeError) {
    console.error("purge expired messages failed", purgeError);
  }

  let query = supabase
    .from("messages")
    .select("*")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (channel === "anonymous" || channel === "founder") {
    query = query.eq("channel", channel);
  }

  const { data, error } = await query;
  if (error) {
    console.error("list messages failed", error);
    return NextResponse.json({ error: "Failed to load messages." }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}
