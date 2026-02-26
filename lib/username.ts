import prisma from "@/lib/prisma";

/**
 * Generates a unique username from a display name or email prefix.
 * Tries the base slug first, then appends random digits if taken.
 */
export async function generateUniqueUsername(
  hint: string,
): Promise<string> {
  // Build a URL-safe slug: lowercase, letters/digits only
  const base = hint
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20) || "user";

  // Try base first
  const taken = await prisma.user.findUnique({ where: { username: base } });
  if (!taken) return base;

  // Append random 4-digit suffix until unique
  let candidate = "";
  for (let i = 0; i < 10; i++) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    candidate = `${base}_${suffix}`;
    const conflict = await prisma.user.findUnique({
      where: { username: candidate },
    });
    if (!conflict) return candidate;
  }

  // Fallback: timestamp
  return `${base}_${Date.now()}`;
}
