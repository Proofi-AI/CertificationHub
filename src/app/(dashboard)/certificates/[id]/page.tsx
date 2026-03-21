import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { ExpiryBadge } from "@/components/certificates/ExpiryBadge";
import { CategoryBadge } from "@/components/certificates/CategoryBadge";
import { VisibilityToggle } from "@/components/certificates/VisibilityToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";
import { Suspense } from "react";
import dynamic from "next/dynamic";

const PdfViewer = dynamic(
  () => import("@/components/certificates/PdfViewer").then((m) => m.PdfViewer),
  { ssr: false }
);
const ImageViewer = dynamic(
  () => import("@/components/certificates/ImageViewer").then((m) => m.ImageViewer),
  { ssr: false }
);

export default async function CertificateDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const cert = await prisma.certificate.findFirst({
    where: { id: params.id, userId: session.user.id, deletedAt: null },
  });

  if (!cert) notFound();

  const isPdf = cert.fileMimeType === "application/pdf";
  const isImage = cert.fileMimeType?.startsWith("image/");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/certificates">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-gray-900 flex-1 truncate">{cert.name}</h1>
        <Button variant="outline" asChild>
          <Link href={`/certificates/${cert.id}/edit`}>
            <Pencil className="h-4 w-4 mr-1.5" />
            Edit
          </Link>
        </Button>
      </div>

      {cert.fileUrl && (
        <Card>
          <CardContent className="pt-6">
            <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded" />}>
              {isPdf && <PdfViewer url={cert.fileUrl} />}
              {isImage && <ImageViewer url={cert.fileUrl} alt={cert.name} />}
            </Suspense>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle>{cert.name}</CardTitle>
            <ExpiryBadge expiryDate={cert.expiryDate} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryBadge category={cert.category} />
            <span className="text-sm text-gray-500">{cert.issuer}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Issue Date</p>
              <p className="mt-0.5 font-medium">{formatDate(cert.issueDate)}</p>
            </div>
            {cert.expiryDate && (
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Expiry Date</p>
                <p className="mt-0.5 font-medium">{formatDate(cert.expiryDate)}</p>
              </div>
            )}
            {cert.credentialId && (
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Credential ID</p>
                <p className="mt-0.5 font-medium font-mono text-xs">{cert.credentialId}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Added</p>
              <p className="mt-0.5 font-medium">{formatDate(cert.createdAt)}</p>
            </div>
          </div>

          {cert.description && (
            <>
              <Separator />
              <p className="text-sm text-gray-700 leading-relaxed">{cert.description}</p>
            </>
          )}

          {cert.fileUrl && (
            <>
              <Separator />
              <Button variant="outline" size="sm" asChild>
                <a href={cert.fileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Open original file
                </a>
              </Button>
            </>
          )}

          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Public profile visibility</span>
            <VisibilityToggle certId={cert.id} initialValue={cert.isPublic} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
