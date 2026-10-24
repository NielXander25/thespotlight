import { getSql } from "@/lib/db";
import { QuestionExperience } from "@/components/public/QuestionExperience";
import { ClosedState } from "@/components/public/ClosedState";
import type { Question } from "@/lib/types";

// Rendered per-request on the server — never prerendered at build time, and
// the public never gets a direct read path to the questions table.
export const dynamic = "force-dynamic";

export default async function QuestionPage({ params }: { params: { slug: string } }) {
  const sql = getSql();
  const [question] = (await sql`
    select * from questions where slug = ${params.slug}
  `) as Question[];

  if (!question) {
    return (
      <ClosedState
        heading="We couldn't find that link"
        body="Double check the link you were sent, or ask The Spotlight for a new one."
      />
    );
  }

  if (!question.is_active) {
    return (
      <ClosedState
        heading="This guess is closed"
        body="Thanks for stopping by — this round isn't accepting guesses anymore."
      />
    );
  }

  return <QuestionExperience question={question} />;
}
