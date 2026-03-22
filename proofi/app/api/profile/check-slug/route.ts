import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { isValidSlug } from "@/lib/utils/slug";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const slug = request.nextUrl.searchParams.get("slug") ?? "";

  if (!isValidSlug(slug)) {
    return Response.json({
      available: false,
      message: "3–30 characters, letters, numbers, and hyphens only",
    });
  }

  const taken = await prisma.user.findFirst({
    where: { slug, NOT: { id: user.id } },
  });

  return Response.json({
    available: !taken,
    message: taken ? "This URL is already taken" : "Available",
  });
}
