import type { Metadata } from "next";
import { MessagePageShell } from "@/components/public/MessagePageShell";
import { MessageForm } from "@/components/public/MessageForm";

export const metadata: Metadata = {
  title: "Talk To The Founder",
  description: "Send a message straight to the founder of The Spotlight.",
};

export default function FounderPage({
  searchParams,
}: {
  searchParams: { topic?: string };
}) {
  const recommending = searchParams.topic === "recommend";

  return (
    <MessagePageShell
      eyebrow="Direct line"
      title="Talk To The Founder"
      intro={
        recommending
          ? "Know someone whose work deserves to be seen? Tell us who they are and why — the next meaningful story may be closer than you think."
          : "Ideas, recommendations, feedback, or questions — this goes straight to the founder. Leave your name and contact if you'd like a reply."
      }
    >
      <MessageForm
        channel="founder"
        placeholder={
          recommending
            ? "I'd like to recommend… because…"
            : "Hi! I wanted to share…"
        }
      />
    </MessagePageShell>
  );
}
