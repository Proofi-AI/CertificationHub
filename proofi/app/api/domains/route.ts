import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const domains = await prisma.customDomain.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });

  return Response.json({ data: domains });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name } = body;
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return Response.json({ error: "Name must be at least 2 characters." }, { status: 400 });
  }

  const trimmed = name.trim();

  const existing = await prisma.customDomain.findFirst({
    where: { userId: user.id, name: { equals: trimmed, mode: "insensitive" } },
  });
  if (existing) {
    return Response.json({ error: "This domain already exists." }, { status: 409 });
  }

  const domain = await prisma.customDomain.create({
    data: { userId: user.id, name: trimmed },
  });

  return Response.json({ data: domain }, { status: 201 });
}
