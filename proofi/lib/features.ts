export interface UserFeatures {
  autoFillFromImage: boolean;
  portfolioInsights: boolean;
  aiVerification: boolean;
}

export const DEFAULT_FEATURES: UserFeatures = {
  autoFillFromImage: true,
  portfolioInsights: false,
  aiVerification: false,
};

/** Safely parse the raw JSON value from Prisma into a typed UserFeatures object. */
export function parseFeatures(raw: unknown): UserFeatures {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_FEATURES };
  }
  const obj = raw as Record<string, unknown>;
  return {
    autoFillFromImage:
      typeof obj.autoFillFromImage === "boolean" ? obj.autoFillFromImage : true,
    portfolioInsights:
      typeof obj.portfolioInsights === "boolean" ? obj.portfolioInsights : false,
    aiVerification:
      typeof obj.aiVerification === "boolean" ? obj.aiVerification : false,
  };
}
