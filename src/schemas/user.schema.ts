import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-z0-9_-]+$/, "Username can only contain lowercase letters, numbers, hyphens and underscores")
    .optional(),
  bio: z.string().max(300, "Bio must be at most 300 characters").optional().nullable(),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().nullable(),
  isPublicProfile: z.boolean().optional(),
  notificationsEnabled: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
