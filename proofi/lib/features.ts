export interface UserFeatures {
  autoFillFromImage: boolean;
}

export const DEFAULT_FEATURES: UserFeatures = {
  autoFillFromImage: false,
};

/** Safely parse the raw JSON value from Prisma into a typed UserFeatures object. */
export function parseFeatures(raw: unknown): UserFeatures {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_FEATURES };
  }
  const obj = raw as Record<string, unknown>;
  return {
    autoFillFromImage:
      typeof obj.autoFillFromImage === "boolean" ? obj.autoFillFromImage : false,
  };
}
