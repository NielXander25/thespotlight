import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

// Reads live, request-specific data (search/filter/sort query params).
// Must never be statically prerendered at build time.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sql = getSql();
  const params = req.nextUrl.searchParams;

  const search = params.get("search")?.trim();
  const department = params.get("department")?.trim();
  const questionId = params.get("questionId")?.trim();
  const sort = params.get("sort") === "oldest" ? "asc" : "desc";
  const onlyFeatured = params.get("featured") === "true";
  const includeHidden = params.get("includeHidden") === "true";

  // Filters are built as parameterized clauses — user input is only ever
  // passed as a bound value, never spliced into the SQL text.
  const where: string[] = [];
  const values: unknown[] = [];
  const bind = (value: unknown) => {
    values.push(value);
    return `$${values.length}`;
  };

  if (!includeHidden) where.push(`s.status = 'visible'`);
  if (department && department !== "all") where.push(`s.department = ${bind(department)}`);
  if (questionId && questionId !== "all") {
    where.push(questionId === "none" ? "s.question_id is null" : `s.question_id::text = ${bind(questionId)}`);
  }
  if (onlyFeatured) where.push("s.featured");
  if (search) {
    const pattern = bind(`%${search}%`);
    where.push(`(s.name ilike ${pattern} or s.department ilike ${pattern} or s.message ilike ${pattern})`);
  }

  try {
    // Embed the parent question's title/slug so the dashboard can tag each
    // guess with which question it answered, without an extra round trip.
    const submissions = await sql.query(
      `select s.*,
              case when q.id is null then null
                   else json_build_object('id', q.id, 'title', q.title, 'slug', q.slug)
              end as question
       from submissions s
       left join questions q on q.id = s.question_id
       ${where.length ? `where ${where.join(" and ")}` : ""}
       order by s.created_at ${sort}`,
      values
    );

    // Stats are computed from the full, unfiltered table so the dashboard
    // header numbers stay stable while the admin searches/filters below.
    const [[stats], departmentRows, questionList] = await Promise.all([
      sql`
        select count(*)::int as total,
               count(distinct department)::int as departments,
               count(*) filter (where created_at >= date_trunc('day', now()))::int as today
        from submissions
      `,
      sql`select distinct department from submissions order by department`,
      sql`select id, title, slug from questions order by created_at desc`,
    ]);

    return NextResponse.json({
      submissions,
      count: submissions.length,
      stats,
      departmentList: departmentRows.map((r) => r.department),
      questionList,
    });
  } catch (error) {
    console.error("list submissions failed", error);
    return NextResponse.json({ error: "Failed to load submissions." }, { status: 500 });
  }
}
