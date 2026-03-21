"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { Certificate } from "@prisma/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExpiryBadge } from "./ExpiryBadge";
import { CategoryBadge } from "./CategoryBadge";
import { VisibilityToggle } from "./VisibilityToggle";
import { formatDate } from "@/lib/utils";
import { deleteCertificate } from "@/actions/certificate.actions";
import { Pencil, Trash2, FileText, Image } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CertificateCardProps {
  certificate: Certificate;
}

export function CertificateCard({ certificate: cert }: CertificateCardProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCertificate(cert.id);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success("Certificate deleted");
        setOpen(false);
      }
    });
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-blue-600">
            {cert.fileMimeType === "application/pdf" ? (
              <FileText className="h-4 w-4 flex-shrink-0" />
            ) : cert.fileMimeType ? (
              <Image className="h-4 w-4 flex-shrink-0" />
            ) : null}
            <Link
              href={`/certificates/${cert.id}`}
              className="font-semibold text-gray-900 hover:text-blue-600 line-clamp-2 leading-snug"
            >
              {cert.name}
            </Link>
          </div>
          <ExpiryBadge expiryDate={cert.expiryDate} />
        </div>
        <p className="text-sm text-gray-500">{cert.issuer}</p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          <CategoryBadge category={cert.category} />
        </div>
        <div className="text-xs text-gray-500 space-y-0.5">
          <p>Issued: {formatDate(cert.issueDate)}</p>
          {cert.expiryDate && <p>Expires: {formatDate(cert.expiryDate)}</p>}
          {cert.credentialId && <p>ID: {cert.credentialId}</p>}
        </div>
        <div className="mt-auto pt-2 flex items-center justify-between">
          <VisibilityToggle certId={cert.id} initialValue={cert.isPublic} />
          <div className="flex gap-1">
            <Button variant="ghost" size="icon">
              <Link href={`/certificates/${cert.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-600"
              onClick={() => setOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Certificate</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{cert.name}&rdquo;? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
