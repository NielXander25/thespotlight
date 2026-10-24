import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { hashIp, isRateLimited } from "@/lib/rate-limit";
import { MESSAGE_LIMITS, MESSAGE_RETENTION_DAYS } from "@/lib/messages";
import type { MessageChannel, PublicMessageInput } from "@/lib/types";

export const dynamic = "force-dynamic";

const CHANNELS: MessageChannel[] = ["anonymous", "founder"];

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: NextRequest) {
  let body: PublicMessageInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Honeypot — same trick as guesses: fake success so bots move on.
  if (clean(body.honeypot)) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const channel = CHANNELS.includes(body.channel) ? body.channel : null;
  if (!channel) {
    return NextResponse.json({ error: "Unknown message type." }, { status: 400 });
  }

  // Keep line breaks in the message itself — people write paragraphs here.
  const text = clean(body.body).replace(/\n{3,}/g, "\n\n");
  // The anonymous box never stores identity, even if a client sends it.
  const senderName = channel === "founder" ? clean(body.senderName) : "";
  const senderContact = channel === "founder" ? clean(body.senderContact) : "";

  const errors: Record<string, string> = {};
  if (text.length < MESSAGE_LIMITS.body.min || text.length > MESSAGE_LIMITS.body.max) {
    errors.body = `Your message should be ${MESSAGE_LIMITS.body.min}-${MESSAGE_LIMITS.body.max} characters.`;
  }
  if (senderName.length > MESSAGE_LIMITS.senderName.max) {
    errors.senderName = "That name is too long.";
  }
  if (senderContact.length > MESSAGE_LIMITS.senderContact.max) {
    errors.senderContact = "That contact is too long.";
  }
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Validation failed.", fields: errors }, { status: 422 });
  }

  // Rate limiting uses the hashed IP in memory only — it is never written to
  // the messages table, so a message can't be traced back to a device.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (isRateLimited(`msg:${hashIp(ip)}`)) {
    return NextResponse.json(
      { error: "You're sending messages a little too fast — try again in a minute." },
      { status: 429 }
    );
  }

  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + MESSAGE_RETENTION_DAYS * 86_400_000);

  try {
    await getSql()`
      insert into messages (channel, body, sender_name, sender_contact, created_at, expires_at)
      values (${channel}, ${text}, ${senderName || null}, ${senderContact || null},
              ${createdAt.toISOString()}, ${expiresAt.toISOString()})
    `;
  } catch (error) {
    console.error("message insert failed", error);
    return NextResponse.json(
      { error: "Something went wrong on our end. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
