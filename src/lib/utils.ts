import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, differenceInDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "MMM d, yyyy");
}

export function getDaysUntilExpiry(expiryDate: Date | string | null | undefined): number | null {
  if (!expiryDate) return null;
  return differenceInDays(new Date(expiryDate), new Date());
}

export type ExpiryStatus = "expired" | "critical" | "warning" | "valid" | "no-expiry";

export function getExpiryStatus(expiryDate: Date | string | null | undefined): ExpiryStatus {
  if (!expiryDate) return "no-expiry";
  const days = getDaysUntilExpiry(expiryDate);
  if (days === null) return "no-expiry";
  if (days < 0) return "expired";
  if (days <= 7) return "critical";
  if (days <= 30) return "warning";
  return "valid";
}

export function generateUsername(email: string): string {
  const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  return `${base}${suffix}`;
}

export const CATEGORY_LABELS: Record<string, string> = {
  CLOUD: "Cloud",
  SECURITY: "Security",
  NETWORKING: "Networking",
  DATA: "Data",
  DEVOPS: "DevOps",
  HEALTHCARE: "Healthcare",
  FINANCE: "Finance",
  PROJECT_MANAGEMENT: "Project Management",
  OTHER: "Other",
};
