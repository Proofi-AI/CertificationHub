import type { User } from "@supabase/supabase-js";
import { Prisma } from "@prisma/client";
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
    const code = (err as { code?: string })?.code;

    // P2002 = unique constraint violation (concurrent create race, or stale record with same email)
    if (code === "P2002") {
      // Race condition: parallel request already created the record with this id
      const byId = await prisma.user.findUnique({ where: { id: authUser.id } });
      if (byId) return byId;

      // Email collision: a record exists with the same email but a different id
      // (e.g. the Supabase auth user was deleted and recreated).
      // Can't update the PK directly (FK constraints block it), so we:
      //   1. Park the old record (temp email + slug so unique constraints free up)
      //   2. Create a new record with the correct auth id and original data
      //   3. Move all related rows to the new id
      //   4. Delete the parked record
      const byEmail = await prisma.user.findUnique({ where: { email: authUser.email! } });
      if (byEmail && byEmail.id !== authUser.id) {
        const oldId = byEmail.id;
        const newId = authUser.id;

        await prisma.user.update({
          where: { id: oldId },
          data: {
            email: `migrating_${oldId}@temp.invalid`,
            slug: `migrating_${oldId}`,
          },
        });

        await prisma.user.create({
          data: {
            id: newId,
            email: authUser.email!,
            name: byEmail.name ?? undefined,
            bio: byEmail.bio ?? undefined,
            avatarUrl: byEmail.avatarUrl ?? undefined,
            slug: byEmail.slug,
            defaultTheme: byEmail.defaultTheme,
            features: byEmail.features ?? Prisma.JsonNull,
            isAdmin: byEmail.isAdmin,
            profileViews: byEmail.profileViews,
            sortStrategy: byEmail.sortStrategy,
            hasSetSecurity: byEmail.hasSetSecurity,
            securityQ1: byEmail.securityQ1 ?? undefined,
            securityA1: byEmail.securityA1 ?? undefined,
            securityQ2: byEmail.securityQ2 ?? undefined,
            securityA2: byEmail.securityA2 ?? undefined,
            securityQ3: byEmail.securityQ3 ?? undefined,
            securityA3: byEmail.securityA3 ?? undefined,
          },
        });

        await prisma.certificate.updateMany({ where: { userId: oldId }, data: { userId: newId } });
        await prisma.feedback.updateMany({ where: { userId: oldId }, data: { userId: newId } });
        await prisma.user.delete({ where: { id: oldId } });

        const migrated = await prisma.user.findUnique({ where: { id: newId } });
        if (migrated) return migrated;
      }
    }
    throw err;
  }
}
