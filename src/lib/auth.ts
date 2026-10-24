import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "spotlight_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

/**
 * Dashboard accounts. Each has its own password env var:
 * - "admin"   → ADMIN_PASSWORD   (the team: guesses, questions, anonymous messages)
 * - "founder" → FOUNDER_PASSWORD (everything, plus Talk to the Founder messages)
 */
export type Account = "admin" | "founder";
export const ACCOUNTS: Account[] = ["admin", "founder"];

export function passwordEnvFor(account: Account): string | undefined {
  return account === "founder" ? process.env.FOUNDER_PASSWORD : process.env.ADMIN_PASSWORD;
}

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET is missing or too short. Set a long random string in your environment."
    );
  }
  return new TextEncoder().encode(secret);
}

/** Creates a signed session token for the account that authenticated. */
export async function createSessionToken(account: Account): Promise<string> {
  return new SignJWT({ role: "admin", account })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

/** Verifies a session token. Returns the signed-in account, or null if invalid/expired. */
export async function verifySessionToken(token: string | undefined): Promise<Account | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.role !== "admin") return null;
    // Sessions issued before founder accounts existed carry no account claim.
    return payload.account === "founder" ? "founder" : "admin";
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_MAX_AGE = SESSION_TTL_SECONDS;
