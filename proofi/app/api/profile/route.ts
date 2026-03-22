import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { isValidSlug } from "@/lib/utils/slug";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.user.findUnique({ where: { id: user.id } });
  if (!profile) return Response.json({ error: "Profile not found" }, { status: 404 });

  return Response.json({ data: profile });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, bio, slug, avatarUrl } = body;

  if (bio && bio.length > 160) {
    return Response.json({ error: "Bio must be 160 characters or less" }, { status: 400 });
  }

  if (slug !== undefined) {
    if (!isValidSlug(slug)) {
      return Response.json(
        { error: "Slug must be 3–30 characters using only letters, numbers, and hyphens" },
        { status: 400 }
      );
    }
    const taken = await prisma.user.findFirst({
      where: { slug, NOT: { id: user.id } },
    });
    if (taken) {
      return Response.json({ error: "This URL is already taken" }, { status: 409 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(name !== undefined && { name }),
      ...(bio !== undefined && { bio }),
      ...(slug !== undefined && { slug }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
  });

  return Response.json({ data: updated });
}
