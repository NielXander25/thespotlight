import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken, type Account } from "@/lib/auth";

/** The signed-in dashboard account for this request (server-only). */
export async function getSessionAccount(): Promise<Account | null> {
  return verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
}
