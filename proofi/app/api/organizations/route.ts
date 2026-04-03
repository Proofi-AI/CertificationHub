import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const orgs = await prisma.customOrganization.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });

  return Response.json({ data: orgs });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name } = body;

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return Response.json({ error: "Name must be at least 2 characters" }, { status: 400 });
  }

  const org = await prisma.customOrganization.create({
    data: {
      userId: user.id,
      name: name.trim(),
    },
  });

  return Response.json({ data: org }, { status: 201 });
}
