import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const user = await prisma.user.findUnique({
    where: { slug },
    include: {
      certificates: {
        where: { isPublic: true },
        orderBy: { issuedAt: "desc" },
      },
      badges: {
        where: { isPublic: true },
        orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { issuedAt: "desc" }],
      },
    },
  });

  if (!user) return Response.json({ error: "Profile not found" }, { status: 404 });

  const { email: _email, ...publicUser } = user;
  return Response.json({ data: publicUser });
}
