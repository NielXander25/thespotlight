import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

// This route reads live data from the database and is gated by the
// admin session cookie — it must never be statically prerendered at build
// time (which would run it with no request and no runtime env vars).
export const dynamic = "force-dynamic";

function toCsvValue(value: unknown): string {
  const str = value instanceof Date ? value.toISOString() : String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  let data: Record<string, unknown>[];
  try {
    data = await getSql()`
      select id, name, department, message, created_at, status, featured
      from submissions order by created_at desc
    `;
  } catch (error) {
    console.error("export failed", error);
    return NextResponse.json({ error: "Failed to export submissions." }, { status: 500 });
  }

  const header = ["id", "name", "department", "message", "created_at", "status", "featured"];
  const rows = data.map((row) => header.map((key) => toCsvValue(row[key])).join(","));
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
