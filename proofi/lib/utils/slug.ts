import { SLUG_REGEX } from "@/lib/constants";
import type { PrismaClient } from "@prisma/client";

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 30);
}

export function isValidSlug(slug: string): boolean {
  return SLUG_REGEX.test(slug);
}

export async function generateUniqueSlug(
  name: string,
  prisma: PrismaClient,
  excludeUserId?: string
): Promise<string> {
  const base = generateSlug(name) || "user";
  let candidate = base;
  let counter = 2;

  while (true) {
    const existing = await prisma.user.findFirst({
      where: {
        slug: candidate,
        ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
      },
    });
    if (!existing) return candidate;
    candidate = `${base}-${counter}`;
    counter++;
  }
}
