import type { Certificate } from "@prisma/client";
import { domainMap } from "./domainMap";

export interface Insight {
  type: "strength" | "suggestion" | "warning" | "milestone";
  message: string;
  priority: number; // 1 = highest, 3 = lowest
}

function domainFromCert(cert: Certificate): string {
  return cert.domain.toLowerCase().trim();
}

function matchesDomain(certDomain: string, mapDomain: string): boolean {
  const cd = certDomain.toLowerCase();
  const md = mapDomain.toLowerCase();
  if (cd === md) return true;
  // partial match for domains like "Cloud Computing" → "cloud computing"
  return cd.includes(md) || md.includes(cd);
}

function getDomainForCert(cert: Certificate): string | null {
  const cd = domainFromCert(cert);
  for (const key of Object.keys(domainMap)) {
    if (matchesDomain(cd, key)) return key;
  }
  return null;
}

export function generateInsights(certificates: Certificate[]): Insight[] {
  const insights: Insight[] = [];
  const now = Date.now();

  if (certificates.length === 0) return [];

  const uniqueDomainKeys = new Set<string>();
  for (const cert of certificates) {
    const d = getDomainForCert(cert);
    if (d) uniqueDomainKeys.add(d);
    else uniqueDomainKeys.add(cert.domain.toLowerCase());
  }
  const domainCount = uniqueDomainKeys.size;
  const total = certificates.length;

  // ── Strength insights ────────────────────────────────────────────────────

  if (domainCount >= 3) {
    insights.push({
      type: "strength",
      message: "Your portfolio spans multiple fields — that versatility stands out to employers and collaborators.",
      priority: 2,
    });
  }

  if (total >= 5) {
    insights.push({
      type: "strength",
      message: `A portfolio of ${total} certificates shows serious commitment to continuous learning.`,
      priority: 2,
    });
  }

  const hasCertsWithCredId = certificates.some((c) => c.credentialId);
  if (hasCertsWithCredId) {
    insights.push({
      type: "strength",
      message: "Certificates with credential IDs add verifiability to your profile.",
      priority: 3,
    });
  }

  const publicCertsWithImages = certificates.filter((c) => c.isPublic && c.imageUrl);
  const publicCerts = certificates.filter((c) => c.isPublic);
  if (publicCerts.length > 0 && publicCertsWithImages.length === publicCerts.length) {
    insights.push({
      type: "strength",
      message: "Every public certificate has a visual — your profile looks professional and complete.",
      priority: 3,
    });
  }

  const recentCert = certificates.some((c) => {
    const diff = (now - new Date(c.createdAt).getTime()) / 86400000;
    return diff <= 60;
  });
  if (recentCert) {
    insights.push({
      type: "strength",
      message: "You recently added a new certification — great momentum.",
      priority: 3,
    });
  }

  // ── Suggestion insights ──────────────────────────────────────────────────

  if (domainCount === 1) {
    insights.push({
      type: "suggestion",
      message: "Your profile focuses on one area. Adding a complementary field makes it more well-rounded.",
      priority: 1,
    });
  }

  const certsWithoutImages = certificates.filter((c) => !c.imageUrl);
  if (certsWithoutImages.length > 0) {
    insights.push({
      type: "suggestion",
      message: "Certificates without images are less engaging. Upload the certificate file to improve your profile.",
      priority: 1,
    });
  }

  const certsWithoutCredId = certificates.filter((c) => !c.credentialId);
  if (certsWithoutCredId.length > 0) {
    insights.push({
      type: "suggestion",
      message: "Adding credential IDs to your certificates makes them more credible and verifiable.",
      priority: 2,
    });
  }

  const privateCerts = certificates.filter((c) => !c.isPublic);
  if (privateCerts.length > 3) {
    insights.push({
      type: "suggestion",
      message: `You have ${privateCerts.length} hidden certificates. Consider making more public so visitors see your full profile.`,
      priority: 2,
    });
  }

  const expiringSoon = certificates.filter((c) => {
    if (!c.expiresAt) return false;
    const diff = (new Date(c.expiresAt).getTime() - now) / 86400000;
    return diff > 0 && diff <= 90;
  });
  if (expiringSoon.length > 0) {
    insights.push({
      type: "suggestion",
      message: "Some certificates are expiring soon. Renew them to keep your profile current.",
      priority: 1,
    });
  }

  // ── Warning insights ──────────────────────────────────────────────────────

  const expiredPublic = certificates.filter((c) => {
    if (!c.expiresAt || !c.isPublic) return false;
    return new Date(c.expiresAt).getTime() < now;
  });
  if (expiredPublic.length > 0) {
    insights.push({
      type: "warning",
      message: "You have expired certificates visible on your public profile. Consider hiding or renewing them.",
      priority: 1,
    });
  }

  const fiveYearsAgo = now - 5 * 365 * 24 * 60 * 60 * 1000;
  const staleDomains = new Set<string>();
  for (const cert of certificates) {
    if (new Date(cert.issuedAt).getTime() < fiveYearsAgo) {
      const domainKey = getDomainForCert(cert) ?? cert.domain.toLowerCase();
      const hasNewer = certificates.some((c) => {
        const cDomain = getDomainForCert(c) ?? c.domain.toLowerCase();
        return cDomain === domainKey && new Date(c.issuedAt).getTime() >= fiveYearsAgo;
      });
      if (!hasNewer) staleDomains.add(domainKey);
    }
  }
  if (staleDomains.size > 0) {
    insights.push({
      type: "warning",
      message: "Some of your certificates are aging. Consider refreshing your credentials in those areas.",
      priority: 2,
    });
  }

  // ── Milestone insights ────────────────────────────────────────────────────

  if (total === 1) {
    insights.push({
      type: "milestone",
      message: "You added your first certificate — the journey begins here.",
      priority: 1,
    });
  } else if (total === 5) {
    insights.push({
      type: "milestone",
      message: "5 certificates in your portfolio — you are building something impressive.",
      priority: 1,
    });
  } else if (total === 10) {
    insights.push({
      type: "milestone",
      message: "10 certificates. That is a serious commitment to professional growth.",
      priority: 1,
    });
  } else if (total === 25) {
    insights.push({
      type: "milestone",
      message: "25 certificates. Your profile is extraordinary.",
      priority: 1,
    });
  }

  // Sort: milestones first by priority, then warnings, then suggestions, then strength
  const typeOrder = { milestone: 0, warning: 1, suggestion: 2, strength: 3 };
  insights.sort((a, b) => {
    const typeSort = typeOrder[a.type] - typeOrder[b.type];
    if (typeSort !== 0) return typeSort;
    return a.priority - b.priority;
  });

  return insights.slice(0, 4);
}
