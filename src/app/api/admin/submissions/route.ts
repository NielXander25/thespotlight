import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

// Reads live, request-specific data (search/filter/sort query params) with
// the service-role key. Must never be statically prerendered at build time.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = getAdminClient();
  const params = req.nextUrl.searchParams;

  const search = params.get("search")?.trim();
  const department = params.get("department")?.trim();
  const questionId = params.get("questionId")?.trim();
  const sort = params.get("sort") === "oldest" ? "oldest" : "newest";
  const onlyFeatured = params.get("featured") === "true";
  const includeHidden = params.get("includeHidden") === "true";

  // Embed the parent question's title/slug so the dashboard can tag each
  // guess with which question it answered, without an extra round trip.
  let query = supabase
    .from("submissions")
    .select("*, question:questions(id,title,slug)", { count: "exact" });

  if (!includeHidden) {
    query = query.eq("status", "visible");
  }
  if (department && department !== "all") {
    query = query.eq("department", department);
  }
  if (questionId && questionId !== "all") {
    if (questionId === "none") {
      query = query.is("question_id", null);
    } else {
      query = query.eq("question_id", questionId);
    }
  }
  if (onlyFeatured) {
    query = query.eq("featured", true);
  }
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,department.ilike.%${search}%,message.ilike.%${search}%`
    );
  }

  query = query.order("created_at", { ascending: sort === "oldest" });

  const { data, error, count } = await query;
  if (error) {
    console.error("list submissions failed", error);
    return NextResponse.json({ error: "Failed to load submissions." }, { status: 500 });
  }

  // Stats are computed from the full, unfiltered table so the dashboard
  // header numbers stay stable while the admin searches/filters below.
  const { data: allRows } = await supabase
    .from("submissions")
    .select("department, created_at");

  const { data: questionRows } = await supabase
    .from("questions")
    .select("id, title, slug")
    .order("created_at", { ascending: false });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const departments = new Set((allRows ?? []).map((r) => r.department));
  const todayCount = (allRows ?? []).filter(
    (r) => new Date(r.created_at) >= startOfToday
  ).length;

  return NextResponse.json({
    submissions: data ?? [],
    count: count ?? 0,
    stats: {
      total: allRows?.length ?? 0,
      departments: departments.size,
      today: todayCount,
    },
    departmentList: Array.from(departments).sort(),
    questionList: questionRows ?? [],
  });
}
