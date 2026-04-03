import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const badge = await prisma.badge.findFirst({ where: { id, userId: user.id } });
  if (!badge) return Response.json({ error: "Not found" }, { status: 404 });

  const { isPublic } = await request.json();
  const updated = await prisma.badge.update({
    where: { id },
    data: { isPublic: Boolean(isPublic) },
  });

  return Response.json({ data: updated });
}
