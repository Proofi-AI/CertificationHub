import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import PublicProfile from "@/components/public/PublicProfile";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const user = await prisma.user.findUnique({ where: { slug } });
  if (!user) return { title: "Profile not found — Proofi AI" };

  return {
    title: `${user.name ?? slug}'s Certificates — Proofi AI`,
    description: user.bio ?? `View ${user.name ?? slug}'s professional certificates on Proofi AI.`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { slug } = await params;

  const user = await prisma.user.findUnique({
    where: { slug },
    include: {
      certificates: {
        where: { isPublic: true },
        orderBy: { issuedAt: "desc" },
      },
    },
  });

  if (!user) notFound();

  // Apply sortStrategy on the server for the public profile
  const sortStrategy = user.sortStrategy ?? "recent";
  if (sortStrategy === "alphabetical") {
    user.certificates.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortStrategy === "custom") {
    user.certificates.sort((a, b) => {
      const ao = a.sortOrder ?? 9999;
      const bo = b.sortOrder ?? 9999;
      return ao - bo;
    });
  } else if (sortStrategy === "domain") {
    user.certificates.sort((a, b) => {
      const dc = a.domain.localeCompare(b.domain);
      if (dc !== 0) return dc;
      return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
    });
  }
  // "recent" is already handled by orderBy: { issuedAt: "desc" }

  // Increment view count — but only if the viewer is NOT the profile owner
  try {
    const supabase = await createClient();
    const { data: { user: viewer } } = await supabase.auth.getUser();
    const isOwner = viewer?.id === user.id;

    if (!isOwner) {
      await prisma.user.update({
        where: { slug },
        data: { profileViews: { increment: 1 } },
      });
    }
  } catch {
    // Never fail the page render because of a view count error
  }

  const { email: _email, ...publicUser } = user;

  return <PublicProfile profile={publicUser} />;
}
