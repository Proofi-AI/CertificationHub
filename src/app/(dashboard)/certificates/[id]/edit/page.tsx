import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CertificateForm } from "@/components/certificates/CertificateForm";

export default async function EditCertificatePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const cert = await prisma.certificate.findFirst({
    where: { id: params.id, userId: session.user.id, deletedAt: null },
  });

  if (!cert) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Certificate</CardTitle>
          <CardDescription>Update the details for &ldquo;{cert.name}&rdquo;</CardDescription>
        </CardHeader>
        <CardContent>
          <CertificateForm certificate={cert} mode="edit" />
        </CardContent>
      </Card>
    </div>
  );
}
