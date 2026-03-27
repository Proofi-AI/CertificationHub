import type { Certificate } from "@prisma/client";
import { domainMap } from "./domainMap";

export interface Gap {
  missingDomain: string;
  reason: string;
  strength: "strong" | "moderate";
}

function matchesDomain(certDomain: string, mapDomain: string): boolean {
  const cd = certDomain.toLowerCase().trim();
  const md = mapDomain.toLowerCase().trim();
  if (cd === md) return true;
  return cd.includes(md) || md.includes(cd);
}

function getDomainKey(certDomain: string): string | null {
  const cd = certDomain.toLowerCase().trim();
  for (const key of Object.keys(domainMap)) {
    if (matchesDomain(cd, key)) return key;
  }
  return null;
}

export function detectGaps(certificates: Certificate[]): Gap[] {
  if (certificates.length === 0) return [];

  // Get user's unique domain keys
  const userDomainKeys = new Set<string>();
  for (const cert of certificates) {
    const key = getDomainKey(cert.domain);
    if (key) userDomainKeys.add(key);
  }

  if (userDomainKeys.size === 0) return [];

  // Count how many of the user's domains suggest each complementary domain
  const gapCount = new Map<string, number>();
  for (const domainKey of userDomainKeys) {
    const rel = domainMap[domainKey];
    if (!rel) continue;
    for (const comp of rel.complementary) {
      // Skip if user already has this domain
      let userHas = false;
      for (const ud of userDomainKeys) {
        if (matchesDomain(ud, comp) || matchesDomain(comp, ud)) {
          userHas = true;
          break;
        }
      }
      if (!userHas) {
        gapCount.set(comp, (gapCount.get(comp) ?? 0) + 1);
      }
    }
  }

  // Build gaps list
  const gaps: Gap[] = [];
  for (const [missing, count] of gapCount.entries()) {
    // Build reason from the user domains that suggest this
    const suggestingDomains: string[] = [];
    for (const dk of userDomainKeys) {
      const rel = domainMap[dk];
      if (rel?.complementary.some((c) => matchesDomain(c, missing) || matchesDomain(missing, c))) {
        // Capitalize domain name for display
        suggestingDomains.push(dk.replace(/\b\w/g, (l) => l.toUpperCase()));
      }
    }

    const missingDisplay = missing.replace(/\b\w/g, (l) => l.toUpperCase());
    const reason =
      suggestingDomains.length === 1
        ? `Complements your ${suggestingDomains[0]} credentials.`
        : `Complements your ${suggestingDomains.slice(0, -1).join(", ")} and ${suggestingDomains[suggestingDomains.length - 1]} credentials.`;

    gaps.push({
      missingDomain: missingDisplay,
      reason,
      strength: count >= 2 ? "strong" : "moderate",
    });
  }

  // Sort: strong first, then by count desc
  gaps.sort((a, b) => {
    if (a.strength === b.strength) return 0;
    return a.strength === "strong" ? -1 : 1;
  });

  return gaps.slice(0, 4);
}
