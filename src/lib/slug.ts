const RESERVED_SLUGS = new Set(["admin", "api", "favicon.ico"]);

/** Turns a title into a URL-safe slug: "Who's in the Spotlight?" -> "whos-in-the-spotlight" */
export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return base || "question";
}

/** Appends a short random suffix, used when a slug collides with an existing one. */
export function withRandomSuffix(slug: string): string {
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${slug}-${suffix}`;
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}
