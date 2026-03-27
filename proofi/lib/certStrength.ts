import type { Certificate } from "@prisma/client";

export interface CertStrength {
  score: number;        // 0–5
  label: "Complete" | "Good" | "Basic" | "Incomplete";
  widthPct: number;     // percentage for the bar
  color: string;        // CSS color
  missing: string[];    // list of missing field descriptions
}

export function scoreCertificate(cert: Certificate): CertStrength {
  let score = 0;
  const missing: string[] = [];

  // 2 pts: image or PDF uploaded
  if (cert.imageUrl) {
    score += 2;
  } else {
    missing.push("certificate image or file");
  }

  // 1 pt: credential ID
  if (cert.credentialId) {
    score += 1;
  } else {
    missing.push("credential ID");
  }

  // 1 pt: specific issue date (not just Jan 1 — a year-only placeholder)
  const issued = new Date(cert.issuedAt);
  const hasSpecificDate = !(issued.getMonth() === 0 && issued.getDate() === 1);
  if (hasSpecificDate) {
    score += 1;
  } else {
    missing.push("specific issue date (month and day)");
  }

  // 1 pt: expiry date set or no expiry (null = no expiry in this app)
  // Since null means "no expiry" by convention, this is always satisfied
  score += 1;

  if (score === 5) {
    return { score, label: "Complete", widthPct: 100, color: "#10b981", missing: [] };
  } else if (score >= 3) {
    return { score, label: "Good", widthPct: 70, color: "#3b82f6", missing };
  } else if (score >= 1) {
    return { score, label: "Basic", widthPct: 40, color: "#f59e0b", missing };
  } else {
    return { score, label: "Incomplete", widthPct: 15, color: "#ef4444", missing };
  }
}

export function buildMissingTooltip(strength: CertStrength): string {
  if (strength.missing.length === 0) return "This certificate is fully complete.";
  const parts = strength.missing;
  if (parts.length === 1) return `Add a ${parts[0]} to complete this certificate.`;
  const last = parts[parts.length - 1];
  const rest = parts.slice(0, -1).join(", a ");
  return `Add a ${rest} and a ${last} to complete this certificate.`;
}
