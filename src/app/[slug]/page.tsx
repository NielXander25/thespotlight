import { getAdminClient } from "@/lib/supabase";
import { QuestionExperience } from "@/components/public/QuestionExperience";
import { ClosedState } from "@/components/public/ClosedState";
import type { Question } from "@/lib/types";

// Rendered per-request via the service role key (server-side only) — never
// prerendered at build time, and the public never gets a direct read path
// to the questions table (see supabase/schema.sql).
export const dynamic = "force-dynamic";

export default async function QuestionPage({ params }: { params: { slug: string } }) {
  const supabase = getAdminClient();
  const { data: question } = await supabase
    .from("questions")
    .select("*")
    .eq("slug", params.slug)
    .single<Question>();

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
