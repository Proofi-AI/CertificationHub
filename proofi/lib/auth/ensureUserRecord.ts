import type { User } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/utils/slug";

export async function ensureUserRecord(authUser: User) {
  const existing = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (existing) return existing;

  const displayName =
    authUser.user_metadata?.full_name ||
    authUser.email?.split("@")[0] ||
    "user";

  const slug = await generateUniqueSlug(displayName, prisma);

  try {
    return await prisma.user.create({
      data: {
        id: authUser.id,
        email: authUser.email!,
        name: displayName,
        slug,
      },
    });
  } catch (err: unknown) {
    // Layout and page both call ensureUserRecord concurrently on first login.
    // If a parallel request won the race and already created the record,
    // catch the unique constraint violation and return the existing record.
    if (
      err instanceof Error &&
      err.message.includes("Unique constraint failed")
    ) {
      const record = await prisma.user.findUnique({ where: { id: authUser.id } });
      if (record) return record;
    }
    throw err;
  }
}
