"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Certificate } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FileUploadZone, type UploadedFile } from "./FileUploadZone";
import { createCertificate, updateCertificate } from "@/actions/certificate.actions";
import { CATEGORY_LABELS } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";

const CATEGORIES = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

interface CertificateFormProps {
  certificate?: Certificate;
  mode: "create" | "edit";
}

export function CertificateForm({ certificate, mode }: CertificateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isPublic, setIsPublic] = useState(certificate?.isPublic ?? false);
  const [duplicateDialog, setDuplicateDialog] = useState<{ id: string; name: string } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("isPublic", isPublic.toString());

    if (uploadedFile) {
      formData.set("fileUrl", uploadedFile.fileUrl);
      formData.set("filePath", uploadedFile.filePath);
      formData.set("fileHash", uploadedFile.fileHash);
      formData.set("fileName", uploadedFile.fileName);
      formData.set("fileMimeType", uploadedFile.fileMimeType);
      formData.set("fileSizeBytes", uploadedFile.fileSizeBytes.toString());
    }

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createCertificate(formData)
          : await updateCertificate(certificate!.id, formData);

      if (!result.success) {
        if (result.error.startsWith("DUPLICATE:")) {
          const dupId = result.error.split(":")[1];
          setDuplicateDialog({ id: dupId, name: "existing certificate" });
        } else {
          toast.error(result.error);
        }
      } else {
        toast.success(mode === "create" ? "Certificate added!" : "Certificate updated!");
        router.push(`/certificates/${result.data.id}`);
      }
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {mode === "create" && (
          <div className="space-y-2">
            <Label>Certificate Document (optional)</Label>
            <FileUploadZone
              onUpload={setUploadedFile}
              onDuplicate={(id, name) => setDuplicateDialog({ id, name })}
              onClear={() => setUploadedFile(null)}
              uploadedFile={uploadedFile}
            />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Certificate Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="AWS Solutions Architect"
              defaultValue={certificate?.name}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issuer">Issuer *</Label>
            <Input
              id="issuer"
              name="issuer"
              placeholder="Amazon Web Services"
              defaultValue={certificate?.issuer}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="issueDate">Issue Date *</Label>
            <Input
              id="issueDate"
              name="issueDate"
              type="date"
              defaultValue={
                certificate?.issueDate
                  ? new Date(certificate.issueDate).toISOString().split("T")[0]
                  : ""
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Input
              id="expiryDate"
              name="expiryDate"
              type="date"
              defaultValue={
                certificate?.expiryDate
                  ? new Date(certificate.expiryDate).toISOString().split("T")[0]
                  : ""
              }
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select name="category" defaultValue={certificate?.category ?? "OTHER"}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="credentialId">Credential ID</Label>
            <Input
              id="credentialId"
              name="credentialId"
              placeholder="Optional"
              defaultValue={certificate?.credentialId ?? ""}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-y"
            placeholder="Optional description or notes"
            defaultValue={certificate?.description ?? ""}
          />
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="isPublic"
            checked={isPublic}
            onCheckedChange={setIsPublic}
          />
          <Label htmlFor="isPublic">
            Show on public profile
          </Label>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : mode === "create" ? "Add Certificate" : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>

      <Dialog open={!!duplicateDialog} onOpenChange={() => setDuplicateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Certificate Detected</DialogTitle>
            <DialogDescription>
              A certificate with the same details already exists in your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialog(null)}>
              Cancel
            </Button>
            {duplicateDialog && (
              <Button asChild>
                <Link href={`/certificates/${duplicateDialog.id}`}>View Existing</Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
