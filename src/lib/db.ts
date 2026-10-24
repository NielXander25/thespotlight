import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | null = null;

/**
 * Server-only Postgres client for Neon (HTTP driver — works on serverless).
 * NEVER import this into a client component: DATABASE_URL carries the
 * database password. The browser has no direct path to the database; every
 * read and write goes through server components or API routes.
 */
export function getSql(): NeonQueryFunction<false, false> {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set. Add your Neon connection string (server-side only).");
    }
    client = neon(url);
  }
  return client;
}

/** Postgres unique_violation, e.g. a question slug that's already taken. */
export function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === "23505";
}
