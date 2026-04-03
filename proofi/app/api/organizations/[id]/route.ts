import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const org = await prisma.customOrganization.findFirst({ where: { id, userId: user.id } });
  if (!org) return Response.json({ error: "Not found" }, { status: 404 });

  const orgName = org.name;
  await prisma.customOrganization.delete({ where: { id } });

  // Clear issuingOrganization on any badges that used this organization
  await prisma.badge.updateMany({
    where: { userId: user.id, issuingOrganization: orgName },
    data: { issuingOrganization: "" },
  });

  return Response.json({ data: { id } });
}
