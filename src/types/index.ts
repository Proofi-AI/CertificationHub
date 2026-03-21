import type { Certificate, User, CertificateCategory, CertificateSource } from "@prisma/client";

export type CertificateWithUser = Certificate & { user: Pick<User, "name" | "username" | "avatarUrl"> };

export type PublicCertificate = Pick<
  Certificate,
  "id" | "name" | "issuer" | "issueDate" | "expiryDate" | "credentialId" | "category" | "description" | "fileUrl" | "fileMimeType" | "createdAt"
>;

export type PublicProfile = Pick<User, "id" | "name" | "username" | "avatarUrl" | "bio" | "linkedinUrl"> & {
  certificates: PublicCertificate[];
};

export type CertificateFilters = {
  search?: string;
  category?: CertificateCategory;
  issuer?: string;
  expiryStatus?: "expired" | "expiring_soon" | "valid";
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "expiryDate" | "createdAt" | "name";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export { CertificateCategory, CertificateSource };
