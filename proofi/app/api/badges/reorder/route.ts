import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { order } = body as { order: { id: string; sortOrder: number }[] };

  if (!Array.isArray(order)) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  await prisma.$transaction(
    order.map(({ id, sortOrder }) =>
      prisma.badge.updateMany({
        where: { id, userId: user.id },
        data: { sortOrder },
      })
    )
  );

  return Response.json({ success: true });
}
