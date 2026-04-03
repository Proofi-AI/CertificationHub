import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const badges = await prisma.badge.findMany({
    where: { userId: user.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return Response.json({ data: badges });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

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
  } = body;

  if (!title || !issuingOrganization || !issuedAt) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const badge = await prisma.badge.create({
    data: {
      userId: user.id,
      title,
      issuingOrganization,
      description: description || null,
      issuedAt: new Date(issuedAt),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      credentialId: credentialId || null,
      credentialUrl: credentialUrl || null,
      imageUrl: imageUrl || null,
      domain: domain || null,
      isPublic: isPublic !== false,
    },
  });

  return Response.json({ data: badge }, { status: 201 });
}
