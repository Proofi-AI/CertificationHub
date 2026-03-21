import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { CertificateCategory, Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") as CertificateCategory | null;
  const issuer = searchParams.get("issuer") || "";
  const expiryStatus = searchParams.get("expiryStatus") || "";
  const sortBy = (searchParams.get("sortBy") || "createdAt") as "expiryDate" | "createdAt" | "name";
  const order = (searchParams.get("order") || "desc") as "asc" | "desc";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 12)));

  const where: Prisma.CertificateWhereInput = {
    userId: session.user.id,
    deletedAt: null,
    ...(category && { category }),
    ...(issuer && { issuer: { contains: issuer, mode: "insensitive" } }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { issuer: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const now = new Date();
  if (expiryStatus === "expired") {
    where.expiryDate = { lt: now };
  } else if (expiryStatus === "expiring_soon") {
    where.expiryDate = { gte: now, lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) };
  } else if (expiryStatus === "valid") {
    where.OR = [
      { expiryDate: null },
      { expiryDate: { gt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) } },
    ];
  }

  const [certificates, total] = await Promise.all([
    prisma.certificate.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.certificate.count({ where }),
  ]);

  return NextResponse.json({ certificates, total, page, limit });
}
