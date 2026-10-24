/** Messages are kept for this long unless the admin deletes them sooner. */
export const MESSAGE_RETENTION_DAYS = 30;

export const MESSAGE_LIMITS = {
  body: { min: 2, max: 2000 },
  senderName: { max: 80 },
  senderContact: { max: 120 },
};

/** Whole days left before a message is purged (0 on its final day). */
export function daysUntilExpiry(expiresAt: string, now = Date.now()): number {
  const ms = new Date(expiresAt).getTime() - now;
  return Math.max(0, Math.floor(ms / 86_400_000));
}
