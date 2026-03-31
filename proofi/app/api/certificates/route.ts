import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const certificates = await prisma.certificate.findMany({
    where: { userId: user.id },
    orderBy: { issuedAt: "desc" },
  });

  return Response.json({ data: certificates });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, issuer, issuedAt, expiresAt, domain, credentialId, description, imageUrl, verifyStatus } = body;

  if (!name || !issuer || !issuedAt || !domain) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const certificate = await prisma.certificate.create({
    data: {
      userId: user.id,
      name,
      issuer,
      issuedAt: new Date(issuedAt),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      domain,
      credentialId: credentialId || null,
      description: description || null,
      imageUrl: imageUrl || null,
      ...(verifyStatus === "ai_verified" && { verifyStatus: "ai_verified" }),
    },
  });

  return Response.json({ data: certificate }, { status: 201 });
}
