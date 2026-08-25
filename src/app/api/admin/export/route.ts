import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

function toCsvValue(value: unknown): string {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("submissions")
    .select("id,name,department,message,created_at,status,featured")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("export failed", error);
    return NextResponse.json({ error: "Failed to export submissions." }, { status: 500 });
  }

  const header = ["id", "name", "department", "message", "created_at", "status", "featured"];
  const rows = (data ?? []).map((row) =>
    header.map((key) => toCsvValue((row as Record<string, unknown>)[key])).join(",")
  );
  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="spotlight-guesses-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
