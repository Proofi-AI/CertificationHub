import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function getOwnedBadge(badgeId: string, userId: string) {
  return prisma.badge.findFirst({ where: { id: badgeId, userId } });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const badge = await getOwnedBadge(id, user.id);
  if (!badge) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ data: badge });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const badge = await getOwnedBadge(id, user.id);
  if (!badge) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const {
    title,
    issuingOrganization,
    description,
    issuedAt,
    expiresAt,
    credentialId,
    credentialUrl,
    imageUrl,
    domain,
    isPublic,
    isFeatured,
    sortOrder,
  } = body;

  const updated = await prisma.badge.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(issuingOrganization !== undefined && { issuingOrganization }),
      ...(description !== undefined && { description: description || null }),
      ...(issuedAt && { issuedAt: new Date(issuedAt) }),
      ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      ...(credentialId !== undefined && { credentialId: credentialId || null }),
      ...(credentialUrl !== undefined && { credentialUrl: credentialUrl || null }),
      ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      ...(domain !== undefined && { domain: domain || null }),
      ...(isPublic !== undefined && { isPublic: Boolean(isPublic) }),
      ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });

  return Response.json({ data: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const badge = await getOwnedBadge(id, user.id);
  if (!badge) return Response.json({ error: "Not found" }, { status: 404 });

  // Delete image from Supabase Storage if it exists
  if (badge.imageUrl) {
    try {
      const url = new URL(badge.imageUrl);
      const pathMatch = url.pathname.match(/\/badges\/(.+)$/);
      if (pathMatch) {
        await supabaseAdmin.storage.from("badges").remove([pathMatch[1]]);
      }
    } catch {
      // Silently ignore storage delete errors
    }
  }

  await prisma.badge.delete({ where: { id } });
  return Response.json({ data: { id } });
}
