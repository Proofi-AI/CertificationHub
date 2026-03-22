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

  return prisma.user.create({
    data: {
      id: authUser.id,
      email: authUser.email!,
      name: displayName,
      slug,
    },
  });
}
