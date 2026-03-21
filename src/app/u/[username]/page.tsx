import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatDate, CATEGORY_LABELS, getExpiryStatus } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Linkedin, Award, Calendar, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Props {
  params: { username: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: { name: true, bio: true, username: true },
  });

  if (!user) return { title: "Profile not found" };

  return {
    title: `${user.name ?? user.username} — proofi.ai`,
    description: user.bio ?? `View ${user.name ?? user.username}'s professional certifications.`,
    openGraph: {
      title: `${user.name ?? user.username} on proofi.ai`,
      description: user.bio ?? `Professional certifications of ${user.name ?? user.username}`,
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      avatarUrl: true,
      linkedinUrl: true,
      isPublicProfile: true,
      certificates: {
        where: { isPublic: true, deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user || !user.isPublicProfile) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: user.name ?? user.username,
    url: `${appUrl}/u/${user.username}`,
    ...(user.bio && { description: user.bio }),
    ...(user.linkedinUrl && { sameAs: user.linkedinUrl }),
    hasCredential: user.certificates.map((c) => ({
      "@type": "EducationalOccupationalCredential",
      name: c.name,
      credentialCategory: CATEGORY_LABELS[c.category] ?? c.category,
      recognizedBy: { "@type": "Organization", name: c.issuer },
      ...(c.expiryDate && { expires: c.expiryDate.toISOString() }),
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-blue-600 font-bold">
            proofi.ai
          </Link>
          <Link href="/register" className="text-sm text-blue-600 hover:underline">
            Create your profile →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xl font-bold flex-shrink-0">
            {user.name?.[0]?.toUpperCase() ?? user.username?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{user.name ?? user.username}</h1>
            {user.username && (
              <p className="text-gray-500 text-sm">@{user.username}</p>
            )}
            {user.bio && (
              <p className="mt-2 text-gray-700 text-sm leading-relaxed">{user.bio}</p>
            )}
            {user.linkedinUrl && (
              <a
                href={user.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
              >
                <Linkedin className="h-3.5 w-3.5" />
                LinkedIn
              </a>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" />
            Certifications ({user.certificates.length})
          </h2>

          {user.certificates.length === 0 ? (
            <p className="text-gray-500 text-sm">No public certifications yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {user.certificates.map((cert) => {
                const status = getExpiryStatus(cert.expiryDate);
                return (
                  <Card key={cert.id} className="border hover:border-blue-200 transition-colors">
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 text-sm leading-snug">
                          {cert.name}
                        </h3>
                        {status === "expired" ? (
                          <Badge variant="destructive" className="text-xs flex-shrink-0">Expired</Badge>
                        ) : status !== "no-expiry" ? (
                          <Badge className="text-xs flex-shrink-0 bg-green-100 text-green-700 hover:bg-green-100">
                            Valid
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-500">{cert.issuer}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_LABELS[cert.category] ?? cert.category}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="h-3 w-3" />
                          {formatDate(cert.issueDate)}
                        </span>
                      </div>
                      {cert.credentialId && (
                        <p className="text-xs text-gray-400 font-mono">ID: {cert.credentialId}</p>
                      )}
                      {cert.fileUrl && (
                        <a
                          href={cert.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Certificate
                        </a>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t py-6 mt-10">
        <div className="mx-auto max-w-3xl px-4 text-center text-xs text-gray-400">
          Credentials are self-reported and not independently verified. ·{" "}
          <Link href="/" className="hover:underline text-blue-500">
            Create your proofi.ai profile
          </Link>
        </div>
      </footer>
    </div>
  );
}
