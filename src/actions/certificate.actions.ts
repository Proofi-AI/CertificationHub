"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteFileFromStorage } from "@/lib/supabase";
import { createCertificateSchema, updateCertificateSchema } from "@/schemas/certificate.schema";
import type { ActionResult } from "@/types";
import type { Certificate } from "@prisma/client";

async function getSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session;
}

export async function createCertificate(formData: FormData): Promise<ActionResult<Certificate>> {
  const session = await getSession();

  const raw = {
    name: formData.get("name"),
    issuer: formData.get("issuer"),
    issueDate: formData.get("issueDate"),
    expiryDate: formData.get("expiryDate") || null,
    credentialId: formData.get("credentialId") || null,
    category: formData.get("category"),
    description: formData.get("description") || null,
    isPublic: formData.get("isPublic") === "true",
    fileUrl: formData.get("fileUrl") || null,
    filePath: formData.get("filePath") || null,
    fileHash: formData.get("fileHash") || null,
    fileName: formData.get("fileName") || null,
    fileMimeType: formData.get("fileMimeType") || null,
    fileSizeBytes: formData.get("fileSizeBytes") ? Number(formData.get("fileSizeBytes")) : null,
  };

  const parsed = createCertificateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;
  const source = data.fileUrl ? "UPLOAD" : "MANUAL";

  // Check for manual entry duplicate
  if (source === "MANUAL") {
    const duplicate = await prisma.certificate.findFirst({
      where: {
        userId: session.user.id,
        deletedAt: null,
        name: { equals: data.name, mode: "insensitive" },
        issuer: { equals: data.issuer, mode: "insensitive" },
        issueDate: new Date(data.issueDate),
      },
    });
    if (duplicate) {
      return { success: false, error: `DUPLICATE:${duplicate.id}` };
    }
  }

  const cert = await prisma.certificate.create({
    data: {
      userId: session.user.id,
      name: data.name,
      issuer: data.issuer,
      issueDate: new Date(data.issueDate),
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      credentialId: data.credentialId,
      category: data.category,
      description: data.description,
      isPublic: data.isPublic,
      source,
      fileUrl: data.fileUrl,
      filePath: data.filePath,
      fileHash: data.fileHash,
      fileName: data.fileName,
      fileMimeType: data.fileMimeType,
      fileSizeBytes: data.fileSizeBytes,
    },
  });

  revalidatePath("/certificates");
  revalidatePath("/dashboard");

  return { success: true, data: cert };
}

export async function updateCertificate(
  id: string,
  formData: FormData
): Promise<ActionResult<Certificate>> {
  const session = await getSession();

  const existing = await prisma.certificate.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
  });
  if (!existing) return { success: false, error: "Certificate not found." };

  const raw = {
    name: formData.get("name"),
    issuer: formData.get("issuer"),
    issueDate: formData.get("issueDate"),
    expiryDate: formData.get("expiryDate") || null,
    credentialId: formData.get("credentialId") || null,
    category: formData.get("category"),
    description: formData.get("description") || null,
    isPublic: formData.get("isPublic") === "true",
  };

  const parsed = updateCertificateSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const data = parsed.data;

  const cert = await prisma.certificate.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.issuer && { issuer: data.issuer }),
      ...(data.issueDate && { issueDate: new Date(data.issueDate) }),
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      credentialId: data.credentialId,
      category: data.category,
      description: data.description,
      isPublic: data.isPublic,
    },
  });

  revalidatePath("/certificates");
  revalidatePath(`/certificates/${id}`);

  return { success: true, data: cert };
}

export async function deleteCertificate(id: string): Promise<ActionResult> {
  const session = await getSession();

  const cert = await prisma.certificate.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
  });
  if (!cert) return { success: false, error: "Certificate not found." };

  if (cert.filePath) {
    try {
      await deleteFileFromStorage(cert.filePath);
    } catch {
      // Non-fatal: file may already be deleted
    }
  }

  await prisma.certificate.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/certificates");
  revalidatePath("/dashboard");

  return { success: true, data: undefined };
}

export async function toggleCertificateVisibility(id: string): Promise<ActionResult<boolean>> {
  const session = await getSession();

  const cert = await prisma.certificate.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
  });
  if (!cert) return { success: false, error: "Certificate not found." };

  const updated = await prisma.certificate.update({
    where: { id },
    data: { isPublic: !cert.isPublic },
  });

  revalidatePath("/certificates");
  revalidatePath(`/u/${session.user.username}`);

  return { success: true, data: updated.isPublic };
}
