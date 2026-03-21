import { z } from "zod";
import { CertificateCategory } from "@prisma/client";

export const createCertificateSchema = z.object({
  name: z.string().min(1, "Certificate name is required"),
  issuer: z.string().min(1, "Issuer is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  expiryDate: z.string().optional().nullable(),
  credentialId: z.string().optional().nullable(),
  category: z.nativeEnum(CertificateCategory).default("OTHER"),
  description: z.string().optional().nullable(),
  isPublic: z.boolean().default(false),
  // File metadata (populated when uploading)
  fileUrl: z.string().url().optional().nullable(),
  filePath: z.string().optional().nullable(),
  fileHash: z.string().optional().nullable(),
  fileName: z.string().optional().nullable(),
  fileMimeType: z.string().optional().nullable(),
  fileSizeBytes: z.number().optional().nullable(),
});

export const updateCertificateSchema = createCertificateSchema.partial();

export type CreateCertificateInput = z.infer<typeof createCertificateSchema>;
export type UpdateCertificateInput = z.infer<typeof updateCertificateSchema>;
