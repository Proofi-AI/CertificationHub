import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cert = await prisma.certificate.findFirst({
    where: { id: params.id, userId: session.user.id, deletedAt: null },
  });

  if (!cert) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(cert);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cert = await prisma.certificate.findFirst({
    where: { id: params.id, userId: session.user.id, deletedAt: null },
  });

  if (!cert) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.certificate.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
