import type { Metadata } from "next";
import { MessagePageShell } from "@/components/public/MessagePageShell";
import { MessageForm } from "@/components/public/MessageForm";

export const metadata: Metadata = {
  title: "Send an anonymous message",
  description: "Send The Spotlight a message without your name.",
};

export default function AnonymousMessagePage() {
  return (
    <MessagePageShell
      eyebrow="Anonymous"
      title="Say it to The Spotlight"
      intro="A story tip, a confession, feedback, or a question you'd rather not put your name on. No sign-in, no identity."
    >
      <MessageForm channel="anonymous" placeholder="Type your message…" />
    </MessagePageShell>
  );
}
