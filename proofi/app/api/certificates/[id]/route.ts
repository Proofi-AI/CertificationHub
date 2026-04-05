import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

async function getOwnedCert(certId: string, userId: string) {
  return prisma.certificate.findFirst({ where: { id: certId, userId } });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const cert = await getOwnedCert(id, user.id);
  if (!cert) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const { name, issuer, issuedAt, expiresAt, domain, credentialId, description, imageUrl, verifyStatus, isFeatured } = body;

  const updated = await prisma.certificate.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(issuer && { issuer }),
      ...(issuedAt && { issuedAt: new Date(issuedAt) }),
      ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      ...(domain && { domain }),
      ...(credentialId !== undefined && { credentialId: credentialId || null }),
      ...(description !== undefined && { description: description || null }),
      ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      ...(verifyStatus === "ai_verified" && { verifyStatus: "ai_verified" }),
      ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
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
  const cert = await getOwnedCert(id, user.id);
  if (!cert) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.certificate.delete({ where: { id } });
  return Response.json({ data: { id } });
}
