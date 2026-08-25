import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/supabase";
import { ClosedState } from "@/components/public/ClosedState";

// Same reasoning as [slug]/page.tsx — always rendered per-request.
export const dynamic = "force-dynamic";

export default async function RootPage() {
  const supabase = getAdminClient();

  // The root domain isn't the primary way people reach a guess anymore —
  // each question has its own shareable link. If there's exactly one
  // active question, send visitors straight to it as a convenience; with
  // zero or several active questions, show a neutral branded page instead
  // of guessing which one they meant (and never list them publicly).
  const { data: active } = await supabase
    .from("questions")
    .select("slug")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(2);

  if (active && active.length === 1) {
    redirect(`/${active[0].slug}`);
  }

  return (
    <ClosedState
      heading="Who's in the Spotlight?"
      body="There's no live guess at this exact link right now — check the link The Spotlight shared with you."
    />
  );
}
