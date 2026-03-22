import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
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

  const { email: _email, ...publicUser } = user;

  return <PublicProfile profile={publicUser} />;
}
