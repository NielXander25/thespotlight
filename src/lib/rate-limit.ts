import { createHash } from "crypto";

/**
 * Lightweight in-memory rate limiter.
 * Good enough for a single long-running Node server (e.g. a VPS or Docker deploy).
 * NOTE: on serverless/edge deploys (Vercel functions), memory isn't shared across
 * instances — swap this for Upstash Redis or Supabase-backed throttling if you
 * deploy there and see abuse. Left simple on purpose per the brief.
 */
const WINDOW_MS = 60_000; // 1 minute
const MAX_PER_WINDOW = 3; // 3 submissions per minute per IP

const hits = new Map<string, number[]>();

export function isRateLimited(ipHash: string): boolean {
  const now = Date.now();
  const timestamps = (hits.get(ipHash) ?? []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  hits.set(ipHash, timestamps);
  return timestamps.length > MAX_PER_WINDOW;
}

/** Hashes an IP so we never store raw addresses, even for internal throttling. */
export function hashIp(ip: string): string {
  const salt = process.env.SESSION_SECRET || "spotlight";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 24);
}
