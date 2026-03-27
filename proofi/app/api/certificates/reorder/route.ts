import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { order } = body as { order: { id: string; sortOrder: number }[] };

    if (!Array.isArray(order)) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Verify all certificates belong to this user
    const certIds = order.map((o) => o.id);
    const certs = await prisma.certificate.findMany({
      where: { id: { in: certIds }, userId: user.id },
      select: { id: true },
    });
    if (certs.length !== certIds.length) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update sortOrder for each certificate
    await Promise.all(
      order.map((o) =>
        prisma.certificate.update({
          where: { id: o.id },
          data: { sortOrder: o.sortOrder },
        })
      )
    );

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/certificates/reorder] Error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
