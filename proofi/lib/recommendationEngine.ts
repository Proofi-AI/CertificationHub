import type { Certificate } from "@prisma/client";
import { recommendationsDb, type CertRecommendation } from "./recommendationsDb";

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function userAlreadyHas(cert: CertRecommendation, certificates: Certificate[]): boolean {
  const recName = normalize(cert.name);
  return certificates.some((c) => {
    const certName = normalize(c.name);
    // Check if name is a close match (contains or is contained)
    return certName.includes(recName.slice(0, 12)) || recName.includes(certName.slice(0, 12));
  });
}

const BEGINNER_FALLBACKS = [
  "Google IT Support Professional Certificate",
  "LinkedIn Learning – Becoming a Manager",
  "Coursera – Learning How to Learn",
  "Microsoft Office Specialist (MOS) – Excel Expert",
  "CompTIA Project+ Certification",
];

export function getRecommendations(
  certificates: Certificate[],
  offset = 0
): CertRecommendation[] {
  if (certificates.length === 0) {
    // Return 5 general beginner recommendations
    return recommendationsDb
      .filter((r) => BEGINNER_FALLBACKS.includes(r.name))
      .slice(0, 5);
  }

  // Extract user's domains and keyword text
  const userDomains = certificates.map((c) => normalize(c.domain));
  const userText = certificates
    .flatMap((c) => [normalize(c.name), normalize(c.issuer)])
    .join(" ");

  // Score each recommendation
  const scored = recommendationsDb
    .filter((rec) => !userAlreadyHas(rec, certificates))
    .map((rec) => {
      let score = 0;

      // +2 for each matching trigger domain
      for (const td of rec.triggerDomains) {
        if (userDomains.some((ud) => ud.includes(normalize(td)) || normalize(td).includes(ud))) {
          score += 2;
        }
      }

      // +1 for each matching trigger keyword
      for (const kw of rec.triggerKeywords) {
        if (userText.includes(normalize(kw))) {
          score += 1;
        }
      }

      return { rec, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  // Cycle through with offset
  const total = scored.length;
  if (total === 0) {
    return recommendationsDb
      .filter((r) => BEGINNER_FALLBACKS.includes(r.name))
      .slice(0, 5);
  }

  const startIdx = offset % total;
  const result: CertRecommendation[] = [];

  for (let i = 0; i < 5 && i < total; i++) {
    result.push(scored[(startIdx + i) % total].rec);
  }

  return result;
}
