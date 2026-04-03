import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import PublicProfile from "@/components/public/PublicProfile";
import { scoreCertificate } from "@/lib/certStrength";

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

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { slug },
      include: {
        certificates: {
          where: { isPublic: true },
          orderBy: { issuedAt: "desc" },
        },
        badges: {
          where: { isPublic: true },
          orderBy: [{ isFeatured: "desc" }, { issuedAt: "desc" }],
        },
      },
    });
  } catch {
    throw new Error("Failed to load profile — database unreachable");
  }

  if (!user) notFound();

  // Apply sortStrategy — mirrors the exact same logic used in the dashboard CertificatesPanel
  const sortStrategy = user.sortStrategy ?? "recent";
  switch (sortStrategy) {
    case "alphabetical":
      user.certificates.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "custom":
      user.certificates.sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
      break;
    case "domain":
      user.certificates.sort((a, b) => {
        const dc = a.domain.localeCompare(b.domain);
        return dc !== 0 ? dc : new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
      });
      break;
    case "strongest":
      user.certificates.sort((a, b) => scoreCertificate(b).score - scoreCertificate(a).score);
      break;
    case "expiring":
      user.certificates.sort((a, b) => {
        if (!a.expiresAt && !b.expiresAt) return 0;
        if (!a.expiresAt) return 1;
        if (!b.expiresAt) return -1;
        return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
      });
      break;
    // "recent" is already handled by the prisma orderBy: { issuedAt: "desc" } above
  }

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
